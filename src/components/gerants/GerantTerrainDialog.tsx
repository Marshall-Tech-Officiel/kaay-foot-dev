import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface GerantTerrainDialogProps {
  gerant: any
  onClose: () => void
}

export function GerantTerrainDialog({ gerant, onClose }: GerantTerrainDialogProps) {
  const { user } = useAuth()
  const [assignedTerrains, setAssignedTerrains] = useState<{ [key: string]: boolean }>({})

  // Récupérer les terrains du propriétaire
  const { data: terrains } = useQuery({
    queryKey: ["terrains", user?.id],
    queryFn: async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      const { data: terrains } = await supabase
        .from("terrains")
        .select("*")
        .eq("proprietaire_id", profileData.id)

      return terrains || []
    },
    enabled: !!user && !!gerant,
  })

  // Récupérer les assignations existantes
  const { data: existingAssignments } = useQuery({
    queryKey: ["droits_gerants", gerant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("droits_gerants")
        .select("terrain_id")
        .eq("gerant_id", gerant.id)
      
      return data || []
    },
    enabled: !!gerant,
  })

  // Mettre à jour l'état local des assignations quand les données sont chargées
  useEffect(() => {
    if (existingAssignments) {
      const assignments: { [key: string]: boolean } = {}
      existingAssignments.forEach((assignment) => {
        assignments[assignment.terrain_id] = true
      })
      setAssignedTerrains(assignments)
    }
  }, [existingAssignments])

  // Gérer le changement d'état d'une checkbox
  const handleTerrainToggle = async (terrainId: string) => {
    const isCurrentlyAssigned = assignedTerrains[terrainId]

    if (!isCurrentlyAssigned) {
      // Créer une nouvelle assignation
      const { error } = await supabase
        .from("droits_gerants")
        .insert({
          gerant_id: gerant.id,
          terrain_id: terrainId,
          peut_gerer_reservations: true,
          peut_annuler_reservations: true,
          peut_modifier_terrain: true,
        })

      if (!error) {
        setAssignedTerrains(prev => ({
          ...prev,
          [terrainId]: true
        }))
      }
    } else {
      // Supprimer l'assignation existante
      const { error } = await supabase
        .from("droits_gerants")
        .delete()
        .eq("gerant_id", gerant.id)
        .eq("terrain_id", terrainId)

      if (!error) {
        setAssignedTerrains(prev => ({
          ...prev,
          [terrainId]: false
        }))
      }
    }
  }

  // Écouter les changements en temps réel
  useEffect(() => {
    const channel = supabase
      .channel('droits_gerants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'droits_gerants',
          filter: `gerant_id=eq.${gerant?.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAssignedTerrains(prev => ({
              ...prev,
              [payload.new.terrain_id]: true
            }))
          } else if (payload.eventType === 'DELETE') {
            setAssignedTerrains(prev => ({
              ...prev,
              [payload.old.terrain_id]: false
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gerant?.id])

  if (!gerant) return null

  return (
    <Dialog open={!!gerant} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Assigner des terrains à {gerant.prenom} {gerant.nom}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {terrains?.map((terrain) => (
            <div key={terrain.id} className="flex items-center space-x-2">
              <Checkbox
                id={terrain.id}
                checked={assignedTerrains[terrain.id] || false}
                onCheckedChange={() => handleTerrainToggle(terrain.id)}
              />
              <label
                htmlFor={terrain.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {terrain.nom}
              </label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}