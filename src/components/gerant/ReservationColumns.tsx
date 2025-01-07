import { type ColumnDef } from "@tanstack/react-table"
import { ReservationStatusBadge } from "./ReservationStatusBadge"
import { ReservationActions } from "./ReservationActions"
import { Badge } from "@/components/ui/badge"

export type Reservation = {
  id: string
  date_reservation: string
  heure_debut: string
  nombre_heures: number
  reserviste: { nom: string; prenom: string; telephone: string }
  statut: "en_attente" | "validee" | "refusee"
  paiement: Array<{ statut: string }>
  terrain: { nom: string }
}

export const getReservationColumns = (
  onValidate: (id: string) => void,
  onRefuse: (id: string) => void
): ColumnDef<Reservation>[] => [
  {
    accessorKey: "date_reservation",
    header: "Date",
    cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
  },
  {
    accessorKey: "heure_debut",
    header: "Heure",
  },
  {
    accessorKey: "nombre_heures",
    header: "Durée",
    cell: (info) => `${info.getValue() as number}h`,
  },
  {
    accessorKey: "reserviste",
    header: "Réserviste",
    cell: (info) => {
      const value = info.getValue() as { nom: string; prenom: string }
      return `${value.prenom} ${value.nom}`
    },
  },
  {
    accessorKey: "reserviste",
    header: "Téléphone",
    cell: (info) => (info.getValue() as { telephone: string }).telephone,
  },
  {
    accessorKey: "statut",
    header: "Statut",
    cell: (info) => <ReservationStatusBadge status={info.getValue() as string} />,
  },
  {
    accessorKey: "paiement",
    header: "Paiement",
    cell: (info) => (
      <Badge
        variant={
          (info.getValue() as Array<{ statut: string }>)?.[0]?.statut === "paye"
            ? "secondary"
            : "destructive"
        }
      >
        {(info.getValue() as Array<{ statut: string }>)?.[0]?.statut || "non payé"}
      </Badge>
    ),
  },
  {
    accessorKey: "id",
    header: "Actions",
    cell: (info) => (
      <ReservationActions
        status={info.row.original.statut}
        onValidate={() => onValidate(info.getValue() as string)}
        onRefuse={() => onRefuse(info.getValue() as string)}
      />
    ),
  },
]