import { Button } from "@/components/ui/button"

interface HourSelectorProps {
  hours: number[]
  selectedHours: number[]
  isHourReserved: (hour: number) => boolean
  isAdjacentToSelected: (hour: number) => boolean
  onHourClick: (hour: number) => void
}

export function HourSelector({
  hours,
  selectedHours,
  isHourReserved,
  isAdjacentToSelected,
  onHourClick,
}: HourSelectorProps) {
  const isPartOfTwoHourReservation = (hour: number): boolean => {
    const prevHour = hour - 1
    const nextHour = hour + 1
    return (isHourReserved(hour) && isHourReserved(nextHour)) || 
           (isHourReserved(hour) && isHourReserved(prevHour))
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {hours.map((hour) => {
        const isSelected = selectedHours.includes(hour)
        const isReservedHour = isHourReserved(hour)
        const isPartOfTwoHours = isPartOfTwoHourReservation(hour)
        const canBeSelected = !isReservedHour && (selectedHours.length === 0 || isAdjacentToSelected(hour))

        return (
          <Button
            key={hour}
            variant={
              isSelected
                ? "default"
                : isReservedHour
                ? "destructive"
                : "outline"
            }
            className={`w-full ${isPartOfTwoHours ? "bg-[#ea384c]" : ""}`}
            disabled={isReservedHour || (selectedHours.length > 0 && !isSelected && !isAdjacentToSelected(hour))}
            onClick={() => onHourClick(hour)}
          >
            {hour.toString().padStart(2, "0")}:00
          </Button>
        )
      })}
    </div>
  )
}