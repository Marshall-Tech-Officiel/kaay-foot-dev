import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface FormData {
  nom: string
  prenom: string
  email: string
  telephone: string
}

interface CreateGerantFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateGerantForm({ onSuccess, onCancel }: CreateGerantFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    email: "",
    telephone: ""
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      try {
        setIsSubmitting(true)
        
        // Récupérer l'ID du profil du propriétaire connecté
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user?.id)
          .single()

        if (profileError) throw profileError

        const { data, error } = await supabase.functions.invoke("create-gerant", {
          body: {
            ...formData,
            proprietaireId: profileData.id
          }
        })

        if (error) {
          const errorMessage = error.message || ""
          if (errorMessage.includes("Un utilisateur avec cet email existe déjà")) {
            setFormErrors(prev => ({
              ...prev,
              email: "Cette adresse email est déjà utilisée"
            }))
            toast({
              variant: "destructive",
              title: "Erreur lors de la création",
              description: "Un compte existe déjà avec cette adresse email. Veuillez utiliser une autre adresse email.",
            })
            return
          }
          throw error
        }

        toast({
          title: "Gérant créé avec succès",
          description: "Le compte a été créé avec le mot de passe par défaut",
        })

        onSuccess()
      } catch (error: any) {
        console.error("Error creating gerant:", error)
        toast({
          variant: "destructive",
          title: "Erreur lors de la création",
          description: error.message || "Une erreur est survenue lors de la création du gérant",
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
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

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Création en cours..." : "Créer le gérant"}
        </Button>
      </div>
    </form>
  )
}