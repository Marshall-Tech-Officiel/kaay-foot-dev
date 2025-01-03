import { useState } from "react"
import { Edit } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  CheckCircle2,
  XCircle,
  ArrowRight,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { TerrainDialog } from "@/components/terrain/TerrainDialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ProprietaireDashboard() {
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [editingTerrain, setEditingTerrain] = useState<any>(null)

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
      <div className="container mx-auto space-y-8">
        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Terrains</CardTitle>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.terrains}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gérants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.gerants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réservations Jour</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.reservationsJour}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.reservationsEnAttente}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Liste des Dernières Réservations */}
          <div className="md:col-span-2 space-y-4">
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

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Heure</TableHead>
                    <TableHead>Terrain</TableHead>
                    <TableHead>Réserviste</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReservations?.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        {new Date(reservation.date_reservation).toLocaleDateString()}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          {reservation.heure_debut}
                        </span>
                      </TableCell>
                      <TableCell>{reservation.terrain?.nom}</TableCell>
                      <TableCell>
                        {reservation.reserviste?.prenom} {reservation.reserviste?.nom}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            reservation.statut === "validee"
                              ? "secondary"
                              : reservation.statut === "en_attente"
                              ? "outline"
                              : "default"
                          }
                        >
                          {reservation.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={reservation.statut !== "en_attente"}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={reservation.statut !== "en_attente"}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Sections latérales */}
          <div className="space-y-6">
            {/* Aperçu Rapide des Terrains */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Aperçu des Terrains</h2>
              <div className="space-y-4">
                {terrains?.map((terrain) => (
                  <Card key={terrain.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{terrain.nom}</h3>
                          <p className="text-sm text-muted-foreground">
                            {terrain.localisation || "Emplacement non spécifié"}
                          </p>
                        </div>
                        <Badge variant="outline">Disponible</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Liste des Gérants Actifs */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Gérants Actifs</h2>
              <div className="space-y-4">
                {gerants?.map((gerant) => (
                  <Card key={gerant.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">
                            {gerant.prenom} {gerant.nom}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {gerant.droits?.length} terrain(s) assigné(s)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
