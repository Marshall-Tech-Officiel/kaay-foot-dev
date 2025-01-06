import { Calendar } from "@/components/ui/calendar"
import { fr } from "date-fns/locale"

interface ReservationCalendarProps {
  selectedDate: Date | undefined
  onDateSelect: (date: Date | undefined) => void
}

export function ReservationCalendar({ selectedDate, onDateSelect }: ReservationCalendarProps) {
  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateSelect}
      locale={fr}
      className="rounded-md border"
    />
  )
}