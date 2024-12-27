import { MainLayout } from "@/components/layout/MainLayout"

const Index = () => {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
        <h1 className="text-4xl font-bold mb-2">Mini-Foot</h1>
        <div className="h-1 w-24 bg-red-500 mb-4" />
        <p className="text-xl text-gray-600 mb-8">
          Gérez vos terrains de foot en toute simplicité
        </p>
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Connexion
          </button>
          <button className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors">
            Inscription
          </button>
        </div>
      </div>
    </MainLayout>
  )
}

export default Index