import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"

interface TerrainCardProps {
  nom: string
  localisation: string
  prix_jour: number
  prix_nuit: number
  taille: string
  imageUrl?: string
}

export function TerrainCard({ nom, localisation, prix_jour, prix_nuit, taille, imageUrl }: TerrainCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden bg-muted">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={nom}
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
          <span>{nom}</span>
          <Badge variant="outline">{taille}</Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {localisation}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <div className="flex gap-2">
            <Badge variant="secondary">Jour: {prix_jour} FCFA</Badge>
            <Badge variant="secondary">Nuit: {prix_nuit} FCFA</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}