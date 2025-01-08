import { Calendar } from "@/components/ui/calendar"
import { fr } from "date-fns/locale"
import { startOfToday, isBefore } from "date-fns"

interface ReservationCalendarProps {
  selectedDate: Date | undefined
  onDateSelect: (date: Date | undefined) => void
}

export function ReservationCalendar({ selectedDate, onDateSelect }: ReservationCalendarProps) {
  const today = startOfToday()

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateSelect}
      locale={fr}
      disabled={(date) => isBefore(date, today)}
      className="rounded-md border"
    />
  )
}