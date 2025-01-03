import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const now = new Date()
      const today = now.toISOString().split('T')[0]

      const [
        { count: totalTerrains },
        { count: totalProprietaires },
        { count: totalGerants },
        { count: reservationsEnAttente },
        { count: reservationsDuJour }
      ] = await Promise.all([
        // Total des terrains
        supabase
          .from('terrains')
          .select('*', { count: 'exact', head: true }),

        // Total des propriétaires
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'proprietaire'),

        // Total des gérants
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'gerant'),

        // Réservations en attente
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'en_attente'),

        // Réservations du jour
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('date_reservation', today)
      ])

      return {
        totalTerrains: totalTerrains || 0,
        totalProprietaires: totalProprietaires || 0,
        totalGerants: totalGerants || 0,
        reservationsEnAttente: reservationsEnAttente || 0,
        reservationsDuJour: reservationsDuJour || 0
      }
    }
  })

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-4 p-4">
        <h1 className="mb-8 text-3xl font-bold">Tableau de bord</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Terrains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTerrains}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Propriétaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProprietaires}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gérants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalGerants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réservations en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.reservationsEnAttente}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réservations du jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.reservationsDuJour}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}