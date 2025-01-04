import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { GerantTerrainButton } from "./GerantTerrainButton"

interface GerantTerrainsListProps {
  gerant: {
    id: string
    nom: string
    prenom: string
  }
  terrains: Array<{
    id: string
    nom: string
  }>
}

export function GerantTerrainsList({ gerant, terrains }: GerantTerrainsListProps) {
  const [droitsGerant, setDroitsGerant] = useState<any[]>([])

  useEffect(() => {
    const loadDroits = async () => {
      const { data, error } = await supabase
        .from("droits_gerants")
        .select("*")
        .eq("gerant_id", gerant.id)

      if (!error && data) {
        setDroitsGerant(data)
      }
    }

    loadDroits()

    const channel = supabase
      .channel('droits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'droits_gerants',
          filter: `gerant_id=eq.${gerant.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDroitsGerant(prev => [...prev, payload.new])
          } else if (payload.eventType === 'DELETE') {
            setDroitsGerant(prev => prev.filter(droit => 
              droit.terrain_id !== payload.old.terrain_id
            ))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gerant.id])

  return (
    <div className="space-y-2 p-4 bg-muted/50 rounded-lg max-h-[300px] overflow-y-auto">
      {terrains.map((terrain) => {
        const isAssigned = droitsGerant?.some(
          (droit) => droit.terrain_id === terrain.id
        )

        return (
          <div
            key={terrain.id}
            className="flex items-center justify-between bg-background p-2 rounded-lg"
          >
            <span className="truncate mr-4">{terrain.nom}</span>
            <GerantTerrainButton
              gerantId={gerant.id}
              terrainId={terrain.id}
              isAssigned={isAssigned}
            />
          </div>
        )
      })}
      {terrains.length === 0 && (
        <p className="text-center text-muted-foreground">
          Aucun terrain disponible
        </p>
      )}
    </div>
  )
}