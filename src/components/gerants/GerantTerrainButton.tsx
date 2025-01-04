import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

interface GerantTerrainButtonProps {
  gerantId: string
  terrainId: string
  isAssigned: boolean
}

export function GerantTerrainButton({ gerantId, terrainId, isAssigned }: GerantTerrainButtonProps) {
  const handleTerrainToggle = async () => {
    try {
      if (!isAssigned) {
        const { error } = await supabase
          .from("droits_gerants")
          .insert({
            gerant_id: gerantId,
            terrain_id: terrainId,
            peut_gerer_reservations: true,
            peut_annuler_reservations: true,
            peut_modifier_terrain: true,
          })

        if (error) throw error
        toast.success("Terrain assigné avec succès")
      } else {
        const { error } = await supabase
          .from("droits_gerants")
          .delete()
          .eq("gerant_id", gerantId)
          .eq("terrain_id", terrainId)

        if (error) throw error
        toast.success("Assignation retirée avec succès")
      }
    } catch (error: any) {
      console.error("Erreur lors de la modification des droits:", error)
      toast.error("Une erreur est survenue")
    }
  }

  return (
    <Button
      variant={isAssigned ? "destructive" : "default"}
      size="sm"
      onClick={handleTerrainToggle}
      className="whitespace-nowrap"
    >
      {isAssigned ? "Retirer" : "Assigner"}
    </Button>
  )
}