
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"
import { encode } from "https://deno.land/std@0.177.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("1. Webhook PayTech reçu:", {
      type_event: body.type_event,
      ref_command: body.ref_command,
      custom_field: body.custom_field,
      token: body.token,
      api_key_sha256: body.api_key_sha256,
      api_secret_sha256: body.api_secret_sha256
    })

    if (body.type_event === 'sale_complete') {
      const my_api_key = Deno.env.get('PAYTECH_API_KEY') || ''
      const my_api_secret = Deno.env.get('PAYTECH_API_SECRET') || ''
      
      console.log("2. Vérification des identifiants API:", {
        api_key_exists: !!my_api_key,
        api_secret_exists: !!my_api_secret
      })

      const api_key_hash = await sha256(my_api_key)
      const api_secret_hash = await sha256(my_api_secret)

      console.log("3. Hash comparaison:", {
        api_key_match: api_key_hash === body.api_key_sha256,
        api_secret_match: api_secret_hash === body.api_secret_sha256
      })

      if (
        api_key_hash === body.api_key_sha256 && 
        api_secret_hash === body.api_secret_sha256
      ) {
        const ref = body.ref_command || body.custom_field?.ref_command
        if (!ref) {
          throw new Error('Référence non trouvée dans les données du webhook')
        }

        console.log("4. Référence de commande validée:", ref)

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: pendingReservation, error: fetchError } = await supabase
          .from('reservations_pending')
          .select('*')
          .eq('ref_command', ref)
          .single()

        console.log("5. Réservation en attente:", pendingReservation)
        console.log("Erreur de récupération:", fetchError)

        if (fetchError) {
          throw new Error(`Erreur lors de la récupération de la réservation en attente: ${fetchError.message}`)
        }

        if (!pendingReservation) {
          throw new Error('Réservation en attente non trouvée')
        }

        try {
          const dataToInsert = {
            ...pendingReservation.reservation_data,
            statut: 'validee',
            ref_paiement: ref
          }

          console.log("6. Données à insérer:", dataToInsert)

          const { data: insertedData, error: insertError } = await supabase
            .from('reservations')
            .insert([dataToInsert])
            .select()
            .single()

          console.log("7. Résultat de l'insertion:", {
            success: !insertError,
            data: insertedData,
            error: insertError
          })

          if (insertError) {
            throw new Error(`Erreur lors de l'insertion de la réservation: ${insertError.message}`)
          }

          const { error: deleteError } = await supabase
            .from('reservations_pending')
            .delete()
            .eq('ref_command', ref)

          console.log("8. Nettoyage des données temporaires:", deleteError || 'Succès')

          if (deleteError) {
            console.error('Attention: Erreur lors de la suppression de la réservation en attente:', deleteError)
          }

          return new Response(
            JSON.stringify({ success: true }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          )
        } catch (error) {
          console.error("9. Erreur critique lors du transfert de la réservation:", error)
          throw error
        }
      } else {
        throw new Error('Identifiants API invalides')
      }
    }

    throw new Error('Type d\'événement invalide')
  } catch (error) {
    console.error("Erreur globale du webhook:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Une erreur est survenue lors du traitement du webhook"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
