import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { Search } from "@/components/ui/search"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"

export default function ReservisteAccueil() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data: terrains, isLoading } = useQuery({
    queryKey: ["terrains-public"],
    queryFn: async () => {
      // Fetch terrains with their ratings
      const { data: terrainsWithRatings, error } = await supabase
        .from("terrains")
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom),
          photos:photos_terrain(url),
          terrain_ratings(rating)
        `)

      if (error) throw error

      // Calculate average rating for each terrain and sort
      const processedTerrains = terrainsWithRatings.map(terrain => {
        const ratings = terrain.terrain_ratings || []
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
          : 0
        return {
          ...terrain,
          averageRating: avgRating
        }
      }).sort((a, b) => b.averageRating - a.averageRating)

      return processedTerrains
    },
  })

  const filteredTerrains = terrains?.filter((terrain) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      terrain.nom.toLowerCase().includes(searchLower) ||
      terrain.zone?.nom?.toLowerCase().includes(searchLower) ||
      terrain.region?.nom?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Terrains disponibles</h1>
          <p className="text-muted-foreground mt-2">
            Trouvez et réservez votre terrain de foot
          </p>
        </div>

        <div className="max-w-md">
          <Search
            placeholder="Rechercher par nom, zone ou région..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filteredTerrains?.length ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">
              {searchTerm
                ? "Aucun terrain ne correspond à votre recherche"
                : "Aucun terrain disponible pour le moment"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTerrains.map((terrain) => (
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