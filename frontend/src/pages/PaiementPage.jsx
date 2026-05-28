import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Loader2, ExternalLink, ShieldCheck, Lock, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseClient';

export default function PaiementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  
  const state = location.state || {};
  const [reservation, setReservation] = useState({
    reservationId: state.reservationId,
    montant: state.montant,
    standNom: state.standNom,
    telephone: state.telephone,
    email: state.email,
    nom: state.nom
  });

  // ... (votre logique useEffect reste identique pour charger les données)
  useEffect(() => {
    const loadResa = async () => {
      if (reservation.reservationId && !reservation.montant) {
        const { data } = await supabase.from('reservations_stands').select('prix, stand_nom, telephone, email, nom').eq('id', reservation.reservationId).single();
        if (data) setReservation(r => ({ ...r, montant: data.prix, standNom: data.stand_nom, telephone: data.telephone, email: data.email, nom: data.nom }));
      }
    };
    loadResa();
  }, [reservation.reservationId, reservation.montant]);

  const { reservationId, montant, standNom } = reservation;
  const cleanAmount = Math.floor(Number(String(montant ?? 0).replace(/[^\d]/g, '')));

  const handlePaiement = async () => {
    setIsProcessing(true);
    const toastId = toast.loading("Connexion au terminal sécurisé...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: result, error } = await supabase.functions.invoke('init-geniuspay', {
        body: { amount: cleanAmount, reference: String(reservationId), stand_nom: standNom, user_id: user?.id || null }
      });

      if (error || result?.error) throw new Error(result?.error || error?.message);

      const url = result?.payment_url || result?.url || result?.checkout_url;
      setPaymentUrl(url);
      toast.success("Transaction initialisée !", { id: toastId });
    } catch (err) {
      toast.error(err.message || "Erreur serveur.", { id: toastId });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] transition-colors duration-500 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {/* En-tête avec bouton retour élégant */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-black dark:hover:text-white mb-8 transition font-bold text-sm uppercase tracking-widest">
          <ArrowLeft size={18} /> Retour
        </button>

        <div className="bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2 dark:text-white">Récapitulatif</h1>
            <p className="text-slate-500 font-medium">Validation de votre réservation</p>
          </div>

          {/* Carte de commande */}
          <div className="bg-slate-50 dark:bg-[#2c2c2e] rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-sm font-bold uppercase">Stand</span>
              <span className="font-bold dark:text-white">{standNom}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-4">
              <span className="text-slate-400 text-sm font-bold uppercase">Total</span>
              <span className="font-black text-2xl text-[#6c47ff]">{cleanAmount.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>

          {/* Zone d'action */}
          {!paymentUrl ? (
            <button 
              onClick={handlePaiement}
              disabled={isProcessing}
              className="w-full h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <><CreditCard size={20} /> Procéder au paiement</>}
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <a 
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-16 bg-[#00d4aa] text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-[#00bfa0] transition-all"
              >
                <ExternalLink size={20} /> Ouvrir le paiement
              </a>
              <p className="text-center text-xs text-slate-400">Une fenêtre sécurisée s'ouvrira.</p>
            </div>
          )}

          {/* Réassurance */}
          <div className="mt-8 flex justify-center items-center gap-6 text-[10px] uppercase font-bold text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Sécurisé</span>
            <span className="flex items-center gap-1.5"><Lock size={14} /> Chiffré</span>
            <span className="flex items-center gap-1.5"><Smartphone size={14} /> Mobile Money</span>
          </div>
        </div>
      </div>
    </div>
  );
}