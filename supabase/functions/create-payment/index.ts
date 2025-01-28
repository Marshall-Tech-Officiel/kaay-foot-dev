import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, ref_command, terrain_name, reservation_date, reservation_hours } = await req.json() as PaymentRequest

    console.log("Payment request received:", {
      amount,
      ref_command,
      terrain_name,
      reservation_date,
      reservation_hours
    })

    const paymentRequestUrl = "https://paytech.sn/api/payment/request-payment"
    
    const params = {
      item_name: `Réservation ${terrain_name}`,
      item_price: amount,
      currency: "XOF",
      ref_command,
      command_name: `Réservation ${terrain_name} - ${reservation_date} (${reservation_hours})`,
      env: "test",
      ipn_url: `${req.headers.get("origin")}/api/paytech-webhook`,
      success_url: `${req.headers.get("origin")}/reserviste/reservations`,
      cancel_url: `${req.headers.get("origin")}/reserviste/terrain/${ref_command}`,
      custom_field: JSON.stringify({
        reservation_date,
        reservation_hours,
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
        status: 500
      }
    )
  }
})