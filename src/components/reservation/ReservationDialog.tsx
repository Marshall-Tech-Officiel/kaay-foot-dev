import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReservationCalendar } from "./ReservationCalendar"
import { HourSelector } from "./HourSelector"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { format } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface ReservationDialogProps {
  terrainId: string
  terrainNom: string
}

export function ReservationDialog({ terrainId, terrainNom }: ReservationDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedHours, setSelectedHours] = useState<number[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [lastSelectedHour, setLastSelectedHour] = useState<number | null>(null)
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
    setLastSelectedHour(hour)
    setShowConfirmDialog(true)
  }

  const handleAddMoreHours = () => {
    if (lastSelectedHour !== null) {
      setSelectedHours([...selectedHours, lastSelectedHour])
      setShowConfirmDialog(false)
    }
  }

  const handleFinishSelection = () => {
    if (lastSelectedHour !== null) {
      setSelectedHours([...selectedHours, lastSelectedHour])
    }
    setShowConfirmDialog(false)
    setIsReservationDialogOpen(false)
    console.log("Heures sélectionnées:", selectedHours)
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
      setLastSelectedHour(null)
      setShowConfirmDialog(false)
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
            <div>
              <ReservationCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Heures disponibles</h3>
              {selectedDate ? (
                <HourSelector
                  hours={hours}
                  selectedHours={selectedHours}
                  isHourReserved={isHourReserved}
                  isAdjacentToSelected={isAdjacentToSelected}
                  onHourClick={handleHourClick}
                />
              ) : (
                <p className="text-muted-foreground">
                  Sélectionnez une date pour voir les heures disponibles
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onAddMore={handleAddMoreHours}
        onFinish={handleFinishSelection}
      />
    </>
  )
}