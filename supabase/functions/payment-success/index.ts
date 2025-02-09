
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("=== PAYMENT SUCCESS FUNCTION STARTED ===")
  console.log("Request method:", req.method)
  console.log("Request URL:", req.url)
  console.log("Request headers:", Object.fromEntries(req.headers.entries()))

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const fullRef = url.searchParams.get('ref')
    console.log('1. Référence complète reçue:', fullRef)

    if (!fullRef) throw new Error('Référence de paiement non trouvée dans l\'URL')

    console.log('2. Utilisation de la référence:', fullRef)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('3. Client Supabase initialisé')

    const { data: pendingReservation, error: fetchError } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', fullRef)
      .single()

    console.log('4. Requête réservation en attente:', {
      success: !fetchError,
      data: pendingReservation,
      error: fetchError?.message
    })

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération de la réservation en attente: ${fetchError.message}`)
    }

    if (!pendingReservation) {
      throw new Error('Aucune réservation en attente trouvée pour cette référence')
    }

    const dataToInsert = {
      ...pendingReservation.reservation_data,
      statut: 'validee',
      ref_paiement: fullRef
    }

    console.log('5. Données à insérer:', dataToInsert)

    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('reservations')
        .insert([dataToInsert])
        .select()
        .single()

      console.log('6. Résultat de l\'insertion:', {
        success: !insertError,
        data: insertedData,
        error: insertError?.message
      })

      if (insertError) {
        throw new Error(`Erreur lors de l'insertion de la réservation: ${insertError.message}`)
      }

      const { error: deleteError } = await supabase
        .from('reservations_pending')
        .delete()
        .eq('ref_command', fullRef)

      console.log('7. Nettoyage des données temporaires:', {
        success: !deleteError,
        error: deleteError?.message
      })

      if (deleteError) {
        console.error('Attention: Erreur lors de la suppression de la réservation en attente:', deleteError)
      }

    } catch (error) {
      console.error('8. Erreur critique lors du transfert de la réservation:', error)
      throw error
    }

    console.log('9. Transfert réussi, redirection vers la page des réservations')
    
    const baseUrl = "https://preview--kaay-foot-dev.lovable.app"
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${baseUrl}/reserviste/reservations`,
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('10. Erreur globale:', {
      message: error.message,
      stack: error.stack
    })
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Une erreur est survenue lors du traitement de la réservation"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    )
  }
})
