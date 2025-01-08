import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { MainLayout } from "@/components/layout/MainLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { RecentReservations } from "@/components/dashboard/RecentReservations"
import { TerrainOverview } from "@/components/dashboard/TerrainOverview"
import { Calendar, Users, CircleDollarSign, Clock } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function GerantDashboard() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["gerant-dashboard", user?.id],
    queryFn: async () => {
      // Get gérant profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!profile) throw new Error("Profile not found")

      // Get terrains managed by gérant
      const { data: droits } = await supabase
        .from("droits_gerants")
        .select(`
          terrain_id,
          terrain:terrains(
            id,
            nom,
            localisation
          )
        `)
        .eq("gerant_id", profile.id)

      const terrainIds = droits?.map(d => d.terrain_id) || []

      // Get today's reservations for managed terrains
      const { data: reservations } = await supabase
        .from("reservations")
        .select(`
          *,
          terrain:terrains(nom),
          reserviste:profiles(nom, prenom)
        `)
        .in("terrain_id", terrainIds)
        .eq("date_reservation", today)

      // Calculate statistics
      const stats = {
        totalTerrains: terrainIds.length,
        reservationsAujourdhui: reservations?.filter(r => r.date_reservation === today).length || 0,
        reservationsEnAttente: reservations?.filter(r => r.statut === "en_attente").length || 0,
        reservationsValidees: reservations?.filter(r => r.statut === "validee").length || 0
      }

      return {
        terrains: droits?.map(d => d.terrain) || [],
        reservations: reservations || [],
        stats
      }
    },
    enabled: !!user?.id
  })

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto space-y-8 px-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenue sur votre tableau de bord de gestion
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Terrains gérés"
            value={dashboardData?.stats.totalTerrains || 0}
            icon={Users}
          />
          <StatsCard
            title="Réservations aujourd'hui"
            value={dashboardData?.stats.reservationsAujourdhui || 0}
            icon={Calendar}
            subtitle={format(new Date(), 'dd MMMM yyyy', { locale: fr })}
          />
          <StatsCard
            title="En attente"
            value={dashboardData?.stats.reservationsEnAttente || 0}
            icon={Clock}
          />
          <StatsCard
            title="Validées"
            value={dashboardData?.stats.reservationsValidees || 0}
            icon={CircleDollarSign}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Liste des Dernières Réservations */}
          <div className="lg:col-span-2">
            <RecentReservations
              reservations={dashboardData?.reservations || []}
              onValidate={(id) => {
                // Implement validation logic
                console.log("Validate reservation:", id)
              }}
              onRefuse={(id) => {
                // Implement refusal logic
                console.log("Refuse reservation:", id)
              }}
            />
          </div>

          {/* Aperçu des Terrains */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Terrains gérés</h2>
            <div className="space-y-4">
              {dashboardData?.terrains.map((terrain) => (
                <TerrainOverview key={terrain.id} terrain={terrain} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}