import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

interface GerantsListProps {
  searchQuery: string
}

export function GerantsList({ searchQuery }: GerantsListProps) {
  const { user } = useAuth()
  const [expandedGerant, setExpandedGerant] = useState<string | null>(null)
  const [droitsGerants, setDroitsGerants] = useState<Record<string, any[]>>({})

  const { data: gerants, isLoading, refetch } = useQuery({
    queryKey: ["gerants", searchQuery],
    queryFn: async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (profileError) throw profileError

      let query = supabase
        .from("profiles")
        .select("*")
        .eq("proprietaire_id", profileData.id)
        .eq("role", "gerant")

      if (searchQuery) {
        query = query.or(`nom.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

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
    enabled: !!user,
  })

  // Charger les droits pour un gérant spécifique
  const loadDroitsForGerant = async (gerantId: string) => {
    const { data, error } = await supabase
      .from("droits_gerants")
      .select("*")
      .eq("gerant_id", gerantId)

    if (!error && data) {
      setDroitsGerants(prev => ({
        ...prev,
        [gerantId]: data
      }))
    }
  }

  // Configurer la souscription realtime pour les droits
  useEffect(() => {
    if (!expandedGerant) return

    const channel = supabase
      .channel('droits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'droits_gerants',
          filter: `gerant_id=eq.${expandedGerant}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDroitsGerants(prev => ({
              ...prev,
              [expandedGerant]: [...(prev[expandedGerant] || []), payload.new]
            }))
          } else if (payload.eventType === 'DELETE') {
            setDroitsGerants(prev => ({
              ...prev,
              [expandedGerant]: prev[expandedGerant]?.filter(
                droit => droit.terrain_id !== payload.old.terrain_id
              ) || []
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [expandedGerant])

  // Gérer l'assignation/retrait d'un terrain
  const handleTerrainToggle = async (gerantId: string, terrainId: string, isAssigned: boolean) => {
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

  // Gérer l'expansion d'un gérant
  const handleGerantExpand = (gerantId: string) => {
    if (expandedGerant === gerantId) {
      setExpandedGerant(null)
    } else {
      setExpandedGerant(gerantId)
      loadDroitsForGerant(gerantId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gerants?.map((gerant) => (
            <Collapsible key={gerant.id}>
              <TableRow>
                <TableCell>{gerant.nom}</TableCell>
                <TableCell>{gerant.prenom}</TableCell>
                <TableCell>{gerant.email}</TableCell>
                <TableCell>{gerant.telephone}</TableCell>
                <TableCell>
                  {new Date(gerant.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGerantExpand(gerant.id)}
                    >
                      {expandedGerant === gerant.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </TableCell>
              </TableRow>
              <CollapsibleContent>
                <TableRow>
                  <TableCell colSpan={6} className="bg-muted/50">
                    <div className="p-4 space-y-4">
                      <h4 className="font-medium">Terrains assignés</h4>
                      <div className="grid gap-2">
                        {terrains?.map((terrain) => {
                          const isAssigned = droitsGerants[gerant.id]?.some(
                            (droit) => droit.terrain_id === terrain.id
                          )

                          return (
                            <div
                              key={terrain.id}
                              className="flex items-center justify-between bg-background p-2 rounded-lg"
                            >
                              <span>{terrain.nom}</span>
                              <Button
                                variant={isAssigned ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleTerrainToggle(gerant.id, terrain.id, isAssigned)}
                              >
                                {isAssigned ? "Retirer" : "Assigner"}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </CollapsibleContent>
            </Collapsible>
          ))}
          {gerants?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                Aucun gérant trouvé
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}