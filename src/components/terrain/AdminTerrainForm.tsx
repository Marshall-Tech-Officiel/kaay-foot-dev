import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const adminTerrainSchema = z.object({
  nom: z.string().min(3, "Le nom doit faire au moins 3 caractères"),
  proprietaire_id: z.string().uuid("Veuillez sélectionner un propriétaire"),
})

type AdminTerrainFormData = z.infer<typeof adminTerrainSchema>

interface AdminTerrainFormProps {
  onSubmit: (data: AdminTerrainFormData) => Promise<void>
  onCancel: () => void
}

export function AdminTerrainForm({ onSubmit, onCancel }: AdminTerrainFormProps) {
  const form = useForm<AdminTerrainFormData>({
    resolver: zodResolver(adminTerrainSchema),
  })

  const { data: proprietaires, isLoading: isLoadingProprietaires } = useQuery({
    queryKey: ["proprietaires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nom, prenom")
        .eq("role", "proprietaire")
        .order("nom")
      if (error) throw error
      return data
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du terrain</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="proprietaire_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Propriétaire</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoadingProprietaires}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un propriétaire" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {proprietaires?.map((proprietaire) => (
                    <SelectItem key={proprietaire.id} value={proprietaire.id}>
                      {`${proprietaire.prenom} ${proprietaire.nom}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            Créer le terrain
          </Button>
        </div>
      </form>
    </Form>
  )
}