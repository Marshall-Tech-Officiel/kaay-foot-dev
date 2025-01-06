import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { useParams } from "react-router-dom"

export default function TerrainDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const { data: terrain } = useQuery({
    queryKey: ["terrain", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terrains")
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: reservations, isLoading, error } = useQuery({
    queryKey: ["reservations-terrain", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          terrain:terrains(nom),
          reserviste:profiles(nom, prenom, telephone),
          paiement:paiements(statut)
        `)
        .eq("terrain_id", id)
        .order("date_reservation", { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!id,
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
              ? "secondary"
              : value === "en_attente"
              ? "outline"
              : "default"
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
            value?.[0]?.statut === "paye" ? "secondary" : "default"
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
            { label: "Terrains", href: "/gerant/terrains" },
            { label: terrain?.nom || "Détails du terrain", href: `/gerant/terrains/${id}` },
          ]}
        />

        <div className="mt-8">
          <h1 className="mb-2 text-2xl font-bold">{terrain?.nom}</h1>
          <p className="mb-6 text-muted-foreground">
            {terrain?.zone?.nom}, {terrain?.region?.nom}
          </p>
          
          <div className="mt-8">
            <h2 className="mb-6 text-xl font-semibold">Réservations</h2>
            <DataTable
              columns={columns}
              data={reservations || []}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}