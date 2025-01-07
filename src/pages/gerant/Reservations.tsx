import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { ReservationFilters } from "@/components/dashboard/ReservationFilters"

type Reservation = {
  id: string
  terrain: { nom: string }
  date_reservation: string
  heure_debut: string
  nombre_heures: number
  reserviste: { nom: string; prenom: string; telephone: string }
  statut: string
  paiement: Array<{ statut: string }>
}

export default function GerantReservations() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("tous")
  const [dateFilter, setDateFilter] = useState("")

  const { data: reservations, isLoading, error } = useQuery({
    queryKey: ["reservations-gerant"],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (profileError) throw profileError
      console.info("Found profile:", profile)

      // Get terrains assigned to this gerant
      const { data: assignedTerrains } = await supabase
        .from("droits_gerants")
        .select(`
          terrain_id,
          terrain:terrains(
            id,
            nom,
            zone:zones(nom),
            region:regions(nom),
            photos:photos_terrain(url),
            taille,
            prix_jour,
            prix_nuit,
            description,
            localisation,
            latitude,
            longitude,
            heure_debut_nuit,
            heure_fin_nuit
          )
        `)
        .eq("gerant_id", profile.id)

      console.info("Assigned terrains:", assignedTerrains)

      if (!assignedTerrains?.length) return []

      const terrainIds = assignedTerrains.map(t => t.terrain_id)

      // Get reservations for these terrains
      const { data, error: reservationsError } = await supabase
        .from("reservations")
        .select(`
          *,
          terrain:terrains(nom),
          reserviste:profiles(nom, prenom, telephone),
          paiement:paiements(statut)
        `)
        .in("terrain_id", terrainIds)
        .order("date_reservation", { ascending: false })

      if (reservationsError) throw reservationsError

      return data as Reservation[]
    },
    enabled: !!user?.id,
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

  const filteredReservations = reservations?.filter(reservation => {
    const matchesSearch = reservation.terrain.nom.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "tous" || reservation.statut === statusFilter
    const matchesDate = !dateFilter || reservation.date_reservation === dateFilter
    return matchesSearch && matchesStatus && matchesDate
  })

  const columns = [
    {
      header: "Terrain",
      accessorKey: "terrain" as const,
      cell: (value: any) => value.nom,
    },
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
          <h1 className="text-2xl font-bold mt-2">Réservations</h1>
        </div>

        <ReservationFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
        />

        <div className="mt-8">
          <DataTable
            columns={columns}
            data={filteredReservations || []}
          />
        </div>
      </div>
    </MainLayout>
  )
}
