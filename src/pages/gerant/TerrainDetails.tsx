import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { useParams } from "react-router-dom"

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
      cell: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      header: "Heure",
      accessorKey: "heure_debut" as const,
    },
    {
      header: "Durée",
      accessorKey: "nombre_heures" as const,
      cell: (value: number) => `${value}h`,
    },
    {
      header: "Réserviste",
      accessorKey: "reserviste" as const,
      cell: (value: any) => `${value.prenom} ${value.nom}`,
    },
    {
      header: "Téléphone",
      accessorKey: "reserviste" as const,
      cell: (value: any) => value.telephone,
    },
    {
      header: "Statut",
      accessorKey: "statut" as const,
      cell: (value: string) => (
        <Badge
          variant={
            value === "validee"
              ? "secondary"
              : value === "en_attente"
              ? "outline"
              : "destructive"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      header: "Paiement",
      accessorKey: "paiement" as const,
      cell: (value: any[]) => (
        <Badge
          variant={
            value?.[0]?.statut === "paye" ? "secondary" : "destructive"
          }
        >
          {value?.[0]?.statut || "non payé"}
        </Badge>
      ),
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