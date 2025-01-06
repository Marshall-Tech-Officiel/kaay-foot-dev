import { useState } from "react"
import { format } from "date-fns"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface UseReservationProps {
  terrainId: string
  prixJour: number
  prixNuit: number
  heureDebutNuit: string
  heureFinNuit: string
}

export function useReservation({
  terrainId,
  prixJour,
  prixNuit,
  heureDebutNuit,
  heureFinNuit,
}: UseReservationProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedHours, setSelectedHours] = useState<number[]>([])
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false)

  const calculateTotalPrice = () => {
    let total = 0
    const debutNuit = parseInt(heureDebutNuit.split(":")[0])
    const finNuit = parseInt(heureFinNuit.split(":")[0])

    selectedHours.forEach(hour => {
      if (
        (hour >= debutNuit && hour <= 23) || 
        (hour >= 0 && hour < finNuit)
      ) {
        total += prixNuit
      } else {
        total += prixJour
      }
    })

    return total
  }

  const handleRequestReservation = async () => {
    console.log("handleRequestReservation called")
    console.log("selectedDate:", selectedDate)
    console.log("selectedHours:", selectedHours)

    if (!selectedDate) {
      console.log("No date selected")
      toast.error("Veuillez sélectionner une date")
      return
    }

    if (selectedHours.length === 0) {
      console.log("No hours selected")
      toast.error("Veuillez sélectionner au moins une heure")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Vous devez être connecté pour faire une réservation")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!profile) {
        toast.error("Profil non trouvé")
        return
      }

      const heureDebut = `${selectedHours[0].toString().padStart(2, "0")}:00:00`
      
      const reservationData = {
        terrain_id: terrainId,
        reserviste_id: profile.id,
        date_reservation: format(selectedDate, "yyyy-MM-dd"),
        heure_debut: heureDebut,
        nombre_heures: selectedHours.length,
        montant_total: calculateTotalPrice(),
        statut: "en_cours"
      }

      console.log("Reservation data:", reservationData)

      const { error } = await supabase
        .from("reservations")
        .insert(reservationData)

      if (error) {
        console.error("Reservation error:", error)
        throw error
      }

      toast.success("Demande de réservation envoyée")
      setIsReservationDialogOpen(false)
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error)
      toast.error("Erreur lors de la création de la réservation")
    }
  }

  const handlePayNow = () => {
    console.log("Paiement immédiat")
    setIsReservationDialogOpen(false)
    toast.success("Redirection vers la page de paiement...")
  }

  return {
    selectedDate,
    setSelectedDate,
    selectedHours,
    setSelectedHours,
    isReservationDialogOpen,
    setIsReservationDialogOpen,
    calculateTotalPrice,
    handleRequestReservation,
    handlePayNow,
  }
}