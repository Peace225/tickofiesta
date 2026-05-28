import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const body = await req.json()

    // GeniusPay peut envoyer 'payment.success' ou 'SUCCESS'
    const event = body.event_type || body.status
    if (event!== 'payment.success' && event!== 'SUCCESS') {
      return new Response(JSON.stringify({ message: "Ignoré" }), { headers: corsHeaders, status: 200 })
    }

    const data = body.data || body
    const { purchase_id, order_id, user_id, tickets } = data

    const pid = purchase_id || order_id
    if (!pid ||!user_id ||!tickets) {
      throw new Error("Données manquantes")
    }

    // tickets peut être un array ou un objet unique
    const ticketsArray = Array.isArray(tickets)? tickets : [tickets]

    const billets = []
    for (const t of ticketsArray) {
      const qty = parseInt(t.quantity || t.quantite || 1, 10)
      for (let i = 0; i < qty; i++) {
        billets.push({
          purchase_id: pid,
          ticket_type_id: t.ticket_type_id,
          user_id,
          scanned: false,
          qr_code: `TKF-${pid}-${Date.now()}-${i}` // tu peux générer ton QR ici
        })
      }
    }

    const { error } = await supabase.from('user_tickets').insert(billets)
    if (error) throw error

    // SMS
    try {
      const { data: profile } = await supabase.from('profiles')
       .select('phone, full_name').eq('id', user_id).single()

      if (profile?.phone) {
        const totalQty = billets.length
        await fetch(Deno.env.get('SMS_PROVIDER_URL')!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('GENIUSPAY_API_SECRET')}`
          },
          body: JSON.stringify({
            to: profile.phone,
            sender: Deno.env.get('SMS_SENDER') || 'TickoFiesta',
            message: `TickoFiesta: Merci ${profile.full_name||''}! ${totalQty} billet(s) confirmé(s). Voir: tickofiesta.com/mes-billets`
          })
        })
      }
    } catch(e) { console.log('SMS fail:', e.message) }

    return new Response(JSON.stringify({ success: true, count: billets.length }), { headers: corsHeaders })

  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})