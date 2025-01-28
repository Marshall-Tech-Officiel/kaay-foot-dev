import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReservationCalendar } from "./ReservationCalendar"
import { HourSelector } from "./HourSelector"
import { ReservationLegend } from "./ReservationLegend"
import { useReservation } from "./hooks/useReservation"
import { useReservationHours } from "./hooks/useReservationHours"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

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
  const {
    selectedDate,
    setSelectedDate,
    selectedHours,
    setSelectedHours,
    isReservationDialogOpen,
    setIsReservationDialogOpen,
    calculateTotalPrice,
    handleRequestReservation,
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
    }
  }

  const handleReservation = () => {
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date")
      return
    }
    if (selectedHours.length === 0) {
      toast.error("Veuillez sélectionner au moins une heure")
      return
    }
    handleRequestReservation()
  }

  return (
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
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline"
                        onClick={handleReservation}
                      >
                        Demander réservation
                      </Button>
                      <Button 
                        onClick={handlePayNow}
                      >
                        Réserver maintenant
                      </Button>
                    </div>
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
  )
}