import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReservationCalendar } from "./ReservationCalendar"
import { HourSelector } from "./HourSelector"
import { ReservationConfirmation } from "./ReservationConfirmation"
import { ReservationLegend } from "./ReservationLegend"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

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
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedHours, setSelectedHours] = useState<number[]>([])
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const { data: reservations } = useQuery({
    queryKey: ["terrain-reservations", terrainId, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return []
      
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("terrain_id", terrainId)
        .eq("date_reservation", format(selectedDate, "yyyy-MM-dd"))

      if (error) throw error
      return data
    },
    enabled: !!terrainId && !!selectedDate,
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const isHourReserved = (hour: number) => {
    if (!reservations) return false
    return reservations.some(reservation => {
      const reservationHour = parseInt(reservation.heure_debut.split(":")[0])
      return reservationHour === hour
    })
  }

  const handleHourClick = (hour: number) => {
    if (selectedHours.includes(hour)) {
      setSelectedHours(selectedHours.filter(h => h !== hour))
    } else {
      setSelectedHours([...selectedHours, hour].sort((a, b) => a - b))
    }
  }

  const isAdjacentToSelected = (hour: number) => {
    if (selectedHours.length === 0) return true
    return selectedHours.some(selectedHour => Math.abs(selectedHour - hour) === 1)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsReservationDialogOpen(open)
    if (!open) {
      setSelectedDate(undefined)
      setSelectedHours([])
      setShowConfirmation(false)
    }
  }

  const calculateTotalPrice = () => {
    let total = 0
    const debutNuit = parseInt(heureDebutNuit.split(":")[0])
    const finNuit = parseInt(heureFinNuit.split(":")[0])

    selectedHours.forEach(hour => {
      if (
        (hour >= debutNuit && hour <= 23) || 
        (hour >= 0 && hour < finNuit)
      ) {
        total += prixNuit
      } else {
        total += prixJour
      }
    })

    return total
  }

  const handleReservation = () => {
    if (selectedHours.length === 0) {
      toast.error("Veuillez sélectionner au moins une heure")
      return
    }
    setShowConfirmation(true)
  }

  const handleRequestReservation = () => {
    console.log("Demande de réservation")
    setShowConfirmation(false)
    setIsReservationDialogOpen(false)
    toast.success("Demande de réservation envoyée")
  }

  const handlePayNow = () => {
    console.log("Paiement immédiat")
    setShowConfirmation(false)
    setIsReservationDialogOpen(false)
    toast.success("Redirection vers la page de paiement...")
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
            <div>
              <ReservationCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Heures disponibles</h3>
              {selectedDate ? (
                <>
                  <ReservationLegend />
                  <HourSelector
                    hours={hours}
                    selectedHours={selectedHours}
                    isHourReserved={isHourReserved}
                    isAdjacentToSelected={isAdjacentToSelected}
                    onHourClick={handleHourClick}
                  />
                  {selectedHours.length > 0 && (
                    <Button 
                      className="w-full mt-4" 
                      onClick={handleReservation}
                    >
                      Réserver {selectedHours.length} heure{selectedHours.length > 1 ? 's' : ''}
                    </Button>
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
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        selectedDate={selectedDate}
        selectedHours={selectedHours}
        totalPrice={calculateTotalPrice()}
        onRequestReservation={handleRequestReservation}
        onPayNow={handlePayNow}
      />
    </>
  )
}