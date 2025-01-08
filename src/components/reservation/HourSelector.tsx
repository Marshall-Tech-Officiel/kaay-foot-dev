import { Button } from "@/components/ui/button"

interface HourSelectorProps {
  hours: number[]
  selectedHours: number[]
  selectedDate: Date
  isHourReserved: (hour: number) => boolean
  isHourPassed: (hour: number, date: Date) => boolean
  isAdjacentToSelected: (hour: number) => boolean
  onHourClick: (hour: number) => void
}

export function HourSelector({
  hours,
  selectedHours,
  selectedDate,
  isHourReserved,
  isHourPassed,
  isAdjacentToSelected,
  onHourClick,
}: HourSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {hours.map((hour) => {
        const isSelected = selectedHours.includes(hour)
        const isReservedHour = isHourReserved(hour)
        const isPastHour = isHourPassed(hour, selectedDate)
        const canBeSelected = !isReservedHour && !isPastHour && (selectedHours.length === 0 || isAdjacentToSelected(hour))

        return (
          <Button
            key={hour}
            variant={
              isSelected
                ? "default"
                : isReservedHour || isPastHour
                ? "destructive"
                : "outline"
            }
            className={`w-full ${isReservedHour || isPastHour ? "bg-[#ea384c]" : ""}`}
            disabled={isReservedHour || isPastHour || (selectedHours.length > 0 && !isSelected && !isAdjacentToSelected(hour))}
            onClick={() => onHourClick(hour)}
          >
            {hour.toString().padStart(2, "0")}:00
          </Button>
        )
      })}
    </div>
  )
}