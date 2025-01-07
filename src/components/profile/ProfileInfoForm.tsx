import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export interface ProfileFormValues {
  nom: string
  prenom: string
  email: string
  telephone: string
}

export function ProfileInfoForm() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [initialValues, setInitialValues] = useState<ProfileFormValues>({
    nom: "",
    prenom: "",
    email: "",
    telephone: ""
  })

  const form = useForm<ProfileFormValues>({
    defaultValues: initialValues
  })

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (error) {
          console.error("Error fetching profile:", error)
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger vos informations",
          })
          return
        }

        const values = {
          nom: data.nom || "",
          prenom: data.prenom || "",
          email: data.email || "",
          telephone: data.telephone || "",
        }
        
        setInitialValues(values)
        form.reset(values)
      } catch (error: any) {
        console.error("Error in fetchProfileData:", error)
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement de vos informations",
        })
      }
    }

    fetchProfileData()
  }, [user, form, toast])

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nom: values.nom,
          prenom: values.prenom,
          telephone: values.telephone,
          email: values.email,
        })
        .eq("user_id", user.id)

      if (error) throw error

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
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
                    <Input {...field} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}