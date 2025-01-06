import { Button } from "@/components/ui/button"

export function ReservationLegend() {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">Légende</h3>
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" className="w-8" disabled>
            00
          </Button>
          <span className="text-sm">Heure sélectionnée</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" className="w-8" disabled>
            00
          </Button>
          <span className="text-sm">Heure déjà prise</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="w-8" disabled>
            00
          </Button>
          <span className="text-sm">Heure disponible</span>
        </div>
      </div>
    </div>
  )
}