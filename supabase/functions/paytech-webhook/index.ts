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
    const body = await req.json()
    console.log("Received PayTech webhook:", body)

    const {
      type_event,
      custom_field,
      api_key_sha256,
      api_secret_sha256
    } = body

    // Verify PayTech authenticity
    const crypto = await import('https://deno.land/std@0.177.0/crypto/mod.ts')
    const encoder = new TextEncoder()
    
    const API_KEY = Deno.env.get('PAYTECH_API_KEY')
    const API_SECRET = Deno.env.get('PAYTECH_API_SECRET')

    if (!API_KEY || !API_SECRET) {
      throw new Error("PayTech API keys not configured")
    }

    const calculateHash = async (value: string) => {
      const hash = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(value)
      )
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    }

    const calculatedApiKeyHash = await calculateHash(API_KEY)
    const calculatedApiSecretHash = await calculateHash(API_SECRET)

    if (calculatedApiKeyHash !== api_key_sha256 || calculatedApiSecretHash !== api_secret_sha256) {
      throw new Error("Invalid PayTech signature")
    }

    // Parse custom field data
    const customData = JSON.parse(custom_field)
    const { reservation_id } = customData

    if (!reservation_id) {
      throw new Error("Missing reservation_id in custom_field")
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Update reservation status based on event type
    const newStatus = type_event === 'sale_complete' ? 'confirmee' : 'annulee'
    
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ statut: newStatus })
      .eq('id', reservation_id)

    if (updateError) {
      console.error("Error updating reservation:", updateError)
      throw new Error("Failed to update reservation status")
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    console.error("Error processing PayTech webhook:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})