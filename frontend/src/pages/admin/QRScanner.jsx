import { useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
// CORRECTION : Utilisation du bon export nommé "Scanner" conforme aux versions modernes du package
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { QrCode, Camera, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRScanner() {
  const { dark } = useSelector((s) => s.theme);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [recentScans, setRecentScans] = useState([]);
  // Anti-bounce : évite les scans multiples du même ticket en simultané
  const [isProcessing, setIsProcessing] = useState(false);

  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-2xl' : 'bg-white border-indigo-50 shadow-2xl',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-[#00d4aa]' : 'bg-slate-50 border-gray-200 text-slate-900 focus:border-[#00d4aa]',
  };

  // LOGIQUE DE VÉRIFICATION ANTI-FRAUDE
  const verifyTicket = async (ticketId) => {
    if (!ticketId || isProcessing) return;

    // Validation du format UUID pour éviter les requêtes inutiles vers Supabase
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ticketId.trim())) {
      toast.error('QR Code invalide (Ce n\'est pas un billet Tickofiesta)');
      return;
    }

    setIsProcessing(true);
    const loader = toast.loading('Vérification du billet...');

    try {
      // Appel RPC Supabase de la fonction stockée
      const { data, error } = await supabase.rpc('validate_ticket', { target_ticket_id: ticketId.trim() });

      if (error) throw error;

      const heureActuelle = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      if (data.valid) {
        toast.success(`${data.message} : L'accès est autorisé (${data.type})`, { id: loader });
        
        setRecentScans((prev) => [
          { id: ticketId.substring(0, 8) + '...', event: `${data.event} (${data.type})`, status: 'valid', time: heureActuelle },
          ...prev
        ]);
      } else {
        toast.error(data.message, { id: loader, duration: 5000 });
        
        setRecentScans((prev) => [
          { id: ticketId.substring(0, 8) + '...', event: data.message, status: 'invalid', time: heureActuelle },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur réseau ou droits de contrôle insuffisants', { id: loader });
    } finally {
      // Libère le verrou après 2 secondes pour laisser le temps de retirer le téléphone de la caméra
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }
  };

  const handleManualVerification = (e) => {
    e.preventDefault();
    if (!manualCode) return;
    verifyTicket(manualCode);
    setManualCode('');
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-8 p-4 md:p-8 pb-32 ${theme.bg}`}>
      {/* HEADER */}
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00d4aa]/10 via-transparent to-indigo-500/10" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 backdrop-blur-md">
              <QrCode size={14} className="text-[#00d4aa]" />
              <span className="text-[#00d4aa] text-[10px] font-black uppercase tracking-[0.2em]">Pôle Contrôle Entrée</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            Scanner de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4aa] to-emerald-400">Validation</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION CAMERA EN DIRECT */}
        <div className={`lg:col-span-2 p-8 rounded-[2rem] border flex flex-col items-center justify-center ${theme.card}`}>
          <div className="w-full max-w-md relative aspect-square bg-black rounded-3xl overflow-hidden border-4 border-[#0A0A12] shadow-2xl flex items-center justify-center">
            
            {isScanning ? (
              <>
                {/* Ligne d'animation laser verte du scan */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00d4aa]/30 to-transparent h-1/2 animate-scan z-10 pointer-events-none" />
                
                {/* CORRECTION : Remplacement de <QrScanner> par <Scanner> avec les propriétés requises */}
                <Scanner
                  onScan={(detectedCodes) => {
                    if (detectedCodes && detectedCodes.length > 0) {
                      verifyTicket(detectedCodes[0].rawValue);
                    }
                  }}
                  onError={(error) => console.log("Attente flux caméra...", error?.message)}
                  styles={{ container: { width: '100%', height: '100%' } }}
                />
              </>
            ) : (
              <div className="text-center space-y-4 relative z-20">
                <Camera size={48} className="mx-auto text-white/20" />
                <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">Caméra désactivée</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsScanning(!isScanning)} 
            className={`mt-8 w-full max-w-md py-4 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${isScanning ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}
          >
            {isScanning ? 'Désactiver la Caméra' : 'Activer la Caméra'}
          </button>
        </div>

        {/* CONTROLE MANUEL ET FLUX EN DIRECT DES ENTRÉES */}
        <div className="space-y-6">
          <div className={`p-8 rounded-[2rem] border ${theme.card}`}>
            <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-4 ${theme.text}`}>Saisie Manuelle (Clavier)</h3>
            <form onSubmit={handleManualVerification} className="space-y-4">
              <input 
                type="text" 
                placeholder="Coller l'UUID complet du billet..." 
                value={manualCode} 
                onChange={(e) => setManualCode(e.target.value)} 
                className={`w-full p-4 rounded-xl text-xs font-mono border ${theme.input}`} 
              />
              <button type="submit" className="w-full py-4 rounded-xl bg-[#00d4aa] hover:bg-[#00b390] text-[#0A0A12] font-black uppercase tracking-[0.2em] transition-colors shadow-lg">
                Forcer la validation
              </button>
            </form>
          </div>

          {/* HISTORIQUE DES ENTRÉES DU CONCERT */}
          <div className={`p-8 rounded-[2rem] border ${theme.card}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock size={16} className={theme.sub} />
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${theme.text}`}>Derniers Flux</h3>
              </div>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-slate-400">{recentScans.length}</span>
            </div>
            
            <div className="space-y-4 max-h-[280px] overflow-y-auto custom-scrollbar">
              {recentScans.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Aucune personne scannée pour l'instant.</p>
              ) : (
                recentScans.map((scan, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} animate-in slide-in-from-top-2`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {scan.status === 'valid' ? (
                        <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle size={18} className="text-rose-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-xs font-black font-mono ${theme.text}`}>{scan.id}</p>
                        <p className="text-[10px] text-slate-500 truncate">{scan.event}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{scan.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}