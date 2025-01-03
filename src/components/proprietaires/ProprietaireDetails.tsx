import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import type { Tables } from "@/integrations/supabase/types"

interface ProprietaireDetailsProps {
  proprietaireId: string | null
  onClose: () => void
}

export function ProprietaireDetails({ proprietaireId, onClose }: ProprietaireDetailsProps) {
  const { data: terrains } = useQuery({
    queryKey: ["terrains", proprietaireId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terrains")
        .select("*")
        .eq("proprietaire_id", proprietaireId)
      if (error) throw error
      return data
    },
    enabled: !!proprietaireId,
  })

  const { data: gerants } = useQuery({
    queryKey: ["gerants", proprietaireId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("proprietaire_id", proprietaireId)
        .eq("role", "gerant")
      if (error) throw error
      return data
    },
    enabled: !!proprietaireId,
  })

  const terrainsColumns: Array<{
    header: string
    accessorKey: keyof Tables<"terrains">
  }> = [
    { header: "Nom", accessorKey: "nom" },
    { header: "Prix jour", accessorKey: "prix_jour" },
    { header: "Prix nuit", accessorKey: "prix_nuit" },
    { header: "Localisation", accessorKey: "localisation" },
  ]

  const gerantsColumns: Array<{
    header: string
    accessorKey: keyof Tables<"profiles">
  }> = [
    { header: "Nom", accessorKey: "nom" },
    { header: "Prénom", accessorKey: "prenom" },
    { header: "Email", accessorKey: "email" },
    { header: "Téléphone", accessorKey: "telephone" },
  ]

  return (
    <Dialog open={!!proprietaireId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du propriétaire</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="terrains" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="terrains">Terrains</TabsTrigger>
            <TabsTrigger value="gerants">Gérants</TabsTrigger>
          </TabsList>
          
          <TabsContent value="terrains">
            {terrains?.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Aucun terrain trouvé
              </p>
            ) : (
              <DataTable
                columns={terrainsColumns}
                data={terrains || []}
              />
            )}
          </TabsContent>
          
          <TabsContent value="gerants">
            {gerants?.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Aucun gérant trouvé
              </p>
            ) : (
              <DataTable
                columns={gerantsColumns}
                data={gerants || []}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}