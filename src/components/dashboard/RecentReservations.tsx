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
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface RecentReservationsProps {
  reservations: any[]
  onValidate: (id: string) => void
  onRefuse: (id: string) => void
}

// Define valid status types
type ReservationStatus = 'en_attente' | 'validee' | 'refusee';

export function RecentReservations({ 
  reservations,
  onValidate,
  onRefuse
}: RecentReservationsProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  
  // Filter reservations for today
  const todayReservations = reservations.filter(
    reservation => reservation.date_reservation === today
  )

  const handleValidate = async (id: string) => {
    try {
      console.log("Validating reservation:", id)
      const { error } = await supabase
        .from('reservations')
        .update({ 
          statut: 'validee' as ReservationStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error("Validation error:", error)
        throw error
      }
      
      toast.success("Réservation validée avec succès")
      onValidate(id)
    } catch (error) {
      console.error("Erreur lors de la validation:", error)
      toast.error("Erreur lors de la validation de la réservation")
    }
  }

  const handleRefuse = async (id: string) => {
    try {
      console.log("Refusing reservation:", id)
      const { error } = await supabase
        .from('reservations')
        .update({ 
          statut: 'refusee' as ReservationStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error("Refusal error:", error)
        throw error
      }
      
      toast.success("Réservation refusée")
      onRefuse(id)
    } catch (error) {
      console.error("Erreur lors du refus:", error)
      toast.error("Erreur lors du refus de la réservation")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Réservations du jour</h3>
        <Badge variant="outline">
          {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        </Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Heure</TableHead>
              <TableHead>Terrain</TableHead>
              <TableHead>Réserviste</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {todayReservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucune réservation pour aujourd'hui
                </TableCell>
              </TableRow>
            ) : (
              todayReservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>
                    {reservation.heure_debut}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {reservation.nombre_heures}h
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
                          : "destructive"
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
                        onClick={() => handleValidate(reservation.id)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={reservation.statut !== "en_attente"}
                        onClick={() => handleRefuse(reservation.id)}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}