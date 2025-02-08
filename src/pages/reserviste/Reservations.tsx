
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { fr } from "date-fns/locale"
import { Tables } from "@/integrations/supabase/types"
import { MainLayout } from "@/components/layout/MainLayout"
import { type ColumnDef } from "@tanstack/react-table"
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type ReservationWithTerrain = Tables<"reservations"> & {
  terrain: Pick<Tables<"terrains">, "nom" | "localisation">
}

const statusColors = {
  en_attente: "yellow",
  validee: "green",
  annulee: "red",
  terminee: "gray",
} as const

export default function ReservisteReservations() {
  const { toast } = useToast()

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      return profile
    },
  })

  const { data: reservations, refetch } = useQuery({
    queryKey: ["reservations", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data } = await supabase
        .from("reservations")
        .select(`
          *,
          terrain:terrains (
            nom,
            localisation
          )
        `)
        .eq("reserviste_id", profile.id)
        .order("date_reservation", { ascending: false })

      return (data || []) as ReservationWithTerrain[]
    },
    enabled: !!profile?.id,
  })

  // Auto-refresh when the component mounts to ensure we have the latest data
  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel("reservation-status-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `reserviste_id=eq.${profile.id}`,
        },
        (payload: RealtimePostgresChangesPayload<ReservationWithTerrain>) => {
          if (payload.new && payload.new.statut === "validee") {
            toast({
              title: "Paiement confirmé !",
              description: "Votre réservation a été validée avec succès.",
            })
            refetch()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, toast, refetch])

  const columns: ColumnDef<ReservationWithTerrain>[] = [
    {
      header: "Terrain",
      accessorKey: "terrain",
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue<{ nom: string; localisation: string }>().nom}</div>
          <div className="text-sm text-muted-foreground">
            {info.getValue<{ nom: string; localisation: string }>().localisation}
          </div>
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "date_reservation",
      cell: (info) => format(new Date(info.getValue<string>()), "d MMMM yyyy", { locale: fr }),
    },
    {
      header: "Heure",
      accessorKey: "heure_debut",
      cell: (info) => format(new Date(`2000-01-01T${info.getValue<string>()}`), "HH:mm"),
    },
    {
      header: "Durée",
      accessorKey: "nombre_heures",
      cell: (info) => `${info.getValue<number>()} heure${info.getValue<number>() > 1 ? "s" : ""}`,
    },
    {
      header: "Montant",
      accessorKey: "montant_total",
      cell: (info) => `${info.getValue<number>().toLocaleString()} FCFA`,
    },
    {
      header: "Statut",
      accessorKey: "statut",
      cell: (info) => (
        <Badge variant="outline" className={`bg-${statusColors[info.getValue<keyof typeof statusColors>()]}-100 text-${statusColors[info.getValue<keyof typeof statusColors>()]}-800 border-${statusColors[info.getValue<keyof typeof statusColors>()]}-200`}>
          {info.getValue<string>() === "validee" ? "Validée" : info.getValue<string>().replace("_", " ")}
        </Badge>
      ),
    },
  ]

  if (!reservations) return null

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mes réservations</h1>
          <p className="text-muted-foreground mt-2">
            Consultez l'historique de vos réservations
          </p>
        </div>

        <DataTable 
          columns={columns} 
          data={reservations} 
        />
      </div>
    </MainLayout>
  )
}
