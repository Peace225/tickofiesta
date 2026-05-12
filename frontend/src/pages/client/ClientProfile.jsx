import { useSelector } from 'react-redux';
import { User, Shield, Smartphone } from 'lucide-react';

export default function ClientProfile() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  
  const theme = {
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0A0A12] border-white/10' : 'bg-white border-slate-200',
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-lg mx-auto lg:max-w-4xl">
      <div className="mb-8">
        <h1 className={`text-3xl font-black tracking-tighter ${theme.text}`}>Mon Profil</h1>
        <p className={`text-xs uppercase font-bold tracking-widest mt-1 ${theme.sub}`}>Paramètres du compte</p>
      </div>

      <div className={`p-6 rounded-[2rem] border mb-6 ${theme.card}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center text-white text-2xl font-black">
            {user?.nom ? user.nom.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className={`text-xl font-black ${theme.text}`}>{user?.nom || 'Utilisateur'}</h2>
            <div className="flex items-center gap-1 mt-1 text-[#00d4aa]">
              <Shield size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">Compte Vérifié</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-inherit border-opacity-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 ${theme.text}`}>
              <Smartphone size={18} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Téléphone</p>
              <p className={`text-sm font-bold ${theme.text}`}>{user?.telephone || 'Non renseigné'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}