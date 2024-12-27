import { MainLayout } from "@/components/layout/MainLayout"
import { Search } from "@/components/ui/search"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { Badge } from "@/components/ui/badge"

const Index = () => {
  return (
    <MainLayout>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <h1 className="text-4xl font-bold mb-2">Mini-Foot</h1>
          <div className="h-1 w-24 bg-red-500 mb-4" />
          <p className="text-xl text-gray-600 mb-8">
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
            <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              Connexion
            </button>
            <button className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors">
              Inscription
            </button>
          </div>
        </div>

        {/* Featured Terrains Section */}
        <section className="px-4">
          <h2 className="text-2xl font-semibold mb-6">Terrains à la une</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TerrainCard
              nom="Terrain Olympique"
              localisation="Dakar, Parcelles Assainies"
              prix_jour={15000}
              prix_nuit={20000}
              taille="Standard"
              imageUrl="https://images.unsplash.com/photo-1615729947596-a598e5de0ab3"
            />
            <TerrainCard
              nom="Terrain Elite"
              localisation="Dakar, Almadies"
              prix_jour={20000}
              prix_nuit={25000}
              taille="Premium"
            />
            <TerrainCard
              nom="Terrain Central"
              localisation="Dakar, Plateau"
              prix_jour={18000}
              prix_nuit={22000}
              taille="Standard"
            />
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

export default Index