import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface CreateProprietaireBody {
  email: string
  nom: string
  prenom: string
  telephone: string
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Starting proprietaire creation process")
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { email, nom, prenom, telephone }: CreateProprietaireBody = await req.json()
    console.log("Received data:", { email, nom, prenom, telephone })
    
    // Vérifier si l'utilisateur existe déjà
    console.log("Checking if user exists")
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email
      }
    })

    if (existingUser?.users?.length > 0) {
      console.log("User already exists with email:", email)
      throw new Error("Un utilisateur avec cet email existe déjà")
    }

    // 1. Créer l'utilisateur avec mot de passe fixe
    console.log("Creating user in auth.users")
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "p@sser2025",
      email_confirm: true,
      user_metadata: {
        nom,
        prenom,
        role: "proprietaire"
      }
    })

    if (authError) {
      console.error("Error creating user:", authError)
      throw authError
    }
    console.log("User created successfully:", authData.user.id)

    // 2. Créer le profil
    console.log("Creating profile")
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

    if (profileError) {
      console.error("Error creating profile:", profileError)
      // Si erreur lors de la création du profil, supprimer l'utilisateur auth créé
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }
    console.log("Profile created successfully")

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