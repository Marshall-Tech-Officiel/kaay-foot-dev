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
import { GerantTerrainsList } from "./GerantTerrainsList"

interface GerantsListProps {
  searchQuery: string
}

export function GerantsList({ searchQuery }: GerantsListProps) {
  const { user } = useAuth()
  const [expandedGerant, setExpandedGerant] = useState<string | null>(null)

  const { data: gerants, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead className="w-[50px]"></TableHead>
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
                      onClick={() => setExpandedGerant(
                        expandedGerant === gerant.id ? null : gerant.id
                      )}
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
                  <TableCell colSpan={6}>
                    <GerantTerrainsList 
                      gerant={gerant}
                      terrains={terrains || []}
                    />
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