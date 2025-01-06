import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

export default function GerantTerrains() {
  const { user } = useAuth()

  // Fetch the profile ID first
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (error) throw error
      console.log("Profile data:", data)
      return data
    },
    enabled: !!user?.id,
  })

  // Then use the profile ID to fetch assigned terrains
  const { data: terrains, isLoading: isLoadingTerrains } = useQuery({
    queryKey: ["terrains-gerant", profile?.id],
    queryFn: async () => {
      console.log("Fetching terrains for profile ID:", profile?.id)
      
      // Modifié pour d'abord vérifier les droits_gerants
      const { data: droits, error: droitsError } = await supabase
        .from("droits_gerants")
        .select("terrain_id")
        .eq("gerant_id", profile?.id)

      if (droitsError) {
        console.error("Error fetching droits:", droitsError)
        throw droitsError
      }

      console.log("Droits data:", droits)

      if (droits.length === 0) {
        return []
      }

      const terrainIds = droits.map(d => d.terrain_id)

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

      console.log("Terrains data:", terrains)
      return terrains
    },
    enabled: !!profile?.id,
  })

  if (isLoadingProfile || isLoadingTerrains) {
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