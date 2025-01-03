import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TerrainForm } from "./TerrainForm"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface TerrainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TerrainDialog({ open, onOpenChange, onSuccess }: TerrainDialogProps) {
  const { user } = useAuth()

  const handleSubmit = async (data: any, images: File[]) => {
    try {
      // Récupérer l'ID du profil du propriétaire
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (!profile) throw new Error("Profile not found")

      // Créer le terrain
      const { data: terrain, error: terrainError } = await supabase
        .from("terrains")
        .insert({
          ...data,
          proprietaire_id: profile.id,
        })
        .select()
        .single()

      if (terrainError) throw terrainError

      // Upload des images
      for (const image of images) {
        const fileExt = image.name.split('.').pop()
        const filePath = `${terrain.id}/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("terrain-images")
          .upload(filePath, image)

        if (uploadError) throw uploadError

        // Enregistrer l'URL de l'image
        const { error: photoError } = await supabase
          .from("photos_terrain")
          .insert({
            terrain_id: terrain.id,
            url: `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/terrain-images/${filePath}`,
          })

        if (photoError) throw photoError
      }

      toast.success("Terrain créé avec succès")
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error("Erreur lors de la création du terrain")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un terrain</DialogTitle>
        </DialogHeader>
        <TerrainForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}