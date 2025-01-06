import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

export default function GerantReservations() {
  const { user } = useAuth()
  const { toast } = useToast()

  const { data: reservations, isLoading, error } = useQuery({
    queryKey: ["reservations-gerant"],
    queryFn: async () => {
      // First, get the profile ID for the current user
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (profileError) throw profileError

      // Get terrains assigned to this gerant
      const { data: assignedTerrains } = await supabase
        .from("droits_gerants")
        .select("terrain_id")
        .eq("gerant_id", profile.id)

      if (!assignedTerrains?.length) return []

      const terrainIds = assignedTerrains.map(t => t.terrain_id)

      // Get reservations for these terrains
      const { data, error: reservationsError } = await supabase
        .from("reservations")
        .select(`
          *,
          terrain:terrains(nom),
          reserviste:profiles(nom, prenom, telephone),
          paiement:paiements(statut)
        `)
        .in("terrain_id", terrainIds)
        .order("date_reservation", { ascending: false })

      if (reservationsError) throw reservationsError

      return data
    },
    enabled: !!user?.id,
  })

  if (error) {
    console.error("Query error:", error)
    toast({
      variant: "destructive",
      title: "Erreur",
      description: "Impossible de charger les réservations. Veuillez réessayer plus tard.",
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  const columns = [
    {
      header: "Terrain",
      accessorKey: "terrain",
      cell: (value: any) => value.nom,
    },
    {
      header: "Date",
      accessorKey: "date_reservation",
      cell: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      header: "Heure",
      accessorKey: "heure_debut",
    },
    {
      header: "Durée",
      accessorKey: "nombre_heures",
      cell: (value: number) => `${value}h`,
    },
    {
      header: "Réserviste",
      accessorKey: "reserviste",
      cell: (value: any) => `${value.prenom} ${value.nom}`,
    },
    {
      header: "Téléphone",
      accessorKey: "reserviste",
      cell: (value: any) => value.telephone,
    },
    {
      header: "Statut",
      accessorKey: "statut",
      cell: (value: string) => (
        <Badge
          variant={
            value === "validee"
              ? "success"
              : value === "en_attente"
              ? "outline"
              : "destructive"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      header: "Paiement",
      accessorKey: "paiement",
      cell: (value: any[]) => (
        <Badge
          variant={
            value?.[0]?.statut === "paye" ? "success" : "destructive"
          }
        >
          {value?.[0]?.statut || "non payé"}
        </Badge>
      ),
    },
  ]

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <Breadcrumbs
          items={[
            { label: "Tableau de bord", href: "/gerant" },
            { label: "Réservations", href: "/gerant/reservations" },
          ]}
        />

        <div className="mt-8">
          <h1 className="mb-6 text-2xl font-bold">Réservations</h1>
          <DataTable
            columns={columns}
            data={reservations || []}
          />
        </div>
      </div>
    </MainLayout>
  )
}