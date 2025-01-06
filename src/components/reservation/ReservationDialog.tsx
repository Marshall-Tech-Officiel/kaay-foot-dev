import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReservationCalendar } from "./ReservationCalendar"
import { HourSelector } from "./HourSelector"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface ReservationDialogProps {
  terrainId: string
  terrainNom: string
}

export function ReservationDialog({ terrainId, terrainNom }: ReservationDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedHours, setSelectedHours] = useState<number[]>([])
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false)

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
      // Si l'heure est déjà sélectionnée, on la retire
      setSelectedHours(selectedHours.filter(h => h !== hour))
    } else {
      // Sinon on l'ajoute
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
    }
  }

  const handleReservation = () => {
    if (selectedHours.length === 0) {
      toast.error("Veuillez sélectionner au moins une heure")
      return
    }
    // TODO: Implémenter la logique de réservation
    console.log("Réservation pour les heures:", selectedHours)
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
  )
}