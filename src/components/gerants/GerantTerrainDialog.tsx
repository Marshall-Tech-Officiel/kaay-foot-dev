import { useState } from "react"
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
  const [assignedTerrains, setAssignedTerrains] = useState<string[]>([])
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

      if (!profileData) throw new Error("Profile not found")

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
  const { data: droitsActuels } = useQuery({
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
    meta: {
      onSuccess: (data: any) => {
        const assignedIds = data?.map((droit: any) => droit.terrain_id) || []
        setAssignedTerrains(assignedIds)
      }
    }
  })

  const handleTerrainToggle = async (terrainId: string, isChecked: boolean) => {
    try {
      if (isChecked) {
        // Mettre à jour le state local immédiatement
        setAssignedTerrains(prev => [...prev, terrainId])
        
        // Vérifier d'abord si le droit existe déjà
        const { data: existingDroit, error: checkError } = await supabase
          .from("droits_gerants")
          .select("*")
          .eq("gerant_id", gerant.id)
          .eq("terrain_id", terrainId)
          .maybeSingle()

        if (checkError) throw checkError

        // Si le droit n'existe pas, l'ajouter
        if (!existingDroit) {
          const { error } = await supabase
            .from("droits_gerants")
            .insert({
              gerant_id: gerant.id,
              terrain_id: terrainId,
              peut_gerer_reservations: true,
              peut_annuler_reservations: true,
              peut_modifier_terrain: true,
            })

          if (error) throw error
          toast.success("Terrain assigné avec succès")
        }
      } else {
        // Mettre à jour le state local immédiatement
        setAssignedTerrains(prev => prev.filter(id => id !== terrainId))
        
        // Retirer les droits
        const { error } = await supabase
          .from("droits_gerants")
          .delete()
          .eq("gerant_id", gerant.id)
          .eq("terrain_id", terrainId)

        if (error) throw error
        toast.success("Assignation retirée avec succès")
      }
    } catch (error: any) {
      // En cas d'erreur, restaurer l'état précédent
      setAssignedTerrains(prev => 
        isChecked 
          ? prev.filter(id => id !== terrainId)
          : [...prev, terrainId]
      )
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
          {terrains?.map((terrain) => (
            <div key={terrain.id} className="flex items-center space-x-2">
              <Checkbox
                id={terrain.id}
                checked={assignedTerrains.includes(terrain.id)}
                onCheckedChange={(checked) => 
                  handleTerrainToggle(terrain.id, checked as boolean)
                }
              />
              <Label htmlFor={terrain.id}>{terrain.nom}</Label>
            </div>
          ))}

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