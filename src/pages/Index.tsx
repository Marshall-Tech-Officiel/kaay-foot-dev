import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Index() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0F2E9] to-[#CDE9E0]">
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <h1 className="text-4xl font-bold mb-2">
            <img 
              src="/kaayfoot-logo.png" 
              alt="Kaay-Foot Logo" 
              className="h-24 w-auto object-contain mx-auto mb-4" 
              loading="eager"
              priority="high"
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