
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
      const { data, error } = await supabase
        .from("terrains")
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom),
          photos:photos_terrain(url),
          terrain_ratings(rating)
        `)
        .throwOnError()

      if (!data) return []

      return data.map(terrain => ({
        ...terrain,
        averageRating: terrain.terrain_ratings?.length 
          ? terrain.terrain_ratings.reduce((sum, r) => sum + r.rating, 0) / terrain.terrain_ratings.length
          : 0
      })).sort((a, b) => b.averageRating - a.averageRating)
    },
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false
  })

  const filteredTerrains = terrains?.filter(terrain => 
    [terrain.nom, terrain.zone?.nom, terrain.region?.nom]
      .some(value => value?.toLowerCase().includes(searchTerm.toLowerCase()))
  ) ?? []

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
        ) : !filteredTerrains.length ? (
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
