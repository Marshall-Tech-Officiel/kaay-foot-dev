import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/MainLayout"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, Search, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Profile {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  role: string
  created_at: string
  updated_at: string
  user_id: string
}

export default function AdminProprietaires() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: ""
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.nom) errors.nom = "Le nom est requis"
    if (!formData.prenom) errors.prenom = "Le prénom est requis"
    if (!formData.email) errors.email = "L'email est requis"
    if (!formData.email.includes("@")) errors.email = "Email invalide"
    if (!formData.telephone) errors.telephone = "Le téléphone est requis"
    if (formData.telephone.length < 9) errors.telephone = "Numéro de téléphone invalide"
    return errors
  }

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
      return data as Profile[]
    },
  })

  const generatePassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      try {
        setIsSubmitting(true)
        const password = generatePassword()
        
        const { error } = await supabase.functions.invoke("create-proprietaire", {
          body: { 
            ...formData,
            password
          }
        })

        if (error) throw error

        toast({
          title: "Propriétaire créé avec succès",
          description: "Un email avec les identifiants a été envoyé",
        })

        setIsOpen(false)
        setFormData({ nom: "", prenom: "", email: "", telephone: "" })
        refetch()
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erreur lors de la création",
          description: error.message,
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

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
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <Input
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className={formErrors.nom ? "border-red-500" : ""}
                  />
                  {formErrors.nom && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.nom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <Input
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    className={formErrors.prenom ? "border-red-500" : ""}
                  />
                  {formErrors.prenom && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.prenom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <Input
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className={formErrors.telephone ? "border-red-500" : ""}
                  />
                  {formErrors.telephone && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.telephone}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Création en cours..." : "Créer le propriétaire"}
                </Button>
              </form>
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