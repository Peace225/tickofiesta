import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../config/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, XCircle, TicketCheck, Loader2, Ticket } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import toast, { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

const STATUS_CONFIG = {
  valide: { label: 'Validé', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  utilise: { label: 'Utilisé', icon: TicketCheck, color: 'text-slate-500 bg-slate-50 border-slate-200' },
  annule: { label: 'Annulé', icon: XCircle, color: 'text-rose-500 bg-rose-50 border-rose-200' },
};

export default function MesBilletsPage() {
  const { dark } = useSelector((s) => s.theme);
  const [user, setUser] = useState(null);
  const [billets, setBillets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [filter, setFilter] = useState('tous');

  const getPublicImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('events').getPublicUrl(path);
    return data?.publicUrl;
  };

  const handleDownload = async (billet) => {
    if (downloadingId) return;
    const element = document.getElementById(`ticket-${billet.id}`);
    if (!element) return;

    setDownloadingId(billet.id);
    const toastId = toast.loading('Création du PDF...');

    try {
      const canvas = await html2canvas(element, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [210, 99] });
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 99);
      pdf.save(`Billet-TickoFiesta-${billet.id.slice(0,6).toUpperCase()}.pdf`);
      toast.success('Billet enregistré!', { id: toastId });
    } catch (e) {
      toast.error("Impossible de générer le PDF", { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchBillets = async () => {
      try {
        // ✅ CORRECTION : on lit les snapshots, plus de jointure obligatoire
        const { data, error } = await supabase
         .from('user_tickets')
         .select(`
            id, created_at, status, qr_code,
            ticket_nom_snapshot,
            event_image_snapshot,
            event_titre_snapshot,
            event_date_snapshot,
            ticket:ticket_type_id ( nom, event:event_id (titre, image, date, lieu) )
          `)
         .eq('user_id', user.id)
         .order('created_at', { ascending: false });

        if (error) throw error;
        setBillets(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger vos billets.");
      } finally {
        setLoading(false);
      }
    };
    fetchBillets();
  }, [user]);

  const filteredBillets = useMemo(() => {
    if (filter === 'tous') return billets;
    return billets.filter(b => (b.status || 'valide').toLowerCase() === filter);
  }, [billets, filter]);

  const theme = {
    bg: dark? 'bg-[#080812]' : 'bg-[#f4f7fe]',
    text: dark? 'text-white' : 'text-slate-900',
    card: dark? 'bg-[#0f0e1a] border-white/10' : 'bg-white border-slate-200',
  };

  if (loading) return <div className={`h-screen flex items-center justify-center ${theme.bg}`}><Loader2 className="animate-spin text-[#00d4aa]" size={48} /></div>;

  return (
    <div className={`min-h-screen ${theme.bg} pb-24`}>
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className={`text-3xl font-black ${theme.text} mb-6`}>Mes Billets ({billets.length})</h1>

        {filteredBillets.map((b, i) => {
          // ✅ On prend d'abord le snapshot, sinon fallback jointure
          const typeBillet = b.ticket_nom_snapshot || b.ticket?.nom || 'STANDARD';
          const evTitre = b.event_titre_snapshot || b.ticket?.event?.titre || 'Événement';
          const evImage = b.event_image_snapshot || b.ticket?.event?.image;
          const img = getPublicImageUrl(evImage);
          const statusConf = STATUS_CONFIG[b.status] || STATUS_CONFIG.valide;
          const Icon = statusConf.icon;

          return (
            <div key={b.id} id={`ticket-${b.id}`} className={`rounded- overflow-hidden shadow-2xl mb-8 ${theme.card}`}>
              <div className="flex flex-col md:flex-row">
                <div className="relative md:w-[65%] h-56">
                  {img? <img src={img} className="w-full h-full object-cover" crossOrigin="anonymous" />
                       : <div className="w-full h-full bg-gradient-to-br from-[#6c47ff] to-[#00d4aa]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-[#00d4aa] text-black text- font-black px-3 py-1 rounded uppercase tracking-widest">{typeBillet}</span>
                    <h2 className="text-white text-2xl font-black mt-1">{evTitre}</h2>
                  </div>
                </div>
                <div className="md:w-[35%] p-6 flex flex-col items-center justify-center">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text- font-black uppercase ${statusConf.color} mb-4`}>
                    <Icon size={14} /> {statusConf.label}
                  </div>
                  <QRCodeSVG value={b.qr_code || b.id} size={100} />
                  <button onClick={() => handleDownload(b)} className="mt-4 w-full h-10 bg-slate-900 text-white rounded-xl text-xs font-bold">
                    {downloadingId === b.id? '...' : 'PDF'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}