
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
    const params = new URL(req.url).searchParams
    const body = await req.json().catch(() => ({}))
    
    const ref = params.get('ref_payment') || params.get('ref') || body.ref_payment || body.ref

    if (!ref) {
      throw new Error('Reference not found in parameters or body')
    }

    console.log("Processing payment for ref:", ref)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: pendingReservation, error } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', ref)
      .single()

    if (error || !pendingReservation) {
      console.error("Error fetching pending reservation:", error)
      throw new Error('Pending reservation not found')
    }

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

    await supabase
      .from('reservations_pending')
      .delete()
      .eq('ref_command', ref)

    // Rediriger vers la page des réservations si c'est une requête du navigateur
    const isNavigator = req.headers.get('accept')?.includes('text/html')
    
    if (isNavigator) {
      return new Response(null, {
        headers: {
          ...corsHeaders,
          'Location': '/reserviste/reservations'
        },
        status: 302
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error("Payment processing error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
