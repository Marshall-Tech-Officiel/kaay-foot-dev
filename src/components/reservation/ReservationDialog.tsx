import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReservationCalendar } from "./ReservationCalendar"
import { HourSelector } from "./HourSelector"
import { ReservationLegend } from "./ReservationLegend"
import { useReservation } from "./hooks/useReservation"
import { useReservationHours } from "./hooks/useReservationHours"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import { ReservationConfirmation } from "./ReservationConfirmation"
import { useState } from "react"

interface ReservationDialogProps {
  terrainId: string
  terrainNom: string
  prixJour: number
  prixNuit: number
  heureDebutNuit: string
  heureFinNuit: string
}

export function ReservationDialog({ 
  terrainId, 
  terrainNom,
  prixJour,
  prixNuit,
  heureDebutNuit,
  heureFinNuit
}: ReservationDialogProps) {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    selectedDate,
    setSelectedDate,
    selectedHours,
    setSelectedHours,
    isReservationDialogOpen,
    setIsReservationDialogOpen,
    calculateTotalPrice,
    handlePayNow,
  } = useReservation({
    terrainId,
    prixJour,
    prixNuit,
    heureDebutNuit,
    heureFinNuit,
  })

  const { hours, isHourReserved, isHourPassed, isAdjacentToSelected } = useReservationHours(terrainId, selectedDate)

  const handleHourClick = (hour: number) => {
    if (selectedHours.includes(hour)) {
      setSelectedHours(selectedHours.filter(h => h !== hour))
    } else {
      setSelectedHours([...selectedHours, hour].sort((a, b) => a - b))
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsReservationDialogOpen(open)
    if (!open) {
      setSelectedDate(undefined)
      setSelectedHours([])
      setIsConfirmationOpen(false)
    }
  }

  const handlePaymentClick = async () => {
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date")
      return
    }
    if (selectedHours.length === 0) {
      toast.error("Veuillez sélectionner au moins une heure")
      return
    }
    setIsConfirmationOpen(true)
  }

  const handleConfirmedPayment = async () => {
    setIsLoading(true)
    try {
      await handlePayNow()
    } catch (error) {
      console.error("Erreur lors du paiement:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isReservationDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button className="w-full mt-4">Réserver</Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Réserver {terrainNom}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <ReservationCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
              <ReservationLegend />
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Heures disponibles</h3>
              {selectedDate ? (
                <>
                  <HourSelector
                    hours={hours}
                    selectedHours={selectedHours}
                    selectedDate={selectedDate}
                    isHourReserved={isHourReserved}
                    isHourPassed={isHourPassed}
                    isAdjacentToSelected={(hour) => isAdjacentToSelected(hour, selectedHours)}
                    onHourClick={handleHourClick}
                  />
                  {selectedHours.length > 0 && (
                    <div className="space-y-4 mt-4">
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-medium">Prix total:</span>
                        <span className="text-lg font-bold">{formatPrice(calculateTotalPrice())} FCFA</span>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={handlePaymentClick}
                      >
                        Réserver maintenant
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Sélectionnez une date pour voir les heures disponibles
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReservationConfirmation
        open={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
        selectedDate={selectedDate}
        selectedHours={selectedHours}
        totalPrice={calculateTotalPrice()}
        onPayNow={handleConfirmedPayment}
        isLoading={isLoading}
      />
    </>
  )
}