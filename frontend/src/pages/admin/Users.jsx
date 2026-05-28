import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { 
  Users, Search, Filter, Shield, UserX, 
  CheckCircle, XCircle, Activity, Mail, Ticket // <-- AJOUT DE TICKET ICI
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function UsersManagement() {
  const { dark } = useSelector((s) => s.theme);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Palette Premium / FinTech identique à Trésorerie
  const theme = {
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-indigo-50 shadow-2xl shadow-indigo-100/50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-amber-500 focus:ring-amber-500/20' : 'bg-slate-50 border-gray-200 text-slate-900 placeholder-gray-400 focus:border-amber-500 focus:ring-amber-500/20',
  };

  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsUpdating(true);

    try {
      // Récupération des profils utilisateurs depuis Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setIsUpdating(true);
      const nextStatus = currentStatus === 'active' ? 'banned' : 'active';
      
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(nextStatus === 'banned' ? 'Utilisateur suspendu' : 'Utilisateur réactivé');
      loadUsers(true);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la modification du statut");
      setIsUpdating(false);
    }
  };

  // Filtrage combiné (Recherche Nom/Email + Rôle)
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      u.nom?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // KPI Rapides
  const stats = {
    total: usersList.length,
    organisateurs: usersList.filter(u => u.role === 'organisateur').length,
    admins: usersList.filter(u => u.role === 'admin').length,
    banned: usersList.filter(u => u.status === 'banned').length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
      
      {/* HEADER DE LA PAGE */}
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
              <Shield size={14} className="text-violet-400" />
              <span className="text-violet-400 text-[10px] font-black uppercase tracking-[0.2em]">Contrôle d'Accès</span>
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${isUpdating ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
              <Activity size={10} className={isUpdating ? "text-emerald-400 animate-spin" : "text-slate-500"} />
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-400">
                {isUpdating ? "Mise à jour..." : "Système Synchronisé"}
              </span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            Registre des <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">Comptes</span>
          </h1>
        </div>
      </div>

      {/* COMPTEURS DE STATUT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Utilisateurs Totaux', value: stats.total, icon: Users, color: '#a855f7' },
          { label: 'Organisateurs', value: stats.organisateurs, icon: Ticket, color: '#06b6d4' },
          { label: 'Administrateurs', value: stats.admins, icon: Shield, color: '#f5a623' },
          { label: 'Comptes Suspendus', value: stats.banned, icon: UserX, color: '#ef4444' },
        ].map((stat, idx) => (
          <div key={idx} className={`group relative p-6 rounded-[2rem] border transition-all duration-500 hover:-translate-y-1 hover:border-white/10 ${theme.card}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={20} />
            </div>
            <p className={`text-3xl font-black tracking-tighter ${theme.text}`}>{stat.value}</p>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 ${theme.sub}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* FILTRES BAR */}
      <div className="flex flex-col md:flex-row gap-4 relative z-20">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
          <input type="text" placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pl-12 pr-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all shadow-inner ${theme.input}`} />
        </div>

        <div className="relative w-full md:w-64 group">
          <Filter size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`w-full pl-12 pr-10 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer shadow-inner ${theme.input}`}>
            <option value="all">Tous les rôles</option>
            <option value="organisateur">Organisateurs uniquement</option>
            <option value="admin">Administrateurs uniquement</option>
          </select>
        </div>
      </div>

      {/* TABLEAU DES UTILISATEURS */}
      {loading ? (
        <div className="flex justify-center items-center py-32"><Spinner size="xl" className="border-violet-500 border-t-cyan-400" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className={`py-32 text-center rounded-[2rem] border ${dark ? 'border-white/5 bg-[#0A0A12]' : 'border-indigo-50 bg-white'}`}>
          <p className={`text-2xl font-black tracking-tighter ${theme.text}`}>Aucun utilisateur trouvé</p>
          <p className={`text-sm mt-2 font-medium ${theme.sub}`}>Modifiez vos critères de recherche ou filtres.</p>
        </div>
      ) : (
        <div className={`rounded-[2rem] border overflow-hidden ${theme.card} relative`}>
          {isUpdating && <div className="absolute inset-0 z-50 bg-black/5 dark:bg-white/5 backdrop-blur-[1px]" />}
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead className={`border-b ${dark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                <tr>
                  <th className={`text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>Profil</th>
                  <th className={`text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>Privilèges</th>
                  <th className={`text-center p-6 text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>Statut</th>
                  <th className={`text-right p-6 text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 dark:divide-white/5 divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`transition-colors duration-300 ${dark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg border border-white/10">
                          {u.nom?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-black truncate ${theme.text}`}>{u.nom || 'Sans Nom'}</p>
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${theme.sub}`}><Mail size={12}/>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${
                        u.role === 'admin' 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {u.role || 'Utilisateur'}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        u.status === 'banned'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {u.status === 'banned' ? <XCircle size={12}/> : <CheckCircle size={12}/>}
                        {u.status === 'banned' ? 'Suspendu' : 'Actif'}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => toggleUserStatus(u.id, u.status)}
                        className={`text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl border transition-all active:scale-95 ${
                          u.status === 'banned'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-rose-500/5 border-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        {u.status === 'banned' ? 'Réactiver' : 'Suspendre'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}