
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("=== PAYTECH WEBHOOK HANDLER STARTED ===")
  console.log("Request method:", req.method)
  console.log("Request headers:", Object.fromEntries(req.headers.entries()))

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const webhookData = await req.json()
    console.log("Webhook data received:", webhookData)

    // Store webhook data in history
    await supabase
      .from('payment_history')
      .insert([{
        event_type: 'webhook_received',
        payload: webhookData
      }])

    if (webhookData.type_event !== 'sale_complete') {
      console.log('Ignoring non-sale_complete event:', webhookData.type_event)
      return new Response(
        JSON.stringify({ status: 'ignored', message: 'Event type non traité' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify PayTech credentials
    const apiKey = Deno.env.get('508d30ed892ec5b51c3f8055e10e4e4d12d0c61a4a578ca29d42abf4ebe2efd7')
    const apiSecret = Deno.env.get('2a1fb92617596d861d05c974e3a29d06a1ee8e34bd489ab2e46ed39a612260ed')

    if (!apiKey || !apiSecret) {
      throw new Error('Configuration PayTech manquante')
    }

    const apiKeyHash = await sha256(apiKey)
    const apiSecretHash = await sha256(apiSecret)

    if (
      apiKeyHash !== webhookData.api_key_sha256 ||
      apiSecretHash !== webhookData.api_secret_sha256
    ) {
      throw new Error('Identifiants PayTech invalides')
    }

    // Get ref_command from webhook data
    const ref = webhookData.ref_command || 
                (typeof webhookData.custom_field === 'string' ? 
                  JSON.parse(webhookData.custom_field).ref_command : 
                  webhookData.custom_field?.ref_command)

    if (!ref) {
      throw new Error('Référence de commande manquante')
    }

    // Get pending reservation
    const { data: pendingReservation, error: pendingError } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', ref)
      .maybeSingle()

    if (pendingError || !pendingReservation) {
      throw new Error('Réservation en attente non trouvée')
    }

    // Create confirmed reservation
    const reservationData = {
      ...pendingReservation.reservation_data,
      statut: 'validee',
      payment_status: 'completed',
      payment_ref: ref,
      payment_method: webhookData.payment_method,
      client_phone: webhookData.client_phone,
      payment_details: webhookData,
      confirmed_at: new Date().toISOString()
    }

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select()
      .single()

    if (reservationError) {
      throw new Error(`Erreur lors de la création de la réservation: ${reservationError.message}`)
    }

    // Delete pending reservation
    await supabase
      .from('reservations_pending')
      .delete()
      .eq('ref_command', ref)

    // Store success in history
    await supabase
      .from('payment_history')
      .insert([{
        event_type: 'payment_completed',
        payload: {
          webhook_data: webhookData,
          reservation_data: reservationData
        }
      }])

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Paiement traité avec succès',
        reservation 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    
    // Store error in history
    await supabase
      .from('payment_history')
      .insert([{
        event_type: 'webhook_error',
        payload: { error: error.message }
      }])

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
