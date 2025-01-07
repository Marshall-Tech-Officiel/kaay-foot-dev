import { Search } from "@/components/ui/search"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReservationFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  dateFilter: string
  onDateChange: (value: string) => void
}

export function ReservationFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
}: ReservationFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Search
          placeholder="Rechercher par nom de terrain..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="w-full md:w-48">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="validee">Validée</SelectItem>
            <SelectItem value="refusee">Refusée</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-full md:w-48">
        <input
          type="date"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
    </div>
  )
}