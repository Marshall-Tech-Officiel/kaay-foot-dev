import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GerantTerrainDialogProps {
  gerant: any
  onClose: () => void
}

export function GerantTerrainDialog({ gerant, onClose }: GerantTerrainDialogProps) {
  const { toast } = useToast()
  const [assignedTerrains, setAssignedTerrains] = useState<Record<string, boolean>>({})

  // Charger les terrains du propriétaire
  const { data: terrains } = useQuery({
    queryKey: ["terrains-proprietaire"],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single()

      const { data } = await supabase
        .from("terrains")
        .select("*")
        .eq("proprietaire_id", profile.id)

      return data || []
    },
    enabled: !!gerant,
  })

  // Charger les assignations existantes
  const { data: existingAssignments, refetch } = useQuery({
    queryKey: ["gerant-terrains", gerant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("droits_gerants")
        .select("terrain_id")
        .eq("gerant_id", gerant.id)

      return data || []
    },
    enabled: !!gerant,
  })

  // Mettre à jour l'état local avec les assignations existantes
  useEffect(() => {
    if (existingAssignments && terrains) {
      const assignments: Record<string, boolean> = {}
      terrains.forEach((terrain) => {
        assignments[terrain.id] = existingAssignments.some(
          (assignment) => assignment.terrain_id === terrain.id
        )
      })
      setAssignedTerrains(assignments)
    }
  }, [existingAssignments, terrains])

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!gerant) return

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'droits_gerants',
          filter: `gerant_id=eq.${gerant.id}`
        },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gerant, refetch])

  const handleTerrainAssignment = async (terrainId: string, checked: boolean) => {
    try {
      if (checked) {
        // Créer l'assignation
        const { error } = await supabase
          .from("droits_gerants")
          .insert({
            gerant_id: gerant.id,
            terrain_id: terrainId,
            peut_gerer_reservations: true,
          })

        if (error) throw error

        toast({
          title: "Terrain assigné",
          description: "Le terrain a été assigné au gérant avec succès.",
        })
      } else {
        // Supprimer l'assignation
        const { error } = await supabase
          .from("droits_gerants")
          .delete()
          .eq("gerant_id", gerant.id)
          .eq("terrain_id", terrainId)

        if (error) throw error

        toast({
          title: "Terrain retiré",
          description: "Le terrain a été retiré du gérant avec succès.",
        })
      }

      // Mettre à jour l'état local
      setAssignedTerrains((prev) => ({
        ...prev,
        [terrainId]: checked,
      }))
    } catch (error) {
      console.error("Erreur lors de la gestion de l'assignation:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'opération.",
        variant: "destructive",
      })
    }
  }

  if (!gerant) return null

  return (
    <Dialog open={!!gerant} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Gestion des terrains pour {gerant.prenom} {gerant.nom}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {terrains?.map((terrain) => (
              <div key={terrain.id} className="flex items-center space-x-2">
                <Checkbox
                  id={terrain.id}
                  checked={assignedTerrains[terrain.id] || false}
                  onCheckedChange={(checked) =>
                    handleTerrainAssignment(terrain.id, checked as boolean)
                  }
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}