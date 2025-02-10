import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("=== PAYMENT SUCCESS FUNCTION STARTED ===")
  console.log("Request URL:", req.url)
  console.log("Request headers:", Object.fromEntries(req.headers.entries()))
  console.log("Request method:", req.method)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let ref: string | null = null
    let customField: any = {}

    // Check if it's a POST request from our frontend
    if (req.method === 'POST') {
      const body = await req.json()
      console.log("Request body:", body)
      ref = body.ref
      try {
        customField = typeof body.custom_field === 'string' 
          ? JSON.parse(body.custom_field)
          : body.custom_field || {}
      } catch (error) {
        console.error("Error parsing custom field from body:", error)
      }
    } else {
      // Handle direct PayTech redirect
      const url = new URL(req.url)
      ref = url.searchParams.get('ref') || url.searchParams.get('token')
      try {
        const customFieldStr = url.searchParams.get('custom_field')
        customField = customFieldStr ? JSON.parse(customFieldStr) : {}
      } catch (error) {
        console.error("Error parsing custom field from URL:", error)
      }
    }

    console.log("Payment reference:", ref)
    console.log("Custom field:", customField)

    if (!ref) {
      throw new Error('Référence de paiement non trouvée')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: pendingReservation, error: fetchError } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', ref)
      .single()

    console.log('Pending reservation found:', pendingReservation)
    if (fetchError) {
      console.error('Error fetching pending reservation:', fetchError)
      throw new Error(`Erreur lors de la récupération de la réservation en attente: ${fetchError.message}`)
    }

    if (!pendingReservation) {
      throw new Error('Aucune réservation en attente trouvée pour cette référence')
    }

    const dataToInsert = {
      ...pendingReservation.reservation_data,
      statut: 'validee',
      ref_paiement: ref
    }

    console.log('Data to insert:', dataToInsert)

    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('reservations')
        .insert([dataToInsert])
        .select()
        .single()

      console.log('Inserted reservation:', insertedData)
      if (insertError) {
        throw new Error(`Erreur lors de l'insertion de la réservation: ${insertError.message}`)
      }

      const { error: deleteError } = await supabase
        .from('reservations_pending')
        .delete()
        .eq('ref_command', ref)

      if (deleteError) {
        console.warn('Warning: Error deleting pending reservation:', deleteError)
      }

    } catch (error) {
      console.error('Critical error during reservation transfer:', error)
      throw error
    }

    // If it's a POST request from our frontend, return JSON
    if (req.method === 'POST') {
      return new Response(
        JSON.stringify({ success: true }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Otherwise, redirect (this handles direct PayTech redirects)
    const redirectUrl = customField.redirect_after_success || 
                       "https://preview--kaay-foot-dev.lovable.app/reserviste/reservations"
    
    console.log('Redirecting to:', redirectUrl)
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('Global error:', error)

    // If it's a POST request from our frontend, return JSON error
    if (req.method === 'POST') {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Otherwise redirect with error (this handles direct PayTech redirects)
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://preview--kaay-foot-dev.lovable.app/reserviste/accueil?error=' + 
                   encodeURIComponent(error.message),
        ...corsHeaders
      }
    })
  }
})
