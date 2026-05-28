import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    console.log("Données reçues du front:", JSON.stringify(body))

    const URL = Deno.env.get('GENIUSPAY_URL')
    const API_KEY = Deno.env.get('GENIUSPAY_API_KEY')

    if (!URL || !API_KEY) {
      throw new Error("Configuration manquante: GENIUSPAY_URL ou GENIUSPAY_API_KEY")
    }

    // --- PARSING ROBUSTE DU MONTANT ---
    const raw = body.amount ?? body.total_amount ?? body.total ?? 0
    const amount = Math.floor(Number(String(raw).replace(/[^\d]/g, '')))
    console.log("amount reçu:", raw, "→ parsé:", amount)

    // Cas gratuit : on ne touche pas GeniusPay
    if (amount <= 0) {
      return new Response(JSON.stringify({
        success: true,
        payment_url: null,
        message: "Paiement gratuit validé",
        raw: null
      }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const payload = {
      amount: amount,
      currency: 'XOF',
      phone: body.phone_number || body.telephone || '+2250700000000',
      email: body.email || 'client@tickofiesta.com',
      name: body.name || 'Client TickoFiesta',
      description: body.description || `Paiement TickoFiesta - ${body.reference || ''}`,
      reference: body.reference || body.stand_nom || undefined,
      callback_url: "https://kmtnulchjoljeyplfoin.supabase.co/functions/v1/geniuspay-webhook",
      return_url: 'https://tickofiesta.vercel.app/paiement/success',
      cancel_url: 'https://tickofiesta.vercel.app/paiement?cancel=true'
    }

    console.log("Envoi payload à GeniusPay:", JSON.stringify(payload))

    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const textResult = await res.text()
    console.log("Réponse texte brute de GeniusPay:", textResult)

    let result
    try {
      result = JSON.parse(textResult)
    } catch {
      throw new Error(`Réponse non-JSON de GeniusPay: ${textResult.slice(0,200)}`)
    }

    if (!res.ok) {
      throw new Error(result.message || result.error || `Erreur GeniusPay ${res.status}`)
    }

    const paymentUrl = result.payment_url || result.url || result.checkout_url || result.data?.payment_url || result.data?.url || null
    console.log("URL extraite:", paymentUrl)

    return new Response(JSON.stringify({
      success: !!paymentUrl,
      payment_url: paymentUrl,
      error: paymentUrl ? null : "URL de paiement absente dans la réponse",
      raw: result
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (e) {
    console.error("Erreur critique:", e.message)
    return new Response(JSON.stringify({
      success: false,
      payment_url: null,
      error: e.message,
      raw: null
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})