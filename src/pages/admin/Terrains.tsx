import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { AdminTerrainDialog } from "@/components/terrain/AdminTerrainDialog"
import { toast } from "sonner"
import { MainLayout } from "@/components/layout/MainLayout"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"

export default function AdminTerrains() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: terrains, refetch } = useQuery({
    queryKey: ["admin-terrains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terrains")
        .select("*, profiles(nom, prenom)")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      return data
    },
  })

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("terrains")
        .delete()
        .eq("id", id)

      if (error) throw error
      
      toast.success("Terrain supprimé avec succès")
      refetch()
    } catch (error) {
      toast.error("Erreur lors de la suppression du terrain")
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumbs />
            <h1 className="text-2xl font-bold mt-2">Gestion des terrains</h1>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un terrain
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terrains?.map((terrain) => (
            <div key={terrain.id} className="relative group">
              <TerrainCard terrain={terrain} />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(terrain.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <AdminTerrainDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => {
            setIsDialogOpen(false)
            refetch()
          }}
        />
      </div>
    </MainLayout>
  )
}