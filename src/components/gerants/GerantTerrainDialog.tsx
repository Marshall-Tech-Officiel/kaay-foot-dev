import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface GerantTerrainDialogProps {
  gerant: any
  onClose: () => void
}

export function GerantTerrainDialog({ gerant, onClose }: GerantTerrainDialogProps) {
  const { user } = useAuth()

  // Récupérer les terrains du propriétaire
  const { data: terrains } = useQuery({
    queryKey: ["terrains", user?.id],
    queryFn: async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      const { data, error } = await supabase
        .from("terrains")
        .select("*")
        .eq("proprietaire_id", profileData.id)

      if (error) throw error
      return data
    },
    enabled: !!user && !!gerant,
  })

  // Récupérer les droits actuels du gérant
  const { data: droitsActuels, refetch: refetchDroits } = useQuery({
    queryKey: ["droits", gerant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("droits_gerants")
        .select("*")
        .eq("gerant_id", gerant.id)

      if (error) throw error
      return data
    },
    enabled: !!gerant,
  })

  const handleTerrainToggle = async (terrainId: string, isChecked: boolean) => {
    try {
      if (isChecked) {
        // Vérifier d'abord si le droit existe déjà
        const { data: existingDroit } = await supabase
          .from("droits_gerants")
          .select("*")
          .eq("gerant_id", gerant.id)
          .eq("terrain_id", terrainId)
          .single()

        if (existingDroit) {
          toast.error("Ce gérant a déjà des droits sur ce terrain")
          return
        }

        // Ajouter les droits
        const { error } = await supabase
          .from("droits_gerants")
          .insert({
            gerant_id: gerant.id,
            terrain_id: terrainId,
            peut_gerer_reservations: true,
            peut_annuler_reservations: true,
            peut_modifier_terrain: true,
          })

        if (error) {
          if (error.code === "23505") {
            toast.error("Ce gérant a déjà des droits sur ce terrain")
            return
          }
          throw error
        }
        toast.success("Terrain assigné avec succès")
      } else {
        // Retirer les droits
        const { error } = await supabase
          .from("droits_gerants")
          .delete()
          .eq("gerant_id", gerant.id)
          .eq("terrain_id", terrainId)

        if (error) throw error
        toast.success("Assignation retirée avec succès")
      }
      await refetchDroits()
    } catch (error: any) {
      console.error("Erreur lors de la modification des droits:", error)
      toast.error("Une erreur est survenue")
    }
  }

  return (
    <Dialog open={!!gerant} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Gestion des terrains - {gerant?.prenom} {gerant?.nom}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {terrains?.map((terrain) => {
            const isAssigned = droitsActuels?.some(
              (droit) => droit.terrain_id === terrain.id
            )

            return (
              <div key={terrain.id} className="flex items-center space-x-2">
                <Checkbox
                  id={terrain.id}
                  checked={isAssigned}
                  onCheckedChange={(checked) => 
                    handleTerrainToggle(terrain.id, checked as boolean)
                  }
                />
                <Label htmlFor={terrain.id}>{terrain.nom}</Label>
              </div>
            )
          })}

          {terrains?.length === 0 && (
            <p className="text-center text-muted-foreground">
              Aucun terrain disponible
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}