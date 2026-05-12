import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient'; // 👈 Import Supabase
import toast from 'react-hot-toast';
import { 
  QrCode, CheckCircle2, XCircle, ArrowLeft, 
  ScanLine, User, Ticket, Hash, Zap
} from 'lucide-react';

export default function ScannerPage() {
  const navigate = useNavigate();
  const { dark } = useSelector((s) => s.theme);
  
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    const qrData = input.trim();
    if (!qrData) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      // 1. RECHERCHE DU BILLET DANS SUPABASE
      // Le QR Code contient généralement l'ID de la table 'purchases'
      const { data: ticket, error: fetchError } = await supabase
        .from('purchases')
        .select(`
          *,
          event_id:events(titre),
          user_id:profiles(nom),
          ticket_id:tickets(type)
        `)
        .eq('id', qrData) // On cherche par l'ID unique du billet
        .single();

      if (fetchError || !ticket) {
        throw new Error("Billet introuvable ou code invalide.");
      }

      // 2. VÉRIFICATION DU STATUT
      if (ticket.status === 'scanned') {
        throw new Error("ALERTE : Ce billet a déjà été utilisé !");
      }

      if (ticket.status !== 'completed') {
        throw new Error("Ce billet n'est pas encore validé (paiement en attente).");
      }

      // 3. MARQUER COMME SCANNÉ (Update Supabase)
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ status: 'scanned' })
        .eq('id', qrData);

      if (updateError) throw updateError;

      // 4. SUCCÈS
      setResult({ success: true, data: ticket });
      toast.success('Accès validé !', {
        icon: '✅',
        style: { borderRadius: '10px', background: dark ? '#0f0e1a' : '#fff', color: dark ? '#fff' : '#000' }
      });
      
      setInput(''); 

    } catch (err) {
      setResult({ success: false, message: err.message });
      toast.error('Scan refusé !', {
        icon: '❌',
        style: { borderRadius: '10px', background: '#ef4444', color: '#fff' }
      });
      setInput('');
    } finally { 
      setLoading(false); 
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl',
    input: dark ? 'bg-[#0f0e1a]/50 border-white/10 text-white placeholder-white/20' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500 relative overflow-hidden flex flex-col`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] bg-[#6c47ff]/20 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] bg-[#00d4aa]/10" />
      </div>

      <div className="relative z-10 w-full p-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')} 
          className={`group flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${dark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <div className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors group-hover:bg-[#6c47ff] group-hover:border-[#6c47ff] group-hover:text-white border-current">
            <ArrowLeft size={14} />
          </div>
          Dashboard
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
          <span className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Mode Scanner</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full px-6 relative z-10 -mt-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block mb-6 group">
            <div className="absolute inset-0 bg-[#6c47ff] rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
              <ScanLine size={36} className="text-white" />
            </div>
          </div>
          <h1 className={`text-3xl font-black tracking-tight mb-2 ${theme.text}`}>Contrôle d'accès</h1>
          <p className={`text-xs font-medium uppercase tracking-widest ${theme.sub}`}>Scannez le QR Code du participant</p>
        </div>

        <form onSubmit={handleScan} className="w-full space-y-4 mb-8">
          <div className="relative group">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scannez ou collez l'ID du billet..."
              rows={2}
              className={`w-full rounded-[1.5rem] px-6 py-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/50 transition-all shadow-inner resize-none ${theme.input}`}
            />
            <div className="absolute bottom-4 right-4 text-xs font-black opacity-30 pointer-events-none">
              <QrCode size={18} />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="w-full bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Zap size={16} className="animate-spin" /> : 'VALIDER LE BILLET'}
          </button>
        </form>

        {result && (
          <div className={`w-full rounded-[2rem] overflow-hidden border animate-slide-up shadow-2xl ${
            result.success 
              ? dark ? 'bg-[#00d4aa]/10 border-[#00d4aa]/30' : 'bg-emerald-50 border-emerald-200' 
              : dark ? 'bg-[#ef4444]/10 border-[#ef4444]/30' : 'bg-red-50 border-red-200'
          }`}>
            <div className={`p-5 flex items-center gap-4 border-b ${result.success ? (dark ? 'border-[#00d4aa]/20' : 'border-emerald-200/50') : (dark ? 'border-[#ef4444]/20' : 'border-red-200/50')}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${result.success ? 'bg-gradient-to-br from-[#00d4aa] to-emerald-400' : 'bg-gradient-to-br from-red-500 to-rose-400'}`}>
                {result.success ? <CheckCircle2 size={24} className="text-white" /> : <XCircle size={24} className="text-white" />}
              </div>
              <div>
                <p className={`font-black text-lg ${result.success ? (dark ? 'text-[#00d4aa]' : 'text-emerald-700') : (dark ? 'text-red-400' : 'text-red-700')}`}>
                  {result.success ? 'ACCÈS AUTORISÉ' : 'ACCÈS REFUSÉ'}
                </p>
                {!result.success && <p className={`text-xs font-bold ${dark ? 'text-red-400/70' : 'text-red-600/70'}`}>{result.message}</p>}
              </div>
            </div>

            {result.success && result.data && (
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Ticket size={16} className={dark ? 'text-[#00d4aa]' : 'text-emerald-600'} />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Événement</p>
                    <p className={`font-bold text-sm ${theme.text}`}>{result.data.event_id?.titre}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User size={16} className={dark ? 'text-[#6c47ff]' : 'text-violet-600'} />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Participant</p>
                    <p className={`font-bold text-sm ${theme.text}`}>{result.data.user_id?.nom}</p>
                    <p className={`text-xs font-medium ${theme.sub}`}>Type : {result.data.ticket_id?.type}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-dashed border-gray-500/20 flex items-center justify-between">
                  <Hash size={12} className="opacity-50" />
                  <span className={`text-[10px] font-mono opacity-50`}>{result.data.transaction_ref || result.data.id.substring(0,8)}</span>
                  <span className="text-[10px] font-black uppercase text-[#00d4aa]">Billet Validé à l'instant</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}