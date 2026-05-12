import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { 
  QrCode, Camera, CheckCircle2, XCircle, 
  Search, Ticket, Clock, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRScanner() {
  const { dark } = useSelector((s) => s.theme);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  // Simulation d'historique de scan
  const [recentScans] = useState([
    { id: 'T-8943', event: 'Concert Abidjan By Night', status: 'valid', time: 'À l\'instant' },
    { id: 'T-1022', event: 'Concert Abidjan By Night', status: 'invalid', time: 'Il y a 2 min' },
    { id: 'T-5541', event: 'Concert Abidjan By Night', status: 'valid', time: 'Il y a 5 min' },
  ]);

  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-2xl' : 'bg-white border-indigo-50 shadow-2xl',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-[#00d4aa]' : 'bg-slate-50 border-gray-200 text-slate-900 focus:border-[#00d4aa]',
  };

  const handleManualVerification = (e) => {
    e.preventDefault();
    if (!manualCode) return;
    const loader = toast.loading('Vérification du billet...');
    setTimeout(() => {
      toast.error('Billet non reconnu dans la base', { id: loader });
      setManualCode('');
    }, 800);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
        
        {/* HEADER SCANNER */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00d4aa]/10 via-transparent to-indigo-500/10" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00d4aa]/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 backdrop-blur-md">
                <QrCode size={14} className="text-[#00d4aa]" />
                <span className="text-[#00d4aa] text-[10px] font-black uppercase tracking-[0.2em]">Pôle Contrôle</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md">
                <Activity size={10} className="text-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-400">Scanner Prêt</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Contrôle <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4aa] to-emerald-400">d'Accès</span>
            </h1>
            <p className="text-white/50 text-sm font-medium tracking-wide">Validation des billets TickoFiesta en temps réel.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CAMERA SECTION */}
          <div className={`lg:col-span-2 p-8 rounded-[2rem] border flex flex-col items-center justify-center ${theme.card}`}>
            <div className="w-full max-w-md relative aspect-square bg-black rounded-3xl overflow-hidden border-4 border-[#0A0A12] shadow-2xl flex items-center justify-center group">
              {/* Lignes de ciblage (Corners) */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-[#00d4aa] rounded-tl-xl z-10" />
              <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-[#00d4aa] rounded-tr-xl z-10" />
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-[#00d4aa] rounded-bl-xl z-10" />
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-[#00d4aa] rounded-br-xl z-10" />
              
              {/* Radar d'animation */}
              {isScanning && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00d4aa]/40 to-transparent h-1/2 animate-scan z-10" />}

              {/* Placeholder Camera */}
              <div className="text-center space-y-4 relative z-20">
                <Camera size={48} className="mx-auto text-white/20" />
                <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">Flux vidéo actif</p>
                <p className="text-white/20 text-[10px]">Placez le QR Code dans le cadre</p>
              </div>
            </div>

            <div className="mt-8 flex gap-4 w-full max-w-md">
              <button onClick={() => setIsScanning(!isScanning)} className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${isScanning ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-black'}`}>
                {isScanning ? 'Pause' : 'Reprendre'}
              </button>
            </div>
          </div>

          {/* MANUEL & HISTORIQUE */}
          <div className="space-y-6">
            
            <div className={`p-8 rounded-[2rem] border ${theme.card}`}>
              <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-4 ${theme.text}`}>Saisie Manuelle</h3>
              <form onSubmit={handleManualVerification} className="space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="Entrez le code billet (ex: T-1234)" value={manualCode} onChange={(e) => setManualCode(e.target.value)} className={`w-full pl-11 pr-4 py-4 rounded-xl text-sm font-bold focus:outline-none transition-all shadow-inner border ${theme.input}`} />
                </div>
                <button type="submit" className="w-full py-4 rounded-xl bg-[#00d4aa] text-[#0A0A12] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#00b38f] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,212,170,0.3)]">
                  Vérifier
                </button>
              </form>
            </div>

            <div className={`p-8 rounded-[2rem] border flex-1 ${theme.card}`}>
              <div className="flex items-center gap-2 mb-6">
                <Clock size={16} className={theme.sub} />
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${theme.text}`}>Derniers Scans</h3>
              </div>
              
              <div className="space-y-4">
                {recentScans.map((scan, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      {scan.status === 'valid' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={16} className="text-emerald-500" /></div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center"><XCircle size={16} className="text-rose-500" /></div>
                      )}
                      <div>
                        <p className={`text-sm font-black ${theme.text}`}>{scan.id}</p>
                        <p className={`text-[10px] font-bold ${theme.sub}`}>{scan.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}