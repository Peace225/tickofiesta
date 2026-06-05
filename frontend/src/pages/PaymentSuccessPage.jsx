import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  CheckCircle2, Calendar, MapPin, 
  Ticket, Printer, ArrowRight, Hash, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const { dark } = useSelector((s) => s.theme);
  const [purchases, setPurchases] = useState([]);
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Animation d'entrée
    setTimeout(() => setAnimate(true), 100);

    // 2. Gestion des données des billets
    const stored = sessionStorage.getItem('last_purchases');
    if (stored) {
      try { 
        const parsedPurchases = JSON.parse(stored);
        const normalizedPurchases = parsedPurchases.map(p => ({
          ...p,
          event: p.events || p.event || p.event_id,
          ticket: p.tickets || p.ticket || p.ticket_id
        }));
        setPurchases(normalizedPurchases); 
      } catch (e) {
        console.error("Erreur de lecture des billets", e);
      }
    }

    // 3. Logique de redirection automatique après 5 secondes
    const redirectTimer = setTimeout(() => {
      const previousUrl = localStorage.getItem('url_avant_paiement');
      if (previousUrl) {
        toast.success("Redirection vers votre événement...");
        navigate(previousUrl);
        localStorage.removeItem('url_avant_paiement');
      }
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  const handlePrint = () => window.print();

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    cardBg: dark ? 'bg-[#0f0e1a]' : 'bg-white',
    cutout: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]'
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme.bg} py-12 px-6 relative overflow-hidden flex flex-col items-center`}>
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none print:hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] bg-[#00d4aa]/10 animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full blur-[150px] bg-[#6c47ff]/10" />
      </div>

      <div className="max-w-2xl w-full mx-auto relative z-10">
        {/* Header Succès */}
        <div className={`text-center mb-12 transition-all duration-700 transform ${animate ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'} print:hidden`}>
          <div className="relative inline-flex mb-6 group">
            <div className="absolute inset-0 bg-[#00d4aa] rounded-full blur-xl opacity-40 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-[#00d4aa] to-[#009e7f] border-[4px] border-[#080812] rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 size={48} className="text-white" />
            </div>
          </div>
          
          <h1 className={`text-4xl font-black mb-4 ${theme.text}`}>PAIEMENT RÉUSSI !</h1>
          <p className={`text-lg font-medium max-w-md mx-auto ${theme.sub}`}>
            Vos billets ont été générés. Vous allez être redirigé automatiquement...
          </p>

          {purchases.length > 0 && (
            <button 
              onClick={handlePrint}
              className="mt-8 flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl"
            >
              <Printer size={16} /> Imprimer les billets
            </button>
          )}
        </div>

        {/* --- SECTION BILLETS --- */}
        {purchases.length > 0 && (
          <div className="space-y-8 mb-12">
            {purchases.map((purchase, i) => (
              <div key={purchase.id || i} className={`rounded-[2.5rem] overflow-hidden shadow-2xl p-6 ${theme.cardBg}`}>
                <h3 className="text-xl font-black mb-4">{purchase.event?.titre || 'Événement'}</h3>
                <div className="flex items-center gap-4 text-sm font-bold opacity-70 mb-4">
                  <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(purchase.event?.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin size={14}/> {purchase.event?.lieu}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="font-black">{purchase.montant} FCFA</span>
                  <span className="text-[#00d4aa] flex items-center gap-1 font-bold"><ShieldCheck size={16} /> VALIDE</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 print:hidden">
          <Link to="/mes-billets" className="flex-1 bg-[#6c47ff] text-white py-4 rounded-2xl font-black text-center uppercase text-sm">
            Voir mes billets
          </Link>
        </div>
      </div>
    </div>
  );
}