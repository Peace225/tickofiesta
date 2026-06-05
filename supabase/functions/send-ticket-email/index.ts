import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'
import QRCode from 'https://esm.sh/qrcode@1.5.3'
import { Resend } from 'https://esm.sh/resend@4.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  try {
    const { ticket_id } = await req.json()

    const { data: ticket } = await supabase
     .from('user_tickets')
     .select(`id, qr_code, status, user_id, tickets:ticket_type_id (events:event_id (titre, date, lieu))`)
     .eq('id', ticket_id)
     .single()

    const { data: { user } } = await supabase.auth.admin.getUserById(ticket.user_id)
    const event = ticket.tickets.events

    // QR code
    const qrDataUrl = await QRCode.toDataURL(ticket.qr_code || ticket.id, { width: 400, margin: 1 })
    const qrBase64 = qrDataUrl.split(',')[1]
    const qrBytes = Uint8Array.from(atob(qrBase64), c => c.charCodeAt(0))

    // PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 420])
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    page.drawRectangle({ x: 0, y: 0, width: 595, height: 420, color: rgb(0.98, 0.98, 0.99) })
    page.drawText(event.titre || 'TickoFiesta', { x: 40, y: 340, size: 26, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
    page.drawText(`${new Date(event.date).toLocaleDateString('fr-FR')}`, { x: 40, y: 310, size: 13, font, color: rgb(0.4, 0.4, 0.4) })
    page.drawText(event.lieu || '', { x: 40, y: 290, size: 13, font, color: rgb(0.4, 0.4, 0.4) })

    const qrImage = await pdfDoc.embedPng(qrBytes)
    page.drawImage(qrImage, { x: 420, y: 180, width: 130, height: 130 })
    page.drawText(`Billet #${ticket.id.slice(0,8).toUpperCase()}`, { x: 425, y: 160, size: 9, font, color: rgb(0.5, 0.5, 0.5) })

    const pdfBase64 = await pdfDoc.saveAsBase64()

    // Envoi Resend
    await resend.emails.send({
      from: 'TickoFiesta <onboarding@resend.dev>', // change après vérif domaine
      to: user.email,
      subject: `🎟️ Votre billet - ${event.titre}`,
      html: `<h2>Votre billet est prêt</h2><p>Bonjour, votre billet pour <b>${event.titre}</b> est en pièce jointe.</p><p>Retrouvez-le aussi sur tickofiesta.com</p>`,
      attachments: [{ filename: `billet-${ticket.id.slice(0,8)}.pdf`, content: pdfBase64 }],
    })

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})