import { useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AdminTerrainForm } from "./AdminTerrainForm"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface AdminTerrainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AdminTerrainDialog({ open, onOpenChange, onSuccess }: AdminTerrainDialogProps) {
  const handleSubmit = async (data: { nom: string; proprietaire_id: string }) => {
    try {
      const { error } = await supabase.from("terrains").insert({
        nom: data.nom,
        proprietaire_id: data.proprietaire_id,
        description: "À définir",
        prix_jour: 0,
        prix_nuit: 0,
        heure_debut_nuit: "00:00",
        heure_fin_nuit: "00:00",
        taille: "5v5", // Valeur par défaut
        numero_wave: "À définir",
      })

      if (error) throw error

      toast.success("Terrain créé avec succès")
      onSuccess()
    } catch (error) {
      toast.error("Erreur lors de la création du terrain")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un terrain</DialogTitle>
        </DialogHeader>
        <AdminTerrainForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}