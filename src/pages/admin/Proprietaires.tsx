import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { UserPlus, Search, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

// Validation schema for the form
const proprietaireSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(9, "Numéro de téléphone invalide"),
})

type ProprietaireFormData = z.infer<typeof proprietaireSchema>

export default function AdminProprietaires() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<ProprietaireFormData>({
    resolver: zodResolver(proprietaireSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
    },
  })

  // Fetch property owners
  const { data: proprietaires, isLoading, refetch } = useQuery({
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
      return data
    },
  })

  // Generate a secure random password
  const generatePassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const onSubmit = async (data: ProprietaireFormData) => {
    try {
      const password = generatePassword()
      
      // Create user in auth.users
      const { data: authUser, error: authError } = await supabase.functions.invoke("create-proprietaire", {
        body: { 
          email: data.email,
          password,
          userData: {
            nom: data.nom,
            prenom: data.prenom,
            telephone: data.telephone,
            role: "proprietaire"
          }
        }
      })

      if (authError) throw authError

      toast({
        title: "Propriétaire créé avec succès",
        description: "Un email avec les identifiants a été envoyé",
      })

      setIsOpen(false)
      form.reset()
      refetch()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur lors de la création",
        description: error.message,
      })
    }
  }

  const columns = [
    {
      header: "Nom",
      accessorKey: "nom",
    },
    {
      header: "Prénom",
      accessorKey: "prenom",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Téléphone",
      accessorKey: "telephone",
    },
    {
      header: "Date création",
      accessorKey: "created_at",
      cell: (value: any) => format(new Date(value), "dd MMMM yyyy", { locale: fr }),
    },
    {
      header: "Actions",
      accessorKey: "id",
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

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestion des Propriétaires</h1>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter un propriétaire
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un propriétaire</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="prenom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    Créer le propriétaire
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={proprietaires || []}
          />
        )}
      </div>
    </MainLayout>
  )
}