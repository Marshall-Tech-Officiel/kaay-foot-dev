import { Card, CardContent } from "@/components/ui/card"
import { User } from "lucide-react"

interface GerantOverviewProps {
  gerant: {
    id: string
    prenom: string
    nom: string
    droits: any[]
  }
}

export function GerantOverview({ gerant }: GerantOverviewProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">
              {gerant.prenom} {gerant.nom}
            </h3>
            <p className="text-sm text-muted-foreground">
              {gerant.droits?.length} terrain(s) assigné(s)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}