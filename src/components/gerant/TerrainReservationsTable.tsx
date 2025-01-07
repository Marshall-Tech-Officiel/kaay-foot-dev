import { DataTable } from "@/components/ui/data-table"
import { type Reservation, getReservationColumns } from "./ReservationColumns"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

interface TerrainReservationsTableProps {
  reservations: Reservation[]
  onValidate: (id: string) => void
  onRefuse: (id: string) => void
}

export function TerrainReservationsTable({
  reservations,
  onValidate,
  onRefuse,
}: TerrainReservationsTableProps) {
  const [showTodayOnly, setShowTodayOnly] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  const columns = getReservationColumns(onValidate, onRefuse)
  
  const filteredReservations = showTodayOnly
    ? reservations.filter(r => r.date_reservation === today)
    : reservations

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Réservations actives</h2>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-today"
            checked={showTodayOnly}
            onCheckedChange={setShowTodayOnly}
          />
          <Label htmlFor="show-today">Afficher uniquement aujourd'hui</Label>
          {showTodayOnly && (
            <Badge variant="outline" className="ml-2">
              {format(new Date(), 'dd/MM/yyyy')}
            </Badge>
          )}
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredReservations}
      />
    </div>
  )
}