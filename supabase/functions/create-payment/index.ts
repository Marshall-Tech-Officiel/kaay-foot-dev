import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      amount, 
      ref_command, 
      terrain_name, 
      reservation_date, 
      reservation_hours,
      cancel_url 
    } = await req.json()

    const PAYTECH_API_KEY = Deno.env.get('PAYTECH_API_KEY')
    const PAYTECH_API_SECRET = Deno.env.get('PAYTECH_API_SECRET')

    if (!PAYTECH_API_KEY || !PAYTECH_API_SECRET) {
      throw new Error('PayTech credentials not configured')
    }

    const response = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': PAYTECH_API_KEY,
        'API_SECRET': PAYTECH_API_SECRET,
      },
      body: JSON.stringify({
        item_name: `Réservation ${terrain_name}`,
        item_price: amount,
        currency: 'XOF',
        ref_command,
        command_name: `Réservation ${terrain_name} - ${reservation_date} (${reservation_hours})`,
        env: "test",
        ipn_url: `${req.headers.get("origin")}/api/paytech-webhook`,
        success_url: `${req.headers.get("origin")}/payment/success`,
        cancel_url: cancel_url,
        custom_field: JSON.stringify({
          ref_command,
          timestamp: Date.now()
        })
      })
    })

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 400
      }
    )
  }
})