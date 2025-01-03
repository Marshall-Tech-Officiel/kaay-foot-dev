import { useState } from "react"
import { Edit } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { TerrainDialog } from "@/components/terrain/TerrainDialog"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"

export default function ProprietaireTerrains() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [editingTerrain, setEditingTerrain] = useState<any>(null)

  const { data: terrains, isLoading, refetch } = useQuery({
    queryKey: ["terrains", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!profile) throw new Error("Profile not found")

      const { data: terrains, error } = await supabase
        .from("terrains")
        .select(`
          *,
          region:regions(nom),
          zone:zones(nom),
          photos:photos_terrain(url)
        `)
        .eq("proprietaire_id", profile.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return terrains
    },
    enabled: !!user?.id,
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes Terrains</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les détails de vos terrains. La création et la suppression des terrains sont réservées aux administrateurs.
        </p>
      </div>

      {terrains?.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">Aucun terrain ne vous a encore été attribué</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {terrains?.map((terrain) => (
            <div key={terrain.id} className="relative group">
              <TerrainCard
                nom={terrain.nom}
                localisation={terrain.localisation || `${terrain.zone?.nom}, ${terrain.region?.nom}`}
                prix_jour={terrain.prix_jour}
                prix_nuit={terrain.prix_nuit}
                taille={terrain.taille}
                imageUrl={terrain.photos?.[0]?.url}
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setEditingTerrain(terrain)}
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
    </div>
  )
}