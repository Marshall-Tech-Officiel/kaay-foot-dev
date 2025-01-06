import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

export default function GerantTerrains() {
  const { user } = useAuth()

  const { data: terrains, isLoading } = useQuery({
    queryKey: ["terrains-gerant"],
    queryFn: async () => {
      const { data: assignedTerrains, error } = await supabase
        .from("droits_gerants")
        .select(`
          terrain_id,
          terrain:terrains (
            *,
            zone:zones(nom),
            region:regions(nom),
            photos:photos_terrain(url)
          )
        `)
        .eq("gerant_id", user?.id)

      if (error) throw error

      // Extract terrains from the assignments and remove null values
      return assignedTerrains
        .map((assignment) => assignment.terrain)
        .filter((terrain): terrain is NonNullable<typeof terrain> => terrain !== null)
    },
    enabled: !!user?.id,
  })

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Breadcrumbs />
          <h1 className="text-2xl font-bold mt-2">Mes Terrains Assignés</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les terrains qui vous ont été assignés.
          </p>
        </div>

        {!terrains?.length ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">
              Aucun terrain ne vous a encore été assigné
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {terrains.map((terrain) => (
              <TerrainCard 
                key={terrain.id} 
                terrain={terrain}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}