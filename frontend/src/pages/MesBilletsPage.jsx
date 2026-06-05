import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../config/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, CheckCircle2, XCircle, TicketCheck, Loader2, Download, Filter, ExternalLink } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import toast, { Toaster } from 'react-hot-toast';

const STATUS_CONFIG = {
  valide: { label: 'Validé', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  utilisé: { label: 'Utilisé', icon: TicketCheck, color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  annulé: { label: 'Annulé', icon: XCircle, color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
};

export default function MesBilletsPage() {
  const [user, setUser] = useState(null);
  const [billets, setBillets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [filter, setFilter] = useState('tous');

  const getPublicImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return supabase.storage.from('events').getPublicUrl(path).data.publicUrl;
  };

  const handleDownload = async (billet) => {
    const element = document.getElementById(`ticket-${billet.id}`);
    if (!element) return;
    setDownloadingId(billet.id);
    const toastId = toast.loading('Génération du PDF...');
    try {
      const clone = element.cloneNode(true);
      clone.classList.add('ticket-pdf-export');
      document.body.appendChild(clone);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';

      const canvas = await html2canvas(clone, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
      const w = pdf.internal.pageSize.getWidth() - 20;
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, (pdf.internal.pageSize.getHeight() - h) / 2, w, h);
      
      pdf.save(`TickoFiesta-${billet.id.slice(0,8)}.pdf`);
      toast.success('Téléchargé !', { id: toastId });
    } catch (e) {
      toast.error('Erreur PDF', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_tickets')
      .select(`id, created_at, status, qr_code, tickets:ticket_type_id (events:event_id (id, titre, date, lieu, image))`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setBillets(data || []); setLoading(false); });
  }, [user]);

  const filteredBillets = useMemo(() => {
    if (filter === 'tous') return billets;
    return billets.filter(b => (b.status || 'valide').toLowerCase().includes(filter));
  }, [billets, filter]);

  if (loading) return <div className="h-screen grid place-items-center bg-slate-50"><Loader2 className="animate-spin text-[#6c47ff]" size={36} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Toaster position="top-center" />
      
      <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900">Mes Billets</h1>
            <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-sm font-bold">{billets.length}</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
          {['tous', 'valide', 'utilise', 'annule'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-xl capitalize font-bold text-sm ${filter === f ? 'bg-[#6c47ff] text-white' : 'bg-white border text-slate-600'}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-6 transition-all duration-300">
          {filteredBillets.map(b => {
            const ev = b.tickets?.events;
            const img = getPublicImageUrl(ev?.image);
            const status = STATUS_CONFIG[(b.status || 'valide').toLowerCase()] || STATUS_CONFIG.valide;
            return (
              <div key={b.id} className="group">
                <div id={`ticket-${b.id}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="relative w-full h-32">
                    {img && <img crossOrigin="anonymous" src={img} className="w-full h-full object-cover" alt="" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <h2 className="absolute bottom-3 left-4 text-white font-black text-lg">{ev?.titre}</h2>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12}/> {new Date(ev?.date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {ev?.lieu}</p>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border">
                      <QRCodeSVG value={b.qr_code || b.id} size={48} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <a href={`/ticket/${b.id}`} target="_blank" className="h-11 flex items-center justify-center bg-slate-900 text-white rounded-xl font-bold text-sm"><ExternalLink size={16} className="mr-2"/> Voir</a>
                  <button onClick={() => handleDownload(b)} className="h-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl font-bold text-sm"><Download size={16} className="mr-2"/> PDF</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}