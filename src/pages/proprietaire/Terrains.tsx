import { useState } from "react"
import { Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { TerrainCard } from "@/components/terrain/TerrainCard"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"

export default function ProprietaireTerrains() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)

  const { data: terrains, isLoading } = useQuery({
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes Terrains</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un terrain
        </Button>
      </div>

      {terrains?.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">Aucun terrain pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {terrains?.map((terrain) => (
            <TerrainCard
              key={terrain.id}
              nom={terrain.nom}
              localisation={terrain.localisation || `${terrain.zone?.nom}, ${terrain.region?.nom}`}
              prix_jour={terrain.prix_jour}
              prix_nuit={terrain.prix_nuit}
              taille={terrain.taille}
              imageUrl={terrain.photos?.[0]?.url}
            />
          ))}
        </div>
      )}
    </div>
  )
}