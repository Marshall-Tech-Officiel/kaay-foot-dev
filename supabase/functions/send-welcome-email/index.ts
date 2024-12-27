import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kaay Foot <no-reply@kaayfoot.com>",
        to: [email],
        subject: "Vos identifiants Kaay Foot",
        html: `
          <h1>Bienvenue sur Kaay Foot !</h1>
          <p>Voici vos identifiants de connexion :</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Mot de passe :</strong> ${password}</p>
          <p>Nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
        `,
      }),
    })

    if (!res.ok) {
      throw new Error("Erreur lors de l'envoi de l'email")
    }

    return new Response(
      JSON.stringify({ message: "Email envoyé avec succès" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})