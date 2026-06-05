import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import toast from 'react-hot-toast';
import { 
  Trash2, CreditCard, Loader2, ShoppingCart, 
  ArrowLeft, Ticket, CheckSquare, Store, ShieldCheck, Lock, Award, Sparkles 
} from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { dark } = useSelector((s) => s.theme);
  
  const authUser = useSelector((s) => s.auth?.user);
  const cartItems = useSelector((s) => s.cart?.items || []); 
  
  // --- NOUVEAU : Logique TickoPoints ---
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  
  // Valeur de conversion : 1 point = 5 FCFA (Ajustable selon votre stratégie)
  const POINT_VALUE = 5; 

  useEffect(() => {
    if (authUser?.id) {
      supabase.from('profiles').select('points').eq('id', authUser.id).single()
        .then(({ data, error }) => {
          if (!error && data) setUserPoints(data.points || 0);
        });
    }
  }, [authUser]);

  // Calculs financiers
  const subTotal = cartItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const maxDiscount = userPoints * POINT_VALUE;
  
  // La réduction ne peut pas dépasser le montant total du panier
  const discountApplied = usePoints ? Math.min(maxDiscount, subTotal) : 0;
  const finalTotal = subTotal - discountApplied;
  // ------------------------------------

  const handleCheckout = async () => {
    setLoading(true);
    const referenceId = crypto.randomUUID(); 

    try {
      if (!authUser) throw new Error("Vous devez être connecté pour payer.");

      // 1. Préparation des transactions standards
      const transactions = cartItems.map(item => ({
        user_id: authUser.id,
        reference_id: referenceId,
        type: item.type, 
        product_id: item.product_id,
        quantity: item.quantity || 1,
        amount: item.amount,
        status: 'pending'
      }));

      // 2. Ajout d'une ligne de transaction négative pour la réduction TickoPoints
      if (usePoints && discountApplied > 0) {
        const pointsUsed = Math.ceil(discountApplied / POINT_VALUE);
        
        transactions.push({
          user_id: authUser.id,
          reference_id: referenceId,
          type: 'discount',
          product_id: 'tickopoints_redemption',
          quantity: pointsUsed,
          amount: -discountApplied,
          status: 'pending'
        });

        // Mise à jour de la cagnotte du profil
        const { error: pointsError } = await supabase
          .from('profiles')
          .update({ points: userPoints - pointsUsed })
          .eq('id', authUser.id);
          
        if (pointsError) throw pointsError;
      }

      // 3. Insertion dans la base de données
      const { error } = await supabase.from('transactions').insert(transactions);
      if (error) throw error;

      toast.success('Panier validé ! Redirection vers le paiement...');
      // navigate(`/payment/${referenceId}`); // À décommenter quand la page sera prête
      
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la validation du panier');
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: dark ? 'bg-[#000000]' : 'bg-[#f5f5f7]', 
    text: dark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]',
    card: dark ? 'bg-[#1c1c1e]/80 border-white/10 backdrop-blur-3xl' : 'bg-white/80 border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-3xl',
    sub: dark ? 'text-[#98989d]' : 'text-[#86868b]',
    divider: dark ? 'border-white/10' : 'border-slate-100'
  };

  const getItemBadge = (type) => {
    const types = {
      ticket: { icon: <Ticket size={14} />, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', label: 'Billet' },
      vote_credits: { icon: <CheckSquare size={14} />, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', label: 'Votes' },
      stand: { icon: <Store size={14} />, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', label: 'Stand' }
    };
    const t = types[type?.toLowerCase()] || { icon: <ShoppingCart size={14} />, color: 'bg-gray-500/10 text-gray-600', label: type };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${t.color} mt-1.5`}>
        {t.icon} {t.label}
      </span>
    );
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} pt-24 md:pt-32 pb-8 md:pb-20 px-4 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display',Inter,sans-serif] transition-colors duration-500`}>
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <Link to="/" className={`p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}>
            <ArrowLeft size={20} className="md:w-6 md:h-6" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Panier</h1>
          <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${dark ? 'bg-white/10' : 'bg-black/5'}`}>
            {cartItems.length} {cartItems.length > 1 ? 'articles' : 'article'}
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div className={`${theme.card} rounded-[2rem] md:rounded-[2.5rem] p-10 md:p-20 border text-center animate-in zoom-in-95 duration-500`}>
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#6c47ff]/20 to-[#00d4aa]/20 text-[#6c47ff] rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
              <ShoppingCart size={48} className="md:w-16 md:h-16" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">Votre panier est vide</h2>
            <p className={`text-base md:text-lg font-medium ${theme.sub} mb-8 md:mb-10 max-w-md mx-auto`}>
              Il semble que vous n'ayez pas encore trouvé votre bonheur. Découvrez nos prochains événements !
            </p>
            <Link to="/" className="inline-flex items-center justify-center bg-gradient-to-r from-[#6c47ff] to-[#5a3ae0] text-white px-8 py-4 md:px-10 md:py-5 rounded-2xl text-base md:text-lg font-bold hover:shadow-[0_10px_40px_-10px_rgba(108,71,255,0.6)] hover:-translate-y-1 transition-all duration-300">
              Explorer les événements
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* COLONNE GAUCHE : Liste des articles */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4 animate-in fade-in slide-in-from-left-8 duration-700">
              {cartItems.map((item, idx) => (
                <div key={idx} className={`${theme.card} p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border flex items-center gap-4 group transition-all hover:shadow-lg`}>
                  <div className={`hidden sm:flex w-16 h-16 rounded-2xl items-center justify-center shrink-0 ${dark ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <Ticket size={24} className={theme.sub} />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-lg md:text-xl truncate">{item.name}</p>
                    {getItemBadge(item.type)}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="font-black text-xl md:text-2xl whitespace-nowrap">{item.amount.toLocaleString()} <span className="text-sm font-bold text-[#6c47ff]">FCFA</span></p>
                    <button className={`text-red-500/70 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100`}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* COLONNE DROITE : Résumé Fixe (Sticky) */}
            <div className="lg:col-span-5 xl:col-span-4 relative">
              <div className={`sticky top-32 ${theme.card} p-6 md:p-8 rounded-[2rem] border animate-in fade-in slide-in-from-right-8 duration-700`}>
                <h3 className="text-xl font-bold mb-6">Résumé de la commande</h3>
                
                {/* BLOC GAMIFICATION - TICKOPOINTS */}
                {userPoints > 0 && (
                  <div className={`mb-6 p-4 rounded-[1.25rem] border-2 transition-all duration-300 ${usePoints ? 'border-[#6c47ff] bg-[#6c47ff]/5' : theme.divider}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-colors ${usePoints ? 'bg-[#6c47ff] text-white' : 'bg-black/5 dark:bg-white/10 text-gray-500'}`}>
                          {usePoints ? <Sparkles size={20} /> : <Award size={20} />}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${usePoints ? 'text-[#6c47ff]' : ''}`}>TickoPoints</p>
                          <p className={`text-[11px] font-medium mt-0.5 ${theme.sub}`}>
                            Solde: {userPoints} pts (<span className="font-bold">{maxDiscount} FCFA</span>)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUsePoints(!usePoints)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          usePoints 
                            ? 'bg-[#6c47ff] text-white shadow-lg shadow-[#6c47ff]/30' 
                            : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
                        }`}
                      >
                        {usePoints ? 'Retirer' : 'Appliquer'}
                      </button>
                    </div>
                  </div>
                )}

                <div className={`space-y-4 mb-6 pb-6 border-b ${theme.divider}`}>
                  <div className="flex justify-between font-medium">
                    <span className={theme.sub}>Sous-total</span>
                    <span>{subTotal.toLocaleString()} FCFA</span>
                  </div>
                  
                  {/* AFFICHAGE DE LA RÉDUCTION SI APPLIQUÉE */}
                  {usePoints && discountApplied > 0 && (
                    <div className="flex justify-between font-medium text-[#6c47ff] animate-in fade-in slide-in-from-top-2">
                      <span className="flex items-center gap-1.5"><Award size={16} /> Réduction Points</span>
                      <span>- {discountApplied.toLocaleString()} FCFA</span>
                    </div>
                  )}

                  <div className="flex justify-between font-medium">
                    <span className={theme.sub}>Frais de service</span>
                    <span className="text-green-500 font-bold">Inclus</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="text-lg font-bold">Total</span>
                  <div className="text-right">
                    {usePoints && discountApplied > 0 && (
                      <div className={`text-sm line-through mb-1 ${theme.sub}`}>{subTotal.toLocaleString()} FCFA</div>
                    )}
                    <span className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">
                      {finalTotal.toLocaleString()} <span className="text-xl">FCFA</span>
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full h-16 rounded-[1.25rem] bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-[17px] font-bold flex items-center justify-center gap-3 hover:opacity-80 active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-black/20 dark:shadow-white/10"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <><CreditCard size={24} /> Confirmer & Payer</>}
                </button>

                <div className="mt-6 flex flex-col gap-3">
                  <div className={`flex items-center gap-2 justify-center text-xs font-semibold ${theme.sub}`}>
                    <ShieldCheck size={16} className="text-green-500" />
                    Paiement 100% sécurisé
                  </div>
                  <div className={`flex items-center gap-2 justify-center text-xs font-semibold ${theme.sub}`}>
                    <Lock size={16} />
                    Vos données sont chiffrées de bout en bout
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}