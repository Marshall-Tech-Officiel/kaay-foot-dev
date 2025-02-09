
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

    console.log("1. Payment request received:", {
      amount,
      ref_command,
      terrain_name,
      reservation_date,
      reservation_hours,
      reservationData,
      cancel_url
    })

    // Utiliser le domaine de preview pour toutes les URLs
    const baseUrl = "https://preview--kaay-foot-dev.lovable.app"
    const successUrl = `${baseUrl}/reserviste/reservations`
    const cancelUrl = `${baseUrl}/reserviste/accueil`
    const ipnUrl = `https://icuwltmlubwgbwszantw.supabase.co/functions/v1/paytech-webhook`

    const paymentRequestUrl = "https://paytech.sn/api/payment/request-payment"

    // Vérification des clés API
    const apiKey = Deno.env.get("PAYTECH_API_KEY")
    const apiSecret = Deno.env.get("PAYTECH_API_SECRET")

    console.log("2. API Keys présentes:", {
      apiKeyExists: !!apiKey,
      apiSecretExists: !!apiSecret
    })
    
    const params = {
      item_name: `Réservation ${terrain_name}`,
      item_price: `${amount}`, // Conversion en string
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
      "API_KEY": apiKey || "",
      "API_SECRET": apiSecret || "",
    }

    console.log("3. PayTech request params:", JSON.stringify(params, null, 2))
    console.log("4. PayTech request headers:", {
      Accept: headers.Accept,
      ContentType: headers["Content-Type"],
      API_KEY_exists: !!headers.API_KEY,
      API_SECRET_exists: !!headers.API_SECRET
    })

    const response = await fetch(paymentRequestUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(params)
    })

    const responseText = await response.text()
    console.log("5. PayTech raw response:", responseText)

    let data
    try {
      data = JSON.parse(responseText)
      console.log("6. PayTech parsed response:", data)
    } catch (parseError) {
      console.error("7. Error parsing PayTech response:", parseError)
      throw new Error(`Invalid JSON response from PayTech: ${responseText}`)
    }

    if (!response.ok) {
      console.error("8. PayTech error response:", {
        status: response.status,
        statusText: response.statusText,
        data
      })
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
    console.error("9. Error processing payment request:", error)
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
