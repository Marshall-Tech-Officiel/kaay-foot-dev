import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { format } from "date-fns"

interface ReservationConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | undefined
  selectedHours: number[]
  totalPrice: number
  onPayNow: () => void
}

export function ReservationConfirmation({
  open,
  onOpenChange,
  selectedDate,
  selectedHours,
  totalPrice,
  onPayNow,
}: ReservationConfirmationProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la réservation</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Vous avez sélectionné {selectedHours.length} heure{selectedHours.length > 1 ? 's' : ''} 
              {selectedDate && ` pour le ${format(selectedDate, 'dd/MM/yyyy')}`}
            </p>
            <p>
              Heures sélectionnées : {selectedHours.map(h => `${h.toString().padStart(2, "0")}:00`).join(", ")}
            </p>
            <p className="font-semibold">
              Prix total : {totalPrice} FCFA
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onPayNow}>
            Payer maintenant
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}