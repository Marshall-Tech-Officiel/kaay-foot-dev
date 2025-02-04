import { useState } from "react"
import { format } from "date-fns"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { PayTechService } from "@/services/PayTechService"

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
  const navigate = useNavigate()

  const handlePayNow = async () => {
    if (!selectedDate || selectedHours.length === 0) {
      toast.error("Veuillez sélectionner une date et au moins une heure")
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        toast.error("Vous devez être connecté pour faire une réservation")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (profileError || !profile) {
        console.error("Profile error:", profileError)
        toast.error("Erreur lors de la récupération du profil")
        return
      }

      const { data: terrain } = await supabase
        .from("terrains")
        .select("nom")
        .eq("id", terrainId)
        .single()

      if (!terrain) {
        toast.error("Erreur lors de la récupération des informations du terrain")
        return
      }

      const formattedDate = format(selectedDate, "dd/MM/yyyy")
      const formattedHours = selectedHours
        .map(h => `${h.toString().padStart(2, "0")}:00`)
        .join(", ")

      const heureDebut = `${selectedHours[0].toString().padStart(2, "0")}:00:00`
      const montantTotal = calculateTotalPrice()

      const reservationData = {
        terrain_id: terrainId,
        reserviste_id: profile.id,
        date_reservation: format(selectedDate, "yyyy-MM-dd"),
        heure_debut: heureDebut,
        nombre_heures: selectedHours.length,
        montant_total: montantTotal,
        statut: "en_cours_de_paiement"
      }

      const { data: pendingReservation, error: pendingError } = await supabase
        .from("reservations_pending")
        .insert([{
          ref_command: `${terrainId}_${Date.now()}`,
          reservation_data: reservationData
        }])
        .select()
        .single()

      if (pendingError) {
        throw pendingError
      }

      const payTechService = new PayTechService({
        apiKey: process.env.PAYTECH_API_KEY || "",
        apiSecret: process.env.PAYTECH_API_SECRET || "",
      })

      const paymentResponse = await payTechService.initiatePayment({
        description: `Réservation ${terrain.nom} - ${formattedDate} (${formattedHours})`,
        amount: montantTotal,
        currency: "XOF"
      })

      if (paymentResponse.success && paymentResponse.redirectUrl) {
        window.location.href = paymentResponse.redirectUrl
      } else {
        throw new Error(paymentResponse.error || "Erreur lors de l'initialisation du paiement")
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du paiement:", error)
      toast.error("Erreur lors de l'initialisation du paiement")
    }
  }

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
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date")
      return
    }

    if (selectedHours.length === 0) {
      toast.error("Veuillez sélectionner au moins une heure")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("Vous devez être connecté pour faire une réservation")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (profileError || !profile) {
        console.error("Profile error:", profileError)
        toast.error("Erreur lors de la récupération du profil")
        return
      }

      const heureDebut = `${selectedHours[0].toString().padStart(2, "0")}:00:00`
      
      const { error: reservationError } = await supabase
        .from("reservations")
        .insert([{
          terrain_id: terrainId,
          reserviste_id: profile.id,
          date_reservation: format(selectedDate, "yyyy-MM-dd"),
          heure_debut: heureDebut,
          nombre_heures: selectedHours.length,
          montant_total: calculateTotalPrice(),
          statut: "en_attente"
        }])

      if (reservationError) {
        throw reservationError
      }

      toast.success("Demande de réservation envoyée")
      setIsReservationDialogOpen(false)
      navigate("/reserviste/reservations")
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error)
      toast.error("Erreur lors de la création de la réservation")
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
    handleRequestReservation,
    handlePayNow,
  }
}
