
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("PayTech webhook received:", body)

    // Vérifier que le paiement est bien réussi
    if (body.type_event !== 'success') {
      throw new Error('Payment not successful')
    }

    const ref = body.ref_command || body.custom_field?.ref_command
    if (!ref) {
      throw new Error('Reference not found in webhook data')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier si la réservation existe toujours
    const { data: pendingReservation, error } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', ref)
      .single()

    if (error || !pendingReservation) {
      console.error("Error fetching pending reservation:", error)
      throw new Error('Pending reservation not found')
    }

    // Créer la réservation finale
    const { error: insertError } = await supabase
      .from('reservations')
      .insert([{
        ...pendingReservation.reservation_data,
        statut: 'validee'
      }])

    if (insertError) {
      console.error("Error creating final reservation:", insertError)
      throw insertError
    }

    // Nettoyer la réservation en attente
    await supabase
      .from('reservations_pending')
      .delete()
      .eq('ref_command', ref)

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error("PayTech webhook error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
