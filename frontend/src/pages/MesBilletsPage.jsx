import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import Spinner from '../components/ui/Spinner';
import { Ticket, Calendar, MapPin, Download, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '../components/shared/BackButton';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

export default function MesBilletsPage() {
  const dark = useSelector((s) => s.theme?.dark ?? false);
  const user = useSelector((s) => s.auth?.user ?? null);
  const navigate = useNavigate();
  
  const [billets, setBillets] = useState([]);
  const [premiumEvents, setPremiumEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const carouselRef = useRef(null);

  // 🛡️ SÉCURITÉ
  if (!user) return <Navigate to="/login" replace />;
  const role = String(user?.user_metadata?.role || user?.role || 'client').toLowerCase();
  if (role === 'admin' || role === 'organisateur') {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: ticketsData, error: e1 } = await supabase
          .from('user_tickets')
          .select(`id, scanned, created_at, purchase:purchase_id (montant), tarif:ticket_type_id (id, nom, prix, event_id)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (e1) throw e1;

        const eventIds = [...new Set((ticketsData || []).map(t => t.tarif?.event_id).filter(Boolean))];
        let eventsMap = {};
        
        if (eventIds.length > 0) {
          const { data: events } = await supabase.from('events').select('id, titre, date, lieu, image').in('id', eventIds);
          eventsMap = Object.fromEntries((events || []).map(e => [e.id, e]));
        }

        setBillets((ticketsData || []).map(b => ({
          id: b.id,
          status: b.scanned ? 'scanned' : 'completed',
          montant: b.purchase?.montant || b.tarif?.prix || 0,
          type: b.tarif?.nom,
          event: eventsMap[b.tarif?.event_id] || {}
        })));

        const { data: upcomingEvents, error: e2 } = await supabase
          .from('events')
          .select('id, titre, date, lieu, image, categorie, tarifs(prix)')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(6);

        if (!e2 && upcomingEvents) {
          setPremiumEvents(upcomingEvents.map(event => ({
            ...event,
            minPrice: event.tarifs?.length > 0 ? Math.min(...event.tarifs.map(t => t.prix)) : null
          })));
        }
      } catch (err) {
        toast.error("Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  // Défilement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        else carouselRef.current.scrollBy({ left: 250, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadPDF = async (billet) => {
    setDownloadingId(billet.id);
    const toastId = toast.loading('Préparation de votre billet...');
    try {
      const element = document.getElementById(`ticket-${billet.id}`);
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: dark ? '#1c1c1e' : '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [380, 640] });
      pdf.addImage(imgData, 'PNG', 0, 0, 380, 640);
      pdf.save(`Ticket_${billet.event.titre || 'Billet'}.pdf`);
      toast.success('Billet téléchargé !', { id: toastId });
    } catch {
      toast.error('Erreur téléchargement', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  const theme = {
    bg: dark ? 'bg-[#000000]' : 'bg-[#f5f5f7]',
    card: dark ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-white',
    sub: dark ? 'text-[#98989d]' : 'text-[#86868b]'
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Spinner size="lg" /></div>;

  return (
    <div className={`min-h-screen pt-24 pb-12 px-4 ${theme.bg} transition-colors duration-500`}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <BackButton />
          <h1 className="text-4xl font-black mt-4">Mes Billets</h1>
        </header>

        {billets.length === 0 ? (
          <div className={`${theme.card} p-12 rounded-[2rem] text-center`}>
            <Ticket size={40} className="mx-auto mb-4 text-[#6c47ff]" />
            <p className="font-bold">Aucun billet trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {billets.map(b => (
              <div key={b.id}>
                <div id={`ticket-${b.id}`} className={`${theme.card} p-6 rounded-3xl shadow-lg border`}>
                  <h3 className="font-black text-xl mb-4">{b.event.titre}</h3>
                  <div className="bg-white p-3 rounded-2xl inline-block"><QRCodeSVG value={b.id} size={100} /></div>
                  <p className="text-xs font-bold mt-4 opacity-50 uppercase">ID: {b.id.substring(0, 8)}</p>
                </div>
                <button onClick={() => handleDownloadPDF(b)} className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black active:scale-95 transition-all">
                  {downloadingId === b.id ? <Spinner size="sm" /> : <><Download size={16} className="inline mr-2" /> PDF</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* CARROUSEL PREMIUM */}
        <div className="mt-20 border-t border-slate-200 dark:border-white/10 pt-12">
          <h2 className="text-2xl font-black mb-8">À ne pas manquer</h2>
          <div ref={carouselRef} className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
            {premiumEvents.map(event => (
              <div key={event.id} className={`shrink-0 w-[240px] rounded-[2rem] p-4 ${theme.card} border snap-center`}>
                <img src={event.image} className="h-32 w-full object-cover rounded-2xl mb-4" />
                <h3 className="font-black text-sm truncate">{event.titre}</h3>
                <p className={`text-[10px] uppercase font-bold mb-4 ${theme.sub}`}>{event.lieu}</p>
                <Link to={`/events/${event.id}`} className="block w-full text-center bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white py-3 rounded-xl font-black text-[11px] uppercase">
                  {event.minPrice ? `DÈS ${event.minPrice.toLocaleString()} F` : 'Réserver'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}