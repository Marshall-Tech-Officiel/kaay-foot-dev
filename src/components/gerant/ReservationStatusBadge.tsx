import { Badge } from "@/components/ui/badge"

export function ReservationStatusBadge({ status }: { status: string }) {
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