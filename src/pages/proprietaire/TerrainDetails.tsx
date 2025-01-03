import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { MainLayout } from "@/components/layout/MainLayout"
import { TerrainStats } from "@/components/terrain/TerrainStats"
import { TerrainCarousel } from "@/components/terrain/TerrainCarousel"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"

export default function TerrainDetails() {
  const { id } = useParams()
  
  const { data: terrain, isLoading } = useQuery({
    queryKey: ["terrain", id],
    queryFn: async () => {
      const { data: terrain, error } = await supabase
        .from("terrains")
        .select(`
          *,
          photos:photos_terrain(url),
          region:regions(nom),
          zone:zones(nom)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      return terrain
    },
    enabled: !!id,
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

  if (!terrain) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Terrain non trouvé</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Breadcrumbs />
          <h1 className="text-2xl font-bold mt-2">{terrain.nom}</h1>
          <p className="text-muted-foreground mt-2">
            Détails et statistiques du terrain
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <TerrainCarousel photos={terrain.photos || []} />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-muted-foreground">Prix jour</div>
                <div className="text-2xl font-bold">{terrain.prix_jour} FCFA</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-muted-foreground">Prix nuit</div>
                <div className="text-2xl font-bold">{terrain.prix_nuit} FCFA</div>
              </div>
            </div>
          </div>
          
          <TerrainStats terrainId={terrain.id} />
        </div>
      </div>
    </MainLayout>
  )
}