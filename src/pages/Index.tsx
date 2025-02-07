
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"

export default function Index() {
  const navigate = useNavigate()

  const { data: terrains, isLoading } = useQuery({
    queryKey: ["terrains-public"],
    queryFn: async () => {
      console.log("Fetching terrains data...")
      const { data: terrainsWithRatings, error } = await supabase
        .from("terrains")
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom),
          photos:photos_terrain(url),
          terrain_ratings(rating)
        `)

      if (error) {
        console.error("Error fetching terrains:", error)
        throw error
      }

      console.log("Terrains data received:", terrainsWithRatings)
      return terrainsWithRatings
    },
    initialData: [],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0F2E9] to-[#CDE9E0]">
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <h1 className="text-4xl font-bold mb-2">
            <img 
              src="/kaayfoot-logo.png" 
              alt="Kaay-Foot Logo" 
              className="h-24 w-24 object-cover rounded-full mx-auto mb-4" 
              loading="eager"
            />
          </h1>
          <h2 className="text-3xl font-bold text-gray-800">
            Réservez votre terrain de foot en quelques clics
          </h2>
          <p className="text-xl text-gray-600 mt-4 max-w-2xl">
            Kaay-Foot vous permet de trouver et réserver facilement des terrains de foot près de chez vous
          </p>
          <div className="flex gap-4 mt-8">
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Commencer
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Se connecter
            </Button>
          </div>
        </div>

        {/* Terrains Preview Section */}
        <div className="p-8">
          <h3 className="text-2xl font-semibold mb-6 text-center">Terrains disponibles</h3>
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : terrains && terrains.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {terrains.slice(0, 3).map((terrain) => (
                <div key={terrain.id} className="bg-white p-6 rounded-lg shadow-md">
                  {terrain.photos && terrain.photos[0] && (
                    <img
                      src={terrain.photos[0].url}
                      alt={terrain.nom}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <h4 className="text-xl font-semibold mb-2">{terrain.nom}</h4>
                  <p className="text-gray-600">
                    {terrain.zone?.nom}, {terrain.region?.nom}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">Aucun terrain disponible pour le moment</p>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 p-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Recherche Facile</h3>
            <p className="text-gray-600">
              Trouvez rapidement des terrains disponibles dans votre zone
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Réservation Simple</h3>
            <p className="text-gray-600">
              Réservez votre créneau en quelques clics
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Paiement Sécurisé</h3>
            <p className="text-gray-600">
              Payez en toute sécurité via notre plateforme
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
