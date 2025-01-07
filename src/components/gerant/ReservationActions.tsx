import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

interface ReservationActionsProps {
  status: string
  onValidate: () => void
  onRefuse: () => void
}

export function ReservationActions({ status, onValidate, onRefuse }: ReservationActionsProps) {
  if (status !== "en_attente") return null

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onValidate}
      >
        <CheckCircle className="h-4 w-4 text-green-500" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onRefuse}
      >
        <XCircle className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  )
}