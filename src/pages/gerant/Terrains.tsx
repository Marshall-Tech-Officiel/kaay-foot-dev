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
    queryKey: ["terrains-gerant", user?.id],
    queryFn: async () => {
      console.log("Fetching terrains for user ID:", user?.id)
      
      // First get the profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        throw profileError
      }

      console.log("Profile found:", profile)

      // Get the terrain IDs first
      const { data: droits, error: droitsError } = await supabase
        .from("droits_gerants")
        .select("terrain_id")
        .eq("gerant_id", profile.id)

      if (droitsError) {
        console.error("Error fetching droits:", droitsError)
        throw droitsError
      }

      if (!droits?.length) {
        console.log("No terrains assigned")
        return []
      }

      const terrainIds = droits.map(d => d.terrain_id)

      // Then fetch the terrains with these IDs
      const { data: terrains, error: terrainsError } = await supabase
        .from("terrains")
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom),
          photos:photos_terrain(url),
          profiles:profiles(nom, prenom)
        `)
        .in("id", terrainIds)

      if (terrainsError) {
        console.error("Error fetching terrains:", terrainsError)
        throw terrainsError
      }

      console.log("Terrains found:", terrains)
      return terrains
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
                showProprietaire
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}