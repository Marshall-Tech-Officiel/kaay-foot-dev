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

interface GerantsListProps {
  searchQuery: string
}

export function GerantsList({ searchQuery }: GerantsListProps) {
  const { user } = useAuth()

  const { data: gerants, isLoading } = useQuery({
    queryKey: ["gerants", searchQuery],
    queryFn: async () => {
      // D'abord, récupérer l'ID du profil du propriétaire connecté
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (profileError) throw profileError

      // Ensuite, récupérer tous les gérants associés à ce propriétaire
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("proprietaire_id", profileData.id)
        .eq("role", "gerant")

      // Ajouter la recherche si un terme est fourni
      if (searchQuery) {
        query = query.or(`nom.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user,
  })

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {gerants?.map((gerant) => (
            <TableRow key={gerant.id}>
              <TableCell>{gerant.nom}</TableCell>
              <TableCell>{gerant.prenom}</TableCell>
              <TableCell>{gerant.email}</TableCell>
              <TableCell>{gerant.telephone}</TableCell>
              <TableCell>
                {new Date(gerant.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {gerants?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                Aucun gérant trouvé
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}