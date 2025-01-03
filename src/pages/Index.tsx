import { MainLayout } from "@/components/layout/MainLayout"
import { Search } from "@/components/ui/search"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

const Index = () => {
  const navigate = useNavigate()

  const { data: featuredTerrains, isLoading } = useQuery({
    queryKey: ['featured-terrains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terrains')
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom),
          photos:photos_terrain(url)
        `)
        .limit(3)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  return (
    <MainLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <h1 className="text-4xl font-bold mb-2">Mini-Foot</h1>
          <div className="h-1 w-24 bg-primary mb-4" />
          <p className="text-xl text-muted-foreground mb-8">
            Gérez vos terrains de foot en toute simplicité
          </p>
          
          {/* Search Section */}
          <div className="w-full max-w-lg mb-8">
            <Search 
              placeholder="Rechercher un terrain..." 
              className="w-full"
            />
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Connexion
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              Inscription
            </button>
          </div>
        </div>

        {/* Featured Terrains Section */}
        <section className="px-4 pb-8">
          <h2 className="text-2xl font-semibold mb-6">Terrains à la une</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-[400px] bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTerrains?.map((terrain) => (
                <TerrainCard key={terrain.id} terrain={terrain} />
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  )
}

export default Index