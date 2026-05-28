import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import toast from 'react-hot-toast';
import { 
  Trash2, CreditCard, Loader2, ShoppingCart, 
  ArrowLeft, Ticket, CheckSquare, Store, ShieldCheck, Lock 
} from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { dark } = useSelector((s) => s.theme);
  
  const cartItems = useSelector((s) => s.cart?.items || []); 
  const total = cartItems.reduce((acc, item) => acc + (item.amount || 0), 0);

  const handleCheckout = async () => {
    setLoading(true);
    const referenceId = crypto.randomUUID(); 

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté pour payer.");

      const transactions = cartItems.map(item => ({
        user_id: user.id,
        reference_id: referenceId,
        type: item.type, 
        product_id: item.product_id,
        quantity: item.quantity || 1,
        amount: item.amount,
        status: 'pending'
      }));

      const { error } = await supabase.from('transactions').insert(transactions);
      if (error) throw error;

      toast.success('Panier validé ! Redirection vers le paiement...');
      // navigate(`/payment/${referenceId}`);
      
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la validation du panier');
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: dark ? 'bg-[#000000]' : 'bg-[#f5f5f7]', // Apple-like backgrounds
    text: dark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]',
    card: dark ? 'bg-[#1c1c1e]/80 border-white/10 backdrop-blur-3xl' : 'bg-white/80 border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] backdrop-blur-3xl',
    sub: dark ? 'text-[#98989d]' : 'text-[#86868b]',
    divider: dark ? 'border-white/10' : 'border-slate-100'
  };

  // Helper intelligent pour formater le type d'article visuellement
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
        
        {/* En-tête de page */}
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
          /* ÉTAT PANIER VIDE - Design "Flottant" et attractif */
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
          /* GRILLE INTELLIGENTE : 2 colonnes sur Desktop, 1 sur Mobile */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* COLONNE GAUCHE : Liste des articles */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4 animate-in fade-in slide-in-from-left-8 duration-700">
              {cartItems.map((item, idx) => (
                <div key={idx} className={`${theme.card} p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border flex items-center gap-4 group transition-all hover:shadow-lg`}>
                  
                  {/* Image/Avatar de l'article (Optionnel, ajoute de la richesse visuelle) */}
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
                
                <div className={`space-y-4 mb-6 pb-6 border-b ${theme.divider}`}>
                  <div className="flex justify-between font-medium">
                    <span className={theme.sub}>Sous-total</span>
                    <span>{total.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className={theme.sub}>Frais de service</span>
                    <span className="text-green-500 font-bold">Inclus</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">
                    {total.toLocaleString()} <span className="text-xl">FCFA</span>
                  </span>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full h-16 rounded-[1.25rem] bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-[17px] font-bold flex items-center justify-center gap-3 hover:opacity-80 active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl shadow-black/20 dark:shadow-white/10"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <><CreditCard size={24} /> Confirmer & Payer</>}
                </button>

                {/* UX Réassurance - Signaux de confiance */}
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