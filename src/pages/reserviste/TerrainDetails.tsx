import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { Loader2, MapPin, Clock } from "lucide-react"
import { TerrainCarousel } from "@/components/terrain/TerrainCarousel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReservationDialog } from "@/components/reservation/ReservationDialog"

export default function TerrainDetails() {
  const { id } = useParams()

  const { data: terrain, isLoading } = useQuery({
    queryKey: ["terrain-details", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terrains")
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom),
          photos:photos_terrain(url)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })

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
        <div className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Terrain non trouvé</p>
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

                <ReservationDialog terrainId={terrain.id} terrainNom={terrain.nom} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}