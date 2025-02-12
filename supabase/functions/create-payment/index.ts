
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("=== CREATE PAYMENT FUNCTION STARTED ===")
  
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
    } = await req.json()

    console.log("Payment request data:", {
      amount,
      ref_command,
      terrain_name,
      reservation_date,
      reservation_hours,
      reservationData
    })

    const baseUrl = "https://preview--kaay-foot-dev.lovable.app"
    // Correction de l'URL IPN
    const ipnUrl = "https://icuwltmlubwgbwszantw.functions.supabase.co/paytech-webhook"
    const successUrl = `${baseUrl}/payment/callback`

    const apiKey = Deno.env.get("PAYTECH_API_KEY")
    const apiSecret = Deno.env.get("PAYTECH_API_SECRET")

    if (!apiKey || !apiSecret) {
      throw new Error("Configuration PayTech manquante")
    }

    // Prepare custom field data
    const customField = {
      ref_command,
      redirect_after_success: `${baseUrl}/reserviste/reservations`
    }

    // PayTech request params
    const params = {
      item_name: `Réservation ${terrain_name}`,
      item_price: amount.toString(),
      currency: "XOF",
      ref_command,
      command_name: `Réservation ${terrain_name} - ${reservation_date} (${reservation_hours})`,
      env: "test",
      ipn_url: ipnUrl,
      success_url: successUrl,
      cancel_url: cancel_url || `${baseUrl}/reserviste/accueil`,
      custom_field: JSON.stringify(customField)
    }

    console.log("PayTech request params:", params)

    // Make PayTech request
    const paymentResponse = await fetch("https://paytech.sn/api/payment/request-payment", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "API_KEY": apiKey,
        "API_SECRET": apiSecret
      },
      body: JSON.stringify(params)
    })

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      console.error("PayTech error response:", errorText)
      throw new Error(`PayTech error: ${errorText}`)
    }

    const paymentData = await paymentResponse.json()
    console.log("PayTech response:", paymentData)

    if (paymentData.success !== 1) {
      throw new Error(`PayTech error: ${JSON.stringify(paymentData)}`)
    }

    // Store payment request in history
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: historyError } = await supabase
      .from('payment_history')
      .insert([{
        event_type: 'payment_initiated',
        payload: {
          paytech_response: paymentData,
          request_params: params,
          reservation_data: reservationData
        }
      }])

    if (historyError) {
      console.error("Error storing payment history:", historyError)
    }

    // Update pending reservation with PayTech token
    const { error: updateError } = await supabase
      .from('reservations_pending')
      .update({ 
        paytech_token: paymentData.token,
        payment_status: 'initiated'
      })
      .eq('ref_command', ref_command)

    if (updateError) {
      console.error("Error updating pending reservation:", updateError)
    }

    return new Response(
      JSON.stringify(paymentData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Payment creation error:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Erreur lors de la création du paiement"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
