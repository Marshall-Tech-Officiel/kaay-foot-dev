import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TerrainForm } from "./TerrainForm"
import { Tables } from "@/integrations/supabase/types"

interface TerrainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  terrain?: Tables<"terrains">
  mode?: "create" | "edit"
}

export function TerrainDialog({ open, onOpenChange, onSuccess, terrain, mode = "create" }: TerrainDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Ajouter un terrain" : "Modifier le terrain"}
          </DialogTitle>
        </DialogHeader>
        <TerrainForm
          onSubmit={async (data) => {
            onSuccess()
          }}
          onCancel={() => onOpenChange(false)}
          initialData={terrain}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  )
}