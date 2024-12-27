import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface CreateProprietaireBody {
  email: string
  password: string
  nom: string
  prenom: string
  telephone: string
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { email, password, nom, prenom, telephone }: CreateProprietaireBody = await req.json()

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    // 2. Créer le profil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        nom,
        prenom,
        telephone,
        email,
        role: "proprietaire"
      })

    if (profileError) throw profileError

    // 3. Envoyer l'email en utilisant la fonction send_welcome_email
    const { error: emailError } = await supabaseAdmin.rpc('send_welcome_email', {
      email,
      password
    })

    if (emailError) throw emailError

    return new Response(
      JSON.stringify({ message: "Propriétaire créé avec succès" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in create-proprietaire function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})