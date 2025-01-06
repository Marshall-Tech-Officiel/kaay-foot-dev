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
      console.log("Profile data:", data) // Debug log
      return data
    },
    enabled: !!user?.id,
  })

  // Then use the profile ID to fetch assigned terrains
  const { data: terrains, isLoading: isLoadingTerrains } = useQuery({
    queryKey: ["terrains-gerant", profile?.id],
    queryFn: async () => {
      console.log("Fetching terrains for profile ID:", profile?.id) // Debug log
      
      const { data: assignedTerrains, error } = await supabase
        .from("droits_gerants")
        .select(`
          terrain_id,
          terrain:terrains (
            *,
            zone:zones(nom),
            region:regions(nom),
            photos:photos_terrain(url),
            profiles:profiles(nom, prenom)
          )
        `)
        .eq("gerant_id", profile?.id)

      if (error) {
        console.error("Error fetching terrains:", error) // Debug log
        throw error
      }

      console.log("Raw assigned terrains data:", assignedTerrains) // Debug log

      // Extract terrains from the assignments and remove null values
      const filteredTerrains = assignedTerrains
        .map((assignment) => assignment.terrain)
        .filter((terrain): terrain is NonNullable<typeof terrain> => terrain !== null)

      console.log("Filtered terrains:", filteredTerrains) // Debug log

      return filteredTerrains
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