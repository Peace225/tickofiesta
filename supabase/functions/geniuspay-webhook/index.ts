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
    const event = body.event_type || body.status
    if (event!== 'payment.success' && event!== 'SUCCESS') {
      return new Response(JSON.stringify({ message: "Ignoré" }), { headers: corsHeaders, status: 200 })
    }

    const data = body.data || body
    const { purchase_id, order_id, user_id, tickets } = data
    const pid = purchase_id || order_id
    if (!pid ||!user_id ||!tickets) throw new Error("Données manquantes")

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
          status: 'valide',
          qr_code: `TKF-${pid}-${crypto.randomUUID().slice(0,8)}`
        })
      }
    }

    // 1. Crée les billets et récupère les IDs
    const { data: inserted, error } = await supabase.from('user_tickets').insert(billets).select('id')
    if (error) throw error

    // 2. Récupère email + téléphone
    const { data: { user } } = await supabase.auth.admin.getUserById(user_id)
    const { data: profile } = await supabase.from('profiles').select('phone, full_name').eq('id', user_id).single()

    // 3. Envoi pour chaque billet
    for (const ticket of inserted) {
      if (user?.email) {
        // → Client AVEC email : PDF par email
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-ticket-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ticket_id: ticket.id })
        })
      } else if (profile?.phone) {
        // → Client SANS email : lien SMS
        const link = `https://tickofiesta.com/ticket/${ticket.id}`
        await fetch(Deno.env.get('SMS_PROVIDER_URL')!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('GENIUSPAY_API_SECRET')}`
          },
          body: JSON.stringify({
            to: profile.phone,
            sender: Deno.env.get('SMS_SENDER') || 'TickoFiesta',
            message: `TickoFiesta: ${profile.full_name||''}, votre billet est prêt! Ouvrez: ${link}`
          })
        })
      }
    }

    return new Response(JSON.stringify({ success: true, count: inserted.length }), { headers: corsHeaders })

  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders })
  }
})