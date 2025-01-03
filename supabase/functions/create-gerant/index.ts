import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { email, nom, prenom, telephone, proprietaireId } = await req.json()

    // 1. Vérification dans auth.users
    const { data: authUser, error: authCheckError } = await supabaseAdmin
      .auth.admin.listUsers()

    const userExists = authUser?.users.some(user => user.email === email)

    if (userExists) {
      return new Response(
        JSON.stringify({ error: "L'email est déjà utilisé" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // 2. Vérification dans profiles
    const { data: profileUser, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (profileUser) {
      return new Response(
        JSON.stringify({ error: "L'email est déjà utilisé" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // 3. Si l'email n'existe pas, créer l'utilisateur
    const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "passer2025",
      email_confirm: true,
      user_metadata: {
        nom,
        prenom,
        role: "gerant"
      }
    })

    if (createAuthError) {
      console.log("Erreur création auth:", createAuthError)
      return new Response(
        JSON.stringify({ error: createAuthError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // 4. Créer le profil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newAuthUser.user.id,
        nom,
        prenom,
        telephone,
        email,
        role: "gerant",
        proprietaire_id: proprietaireId
      })

    if (profileError) {
      console.log("Erreur création profil:", profileError)
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id)
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: "Gérant créé avec succès",
        userId: newAuthUser.user.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.log("Erreur générale:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})