
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export default function PaymentCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const processPayment = async () => {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref') || params.get('token')
      const customField = params.get('custom_field')
      
      console.log("Payment callback params:", { ref, customField })

      if (!ref) {
        console.error("No payment reference found")
        toast.error("Référence de paiement non trouvée")
        navigate('/reserviste/accueil?error=missing_reference')
        return
      }

      try {
        const response = await supabase.functions.invoke('payment-success', {
          body: { 
            ref,
            custom_field: customField
          }
        })

        console.log("Payment success response:", response)

        if (!response.error) {
          toast.success("Paiement traité avec succès")
          navigate('/reserviste/reservations')
        } else {
          console.error("Payment processing error:", response.error)
          toast.error("Erreur lors du traitement du paiement")
          navigate('/reserviste/accueil?error=payment_processing_failed')
        }
      } catch (error) {
        console.error('Error processing payment:', error)
        toast.error("Erreur lors du traitement du paiement")
        navigate('/reserviste/accueil?error=payment_failed')
      }
    }

    processPayment()
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-lg">Traitement du paiement en cours...</p>
      </div>
    </div>
  )
}
