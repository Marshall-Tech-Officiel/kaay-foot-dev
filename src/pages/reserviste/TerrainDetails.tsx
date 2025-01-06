import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useParams } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Loader2, MapPin, Clock } from "lucide-react"
import { TerrainCarousel } from "@/components/terrain/TerrainCarousel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function TerrainDetails() {
  const { id } = useParams()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedHours, setSelectedHours] = useState<number[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [lastSelectedHour, setLastSelectedHour] = useState<number | null>(null)

  const { data: terrain, isLoading } = useQuery({
    queryKey: ["terrain-details", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terrains")
        .select(`
          *,
          zone:zones(nom),
          region:regions(nom),
          photos:photos_terrain(url)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: reservations } = useQuery({
    queryKey: ["terrain-reservations", id, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return []
      
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("terrain_id", id)
        .eq("date_reservation", format(selectedDate, "yyyy-MM-dd"))

      if (error) throw error
      return data
    },
    enabled: !!id && !!selectedDate,
  })

  // Generate available hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Check if an hour is reserved
  const isHourReserved = (hour: number) => {
    if (!reservations) return false
    return reservations.some(reservation => {
      const reservationHour = parseInt(reservation.heure_debut.split(":")[0])
      return reservationHour === hour
    })
  }

  const handleHourClick = (hour: number) => {
    setLastSelectedHour(hour)
    setShowConfirmDialog(true)
  }

  const handleAddMoreHours = () => {
    if (lastSelectedHour !== null) {
      setSelectedHours([...selectedHours, lastSelectedHour])
      setShowConfirmDialog(false)
    }
  }

  const handleFinishSelection = () => {
    if (lastSelectedHour !== null) {
      setSelectedHours([...selectedHours, lastSelectedHour])
    }
    setShowConfirmDialog(false)
    // Ici, vous pouvez ajouter la logique pour finaliser la réservation
    console.log("Heures sélectionnées:", selectedHours)
  }

  const isAdjacentToSelected = (hour: number) => {
    if (selectedHours.length === 0) return true
    return selectedHours.some(selectedHour => Math.abs(selectedHour - hour) === 1)
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

  if (!terrain) {
    return (
      <MainLayout>
        <div className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Terrain non trouvé</p>
        </div>
      </MainLayout>
    )
  }

  const location = terrain.localisation || `${terrain.zone?.nom}, ${terrain.region?.nom}`

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <Breadcrumbs />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <TerrainCarousel photos={terrain.photos || []} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{terrain.nom}</span>
                <Badge variant="outline">{terrain.taille}</Badge>
              </CardTitle>
              <CardDescription className="space-y-2">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {location}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <div className="flex gap-2">
                    <Badge variant="secondary">Jour: {terrain.prix_jour} FCFA</Badge>
                    <Badge variant="secondary">Nuit: {terrain.prix_nuit} FCFA</Badge>
                  </div>
                </div>

                {terrain.description && (
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground">{terrain.description}</p>
                  </div>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-4">Réserver</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Réserver {terrain.nom}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          locale={fr}
                          className="rounded-md border"
                        />
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-medium">Heures disponibles</h3>
                        {selectedDate ? (
                          <div className="grid grid-cols-4 gap-2">
                            {hours.map((hour) => (
                              <Button
                                key={hour}
                                variant={
                                  selectedHours.includes(hour)
                                    ? "default"
                                    : isHourReserved(hour)
                                    ? "destructive"
                                    : "outline"
                                }
                                className="w-full"
                                disabled={
                                  isHourReserved(hour) ||
                                  (selectedHours.length > 0 && !isAdjacentToSelected(hour))
                                }
                                onClick={() => handleHourClick(hour)}
                              >
                                {hour.toString().padStart(2, "0")}:00
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            Sélectionnez une date pour voir les heures disponibles
                          </p>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmation de l'heure</AlertDialogTitle>
                      <AlertDialogDescription>
                        Voulez-vous ajouter une autre heure consécutive ou terminer la sélection ?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleAddMoreHours}>
                        Ajouter une autre heure
                      </AlertDialogAction>
                      <AlertDialogAction onClick={handleFinishSelection}>
                        Terminer la sélection
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}