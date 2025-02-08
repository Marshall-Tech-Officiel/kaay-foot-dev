
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
    console.log("PayTech webhook received:", body)

    if (body.type_event === 'sale_complete') {
      const my_api_key = Deno.env.get('PAYTECH_API_KEY') || ''
      const my_api_secret = Deno.env.get('PAYTECH_API_SECRET') || ''
      
      const api_key_hash = await sha256(my_api_key)
      const api_secret_hash = await sha256(my_api_secret)

      if (
        api_key_hash === body.api_key_sha256 && 
        api_secret_hash === body.api_secret_sha256
      ) {
        const ref = body.ref_command || body.custom_field?.ref_command
        if (!ref) {
          throw new Error('Reference not found in webhook data')
        }

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
            statut: 'validee',
            ref_paiement: ref
          }])

        if (insertError) {
          console.error("Error creating final reservation:", insertError)
          throw insertError
        }

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
      } else {
        throw new Error('Invalid API credentials')
      }
    }

    throw new Error('Invalid event type')
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
