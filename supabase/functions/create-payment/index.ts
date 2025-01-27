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

    const paymentRequestUrl = "https://paytech.sn/api/payment/request-payment"
    
    const params = {
      item_name: `Réservation ${terrain_name}`,
      item_price: amount.toString(),
      currency: "XOF",
      ref_command,
      command_name: `Réservation ${terrain_name} - ${reservation_date} (${reservation_hours})`,
      env: "test", // Changer en "prod" pour la production
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

    console.log("Sending payment request to PayTech:", params)

    const response = await fetch(paymentRequestUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(params)
    })

    const data = await response.json()
    console.log("PayTech response:", data)

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
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    )
  }
})