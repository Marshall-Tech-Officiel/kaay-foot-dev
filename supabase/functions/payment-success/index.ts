
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
    console.log('1. Référence complète reçue:', fullRef)

    if (!fullRef) throw new Error('Référence de paiement non trouvée dans l\'URL')

    console.log('2. Utilisation de la référence:', fullRef)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: pendingReservation, error: fetchError } = await supabase
      .from('reservations_pending')
      .select('*')
      .eq('ref_command', fullRef)
      .single()

    console.log('3. Réservation en attente:', pendingReservation, 'Erreur de récupération:', fetchError)

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération de la réservation en attente: ${fetchError.message}`)
    }

    if (!pendingReservation) {
      throw new Error('Aucune réservation en attente trouvée pour cette référence')
    }

    // Vérifions la structure des données
    console.log('4. Données de réservation à insérer:', {
      ...pendingReservation.reservation_data,
      statut: 'validee',
      ref_paiement: fullRef
    })

    try {
      const { error: insertError } = await supabase
        .from('reservations')
        .insert([{
          ...pendingReservation.reservation_data,
          statut: 'validee',
          ref_paiement: fullRef
        }])

      console.log('5. Résultat de l\'insertion:', insertError || 'Succès')

      if (insertError) {
        throw new Error(`Erreur lors de l'insertion de la réservation: ${insertError.message}`)
      }

      // Suppression uniquement après une insertion réussie
      const { error: deleteError } = await supabase
        .from('reservations_pending')
        .delete()
        .eq('ref_command', fullRef)

      console.log('6. Nettoyage des données temporaires:', deleteError || 'Succès')

      if (deleteError) {
        console.error('Attention: Erreur lors de la suppression de la réservation en attente:', deleteError)
      }

    } catch (error) {
      console.error('7. Erreur critique lors du transfert de la réservation:', error)
      throw error
    }

    console.log('8. Transfert réussi, redirection vers la page des réservations')
    
    const baseUrl = "https://preview--kaay-foot-dev.lovable.app"
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${baseUrl}/reserviste/reservations`,
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('Erreur globale:', error)
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
