import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  CheckCircle2, Calendar, MapPin, 
  QrCode, Ticket, Printer, ArrowRight, Hash, ShieldCheck
} from 'lucide-react';

export default function PaymentSuccessPage() {
  const { dark } = useSelector((s) => s.theme);
  const [purchases, setPurchases] = useState([]);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Déclenche l'animation d'entrée
    setTimeout(() => setAnimate(true), 100);

    const stored = sessionStorage.getItem('last_purchases');
    if (stored) {
      try { 
        // On parse les données du backend
        const parsedPurchases = JSON.parse(stored);
        
        // On normalise les objets pour s'assurer que ça marche avec Supabase
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
    
    // Optionnel : On peut vider le storage si on ne veut pas que l'utilisateur 
    // revoie cette page en faisant "Précédent" dans son navigateur.
    // sessionStorage.removeItem('last_purchases');
  }, []);

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
      
      {/* --- BACKGROUND ORBS (Non imprimés) --- */}
      <div className="absolute inset-0 pointer-events-none print:hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] bg-[#00d4aa]/10 animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full blur-[150px] bg-[#6c47ff]/10" />
      </div>

      <div className="max-w-2xl w-full mx-auto relative z-10">

        {/* --- HEADER SUCCÈS --- */}
        <div className={`text-center mb-12 transition-all duration-700 transform ${animate ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'} print:hidden`}>
          <div className="relative inline-flex mb-6 group">
            <div className="absolute inset-0 bg-[#00d4aa] rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-[#00d4aa] to-[#009e7f] border-[4px] border-[#080812] rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 size={48} className="text-white" />
            </div>
          </div>
          
          <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-4 ${theme.text}`}>
            PAIEMENT <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00d4aa] to-[#009e7f]">RÉUSSI !</span>
          </h1>
          
          <p className={`text-lg font-medium max-w-md mx-auto ${theme.sub}`}>
            {purchases.length > 0
              ? `Félicitations, vos ${purchases.length} billet${purchases.length > 1 ? 's' : ''} ont été générés avec succès.`
              : 'Votre commande a été traitée avec succès.'}
          </p>

          {purchases.length > 0 && (
            <button 
              onClick={handlePrint}
              className="mt-8 flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl hover:-translate-y-1"
            >
              <Printer size={16} /> Imprimer les billets
            </button>
          )}
        </div>

        {/* --- TICKETS (Zone Imprimable) --- */}
        {purchases.length > 0 ? (
          <div className="space-y-8 mb-12 print:space-y-4 print:mb-0">
            {purchases.map((purchase, i) => (
              <div 
                key={purchase.id || i}
                className={`rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} print:shadow-none print:border print:border-gray-300 print:break-inside-avoid ${theme.cardBg}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* --- Haut du Billet (Événement) --- */}
                <div className="relative h-48 md:h-56 overflow-hidden print:h-32">
                  {purchase.event?.image ? (
                    <img 
                      src={purchase.event.image} 
                      alt={purchase.event?.titre}
                      className="w-full h-full object-cover scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#6c47ff] to-[#00d4aa]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e1a] via-[#0f0e1a]/60 to-transparent print:from-white print:via-white/80" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 print:p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-[#00d4aa] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-lg">
                        BILLET {i + 1}
                      </span>
                      {purchase.event?.categorie && (
                        <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md border border-white/20 print:bg-gray-200 print:text-black">
                          {purchase.event.categorie}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-white font-black text-2xl md:text-3xl leading-tight tracking-tight print:text-black">
                      {purchase.event?.titre?.toUpperCase() || 'ÉVÉNEMENT'}
                    </h3>
                    
                    <div className="flex items-center gap-4 mt-3 flex-wrap print:text-gray-600">
                      {purchase.event?.date && (
                        <span className="flex items-center gap-1.5 text-white/70 text-xs font-bold print:text-gray-600">
                          <Calendar size={14} className="text-[#00d4aa] print:text-gray-500" />
                          {new Date(purchase.event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {purchase.event?.lieu && (
                        <span className="flex items-center gap-1.5 text-white/70 text-xs font-bold print:text-gray-600">
                          <MapPin size={14} className="text-[#00d4aa] print:text-gray-500" />
                          {purchase.event.lieu}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- Ligne de Découpe (Perforation) --- */}
                <div className="flex items-center relative z-20 print:hidden">
                  <div className={`w-8 h-8 rounded-full -ml-4 flex-shrink-0 shadow-inner ${theme.cutout}`} />
                  <div className={`flex-1 border-t-[3px] border-dashed mx-2 ${dark ? 'border-white/10' : 'border-gray-200'}`} />
                  <div className={`w-8 h-8 rounded-full -mr-4 flex-shrink-0 shadow-inner ${theme.cutout}`} />
                </div>
                {/* Ligne alternative pour l'impression */}
                <div className="hidden print:block border-t-2 border-dashed border-gray-300 mx-4" />

                {/* --- Bas du Billet (Infos & QR Code) --- */}
                <div className="p-6 md:p-8 print:p-4">
                  <div className="flex flex-col-reverse md:flex-row items-center md:items-start gap-8">
                    
                    {/* Détails Achat */}
                    <div className="flex-1 w-full space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.sub}`}>Type de Billet</p>
                          <p className={`font-black text-lg ${theme.text} print:text-black`}>{purchase.ticket?.type?.toUpperCase() || 'STANDARD'}</p>
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.sub}`}>Statut</p>
                          <p className="font-black text-lg text-[#00d4aa] flex items-center gap-1">
                            <ShieldCheck size={18} /> VALIDE
                          </p>
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'} print:bg-white print:border-gray-300`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold ${theme.sub}`}>Montant réglé</span>
                          <span className={`text-sm font-black ${theme.text} print:text-black`}>{purchase.montant?.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${theme.sub}`}>Réf. Transaction</span>
                          <span className={`text-xs font-mono font-bold ${theme.text} print:text-black`}>
                            <Hash size={10} className="inline mr-1 opacity-50" />
                            {purchase.transaction_ref || purchase.id || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center">
                      <div className={`p-3 rounded-3xl border shadow-xl ${dark ? 'bg-white border-white/20' : 'bg-white border-gray-200'} print:border-none print:shadow-none`}>
                        {purchase.qr_code_image ? (
                          <img src={purchase.qr_code_image} alt="QR Code d'accès" className="w-32 h-32 md:w-36 md:h-36 object-contain" />
                        ) : (
                          // Fallback avec l'ID Supabase si pas d'image en DB
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${purchase.id}`} alt="QR Code généré" className="w-32 h-32 md:w-36 md:h-36 object-contain" />
                        )}
                      </div>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-4 text-center ${theme.sub}`}>
                        Scanner à l'entrée
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-[3rem] border-2 border-dashed p-10 mb-8 text-center animate-fade-in print:hidden ${dark ? 'bg-[#0f0e1a]/50 border-white/10' : 'bg-white border-gray-200'}`}>
            <Ticket size={48} className={`mx-auto mb-4 opacity-20 ${theme.sub}`} />
            <p className={`text-2xl font-black mb-2 ${theme.text}`}>Billets introuvables</p>
            <p className={`text-sm font-medium ${theme.sub}`}>Retrouvez l'intégralité de vos billets achetés dans votre espace personnel.</p>
          </div>
        )}

        {/* --- ACTIONS NAVIGATION (Non imprimées) --- */}
        <div className="flex flex-col sm:flex-row gap-4 print:hidden animate-fade-in" style={{ animationDelay: '500ms' }}>
          <Link 
            to="/mes-billets"
            className="flex-1 bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#6c47ff]/20 text-center flex items-center justify-center gap-2"
          >
            VOIR MES BILLETS <ArrowRight size={18} />
          </Link>
          <Link 
            to="/events"
            className={`flex-1 border px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all text-center flex items-center justify-center ${dark ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            RETOUR AU CATALOGUE
          </Link>
        </div>

      </div>
    </div>
  );
}