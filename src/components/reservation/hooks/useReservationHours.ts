import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"

export function useReservationHours(terrainId: string, selectedDate: Date | undefined) {
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
      const startHour = parseInt(reservation.heure_debut.split(":")[0])
      const endHour = startHour + reservation.nombre_heures
      return hour >= startHour && hour < endHour
    })
  }

  const isAdjacentToSelected = (hour: number, selectedHours: number[]) => {
    if (selectedHours.length === 0) return true
    return selectedHours.some(selectedHour => Math.abs(selectedHour - hour) === 1)
  }

  return {
    hours,
    isHourReserved,
    isAdjacentToSelected,
  }
}