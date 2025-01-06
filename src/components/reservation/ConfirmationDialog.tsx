import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMore: () => void
  onFinish: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onAddMore,
  onFinish,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmation de l'heure</AlertDialogTitle>
          <AlertDialogDescription>
            Voulez-vous ajouter une autre heure consécutive ou terminer la sélection ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onAddMore}>
            Ajouter une autre heure
          </AlertDialogAction>
          <AlertDialogAction onClick={onFinish}>
            Terminer la sélection
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}