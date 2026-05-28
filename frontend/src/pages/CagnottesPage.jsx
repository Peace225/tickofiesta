import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import {
  Heart, Clock, TrendingUp, ChevronRight,
  ShieldCheck, ArrowLeft, X, Wallet, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function CagnottesPage() {
  const navigate = useNavigate();
  const [cagnottes, setCagnottes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nouveaux states pour gérer la Pop-up Premium
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, cagnotte: null });
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCagnottes = useCallback(async () => {
    const { data, error } = await supabase
      .from('cagnottes')
      .select(`*, organisateur:profiles(nom, avatar_url)`)
      .eq('statut', 'validé')
      .order('created_at', { ascending: false });
    if (!error) setCagnottes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCagnottes();
    const channel = supabase.channel('cagnottes-publiques-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cagnottes' }, fetchCagnottes)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCagnottes]);

  const getProgress = (actuel, objectif) => objectif > 0 ? Math.min(Math.round((actuel / objectif) * 100), 100) : 0;

  // Ouvre la pop-up au lieu du vieux 'prompt'
  const openPaymentModal = (cagnotte) => {
    setPaymentModal({ isOpen: true, cagnotte });
    setAmount(''); // Réinitialise le montant
  };

  const closePaymentModal = () => {
    if (isProcessing) return; // Empêche de fermer si un paiement est en cours d'initialisation
    setPaymentModal({ isOpen: false, cagnotte: null });
  };

  // Logique de paiement transférée ici
  const processPayment = async (e) => {
    e.preventDefault();
    const val = parseInt(amount.replace(/\s/g, '')); // Enlève les espaces si l'utilisateur en met
    
    if (!val || val < 500) {
      return toast.error("Le montant minimum est de 500 FCFA");
    }

    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Veuillez vous connecter pour contribuer");
        return navigate('/login');
      }

      const { data, error } = await supabase.functions.invoke('init-geniuspay', {
        body: { 
          cagnotte_id: paymentModal.cagnotte.id, 
          total_amount: val, 
          type: 'cagnotte', 
          customer_email: user.email, 
          name: user.user_metadata?.full_name || 'Donateur' 
        }
      });

      if (error) throw error;
      
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error("URL de paiement introuvable");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'initialisation du paiement");
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-[#F5F7FB] relative">
      {/* HERO SECTION */}
      <div className="relative pt-8 pb-16 md:pt-12 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[#070B1A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.25),transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-[0.18em] mb-8">
            <ArrowLeft size={14} /> RETOUR
          </button>

          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">Collecte ouverte</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[0.9] text-white tracking-tight">
              LES <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">CAGNOTTES</span>
            </h1>
            <div className="flex items-center gap-2 mt-3 text-slate-400">
              <Heart size={14} className="text-sky-400" />
              <p className="text-sm md:text-base font-medium">Validées par TickoFiesta • Solidarité & Projets</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 pb-24 relative z-10">
        <div className="bg-sky-50 border border-sky-100 text-sky-700 px-4 py-3 rounded-xl text-sm font-medium mb-8 flex items-center gap-2">
          <ShieldCheck size={16} />Seules les cagnottes validées par l'admin apparaissent ici.
        </div>

        {cagnottes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center shadow-sm">
            <ShieldCheck size={44} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-widest">Aucune cagnotte active</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {cagnottes.map((item) => {
              const progress = getProgress(item.montant_actuel, item.objectif_montant);
              return (
                <div key={item.id} className="group relative">
                  <div className="relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img src={item.image_url || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80'} alt={item.titre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-emerald-600" />
                        <span className="text-xs font-black text-slate-900">{progress}%</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-extrabold text-slate-900 mb-4 line-clamp-1">{item.titre}</h3>
                      <div className="flex justify-between items-end mb-3">
                        <p className="text-2xl font-black">{(item.montant_actuel || 0).toLocaleString()} <span className="text-sm text-slate-500">FCFA</span></p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cible: {(item.objectif_montant || 0).toLocaleString()} FCFA</p>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-5">
                        <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <Clock size={14} className="text-sky-500"/>
                          Fin : {item.date_fin ? new Date(item.date_fin).toLocaleDateString('fr-FR') : 'N/A'}
                        </span>
                        {/* Bouton qui déclenche la nouvelle Modal */}
                        <button onClick={() => openPaymentModal(item)} className="text-[13px] font-bold text-white bg-gradient-to-r from-sky-600 to-emerald-500 px-5 py-2.5 rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-1">
                          Contribuer <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POP-UP PREMIUM DE CONTRIBUTION */}
      {paymentModal.isOpen && paymentModal.cagnotte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Overlay avec effet Blur */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closePaymentModal}
          />
          
          {/* Contenu de la Pop-up */}
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Pop-up */}
            <div className="bg-gradient-to-br from-sky-500 to-emerald-500 p-6 sm:p-8 text-center relative">
              <button 
                onClick={closePaymentModal}
                disabled={isProcessing}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <X size={16} />
              </button>
              <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-inner mb-4">
                <Heart size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white mb-1 leading-tight">Faire un don</h2>
              <p className="text-white/80 text-sm font-medium line-clamp-1">Pour : {paymentModal.cagnotte.titre}</p>
            </div>

            {/* Corps Pop-up */}
            <form onSubmit={processPayment} className="p-6 sm:p-8">
              
              {/* Raccourcis de montants */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[1000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      amount === val.toString() 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-slate-50'
                    }`}
                  >
                    {val.toLocaleString()} F
                  </button>
                ))}
              </div>

              {/* Champ de saisie libre */}
              <div className="relative mb-8">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Montant libre (FCFA)
                </label>
                <div className="relative flex items-center">
                  <Wallet size={20} className="absolute left-4 text-slate-400" />
                  <input 
                    type="number"
                    min="500"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 2500"
                    disabled={isProcessing}
                    className="w-full pl-12 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all disabled:opacity-50"
                  />
                  <span className="absolute right-4 text-sm font-bold text-slate-400">FCFA</span>
                </div>
              </div>

              {/* Bouton de soumission */}
              <button 
                type="submit" 
                disabled={isProcessing || !amount || parseInt(amount) < 500}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-wider text-sm hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all flex items-center justify-center gap-2 group"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connexion sécurisée...
                  </>
                ) : (
                  <>
                    Valider mon don 
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-widest flex items-center justify-center gap-1">
                <ShieldCheck size={12} /> Paiement 100% sécurisé
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}