
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
  console.log("=== CREATE PAYMENT FUNCTION STARTED ===")
  console.log("Request method:", req.method)
  console.log("Request headers:", Object.fromEntries(req.headers.entries()))

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Processing request body...")
    const requestData = await req.json() as PaymentRequest
    const { 
      amount, 
      ref_command, 
      terrain_name, 
      reservation_date, 
      reservation_hours, 
      reservationData,
      cancel_url 
    } = requestData

    console.log("Request data:", {
      amount,
      ref_command,
      terrain_name,
      reservation_date,
      reservation_hours,
      reservationData,
      cancel_url
    })

    const baseUrl = "https://preview--kaay-foot-dev.lovable.app"
    const successUrl = `${baseUrl}/payment/callback`
    const cancelUrl = cancel_url || `${baseUrl}/reserviste/accueil`
    const ipnUrl = `https://icuwltmlubwgbwszantw.supabase.co/functions/v1/paytech-webhook`

    const paymentRequestUrl = "https://paytech.sn/api/payment/request-payment"

    const apiKey = Deno.env.get("PAYTECH_API_KEY")
    const apiSecret = Deno.env.get("PAYTECH_API_SECRET")

    if (!apiKey || !apiSecret) {
      console.error("Missing PayTech credentials")
      throw new Error("Configuration PayTech manquante")
    }

    console.log("PayTech configuration:", {
      apiKeyExists: !!apiKey,
      apiSecretExists: !!apiSecret,
      successUrl,
      cancelUrl,
      ipnUrl
    })

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Checking existing pending reservations for:", ref_command)
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', ref_command)
      .maybeSingle()

    if (fetchError) {
      console.error("Error checking pending reservations:", fetchError)
      throw new Error(`Database error: ${fetchError.message}`)
    }

    if (!existingReservation) {
      console.log("Creating new pending reservation")
      const { error: insertError } = await supabase
        .from('reservations_pending')
        .insert([{
          ref_command,
          reservation_data: reservationData
        }])

      if (insertError) {
        console.error("Error creating pending reservation:", insertError)
        throw new Error(`Error creating reservation: ${insertError.message}`)
      }
    }

    const customField = {
      ref_command,
      reservationData,
      redirect_after_success: `${baseUrl}/reserviste/reservations`
    }

    const params = {
      item_name: `Réservation ${terrain_name}`,
      item_price: amount.toString(),
      currency: "XOF",
      ref_command: ref_command,
      command_name: `Réservation ${terrain_name} - ${reservation_date} (${reservation_hours})`,
      env: "prod",
      ipn_url: ipnUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
      custom_field: JSON.stringify(customField)
    }

    console.log("PayTech request params:", params)

    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "API_KEY": apiKey,
      "API_SECRET": apiSecret,
    }

    console.log("Sending request to PayTech...")
    const response = await fetch(paymentRequestUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayTech error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`PayTech error: ${errorText}`)
    }

    const responseText = await response.text()
    console.log("PayTech raw response:", responseText)

    let data
    try {
      data = JSON.parse(responseText)
      console.log("PayTech parsed response:", data)
    } catch (parseError) {
      console.error("Error parsing PayTech response:", parseError)
      throw new Error(`Invalid JSON response from PayTech: ${responseText}`)
    }

    if (data.success !== 1) {
      console.error("PayTech unsuccessful response:", data)
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
    console.error("Global error in create-payment:", error)
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
