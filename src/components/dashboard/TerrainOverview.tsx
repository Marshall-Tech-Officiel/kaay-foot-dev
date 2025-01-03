import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TerrainOverviewProps {
  terrain: {
    id: string
    nom: string
    localisation?: string
  }
}

export function TerrainOverview({ terrain }: TerrainOverviewProps) {
  return (
    <Card className="cursor-pointer hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{terrain.nom}</h3>
            <p className="text-sm text-muted-foreground">
              {terrain.localisation || "Emplacement non spécifié"}
            </p>
          </div>
          <Badge variant="outline">Disponible</Badge>
        </div>
      </CardContent>
    </Card>
  )
}