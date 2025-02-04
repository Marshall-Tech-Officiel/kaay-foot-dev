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
  }
  access_token: string
  refresh_token: string
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
      access_token,
      refresh_token,
      cancel_url
    } = await req.json() as PaymentRequest

    // Create a unique reference by combining the terrain ID with a timestamp
    const uniqueRef = `${ref_command}_${Date.now()}`

    console.log("Payment request received:", {
      amount,
      ref_command: uniqueRef,
      terrain_name,
      reservation_date,
      reservation_hours,
      reservationData
    })

    const paymentRequestUrl = "https://paytech.sn/api/payment/request-payment"
    
    const params = {
      item_name: `Réservation ${terrain_name}`,
      item_price: amount,
      currency: "XOF",
      ref_command: uniqueRef,
      command_name: `Réservation ${terrain_name} - ${reservation_date} (${reservation_hours})`,
      env: "test",
      ipn_url: `${req.headers.get("origin")}/api/paytech-webhook`,
      success_url: `${req.headers.get("origin")}/api/payment-success?ref=${uniqueRef}&access_token=${access_token}&refresh_token=${refresh_token}`,
      cancel_url: cancel_url,
      custom_field: JSON.stringify({
        terrain_id: ref_command,
        reservation_date,
        reservation_hours,
        reservationData
      })
    }

    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "API_KEY": Deno.env.get("PAYTECH_API_KEY") || "",
      "API_SECRET": Deno.env.get("PAYTECH_API_SECRET") || "",
    }

    console.log("PayTech request params:", {
      ...params,
      success_url: params.success_url,
      cancel_url: params.cancel_url
    })

    console.log("PayTech request headers:", {
      ...headers,
      "API_KEY": "HIDDEN",
      "API_SECRET": "HIDDEN"
    })

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

    // Store the reservation data in Supabase for later use
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('reservations_pending')
      .insert([{
        ref_command: uniqueRef,
        reservation_data: reservationData
      }])

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