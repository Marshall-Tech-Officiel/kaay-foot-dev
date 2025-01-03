import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TerrainStatsProps {
  terrainId: string
}

export function TerrainStats({ terrainId }: TerrainStatsProps) {
  const { data: stats } = useQuery({
    queryKey: ["terrain-stats", terrainId],
    queryFn: async () => {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const { data: reservations } = await supabase
        .from("reservations")
        .select(`
          date_reservation,
          heure_debut,
          nombre_heures,
          montant_total
        `)
        .eq("terrain_id", terrainId)
        .gte("date_reservation", startOfMonth.toISOString())
        .order("date_reservation", { ascending: true })

      if (!reservations) return null

      const isNightReservation = (heureDebut: string) => {
        const heure = parseInt(heureDebut.split(":")[0])
        return heure >= 18 || heure < 6
      }

      const dailyStats = reservations.reduce((acc, res) => {
        const date = res.date_reservation
        if (!acc[date]) {
          acc[date] = {
            date,
            "Réservations jour": 0,
            "Réservations nuit": 0,
            "Montant total": 0
          }
        }
        if (isNightReservation(res.heure_debut)) {
          acc[date]["Réservations nuit"]++
        } else {
          acc[date]["Réservations jour"]++
        }
        acc[date]["Montant total"] += Number(res.montant_total)
        return acc
      }, {} as Record<string, any>)

      const today = startOfDay.toISOString().split("T")[0]
      const todayStats = dailyStats[today] || {
        "Réservations jour": 0,
        "Réservations nuit": 0,
        "Montant total": 0
      }

      const weeklyData = Object.values(dailyStats)
        .filter((day: any) => new Date(day.date) >= startOfWeek)

      const monthlyData = Object.values(dailyStats)

      const weeklyTotal = weeklyData.reduce((sum: number, day: any) => 
        sum + day["Montant total"], 0
      )

      const monthlyTotal = monthlyData.reduce((sum: number, day: any) => 
        sum + day["Montant total"], 0
      )

      return {
        today: todayStats,
        weeklyTotal,
        monthlyTotal,
        dailyStats: Object.values(dailyStats)
      }
    }
  })

  if (!stats) return null

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid gap-3 grid-cols-3">
        <Card className="col-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold">{stats.today["Montant total"].toLocaleString()} FCFA</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.today["Réservations jour"]} réservations jour
              <br />
              {stats.today["Réservations nuit"]} réservations nuit
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold">{stats.weeklyTotal.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ce mois
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold">{stats.monthlyTotal.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Statistiques détaillées</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Tabs defaultValue="reservations">
            <TabsList className="mb-4">
              <TabsTrigger value="reservations">Réservations</TabsTrigger>
              <TabsTrigger value="revenus">Revenus</TabsTrigger>
            </TabsList>
            <TabsContent value="reservations" className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Réservations jour" fill="#22c55e" />
                  <Bar dataKey="Réservations nuit" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="revenus" className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Montant total" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}