import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Profile {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  created_at: string
}

interface ProprietairesListProps {
  searchQuery: string
}

export function ProprietairesList({ searchQuery }: ProprietairesListProps) {
  const { data: proprietaires, isLoading } = useQuery({
    queryKey: ["proprietaires", searchQuery],
    queryFn: async () => {
      const query = supabase
        .from("profiles")
        .select("*")
        .eq("role", "proprietaire")
        .order("created_at", { ascending: false })

      if (searchQuery) {
        query.or(`nom.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Profile[]
    },
  })

  const columns = [
    {
      header: "Nom",
      accessorKey: "nom" as keyof Profile,
    },
    {
      header: "Prénom",
      accessorKey: "prenom" as keyof Profile,
    },
    {
      header: "Email",
      accessorKey: "email" as keyof Profile,
    },
    {
      header: "Téléphone",
      accessorKey: "telephone" as keyof Profile,
    },
    {
      header: "Date création",
      accessorKey: "created_at" as keyof Profile,
      cell: (value: any) => format(new Date(value), "dd MMMM yyyy", { locale: fr }),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Profile,
      cell: (value: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={proprietaires || []}
    />
  )
}