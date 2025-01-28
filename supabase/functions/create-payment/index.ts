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
  reservation_id?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { amount, ref_command, terrain_name, reservation_date, reservation_hours, reservation_id } = await req.json() as PaymentRequest

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // PayTech configuration
    const paymentRequestUrl = "https://paytech.sn/api/payment/request-payment"
    const API_KEY = "508d30ed892ec5b51c3f8055e10e4e4d12d0c61a4a578ca29d42abf4ebe2efd7"
    const API_SECRET = "2a1fb92617596d861d05c974e3a29d06a1ee8e34bd489ab2e46ed39a612260ed"

    // Get terrain details to get gérant's Wave number
    const { data: terrain } = await supabase
      .from('terrains')
      .select('numero_wave')
      .eq('id', ref_command)
      .single()

    if (!terrain?.numero_wave) {
      throw new Error("Numéro Wave du gérant non configuré")
    }

    console.log("Preparing PayTech request with params:", {
      terrain_name,
      amount,
      ref_command,
      reservation_date,
      reservation_hours
    })

    // Prepare PayTech request
    const params = {
      item_name: `Réservation ${terrain_name}`,
      item_price: amount.toString(),
      currency: "XOF",
      ref_command,
      command_name: `Réservation ${terrain_name} - ${reservation_date} (${reservation_hours})`,
      env: "test", // Change to "prod" for production
      success_url: `${req.headers.get("origin")}/reserviste/reservations`,
      cancel_url: `${req.headers.get("origin")}/reserviste/terrain/${ref_command}`,
      ipn_url: `${req.headers.get("origin")}/api/paytech-webhook`,
      custom_field: JSON.stringify({
        reservation_id,
        terrain_id: ref_command,
        numero_wave: terrain.numero_wave
      })
    }

    console.log("Sending request to PayTech:", params)

    // Make request to PayTech
    const response = await fetch(paymentRequestUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "API_KEY": API_KEY,
        "API_SECRET": API_SECRET
      },
      body: JSON.stringify(params)
    })

    const data = await response.json()
    console.log("PayTech response:", data)

    if (data.success !== 1 || !data.redirect_url) {
      throw new Error("Erreur lors de l'initialisation du paiement")
    }

    // Update reservation status to "en_cours_de_paiement"
    if (reservation_id) {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ statut: 'en_cours_de_paiement' })
        .eq('id', reservation_id)

      if (updateError) {
        console.error("Error updating reservation status:", updateError)
        throw new Error("Erreur lors de la mise à jour du statut de la réservation")
      }
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
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})