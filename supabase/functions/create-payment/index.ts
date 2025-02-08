
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  amount: number
  ref_command: string
  terrain_name: string
  reservation_date: string
  reservation_hours: string
  reservationData: {
    terrain_id: string
    reserviste_id: string
    date_reservation: string
    heure_debut: string
    nombre_heures: number
    montant_total: number
    statut: string
  }
  cancel_url: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      amount, 
      ref_command, 
      terrain_name, 
      reservation_date, 
      reservation_hours, 
      reservationData,
      cancel_url
    } = await req.json() as PaymentRequest

    console.log("Payment request received:", {
      amount,
      ref_command,
      terrain_name,
      reservation_date,
      reservation_hours,
      reservationData,
      cancel_url
    })

    // Updated URLs according to your configuration
    const successUrl = `https://kaay-foot-dev.lovable.app/reserviste/reservations`
    const cancelUrl = `https://preview--kaay-foot-dev.lovable.app/reserviste/accueil`
    const ipnUrl = `https://icuwltmlubwgbwszantw.supabase.co/functions/v1/paytech-webhook`

    const paymentRequestUrl = "https://paytech.sn/api/payment/request-payment"
    
    const params = {
      item_name: `Réservation ${terrain_name}`,
      item_price: amount,
      currency: "XOF",
      ref_command: ref_command,
      command_name: `Réservation ${terrain_name} - ${reservation_date} (${reservation_hours})`,
      env: "prod",
      ipn_url: ipnUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
      custom_field: JSON.stringify({
        ref_command,
        reservationData
      })
    }

    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "API_KEY": Deno.env.get("PAYTECH_API_KEY") || "",
      "API_SECRET": Deno.env.get("PAYTECH_API_SECRET") || "",
    }

    console.log("PayTech request params:", params)

    const response = await fetch(paymentRequestUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(params)
    })

    const data = await response.json()
    console.log("PayTech response:", data)

    if (!response.ok) {
      console.error("PayTech error response:", data)
      throw new Error(`PayTech error: ${JSON.stringify(data)}`)
    }

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    console.error("Error processing payment request:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Erreur lors de la communication avec PayTech"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    )
  }
})
