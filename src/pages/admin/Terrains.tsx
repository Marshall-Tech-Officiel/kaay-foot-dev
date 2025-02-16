import { useState } from "react"
import { Edit, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { TerrainDialog } from "@/components/terrain/TerrainDialog"
import { TerrainStats } from "@/components/terrain/TerrainStats"
import { useToast } from "@/hooks/use-toast"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AdminTerrainDialog } from "@/components/terrain/AdminTerrainDialog"

export default function AdminTerrains() {
  const { toast } = useToast()
  const [editingTerrain, setEditingTerrain] = useState<any>(null)
  const [selectedTerrain, setSelectedTerrain] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)

  const { data: terrains, isLoading, refetch } = useQuery({
    queryKey: ["terrains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terrains")
        .select(`
          *,
          profiles:proprietaire_id(nom, prenom),
          zone:zones(nom),
          region:regions(nom),
          photos:photos_terrain(url)
        `)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumbs />
            <h1 className="text-2xl font-bold mt-2">Gestion des Terrains</h1>
            <p className="text-muted-foreground mt-2">
              Gérez tous les terrains de l'application.
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un terrain
          </Button>
        </div>

        {terrains?.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Aucun terrain n'a encore été créé</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {terrains?.map((terrain) => (
              <div key={terrain.id} className="relative group">
                <div 
                  onClick={() => setSelectedTerrain(terrain)}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <TerrainCard terrain={terrain} showProprietaire={true} />
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingTerrain(terrain)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <TerrainDialog
          open={!!editingTerrain}
          onOpenChange={(open) => !open && setEditingTerrain(null)}
          onSuccess={() => {
            setEditingTerrain(null)
            refetch()
            toast({
              title: "Terrain modifié",
              description: "Les modifications ont été enregistrées avec succès.",
            })
          }}
          terrain={editingTerrain}
          mode="edit"
        />

        <AdminTerrainDialog
          open={isCreating}
          onOpenChange={setIsCreating}
          onSuccess={() => {
            setIsCreating(false)
            refetch()
          }}
        />

        <Dialog open={!!selectedTerrain} onOpenChange={(open) => !open && setSelectedTerrain(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">{selectedTerrain?.nom} - Statistiques</DialogTitle>
            </DialogHeader>
            {selectedTerrain && <TerrainStats terrainId={selectedTerrain.id} />}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}