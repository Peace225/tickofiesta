import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configuration CORS pour autoriser ton site React à appeler cette fonction
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gestion de la requête préliminaire (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupération des données envoyées par React
    const { email, nom, code } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // Appel à l'API de Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'TickoFiesta <hello@tickofiesta.com>', // Remplace par ton adresse validée sur Resend
        to: [email],
        subject: '🔐 Votre code de sécurité TickoFiesta',
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0071e3; text-align: center;">Bienvenue sur TickoFiesta, ${nom} !</h2>
            <p style="color: #333; font-size: 16px;">Vous êtes sur le point de créer un compte Organisateur.</p>
            <p style="color: #333; font-size: 16px;">Voici votre code de sécurité à 6 chiffres pour valider votre adresse e-mail :</p>
            <div style="background-color: #f5f5f7; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1d1d1f;">${code}</span>
            </div>
            <p style="color: #888; font-size: 14px; text-align: center;">Ce code expirera dans 10 minutes. Si vous n'avez pas demandé ce code, veuillez ignorer cet e-mail.</p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})