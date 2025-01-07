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
import { type ColumnDef } from "@tanstack/react-table"

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

      const { data: droitsGerants, error: droitsError } = await supabase
        .from("droits_gerants")
        .select("terrain_id")
        .eq("gerant_id", profile.id)

      if (droitsError) throw droitsError
      console.info("Found droits_gerants:", droitsGerants)

      if (!droitsGerants?.length) return []

      const terrainIds = droitsGerants.map(d => d.terrain_id)

      const { data: reservationsData, error: reservationsError } = await supabase
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
      console.info("Found reservations:", reservationsData)

      return reservationsData as Reservation[]
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

  const columns: ColumnDef<Reservation>[] = [
    {
      header: "Terrain",
      accessorKey: "terrain",
      cell: (info) => info.getValue<{ nom: string }>().nom,
    },
    {
      header: "Date",
      accessorKey: "date_reservation",
      cell: (info) => new Date(info.getValue<string>()).toLocaleDateString(),
    },
    {
      header: "Heure",
      accessorKey: "heure_debut",
    },
    {
      header: "Durée",
      accessorKey: "nombre_heures",
      cell: (info) => `${info.getValue<number>()}h`,
    },
    {
      header: "Réserviste",
      accessorKey: "reserviste",
      cell: (info) => {
        const value = info.getValue<{ nom: string; prenom: string }>()
        return `${value.prenom} ${value.nom}`
      },
    },
    {
      header: "Téléphone",
      accessorKey: "reserviste",
      cell: (info) => info.getValue<{ telephone: string }>().telephone,
    },
    {
      header: "Statut",
      accessorKey: "statut",
      cell: (info) => (
        <Badge
          variant={
            info.getValue<string>() === "validee"
              ? "secondary"
              : info.getValue<string>() === "en_attente"
              ? "outline"
              : "destructive"
          }
        >
          {info.getValue<string>()}
        </Badge>
      ),
    },
    {
      header: "Paiement",
      accessorKey: "paiement",
      cell: (info) => (
        <Badge
          variant={
            info.getValue<Array<{ statut: string }>>()[0]?.statut === "paye"
              ? "secondary"
              : "destructive"
          }
        >
          {info.getValue<Array<{ statut: string }>>()[0]?.statut || "non payé"}
        </Badge>
      ),
    },
  ]

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