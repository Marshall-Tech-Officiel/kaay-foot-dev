
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

        const { data: pendingReservation, error: fetchError } = await supabase
          .from('reservations_pending')
          .select('*')
          .eq('ref_command', ref)
          .single()

        if (fetchError) {
          console.error("Error fetching pending reservation:", fetchError)
          throw new Error(`Erreur lors de la récupération de la réservation en attente: ${fetchError.message}`)
        }

        if (!pendingReservation) {
          console.warn("No pending reservation found for ref:", ref)
          return new Response(
            JSON.stringify({ status: 'success', message: 'Réservation déjà traitée' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          )
        }

        try {
          const dataToInsert = {
            ...pendingReservation.reservation_data,
            statut: 'validee',
            ref_paiement: ref
          }

          console.log("Inserting reservation:", dataToInsert)

          const { data: insertedData, error: insertError } = await supabase
            .from('reservations')
            .insert([dataToInsert])
            .select()
            .single()

          if (insertError) {
            throw new Error(`Erreur lors de l'insertion de la réservation: ${insertError.message}`)
          }

          console.log("Reservation inserted successfully:", insertedData)

          const { error: deleteError } = await supabase
            .from('reservations_pending')
            .delete()
            .eq('ref_command', ref)

          if (deleteError) {
            console.warn('Warning: Error deleting pending reservation:', deleteError)
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Réservation validée avec succès' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          )
        } catch (error) {
          console.error("Critical error processing webhook:", error)
          throw error
        }
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
