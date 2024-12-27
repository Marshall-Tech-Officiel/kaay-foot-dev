import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Error403() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">403</h1>
      <p className="mt-2 text-lg text-gray-600">Accès refusé</p>
      <Button
        className="mt-4"
        onClick={() => navigate(-1)}
      >
        Retour
      </Button>
    </div>
  )
}