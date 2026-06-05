import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';

export default function PaymentCancelPage() {
  const navigate = useNavigate();
  const { dark } = useSelector((s) => s.theme);
  const [returnUrl, setReturnUrl] = useState('/events');

  // --- LOGIQUE DE NETTOYAGE ET RÉCUPÉRATION D'URL ---
  useEffect(() => {
    // 1. On vide le panier temporaire stocké lors de la tentative d'achat
    sessionStorage.removeItem('last_purchases');

    // 2. On récupère l'URL d'origine pour le bouton "Réessayer"
    const previousUrl = localStorage.getItem('url_avant_paiement');
    if (previousUrl) {
      setReturnUrl(previousUrl);
    }
  }, []);

  const handleRetry = () => {
    // On nettoie le localStorage juste avant de repartir
    localStorage.removeItem('url_avant_paiement');
    navigate(returnUrl);
  };

  // Styles Thème Premium
  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0f0e1a]/90 backdrop-blur-xl border border-white/10' : 'bg-white border border-gray-100 shadow-2xl shadow-gray-200/50',
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden transition-colors duration-500 ${theme.bg}`}>
      
      {/* --- BACKGROUND ORBS --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[400px] h-[400px] rounded-full blur-[120px] bg-red-500/10 animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] bg-[#6c47ff]/10" />
      </div>

      <div className={`relative z-10 w-full max-w-md rounded-[2.5rem] p-8 md:p-10 animate-scale-in ${theme.card}`}>
        
        {/* Bouton Retour Discret */}
        <div className="flex justify-start mb-8">
          <button 
            onClick={handleRetry} 
            className={`group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${dark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <div className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors group-hover:bg-[#6c47ff] group-hover:border-[#6c47ff] group-hover:text-white border-current">
              <ArrowLeft size={14} />
            </div>
            Retour
          </button>
        </div>

        <div className="text-center">
          {/* Icône Animée */}
          <div className="relative inline-block mb-8 group">
            <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse" />
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl border ${dark ? 'bg-[#0f0e1a] border-red-500/30' : 'bg-white border-red-100'}`}>
              <XCircle size={48} className="text-red-500" />
            </div>
          </div>

          <h1 className={`text-3xl md:text-4xl font-black tracking-tighter mb-4 leading-tight ${theme.text}`}>
            PAIEMENT <br />
            <span className="text-red-500">ANNULÉ</span>
          </h1>
          
          <p className={`text-sm font-medium leading-relaxed mb-10 max-w-[250px] mx-auto ${theme.sub}`}>
            Votre transaction a été interrompue. <strong className={theme.text}>Aucun montant n'a été débité</strong> de votre compte.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-gray-800 to-black text-white dark:from-white dark:to-gray-200 dark:text-black py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <RefreshCcw size={16} /> Réessayer
            </button>
            
            <Link 
              to="/events" 
              onClick={() => localStorage.removeItem('url_avant_paiement')}
              className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center ${dark ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              Retour au catalogue
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}