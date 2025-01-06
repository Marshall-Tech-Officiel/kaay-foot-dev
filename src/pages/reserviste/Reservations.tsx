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

type ReservationWithTerrain = Tables<"reservations"> & {
  terrain: Pick<Tables<"terrains">, "nom" | "localisation">
}

const statusColors = {
  en_attente: "yellow",
  confirmee: "green",
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

  // Then fetch reservations using the profile id
  const { data: reservations } = useQuery({
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

  // Subscribe to reservation status changes
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel("reservation-status-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reservations",
          filter: `reserviste_id=eq.${profile.id}`,
        },
        (payload) => {
          const newStatus = payload.new.statut
          if (newStatus === "confirmee") {
            toast({
              title: "Réservation confirmée !",
              description: "Votre réservation a été confirmée par le gérant.",
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, toast])

  const columns = [
    {
      header: "Terrain",
      accessorKey: "terrain" as const,
      cell: (value: any) => (
        <div>
          <div className="font-medium">{value.nom}</div>
          <div className="text-sm text-muted-foreground">{value.localisation}</div>
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "date_reservation" as const,
      cell: (value: string) => format(new Date(value), "d MMMM yyyy", { locale: fr }),
    },
    {
      header: "Heure",
      accessorKey: "heure_debut" as const,
      cell: (value: string) => format(new Date(`2000-01-01T${value}`), "HH:mm"),
    },
    {
      header: "Durée",
      accessorKey: "nombre_heures" as const,
      cell: (value: number) => `${value} heure${value > 1 ? "s" : ""}`,
    },
    {
      header: "Montant",
      accessorKey: "montant_total" as const,
      cell: (value: number) => `${value.toLocaleString()} FCFA`,
    },
    {
      header: "Statut",
      accessorKey: "statut" as const,
      cell: (value: keyof typeof statusColors) => (
        <Badge variant="outline" className={`bg-${statusColors[value]}-100 text-${statusColors[value]}-800 border-${statusColors[value]}-200`}>
          {value.replace("_", " ")}
        </Badge>
      ),
    },
  ] as const

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
