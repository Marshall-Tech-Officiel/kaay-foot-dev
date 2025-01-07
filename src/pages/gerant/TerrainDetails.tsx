import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useParams } from "react-router-dom"
import { type Reservation } from "@/components/gerant/ReservationColumns"
import { TerrainReservationsTable } from "@/components/gerant/TerrainReservationsTable"

type Terrain = {
  id: string
  nom: string
  zone: { nom: string } | null
  region: { nom: string } | null
}

export default function TerrainDetails() {
  const { id } = useParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: terrain, isLoading: isLoadingTerrain } = useQuery({
    queryKey: ["terrain", id],
    queryFn: async () => {
      console.log("Fetching terrain details for ID:", id)
      const { data, error } = await supabase
        .from("terrains")
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom)
        `)
        .eq("id", id)
        .maybeSingle()

      if (error) {
        console.error("Error fetching terrain:", error)
        throw error
      }
      
      console.log("Terrain data:", data)
      return data as Terrain
    },
    enabled: !!id,
  })

  const validateReservation = useMutation({
    mutationFn: async (reservationId: string) => {
      console.log("Validating reservation:", reservationId)
      const { error } = await supabase
        .from("reservations")
        .update({ statut: "validee" })
        .eq("id", reservationId)

      if (error) {
        console.error("Error validating reservation:", error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations-terrain", id] })
      toast({
        title: "Réservation validée",
        description: "La réservation a été validée avec succès.",
      })
    },
    onError: (error) => {
      console.error("Mutation error:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de valider la réservation. Veuillez réessayer.",
      })
    }
  })

  const refuseReservation = useMutation({
    mutationFn: async (reservationId: string) => {
      console.log("Refusing reservation:", reservationId)
      const { error } = await supabase
        .from("reservations")
        .update({ statut: "refusee" })
        .eq("id", reservationId)

      if (error) {
        console.error("Error refusing reservation:", error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations-terrain", id] })
      toast({
        title: "Réservation refusée",
        description: "La réservation a été refusée.",
      })
    },
    onError: (error) => {
      console.error("Mutation error:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de refuser la réservation. Veuillez réessayer.",
      })
    }
  })

  const { data: reservations, isLoading, error } = useQuery({
    queryKey: ["reservations-terrain", id],
    queryFn: async () => {
      console.log("Fetching reservations for terrain ID:", id)
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          reserviste:profiles(nom, prenom, telephone),
          paiement:paiements(statut),
          terrain:terrains(nom)
        `)
        .eq("terrain_id", id)
        .in("statut", ["en_attente", "validee"])
        .order("date_reservation", { ascending: false })

      if (error) {
        console.error("Error fetching reservations:", error)
        throw error
      }
      console.log("Reservations data:", data)
      
      // Transform the data to match the Reservation type
      const transformedData: Reservation[] = data.map(res => ({
        id: res.id,
        date_reservation: res.date_reservation,
        heure_debut: res.heure_debut,
        nombre_heures: res.nombre_heures,
        reserviste: {
          nom: res.reserviste?.nom || "",
          prenom: res.reserviste?.prenom || "",
          telephone: res.reserviste?.telephone || "",
        },
        statut: res.statut as "en_attente" | "validee" | "refusee",
        paiement: Array.isArray(res.paiement) ? res.paiement : [],
        terrain: {
          nom: res.terrain?.nom || ""
        }
      }))

      return transformedData
    },
    enabled: !!id,
  })

  if (error) {
    console.error("Query error:", error)
    toast({
      variant: "destructive",
      title: "Erreur",
      description: "Impossible de charger les réservations. Veuillez réessayer plus tard.",
    })
  }

  if (isLoading || isLoadingTerrain) {
    return (
      <MainLayout>
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  if (!terrain) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Terrain non trouvé</h1>
            <p className="text-muted-foreground mt-2">
              Le terrain que vous recherchez n'existe pas ou vous n'avez pas les droits pour y accéder.
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Breadcrumbs />
          <h1 className="text-2xl font-bold mt-2">{terrain.nom}</h1>
          <p className="text-muted-foreground">
            {terrain.zone?.nom}, {terrain.region?.nom}
          </p>
        </div>
          
        <TerrainReservationsTable
          reservations={reservations || []}
          onValidate={(id) => validateReservation.mutate(id)}
          onRefuse={(id) => refuseReservation.mutate(id)}
        />
      </div>
    </MainLayout>
  )
}