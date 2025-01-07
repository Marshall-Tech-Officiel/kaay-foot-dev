import { Badge } from "@/components/ui/badge"

interface ReservationStatusBadgeProps {
  status: string
}

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  return (
    <Badge
      variant={
        status === "validee"
          ? "secondary"
          : status === "en_attente"
          ? "outline"
          : "destructive"
      }
    >
      {status}
    </Badge>
  )
}