import { useState, useEffect } from "react"
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
import { ProprietaireDetails } from "./ProprietaireDetails"

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