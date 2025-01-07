import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { useState } from "react"
import { ReservationFilters } from "@/components/dashboard/ReservationFilters"
import { getReservationColumns, type Reservation } from "@/components/gerant/ReservationColumns"

export default function ProprietaireReservations() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("tous")
  const [dateFilter, setDateFilter] = useState("")

  const { data: reservations, isLoading, error, refetch } = useQuery({
    queryKey: ["reservations-proprietaire"],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (profileError) throw profileError
      console.info("Found profile:", profile)

      const { data: reservationsData, error: reservationsError } = await supabase
        .from("reservations")
        .select(`
          *,
          terrain:terrains(nom),
          reserviste:profiles(nom, prenom, telephone),
          paiement:paiements(statut)
        `)
        .eq("terrain.proprietaire_id", profile.id)
        .order("date_reservation", { ascending: false })

      if (reservationsError) throw reservationsError
      console.info("Found reservations:", reservationsData)

      // Transform the data to match the Reservation type
      const transformedData: Reservation[] = reservationsData.map((res: any) => ({
        id: res.id,
        date_reservation: res.date_reservation,
        heure_debut: res.heure_debut,
        nombre_heures: res.nombre_heures,
        reserviste: {
          nom: res.reserviste.nom,
          prenom: res.reserviste.prenom,
          telephone: res.reserviste.telephone,
        },
        statut: res.statut as "en_attente" | "validee" | "refusee",
        paiement: res.paiement,
        terrain: {
          nom: res.terrain.nom
        }
      }))

      return transformedData
    },
    enabled: !!user?.id,
  })

  const handleValidate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ 
          statut: "validee",
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error
      
      toast.success("Réservation validée avec succès")
      refetch()
    } catch (error) {
      console.error("Erreur lors de la validation:", error)
      toast.error("Erreur lors de la validation de la réservation")
    }
  }

  const handleRefuse = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ 
          statut: "refusee",
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error
      
      toast.success("Réservation refusée")
      refetch()
    } catch (error) {
      console.error("Erreur lors du refus:", error)
      toast.error("Erreur lors du refus de la réservation")
    }
  }

  if (error) {
    console.error("Query error:", error)
    toast.error("Impossible de charger les réservations. Veuillez réessayer plus tard.")
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

  const columns = getReservationColumns(handleValidate, handleRefuse)

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