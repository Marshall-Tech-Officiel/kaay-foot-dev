
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

    // Fetch the pending reservation
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

    // Prepare data for insertion
    const dataToInsert = {
      ...pendingReservation.reservation_data,
      statut: 'validee',
      ref_paiement: ref
    }

    console.log('Data to insert:', dataToInsert)

    // Insert into reservations table
    const { data: insertedReservation, error: insertError } = await supabase
      .from('reservations')
      .insert([dataToInsert])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting reservation:', insertError)
      throw new Error(`Erreur lors de l'insertion de la réservation: ${insertError.message}`)
    }

    console.log('Inserted reservation:', insertedReservation)

    // Delete from pending reservations
    const { error: deleteError } = await supabase
      .from('reservations_pending')
      .delete()
      .eq('ref_command', ref)

    if (deleteError) {
      console.error('Error deleting pending reservation:', deleteError)
    }

    const baseUrl = "https://preview--kaay-foot-dev.lovable.app"
    const successRedirectUrl = customField.redirect_after_success || 
                             `${baseUrl}/reserviste/reservations`
    
    console.log('Redirecting to:', successRedirectUrl)
    
    // Handle the response based on request type
    if (req.method === 'POST') {
      return new Response(
        JSON.stringify({ 
          success: true,
          reservation: insertedReservation 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(null, {
      status: 302,
      headers: {
        'Location': successRedirectUrl,
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('Global error:', error)

    const baseUrl = "https://preview--kaay-foot-dev.lovable.app"
    if (req.method === 'POST') {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${baseUrl}/reserviste/accueil?error=${encodeURIComponent(error.message)}`,
        ...corsHeaders
      }
    })
  }
})
