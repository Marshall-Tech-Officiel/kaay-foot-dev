import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"

interface ProprietaireDetailsProps {
  proprietaireId: string | null
  onClose: () => void
}

const ProprietaireDetails = ({ proprietaireId, onClose }: ProprietaireDetailsProps) => {
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

  const terrainsColumns = [
    { header: "Nom", accessorKey: "nom" },
    { header: "Prix jour", accessorKey: "prix_jour" },
    { header: "Prix nuit", accessorKey: "prix_nuit" },
    { header: "Localisation", accessorKey: "localisation" },
  ]

  const gerantsColumns = [
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

interface ProprietairesListProps {
  searchQuery: string
}

export function ProprietairesList({ searchQuery }: ProprietairesListProps) {
  const [selectedProprietaireId, setSelectedProprietaireId] = useState<string | null>(null)
  
  const { data: proprietaires, isLoading, refetch } = useQuery({
    queryKey: ["proprietaires", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("role", "proprietaire")

      if (searchQuery) {
        query = query.or(`nom.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })

  // Écouter les changements en temps réel
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `role=eq.proprietaire`
        },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetch])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Date de création</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proprietaires?.map((proprietaire) => (
              <TableRow 
                key={proprietaire.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedProprietaireId(proprietaire.id)}
              >
                <TableCell>{proprietaire.nom}</TableCell>
                <TableCell>{proprietaire.prenom}</TableCell>
                <TableCell>{proprietaire.email}</TableCell>
                <TableCell>{proprietaire.telephone}</TableCell>
                <TableCell>
                  {new Date(proprietaire.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {proprietaires?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Aucun propriétaire trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProprietaireDetails
        proprietaireId={selectedProprietaireId}
        onClose={() => setSelectedProprietaireId(null)}
      />
    </>
  )
}