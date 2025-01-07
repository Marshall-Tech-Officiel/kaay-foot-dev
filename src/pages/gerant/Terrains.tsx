import { TerrainCard } from "@/components/terrain/TerrainCard"
import { MainLayout } from "@/components/layout/MainLayout"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"

export default function GerantTerrains() {
  const { user } = useAuth()

  const { data: terrains, isLoading } = useQuery({
    queryKey: ["terrains-gerant", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!profile) throw new Error("Profile not found")

      const { data: droits } = await supabase
        .from("droits_gerants")
        .select("terrain_id")
        .eq("gerant_id", profile.id)

      if (!droits?.length) return []

      const terrain_ids = droits.map((d) => d.terrain_id)

      const { data: terrains } = await supabase
        .from("terrains")
        .select(`
          *,
          region:regions(nom),
          zone:zones(nom),
          photos:photos_terrain(url)
        `)
        .in("id", terrain_ids)

      return terrains || []
    },
    enabled: !!user?.id,
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
      <div className="space-y-6">
        <div>
          <Breadcrumbs />
          <h1 className="text-2xl font-bold mt-2">Terrains gérés</h1>
          <p className="text-muted-foreground mt-2">
            Liste des terrains dont vous êtes responsable
          </p>
        </div>

        {!terrains?.length ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Aucun terrain ne vous a été assigné</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {terrains.map((terrain) => (
              <TerrainCard 
                key={terrain.id} 
                terrain={terrain} 
                linkPrefix="/gerant/terrains"
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}