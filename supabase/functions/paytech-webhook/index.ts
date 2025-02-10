
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"
import { encode } from "https://deno.land/std@0.177.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  console.log("=== PAYTECH WEBHOOK FUNCTION STARTED ===")
  console.log("Request method:", req.method)
  console.log("Request headers:", Object.fromEntries(req.headers.entries()))

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Endpoint de test pour vérifier que le webhook est actif
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'webhook endpoint active', timestamp: new Date().toISOString() }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }

  try {
    const rawBody = await req.text()
    console.log("Raw webhook payload:", rawBody)
    
    let body
    try {
      body = JSON.parse(rawBody)
      console.log("Parsed webhook payload:", body)
    } catch (e) {
      console.error("Error parsing webhook payload:", e)
      throw new Error("Invalid JSON payload")
    }

    if (body.type_event === 'sale_complete') {
      const my_api_key = Deno.env.get('PAYTECH_API_KEY')
      const my_api_secret = Deno.env.get('PAYTECH_API_SECRET')
      
      if (!my_api_key || !my_api_secret) {
        console.error('Missing API credentials')
        throw new Error('API credentials not configured')
      }

      const api_key_hash = await sha256(my_api_key)
      const api_secret_hash = await sha256(my_api_secret)

      console.log("Hash verification:", {
        received_key_hash: body.api_key_sha256,
        calculated_key_hash: api_key_hash,
        key_match: api_key_hash === body.api_key_sha256,
        secret_match: api_secret_hash === body.api_secret_sha256
      })

      if (
        api_key_hash === body.api_key_sha256 && 
        api_secret_hash === body.api_secret_sha256
      ) {
        const ref = body.ref_command || body.custom_field?.ref_command
        if (!ref) {
          throw new Error('Référence non trouvée dans les données du webhook')
        }

        console.log("Processing payment for ref:", ref)

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Check both pending and confirmed reservations
        const { data: pendingReservation, error: fetchError } = await supabase
          .from('reservations_pending')
          .select('*')
          .eq('ref_command', ref)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error("Error fetching pending reservation:", fetchError)
          throw new Error(`Erreur lors de la récupération de la réservation: ${fetchError.message}`)
        }

        if (pendingReservation) {
          // If still pending, move to confirmed reservations
          const dataToInsert = {
            ...pendingReservation.reservation_data,
            statut: 'validee',
            payment_status: 'completed',
            payment_ref: ref,
            payment_details: body
          }

          console.log("Inserting reservation:", dataToInsert)

          const { data: insertedReservation, error: insertError } = await supabase
            .from('reservations')
            .insert([dataToInsert])
            .select()
            .single()

          if (insertError) {
            throw new Error(`Erreur lors de l'insertion de la réservation: ${insertError.message}`)
          }

          console.log("Reservation inserted successfully:", insertedReservation)

          // Clean up pending reservation
          const { error: deleteError } = await supabase
            .from('reservations_pending')
            .delete()
            .eq('ref_command', ref)

          if (deleteError) {
            console.warn('Warning: Error deleting pending reservation:', deleteError)
          }
        } else {
          // Update existing reservation if already confirmed
          const { data: existingReservation, error: existingError } = await supabase
            .from('reservations')
            .select('*')
            .eq('ref_paiement', ref)
            .single()

          if (existingError && existingError.code !== 'PGRST116') {
            throw new Error(`Erreur lors de la vérification de la réservation existante: ${existingError.message}`)
          }

          if (existingReservation) {
            const { error: updateError } = await supabase
              .from('reservations')
              .update({
                payment_status: 'completed',
                payment_details: body
              })
              .eq('ref_paiement', ref)

            if (updateError) {
              throw new Error(`Erreur lors de la mise à jour de la réservation: ${updateError.message}`)
            }

            console.log("Existing reservation updated with webhook data")
          } else {
            console.warn("No reservation found for ref:", ref)
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      } else {
        console.error("Invalid API credentials in webhook")
        throw new Error('Identifiants API invalides')
      }
    } else {
      console.log("Ignoring non-sale_complete event:", body.type_event)
      return new Response(
        JSON.stringify({ status: 'ignored', message: 'Event type non traité' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }
  } catch (error) {
    console.error("Webhook processing error:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Une erreur est survenue lors du traitement du webhook"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
