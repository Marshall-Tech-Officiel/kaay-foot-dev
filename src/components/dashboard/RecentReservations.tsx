import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle, XCircle } from "lucide-react"

interface RecentReservationsProps {
  reservations: any[]
  onValidate: (id: string) => void
  onRefuse: (id: string) => void
}

export function RecentReservations({ 
  reservations,
  onValidate,
  onRefuse
}: RecentReservationsProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date/Heure</TableHead>
            <TableHead>Terrain</TableHead>
            <TableHead>Réserviste</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations?.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell>
                {new Date(reservation.date_reservation).toLocaleDateString()}
                <br />
                <span className="text-sm text-muted-foreground">
                  {reservation.heure_debut}
                </span>
              </TableCell>
              <TableCell>{reservation.terrain?.nom}</TableCell>
              <TableCell>
                {reservation.reserviste?.prenom} {reservation.reserviste?.nom}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    reservation.statut === "validee"
                      ? "secondary"
                      : reservation.statut === "en_attente"
                      ? "outline"
                      : "default"
                  }
                >
                  {reservation.statut}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={reservation.statut !== "en_attente"}
                    onClick={() => onValidate(reservation.id)}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={reservation.statut !== "en_attente"}
                    onClick={() => onRefuse(reservation.id)}
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}