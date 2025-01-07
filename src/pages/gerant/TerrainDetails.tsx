import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

type Terrain = {
  id: string
  nom: string
  zone: { nom: string }
  region: { nom: string }
}

type Reservation = {
  id: string
  date_reservation: string
  heure_debut: string
  nombre_heures: number
  reserviste: { nom: string; prenom: string; telephone: string }
  statut: string
  paiement: Array<{ statut: string }>
}

export default function TerrainDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: terrain } = useQuery({
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
        .single()

      if (error) throw error
      console.log("Terrain data:", data)
      return data as Terrain
    },
    enabled: !!id,
  })

  const validateReservation = useMutation({
    mutationFn: async (reservationId: string) => {
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
          paiement:paiements(statut)
        `)
        .eq("terrain_id", id)
        .in("statut", ["en_attente", "validee"])
        .order("date_reservation", { ascending: false })

      if (error) {
        console.error("Error fetching reservations:", error)
        throw error
      }
      console.log("Reservations data:", data)
      return data as Reservation[]
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  const columns = [
    {
      header: "Date",
      accessorKey: "date_reservation" as const,
      cell: (info: { getValue: () => string }) => 
        new Date(info.getValue()).toLocaleDateString(),
    },
    {
      header: "Heure",
      accessorKey: "heure_debut" as const,
    },
    {
      header: "Durée",
      accessorKey: "nombre_heures" as const,
      cell: (info: { getValue: () => number }) => `${info.getValue()}h`,
    },
    {
      header: "Réserviste",
      accessorKey: "reserviste" as const,
      cell: (info: { getValue: () => { nom: string; prenom: string } }) => {
        const value = info.getValue()
        return `${value.prenom} ${value.nom}`
      },
    },
    {
      header: "Téléphone",
      accessorKey: "reserviste" as const,
      cell: (info: { getValue: () => { telephone: string } }) => 
        info.getValue().telephone,
    },
    {
      header: "Statut",
      accessorKey: "statut" as const,
      cell: (info: { getValue: () => string }) => (
        <Badge
          variant={
            info.getValue() === "validee"
              ? "secondary"
              : info.getValue() === "en_attente"
              ? "outline"
              : "destructive"
          }
        >
          {info.getValue()}
        </Badge>
      ),
    },
    {
      header: "Paiement",
      accessorKey: "paiement" as const,
      cell: (info: { getValue: () => Array<{ statut: string }> }) => (
        <Badge
          variant={
            info.getValue()?.[0]?.statut === "paye" ? "secondary" : "destructive"
          }
        >
          {info.getValue()?.[0]?.statut || "non payé"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (info: { getValue: () => string; row: { original: Reservation } }) => {
        const statut = info.row.original.statut
        return statut === "en_attente" ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => validateReservation.mutate(info.getValue())}
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => refuseReservation.mutate(info.getValue())}
            >
              <XCircle className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : null
      },
    },
  ] as const

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Breadcrumbs />
          <h1 className="text-2xl font-bold mt-2">{terrain?.nom}</h1>
          <p className="text-muted-foreground">
            {terrain?.zone?.nom}, {terrain?.region?.nom}
          </p>
        </div>
          
        <div className="mt-8">
          <h2 className="mb-6 text-xl font-semibold">Réservations actives</h2>
          <DataTable
            columns={columns}
            data={reservations || []}
          />
        </div>
      </div>
    </MainLayout>
  )
}