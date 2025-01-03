import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { MainLayout } from "@/components/layout/MainLayout"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { RecentReservations } from "@/components/dashboard/RecentReservations"
import { TerrainOverview } from "@/components/dashboard/TerrainOverview"
import { GerantOverview } from "@/components/dashboard/GerantOverview"

export default function ProprietaireDashboard() {
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["proprietaire-stats", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!profile) throw new Error("Profile not found")

      const today = new Date().toISOString().split('T')[0]

      // Récupérer d'abord les IDs des terrains
      const { data: terrains } = await supabase
        .from("terrains")
        .select("id")
        .eq("proprietaire_id", profile.id)

      const terrainIds = terrains?.map(t => t.id) || []

      const [
        { count: terrainsCount },
        { count: gerantsCount },
        { count: todayReservationsCount },
        { count: pendingReservationsCount }
      ] = await Promise.all([
        supabase
          .from("terrains")
          .select("*", { count: "exact", head: true })
          .eq("proprietaire_id", profile.id),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("proprietaire_id", profile.id)
          .eq("role", "gerant"),
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("date_reservation", today)
          .in("terrain_id", terrainIds),
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("statut", "en_attente")
          .in("terrain_id", terrainIds)
      ])

      return {
        terrains: terrainsCount || 0,
        gerants: gerantsCount || 0,
        reservationsJour: todayReservationsCount || 0,
        reservationsEnAttente: pendingReservationsCount || 0
      }
    },
    enabled: !!user?.id
  })

  const { data: recentReservations, isLoading: isLoadingReservations } = useQuery({
    queryKey: ["recent-reservations", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!profile) throw new Error("Profile not found")

      // Récupérer d'abord les IDs des terrains
      const { data: terrains } = await supabase
        .from("terrains")
        .select("id")
        .eq("proprietaire_id", profile.id)

      const terrainIds = terrains?.map(t => t.id) || []

      const { data } = await supabase
        .from("reservations")
        .select(`
          *,
          terrain:terrains(nom),
          reserviste:profiles(nom, prenom)
        `)
        .in("terrain_id", terrainIds)
        .order("created_at", { ascending: false })
        .limit(5)

      return data
    },
    enabled: !!user?.id
  })

  const { data: terrains, isLoading: isLoadingTerrains } = useQuery({
    queryKey: ["terrains-apercu", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!profile) throw new Error("Profile not found")

      const { data } = await supabase
        .from("terrains")
        .select(`
          *,
          photos:photos_terrain(url)
        `)
        .eq("proprietaire_id", profile.id)

      return data
    },
    enabled: !!user?.id
  })

  const { data: gerants, isLoading: isLoadingGerants } = useQuery({
    queryKey: ["gerants-actifs", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!profile) throw new Error("Profile not found")

      const { data } = await supabase
        .from("profiles")
        .select(`
          *,
          droits:droits_gerants(
            terrain:terrains(nom)
          )
        `)
        .eq("proprietaire_id", profile.id)
        .eq("role", "gerant")

      return data
    },
    enabled: !!user?.id
  })

  if (isLoadingStats || isLoadingReservations || isLoadingTerrains || isLoadingGerants) {
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
        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Terrains"
            value={stats?.terrains || 0}
            icon={LayoutDashboard}
          />
          <StatsCard
            title="Total Gérants"
            value={stats?.gerants || 0}
            icon={Users}
          />
          <StatsCard
            title="Réservations Jour"
            value={stats?.reservationsJour || 0}
            icon={Calendar}
          />
          <StatsCard
            title="En Attente"
            value={stats?.reservationsEnAttente || 0}
            icon={ClipboardList}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Liste des Dernières Réservations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Dernières Réservations</h2>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate("/proprietaire/reservations")}
              >
                Voir toutes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <RecentReservations
              reservations={recentReservations || []}
              onValidate={(id) => {
                // Implement validation logic
                toast({
                  title: "Réservation validée",
                  description: "La réservation a été validée avec succès.",
                })
              }}
              onRefuse={(id) => {
                // Implement refusal logic
                toast({
                  title: "Réservation refusée",
                  description: "La réservation a été refusée.",
                  variant: "destructive",
                })
              }}
            />
          </div>

          {/* Sections latérales */}
          <div className="space-y-6">
            {/* Aperçu Rapide des Terrains */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Aperçu des Terrains</h2>
              <div className="space-y-4">
                {terrains?.map((terrain) => (
                  <TerrainOverview key={terrain.id} terrain={terrain} />
                ))}
              </div>
            </div>

            {/* Liste des Gérants Actifs */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Gérants Actifs</h2>
              <div className="space-y-4">
                {gerants?.map((gerant) => (
                  <GerantOverview key={gerant.id} gerant={gerant} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
