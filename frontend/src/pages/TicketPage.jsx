import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../config/supabaseClient'
import { QRCodeSVG } from 'qrcode.react'
import { Loader2, Calendar, MapPin } from 'lucide-react'

export default function TicketPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)

  const getImg = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return supabase.storage.from('events').getPublicUrl(path).data.publicUrl
  }

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
       .from('user_tickets')
       .select('id,created_at,status,qr_code,tickets:ticket_type_id(nom,events:event_id(titre,date,lieu,image))')
       .eq('id', id)
       .maybeSingle()

      if (error) console.error(error)
      setTicket(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-900" size={32} />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-500 font-bold">Billet introuvable</p>
          <p className="text-xs text-slate-400 mt-1">ID: {id}</p>
        </div>
      </div>
    )
  }

  const event = ticket.tickets?.events
  const img = getImg(event?.image)

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden">
        {img && <img src={img} alt={event?.titre} className="w-full h-40 object-cover" />}

        <div className="p-6 text-center">
          <h1 className="text-xl font-black text-slate-900 leading-tight">
            {event?.titre}
          </h1>

          <div className="mt-3 space-y-1.5">
            <p className="text-sm text-slate-600 flex items-center justify-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              {event?.date? new Date(event.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Date à confirmer'}
            </p>
            <p className="text-sm text-slate-600 flex items-center justify-center gap-1.5">
              <MapPin size={14} className="text-slate-400" />
              {event?.lieu || 'Lieu à confirmer'}
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl mt-5">
            <div className="bg-white p-3 rounded-xl inline-block shadow-sm">
              <QRCodeSVG
                value={ticket.qr_code || ticket.id}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="mt-3 font-mono text-xs text-slate-500 tracking-wider">
              {ticket.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {ticket.tickets?.nom}
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="mt-5 w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-sm transition-colors active:scale-[0.98]"
          >
            Imprimer
          </button>
        </div>
      </div>
    </div>
  )
}