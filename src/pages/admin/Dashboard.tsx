import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CalendarCheck, TrendingUp } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: proprietairesCount },
        { count: terrainsCount },
        { count: reservationsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "proprietaire"),
        supabase.from("terrains").select("*", { count: "exact", head: true }),
        supabase.from("reservations").select("*", { count: "exact", head: true }),
      ])

      return {
        proprietaires: proprietairesCount || 0,
        terrains: terrainsCount || 0,
        reservations: reservationsCount || 0,
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const statCards = [
    {
      title: "Propriétaires",
      value: stats?.proprietaires || 0,
      icon: Users,
      description: "Nombre total de propriétaires",
    },
    {
      title: "Terrains",
      value: stats?.terrains || 0,
      icon: Briefcase,
      description: "Nombre total de terrains",
    },
    {
      title: "Réservations",
      value: stats?.reservations || 0,
      icon: CalendarCheck,
      description: "Nombre total de réservations",
    },
    {
      title: "Taux d'occupation",
      value: "78%",
      icon: TrendingUp,
      description: "Taux moyen d'occupation des terrains",
    },
  ]

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-8 text-3xl font-bold">Tableau de bord administrateur</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}