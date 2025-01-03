import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"
import { Tables } from "@/integrations/supabase/types"

interface TerrainCardProps {
  terrain: Tables<"terrains"> & {
    zone?: {
      nom: string
    } | null
    region?: {
      nom: string
    } | null
    photos?: {
      url: string
    }[] | null
    profiles?: {
      nom: string
      prenom: string
    } | null
  }
}

export function TerrainCard({ terrain }: TerrainCardProps) {
  const location = terrain.localisation || `${terrain.zone?.nom}, ${terrain.region?.nom}`

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden bg-muted">
        {terrain.photos?.[0]?.url ? (
          <img 
            src={terrain.photos[0].url} 
            alt={terrain.nom}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Aucune image</span>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{terrain.nom}</span>
          <Badge variant="outline">{terrain.taille}</Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <div className="flex gap-2">
            <Badge variant="secondary">Jour: {terrain.prix_jour} FCFA</Badge>
            <Badge variant="secondary">Nuit: {terrain.prix_nuit} FCFA</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}