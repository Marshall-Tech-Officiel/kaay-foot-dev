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

  const createReservation = async () => {
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date")
      return null
    }

    if (selectedHours.length === 0) {
      toast.error("Veuillez sélectionner au moins une heure")
      return null
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Vous devez être connecté pour faire une réservation")
        return null
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (profileError || !profile) {
        console.error("Profile error:", profileError)
        toast.error("Erreur lors de la récupération du profil")
        return null
      }

      const heureDebut = `${selectedHours[0].toString().padStart(2, "0")}:00:00`
      
      const reservationData = {
        terrain_id: terrainId,
        reserviste_id: profile.id,
        date_reservation: format(selectedDate, "yyyy-MM-dd"),
        heure_debut: heureDebut,
        nombre_heures: selectedHours.length,
        montant_total: calculateTotalPrice(),
        statut: "en_cours_de_paiement" as const
      }

      const { data: reservation, error: reservationError } = await supabase
        .from("reservations")
        .insert([reservationData])
        .select()
        .single()

      if (reservationError) {
        console.error("Reservation error:", reservationError)
        throw reservationError
      }

      return reservation
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error)
      toast.error("Erreur lors de la création de la réservation")
      return null
    }
  }

  const handlePayNow = async () => {
    try {
      const reservation = await createReservation()
      if (!reservation) return

      const { data: terrain } = await supabase
        .from("terrains")
        .select("nom, numero_wave")
        .eq("id", terrainId)
        .single()

      if (!terrain) {
        toast.error("Erreur lors de la récupération des informations du terrain")
        return
      }

      const formattedDate = format(selectedDate!, "dd/MM/yyyy")
      const formattedHours = selectedHours
        .map(h => `${h.toString().padStart(2, "0")}:00`)
        .join(", ")

      const totalPrice = calculateTotalPrice()
      console.log("Initiating payment for amount:", totalPrice)

      const response = await supabase.functions.invoke("create-payment", {
        body: {
          amount: totalPrice,
          ref_command: terrainId,
          terrain_name: terrain.nom,
          reservation_date: formattedDate,
          reservation_hours: formattedHours,
          reservation_id: reservation.id,
          numero_wave: terrain.numero_wave
        }
      })

      console.log("Payment function response:", response)

      if (response.error) {
        console.error("Payment function error:", response.error)
        throw new Error(response.error.message)
      }

      if (response.data?.success === 1 && response.data?.redirect_url) {
        console.log("Redirecting to payment URL:", response.data.redirect_url)
        window.location.href = response.data.redirect_url
      } else {
        console.error("Invalid payment response:", response.data)
        throw new Error("Erreur lors de l'initialisation du paiement")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Erreur lors de l'initialisation du paiement")
    }
  }

  return {
    selectedDate,
    setSelectedDate,
    selectedHours,
    setSelectedHours,
    isReservationDialogOpen,
    setIsReservationDialogOpen,
    calculateTotalPrice,
    handlePayNow,
  }
}