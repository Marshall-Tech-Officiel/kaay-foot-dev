
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("=== CREATE PAYMENT FUNCTION STARTED ===")
  console.log("Request method:", req.method)
  console.log("Request headers:", Object.fromEntries(req.headers.entries()))

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Log start of request processing
    console.log("Starting request processing...")
    
    console.log("Processing request body...")
    const { 
      amount, 
      ref_command, 
      terrain_name, 
      reservation_date, 
      reservation_hours, 
      reservationData,
      cancel_url 
    } = await req.json()

    // Log parsed request data
    console.log("Parsed request data:", {
      amount,
      ref_command,
      terrain_name,
      reservation_date,
      reservation_hours,
      reservationData,
      cancel_url
    })

    const baseUrl = "https://preview--kaay-foot-dev.lovable.app"
    const webhookUrl = `https://icuwltmlubwgbwszantw.supabase.co/functions/v1/paytech-webhook`
    const successUrl = `${baseUrl}/payment/callback`
    const cancelUrl = cancel_url || `${baseUrl}/reserviste/accueil`

    // Verify PayTech credentials
    const apiKey = Deno.env.get("PAYTECH_API_KEY")
    const apiSecret = Deno.env.get("PAYTECH_API_SECRET")

    console.log("PayTech credentials check:", {
      apiKeyExists: !!apiKey,
      apiSecretExists: !!apiSecret
    })

    if (!apiKey || !apiSecret) {
      console.error("Missing PayTech credentials")
      throw new Error("Configuration PayTech manquante")
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log("Supabase configuration:", {
      urlExists: !!supabaseUrl,
      keyExists: !!supabaseKey
    })

    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    )

    // Check for existing reservation
    console.log("Checking existing reservation for ref:", ref_command)
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', ref_command)
      .maybeSingle()

    if (fetchError) {
      console.error("Error checking existing reservation:", fetchError)
      throw new Error(`Database error: ${fetchError.message}`)
    }

    console.log("Existing reservation check result:", existingReservation)

    // Prepare PayTech request
    const customField = {
      ref_command,
      redirect_after_success: `${baseUrl}/reserviste/reservations`
    }

    const params = {
      item_name: `Réservation ${terrain_name}`,
      item_price: amount.toString(),
      currency: "XOF",
      ref_command: ref_command,
      command_name: `Réservation ${terrain_name} - ${reservation_date} (${reservation_hours})`,
      env: "prod",
      ipn_url: webhookUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
      custom_field: JSON.stringify(customField)
    }

    console.log("PayTech request preparation:", params)

    // Make PayTech request
    console.log("Initiating PayTech request...")
    const paymentRequestUrl = "https://paytech.sn/api/payment/request-payment"
    
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "API_KEY": apiKey,
      "API_SECRET": apiSecret,
    }

    const response = await fetch(paymentRequestUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(params)
    })

    console.log("PayTech response status:", response.status)
    console.log("PayTech response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PayTech error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`PayTech error: ${errorText}`)
    }

    // Parse PayTech response
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

    // Store pending reservation
    const pendingReservationData = {
      ref_command,
      paytech_token: data.token,
      reservation_data: reservationData
    }

    if (!existingReservation) {
      console.log("Creating new pending reservation:", pendingReservationData)
      const { error: insertError } = await supabase
        .from('reservations_pending')
        .insert([pendingReservationData])

      if (insertError) {
        console.error("Error creating pending reservation:", insertError)
        throw new Error(`Error creating reservation: ${insertError.message}`)
      }
    } else {
      console.log("Updating existing reservation:", {
        ref_command,
        new_token: data.token
      })
      const { error: updateError } = await supabase
        .from('reservations_pending')
        .update({ paytech_token: data.token })
        .eq('ref_command', ref_command)

      if (updateError) {
        console.error("Error updating pending reservation:", updateError)
        throw new Error(`Error updating reservation: ${updateError.message}`)
      }
    }

    console.log("Successfully completed payment creation")
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
