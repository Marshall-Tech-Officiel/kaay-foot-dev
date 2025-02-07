
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
    const url = new URL(req.url)
    const ref = url.searchParams.get('ref')

    if (!ref) {
      throw new Error('Reference not found')
    }

    console.log("Processing successful payment for ref:", ref)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the pending reservation data
    const { data: pendingReservation } = await supabase
      .from('reservations_pending')
      .select('reservation_data')
      .eq('ref_command', ref)
      .single()

    if (!pendingReservation) {
      throw new Error('Pending reservation not found')
    }

    console.log("Found pending reservation:", pendingReservation)

    // Create the reservation with status "validee"
    const reservationData = {
      ...pendingReservation.reservation_data,
      statut: 'validee'
    }

    const { error: reservationError } = await supabase
      .from('reservations')
      .insert([reservationData])

    if (reservationError) {
      throw reservationError
    }

    // Clean up the pending reservation
    await supabase
      .from('reservations_pending')
      .delete()
      .eq('ref_command', ref)

    // Redirect to the reservations page
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Location': '/reserviste/reservations'
      },
      status: 302
    })
  } catch (error) {
    console.error("Error processing successful payment:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    )
  }
})
