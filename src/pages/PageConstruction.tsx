import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Construction } from "lucide-react"

export default function PageConstruction() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <Construction className="h-16 w-16 text-primary" />
      <h1 className="mt-4 text-2xl font-bold">Page en construction</h1>
      <p className="mt-2 text-gray-600">Cette page est en cours de développement</p>
      <Button
        className="mt-4"
        onClick={() => navigate(-1)}
      >
        Retour
      </Button>
    </div>
  )
}