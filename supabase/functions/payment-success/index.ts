
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("=== PAYMENT SUCCESS HANDLER STARTED ===")
  console.log("Request URL:", req.url)
  console.log("Request method:", req.method)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get ref from URL params or request body
    let ref: string | null = null
    let customField: any = {}

    if (req.method === 'POST') {
      const body = await req.json()
      console.log("Request body:", body)
      ref = body.ref
      try {
        customField = typeof body.custom_field === 'string' 
          ? JSON.parse(body.custom_field)
          : body.custom_field || {}
      } catch (error) {
        console.error("Error parsing custom field:", error)
      }
    } else {
      const url = new URL(req.url)
      ref = url.searchParams.get('ref') || url.searchParams.get('token')
      try {
        const customFieldStr = url.searchParams.get('custom_field')
        customField = customFieldStr ? JSON.parse(customFieldStr) : {}
      } catch (error) {
        console.error("Error parsing custom field:", error)
      }
    }

    console.log("Payment reference:", ref)
    console.log("Custom field:", customField)

    if (!ref) {
      throw new Error('Référence de paiement non trouvée')
    }

    // Store callback in history
    await supabase
      .from('payment_history')
      .insert([{
        event_type: 'success_callback',
        payload: { ref, custom_field: customField }
      }])

    // Check pending reservation
    const { data: pendingReservation } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', customField.ref_command)
      .maybeSingle()

    if (!pendingReservation) {
      console.log('No pending reservation found, assuming already processed')
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${customField.redirect_after_success || '/reserviste/reservations'}`,
          ...corsHeaders
        }
      })
    }

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${customField.redirect_after_success || '/reserviste/reservations'}`,
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('Payment success error:', error)
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/reserviste/accueil?error=' + encodeURIComponent(error.message),
        ...corsHeaders
      }
    })
  }
})
