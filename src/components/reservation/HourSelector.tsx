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
  return (
    <div className="grid grid-cols-4 gap-2">
      {hours.map((hour) => (
        <Button
          key={hour}
          variant={
            selectedHours.includes(hour)
              ? "default"
              : isHourReserved(hour)
              ? "destructive"
              : "outline"
          }
          className="w-full"
          disabled={
            isHourReserved(hour) ||
            (selectedHours.length > 0 && !isAdjacentToSelected(hour))
          }
          onClick={() => onHourClick(hour)}
        >
          {hour.toString().padStart(2, "0")}:00
        </Button>
      ))}
    </div>
  )
}