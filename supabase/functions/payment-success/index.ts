
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
    const fullRef = url.searchParams.get('ref')
    console.log('1. Full reference:', fullRef)

    // Ne pas splitter la référence, utiliser la complète
    console.log('2. Using reference:', fullRef)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: pendingReservation, error: fetchError } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', fullRef)
      .single()

    console.log('3. Pending reservation:', pendingReservation, 'Error:', fetchError)

    if (!pendingReservation) throw new Error('Reservation not found')

    const { error: insertError } = await supabase
      .from('reservations')
      .insert([{
        ...pendingReservation.reservation_data,
        statut: 'validee',
        ref_paiement: fullRef
      }])

    console.log('4. Insert result:', insertError || 'Success')

    await supabase
      .from('reservations_pending')
      .delete()
      .eq('ref_command', fullRef)

    console.log('5. Redirecting to:', '/reserviste/reservations')
    
    // Modification de l'URL de redirection
    return Response.redirect(`${url.origin}/reserviste/reservations`, 302)
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    )
  }
})

