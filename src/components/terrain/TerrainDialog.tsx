import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TerrainForm } from "./TerrainForm"
import { Tables } from "@/integrations/supabase/types"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface TerrainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  terrain?: Tables<"terrains">
  mode?: "create" | "edit"
}

export function TerrainDialog({ open, onOpenChange, onSuccess, terrain, mode = "create" }: TerrainDialogProps) {
  const handleSubmit = async (data: any, images: File[]) => {
    try {
      if (mode === "edit" && terrain) {
        // Mise à jour du terrain
        const { error: updateError } = await supabase
          .from("terrains")
          .update({
            nom: data.nom,
            description: data.description,
            prix_jour: data.prix_jour,
            prix_nuit: data.prix_nuit,
            heure_debut_nuit: data.heure_debut_nuit,
            heure_fin_nuit: data.heure_fin_nuit,
            taille: data.taille,
            numero_wave: data.numero_wave,
            region_id: data.region_id,
            zone_id: data.zone_id,
            latitude: data.latitude,
            longitude: data.longitude,
          })
          .eq("id", terrain.id)

        if (updateError) throw updateError

        // Gestion des nouvelles images
        if (images.length > 0) {
          for (const image of images) {
            const fileName = `${terrain.id}/${Date.now()}-${image.name}`
            const { error: uploadError } = await supabase.storage
              .from("terrain-images")
              .upload(fileName, image)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
              .from("terrain-images")
              .getPublicUrl(fileName)

            const { error: photoError } = await supabase
              .from("photos_terrain")
              .insert({
                terrain_id: terrain.id,
                url: publicUrl
              })

            if (photoError) throw photoError
          }
        }

        toast.success("Le terrain a été modifié avec succès")
      }

      onSuccess()
    } catch (error) {
      console.error("Erreur lors de la modification du terrain:", error)
      toast.error("Une erreur est survenue lors de la modification du terrain")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Ajouter un terrain" : "Modifier le terrain"}
          </DialogTitle>
        </DialogHeader>
        <TerrainForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          initialData={terrain}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  )
}