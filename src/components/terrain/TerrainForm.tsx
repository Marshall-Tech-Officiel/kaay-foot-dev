import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { ImageUpload } from "./ImageUpload"
import { toast } from "sonner"

const terrainSchema = z.object({
  nom: z.string().min(3, "Le nom doit faire au moins 3 caractères"),
  description: z.string().optional(),
  prix_jour: z.number().positive("Le prix doit être positif"),
  prix_nuit: z.number().positive("Le prix doit être positif"),
  heure_debut_nuit: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format invalide (HH:mm)"),
  heure_fin_nuit: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format invalide (HH:mm)"),
  region_id: z.string().uuid("Veuillez sélectionner une région"),
  zone_id: z.string().uuid("Veuillez sélectionner une zone"),
  taille: z.string().min(1, "La taille est requise"),
  numero_wave: z.string().min(1, "Le numéro Wave est requis"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type TerrainFormData = z.infer<typeof terrainSchema>

interface TerrainFormProps {
  onSubmit: (data: TerrainFormData, images: File[]) => Promise<void>
  onCancel: () => void
  initialData?: Partial<TerrainFormData>
}

export function TerrainForm({ onSubmit, onCancel, initialData }: TerrainFormProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const form = useForm<TerrainFormData>({
    resolver: zodResolver(terrainSchema),
    defaultValues: {
      nom: "",
      description: "",
      prix_jour: 0,
      prix_nuit: 0,
      heure_debut_nuit: "18:00",
      heure_fin_nuit: "06:00",
      taille: "",
      numero_wave: "",
      ...initialData,
    },
  })

  const { data: regions, isLoading: isLoadingRegions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("id, nom")
        .order("nom")
      if (error) throw error
      return data
    },
  })

  const { data: zones, isLoading: isLoadingZones } = useQuery({
    queryKey: ["zones", form.watch("region_id")],
    queryFn: async () => {
      const regionId = form.watch("region_id")
      if (!regionId) return []
      const { data, error } = await supabase
        .from("zones")
        .select("id, nom")
        .eq("region_id", regionId)
        .order("nom")
      if (error) throw error
      return data
    },
    enabled: !!form.watch("region_id"),
  })

  const handleSubmit = async (data: TerrainFormData) => {
    try {
      await onSubmit(data, selectedImages)
    } catch (error) {
      toast.error("Une erreur est survenue lors de la création du terrain")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taille"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taille du terrain</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une taille" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="5v5">5 contre 5</SelectItem>
                  <SelectItem value="7v7">7 contre 7</SelectItem>
                  <SelectItem value="11v11">11 contre 11</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numero_wave"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro Wave</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: +221 77 000 00 00" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="prix_jour"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix jour (FCFA)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prix_nuit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix nuit (FCFA)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="heure_debut_nuit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure début nuit</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="heure_fin_nuit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure fin nuit</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="region_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Région</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingRegions}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une région" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regions?.map(region => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zone_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zone</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingZones || !form.watch("region_id")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une zone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {zones?.map(zone => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Images</FormLabel>
          <ImageUpload onImagesChange={setSelectedImages} />
        </div>

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
