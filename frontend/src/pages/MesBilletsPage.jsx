import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient'; 
import Spinner from '../components/ui/Spinner';
import { 
  Calendar, MapPin, QrCode, Ticket, 
  Download, CheckCircle, Sparkles 
} from 'lucide-react';
import BackButton from '../components/shared/BackButton';
import toast from 'react-hot-toast';

export default function MesBilletsPage() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  
  const [billets, setBillets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [filtre, setFiltre] = useState('Tous');

  // --- LOGIQUE SUPABASE : Récupération des Billets ---
  useEffect(() => {
    const fetchBillets = async () => {
      if (!user) return;
      
      try {
        // On récupère les achats de l'utilisateur avec les jointures vers events et tickets
        const { data, error } = await supabase
          .from('purchases')
          .select(`
            *,
            events (*),
            tickets (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // On formate les données pour qu'elles correspondent exactement à ton JSX
        const formattedData = (data || []).map(b => ({
          ...b,
          event_id: b.events || b.event_id, 
          ticket_id: b.tickets || b.ticket_id
        }));
        
        setBillets(formattedData);

      } catch (err) {
        console.error("Erreur lors de la récupération des billets:", err.message);
        toast.error("Impossible de charger vos billets.");
      } finally {
        setLoading(false);
      }
    };

    fetchBillets();
  }, [user]);

  // --- LOGIQUE DE TÉLÉCHARGEMENT PDF ---
  const handleDownloadPDF = async (billet) => {
    setDownloading(billet.id);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:595px;background:white;font-family:Arial,sans-serif;';

      const dateStr = billet.event_id?.date || billet.created_at;
      const date = dateStr
        ? new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

      el.innerHTML = `
        <div style="border:2px solid #6c47ff;border-radius:16px;overflow:hidden;margin:0;">
          ${billet.event_id?.image ? `
          <div style="position:relative;height:160px;overflow:hidden;">
            <img src="${billet.event_id.image}" crossorigin="anonymous" style="width:100%;height:160px;object-fit:cover;display:block;" />
            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85),transparent);"></div>
            <div style="position:absolute;bottom:12px;left:16px;">
              <span style="background:#6c47ff;color:white;font-size:10px;font-weight:bold;padding:3px 10px;border-radius:20px;">${billet.event_id?.categorie?.toUpperCase() || 'ÉVÉNEMENT'}</span>
              <div style="color:white;font-size:20px;font-weight:900;margin-top:4px;">${billet.event_id?.titre?.toUpperCase() || ''}</div>
            </div>
          </div>` : ''}
          <div style="padding:16px;display:flex;gap:16px;align-items:flex-start;">
            <div style="background:white;padding:6px;border-radius:10px;border:1px solid #e5e7eb;flex-shrink:0;text-align:center;">
              <img src="${billet.qr_code_image || 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + billet.id}" style="width:110px;height:110px;display:block;" />
              <p style="font-size:8px;margin:4px 0 0;color:#6b7280;font-weight:bold;text-transform:uppercase;">Scanner à l'entrée</p>
            </div>
            <div style="flex:1;">
              <table style="width:100%;font-size:12px;border-collapse:collapse;">
                <tr><td style="padding:4px 0;color:#6b7280;font-weight:bold;width:80px;">Référence</td><td style="font-family:monospace;font-size:10px;font-weight:bold;">${billet.transaction_ref || billet.id}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;font-weight:bold;">Type</td><td style="font-weight:900;color:#111827;">${billet.ticket_id?.type?.toUpperCase() || 'STANDARD'}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;font-weight:bold;">Montant</td><td style="color:#6c47ff;font-weight:900;">${billet.montant?.toLocaleString('fr-FR')} FCFA</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;font-weight:bold;">Date</td><td style="font-weight:bold;color:#374151;">${date}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;font-weight:bold;">Lieu</td><td style="font-weight:bold;color:#374151;">${billet.event_id?.lieu || '—'}</td></tr>
                <tr><td style="padding:4px 0;color:#6b7280;font-weight:bold;">Statut</td><td style="color:#00d4aa;font-weight:900;">✓ Confirmé</td></tr>
              </table>
            </div>
          </div>
          <div style="background:#f9fafb;padding:8px 16px;border-top:1px dashed #e5e7eb;font-size:8px;color:#9ca3af;word-break:break-all;text-align:center;">
            TICKOFIESTA — Billet Électronique
          </div>
        </div>
      `;

      document.body.appendChild(el);
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      document.body.removeChild(el);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 40;
      const imgH = (canvas.height / canvas.width) * imgW;
      const yOffset = (pageH - imgH) / 2;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 20, Math.max(20, yOffset), imgW, imgH);
      pdf.save(`billet-${billet.transaction_ref || billet.id.substring(0,8)}.pdf`);
      
      toast.success("Billet téléchargé avec succès !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du téléchargement.");
    } finally {
      setDownloading(null);
    }
  };

  // Styles de statut
  const statusConfig = {
    completed: 'bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/30',
    scanned:   'bg-gray-400/10 text-gray-400 border border-gray-400/30',
    pending:   'bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30',
    cancelled: 'bg-red-400/10 text-red-400 border border-red-400/30',
    default:   'bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/30'
  };

  // Thème Premium
  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0f0e1a]/80 backdrop-blur-xl border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/40',
  };

  if (loading) return (
    <div className={`min-h-screen ${theme.bg} flex flex-col justify-center items-center gap-4`}>
      <Spinner size="lg" />
      <span className={`text-xs font-black uppercase tracking-widest animate-pulse ${theme.sub}`}>Recherche de vos billets...</span>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme.bg} relative overflow-hidden`}>
      
      {/* --- BACKGROUND ORBS --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] bg-[#6c47ff]/20 animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full blur-[150px] bg-[#00d4aa]/10" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 pt-24 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center shadow-2xl border border-white/20">
              <Ticket size={24} className="text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-black tracking-tighter ${theme.text}`}>MES BILLETS</h1>
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.sub}`}>{billets.length} ACHAT{billets.length > 1 ? 'S' : ''} RÉALISÉ{billets.length > 1 ? 'S' : ''}</p>
            </div>
          </div>
          <BackButton to="/events" label="Retour au catalogue" />
        </div>

        {/* --- FILTRES --- */}
        {billets.length > 0 && (() => {
          const types = ['Tous', ...new Set(billets.map(b => b.ticket_id?.type || 'Standard').filter(Boolean))];
          return (
            <div className="flex gap-3 flex-wrap mb-10">
              {types.map(t => {
                const count = t === 'Tous' ? billets.length : billets.filter(b => (b.ticket_id?.type || 'Standard') === t).length;
                const isActive = filtre === t;
                return (
                  <button 
                    key={t} 
                    onClick={() => setFiltre(t)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                      isActive
                        ? 'bg-[#6c47ff] text-white shadow-lg shadow-[#6c47ff]/30 scale-105'
                        : dark 
                          ? 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10' 
                          : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    {t}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : dark ? 'bg-white/10' : 'bg-gray-100'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* --- LISTE DES BILLETS --- */}
        {billets.length === 0 ? (
          <div className={`text-center py-32 rounded-[3rem] border-2 border-dashed ${dark ? 'bg-[#0f0e1a]/50 border-white/5' : 'bg-white border-gray-200'}`}>
            <div className="w-24 h-24 rounded-full bg-[#6c47ff]/10 flex items-center justify-center mx-auto mb-6">
              <Ticket size={40} className="text-[#6c47ff] opacity-50" />
            </div>
            <p className={`text-2xl font-black mb-2 tracking-tight ${theme.text}`}>Votre portefeuille est vide</p>
            <p className={`text-sm font-medium ${theme.sub}`}>Vous n'avez pas encore acheté de billets pour nos événements.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {billets.filter(b => filtre === 'Tous' || (b.ticket_id?.type || 'Standard') === filtre).map((billet, i) => {
              const dateStr = billet.event_id?.date || billet.created_at;
              
              return (
                <div 
                  key={billet.id} 
                  className={`group rounded-[2.5rem] overflow-hidden border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl animate-slide-up ${theme.card}`}
                  style={{ animationDelay: `${i * 100}ms`, borderColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                >
                  <div className="flex flex-col md:flex-row">
                    
                    {/* Colonne Image Événement */}
                    <div className="relative h-48 md:h-auto md:w-2/5 overflow-hidden">
                      {billet.event_id?.image ? (
                        <img src={billet.event_id.image} alt={billet.event_id?.titre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#6c47ff] to-[#00d4aa]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e1a]/90 via-[#0f0e1a]/40 to-transparent" />
                      
                      <div className="absolute top-4 left-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg ${statusConfig[billet.status] || statusConfig.default}`}>
                          {billet.status === 'completed' ? 'Valide' : billet.status || 'Confirmé'}
                        </span>
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="inline-block bg-[#00d4aa] text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-1">
                          {billet.event_id?.categorie || 'EVENT'}
                        </span>
                        <h3 className="text-white font-black text-xl leading-tight tracking-tight line-clamp-2">
                          {billet.event_id?.titre?.toUpperCase() || 'ÉVÉNEMENT TICKOFIESTA'}
                        </h3>
                      </div>
                    </div>

                    {/* Colonne Infos Billet */}
                    <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-dashed" style={{ borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.sub}`}>Billet</p>
                            <span className={`text-lg font-black bg-clip-text text-transparent bg-gradient-to-r ${dark ? 'from-white to-gray-400' : 'from-gray-900 to-gray-500'}`}>
                              {billet.ticket_id?.type?.toUpperCase() || 'STANDARD'}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.sub}`}>Montant</p>
                            <span className="text-lg font-black text-[#6c47ff]">{billet.montant?.toLocaleString('fr-FR')} F</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1 ${theme.sub}`}>
                              <Calendar size={12} className="text-[#6c47ff]" /> Date
                            </div>
                            <p className={`text-sm font-bold ${theme.text}`}>
                              {dateStr ? new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'À définir'}
                            </p>
                          </div>
                          <div>
                            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-1 ${theme.sub}`}>
                              <MapPin size={12} className="text-[#00d4aa]" /> Lieu
                            </div>
                            <p className={`text-sm font-bold truncate ${theme.text}`}>{billet.event_id?.lieu || 'Lieu secret'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions Bas de carte */}
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Réf:</span>
                          <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md ${dark ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-700'}`}>
                            {billet.transaction_ref || billet.id?.substring(0, 8)}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelected(selected === billet.id ? null : billet.id)}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-md hover:-translate-y-0.5 ${
                              selected === billet.id 
                                ? 'bg-red-500 text-white shadow-red-500/30' 
                                : 'bg-[#6c47ff] text-white shadow-[#6c47ff]/30'
                            }`}
                            title="Afficher le QR Code"
                          >
                            <QrCode size={18} />
                          </button>
                          
                          <button 
                            onClick={() => handleDownloadPDF(billet)} 
                            disabled={downloading === billet.id}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4aa] to-[#00b894] text-white transition-all shadow-md shadow-[#00d4aa]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:grayscale"
                            title="Télécharger le billet (PDF)"
                          >
                            {downloading === billet.id ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Reveal (Accordion) */}
                  <div 
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${selected === billet.id ? 'max-h-96 border-t' : 'max-h-0'}`}
                    style={{ borderColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  >
                    <div className={`p-8 flex flex-col items-center justify-center ${dark ? 'bg-[#0a0818]' : 'bg-gray-50'}`}>
                      <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 px-4 py-2 rounded-full mb-6">
                         <Sparkles size={14} className="text-[#00d4aa]" />
                         <span className="text-[#00d4aa] text-[10px] font-black uppercase tracking-widest">Prêt pour l'accès</span>
                      </div>
                      
                      <div className="p-4 rounded-3xl bg-white shadow-2xl border border-gray-100">
                        {billet.qr_code_image ? (
                          <img src={billet.qr_code_image} alt="QR Code" className="w-48 h-48 md:w-56 md:h-56" />
                        ) : (
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${billet.id}`} alt="QR Code généré" className="w-48 h-48 md:w-56 md:h-56" />
                        )}
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-6 ${theme.sub}`}>Présentez ce code à l'entrée de l'événement</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}