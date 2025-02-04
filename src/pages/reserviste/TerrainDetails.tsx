import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { Loader2, MapPin, Clock } from "lucide-react"
import { TerrainCarousel } from "@/components/terrain/TerrainCarousel"
import { TerrainRating } from "@/components/terrain/TerrainRating"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReservationDialog } from "@/components/reservation/ReservationDialog"
import { toast } from "sonner"
import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"

export default function TerrainDetails() {
  const { id } = useParams()
  const { user, isLoading: isAuthLoading } = useAuth()

  // Restaurer la session si les tokens sont présents dans localStorage
  useEffect(() => {
    const accessToken = localStorage.getItem('sb-access-token')
    const refreshToken = localStorage.getItem('sb-refresh-token')
    
    if (accessToken && refreshToken && !user) {
      console.log("Restoring session from localStorage...")
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
    }
  }, [user])

  const { data: terrain, isLoading: isTerrainLoading, error } = useQuery({
    queryKey: ["terrain-details", id],
    queryFn: async () => {
      console.log("Fetching terrain details for ID:", id)
      const { data, error } = await supabase
        .from("terrains")
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom),
          photos:photos_terrain(url)
        `)
        .eq("id", id)
        .maybeSingle()

      if (error) {
        console.error("Error fetching terrain:", error)
        throw error
      }
      
      if (!data) {
        throw new Error("Terrain non trouvé")
      }

      console.log("Terrain data:", data)
      return data
    },
    enabled: !!id && !isAuthLoading,
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const isLoading = isAuthLoading || isTerrainLoading

  if (error) {
    console.error("Query error:", error)
    toast.error("Impossible de charger les détails du terrain. Veuillez réessayer plus tard.")
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <p className="text-red-500">Une erreur est survenue lors du chargement des détails du terrain.</p>
          </div>
        </div>
      </MainLayout>
    )
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

  if (!terrain) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <p className="text-muted-foreground">Terrain non trouvé</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const location = terrain.localisation || `${terrain.zone?.nom}, ${terrain.region?.nom}`

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <Breadcrumbs />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <TerrainCarousel photos={terrain.photos || []} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{terrain.nom}</span>
                <Badge variant="outline">{terrain.taille}</Badge>
              </CardTitle>
              <CardDescription className="space-y-2">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {location}
                </div>
                <TerrainRating terrainId={terrain.id} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <div className="flex gap-2">
                    <Badge variant="secondary">Jour: {terrain.prix_jour} FCFA</Badge>
                    <Badge variant="secondary">Nuit: {terrain.prix_nuit} FCFA</Badge>
                  </div>
                </div>

                {terrain.description && (
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground">{terrain.description}</p>
                  </div>
                )}

                <ReservationDialog 
                  terrainId={terrain.id} 
                  terrainNom={terrain.nom}
                  prixJour={terrain.prix_jour}
                  prixNuit={terrain.prix_nuit}
                  heureDebutNuit={terrain.heure_debut_nuit}
                  heureFinNuit={terrain.heure_fin_nuit}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}