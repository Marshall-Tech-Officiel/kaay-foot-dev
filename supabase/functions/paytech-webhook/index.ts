import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const data = await req.json()
    console.log("PayTech webhook received:", data)

    const {
      type_event,
      custom_field,
      api_key_sha256,
      api_secret_sha256,
      client_phone
    } = data

    // Vérifier les clés API
    const my_api_key = "508d30ed892ec5b51c3f8055e10e4e4d12d0c61a4a578ca29d42abf4ebe2efd7"
    const my_api_secret = "2a1fb92617596d861d05c974e3a29d06a1ee8e34bd489ab2e46ed39a612260ed"

    const crypto = await import('https://deno.land/std@0.177.0/crypto/mod.ts')
    const encoder = new TextEncoder()

    const calculateSHA256 = async (text: string) => {
      const data = encoder.encode(text)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    const calculated_api_key_sha256 = await calculateSHA256(my_api_key)
    const calculated_api_secret_sha256 = await calculateSHA256(my_api_secret)

    if (calculated_api_key_sha256 !== api_key_sha256 || calculated_api_secret_sha256 !== api_secret_sha256) {
      throw new Error("Invalid API keys")
    }

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuration Supabase manquante")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const customFieldData = JSON.parse(custom_field)
    const reservation_id = customFieldData.reservation_id

    if (type_event === 'sale_complete') {
      // Mettre à jour le statut de la réservation
      const { error: updateReservationError } = await supabase
        .from("reservations")
        .update({ statut: "validee" })
        .eq("id", reservation_id)

      if (updateReservationError) {
        throw updateReservationError
      }

      // Mettre à jour le statut du paiement
      const { error: updatePaymentError } = await supabase
        .from("paiements")
        .update({ 
          statut: "complete",
          reference_wave: client_phone || null
        })
        .eq("reservation_id", reservation_id)

      if (updatePaymentError) {
        throw updatePaymentError
      }
    } else if (type_event === 'sale_canceled') {
      // Mettre à jour le statut de la réservation
      const { error: updateReservationError } = await supabase
        .from("reservations")
        .update({ statut: "annulee" })
        .eq("id", reservation_id)

      if (updateReservationError) {
        throw updateReservationError
      }

      // Mettre à jour le statut du paiement
      const { error: updatePaymentError } = await supabase
        .from("paiements")
        .update({ statut: "annule" })
        .eq("reservation_id", reservation_id)

      if (updatePaymentError) {
        throw updatePaymentError
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    console.error("Error processing PayTech webhook:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Une erreur est survenue lors du traitement du webhook PayTech"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})