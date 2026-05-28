import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { 
  Users, Search, Shield, UserCheck, Trash2, Mail, 
  Calendar, Filter, Activity, RefreshCw, ShieldAlert, BadgeCheck, Eye, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function UsersPage() {
  const { dark } = useSelector((s) => s.theme);
  const [users, setUsers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  // ETATS POUR LE TEMPS REEL (VISITEURS)
  const [onlineUsers, setOnlineUsers] = useState({});
  const [ticker, setTicker] = useState(Date.now());

  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-indigo-50 shadow-2xl shadow-indigo-100/50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-slate-50 border-gray-200 text-slate-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20',
  };

  // Chargement initial des utilisateurs
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      toast.error('Erreur de chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. ÉCOUTE DE LA BASE DE DONNÉES EN TEMPS RÉEL
  useEffect(() => {
    loadUsers();

    const channel = supabase.channel('profiles-db-live')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        (payload) => {
          setIsUpdating(true);
          
          if (payload.eventType === 'INSERT') {
            setUsers((prev) => [payload.new, ...prev]);
          } 
          else if (payload.eventType === 'UPDATE') {
            setUsers((prev) => prev.map(u => u.id === payload.new.id ? payload.new : u));
          } 
          else if (payload.eventType === 'DELETE') {
            setUsers((prev) => prev.filter(u => u.id !== payload.old.id));
          }
          
          setTimeout(() => setIsUpdating(false), 300);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [loadUsers]);

  // 2. ÉCOUTE DE L'ACTIVITÉ DES VISITEURS EN DIRECT
  useEffect(() => {
    const presenceChannel = supabase.channel('online-visitors');

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        setOnlineUsers(newState);
      })
      .subscribe();

    const interval = setInterval(() => {
      setTicker(Date.now());
    }, 1000);

    return () => {
      supabase.removeChannel(presenceChannel);
      clearInterval(interval);
    };
  }, []);

  const formatTimeSpent = (joinedAt) => {
    const diffMs = Date.now() - new Date(joinedAt).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}m ${secs}s`;
  };

  const activeVisitorsArray = Object.keys(onlineUsers).map((key) => ({
    presenceId: key,
    ...onlineUsers[key][0]
  }));

  // ACTIONS
  const handleToggleVerify = async (userId, currentStatus) => {
    setProcessingId(userId);
    const newStatus = !currentStatus;
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: newStatus } : u));
    
    try {
      const { error } = await supabase.from('profiles').update({ is_verified: newStatus }).eq('id', userId);
      if (error) throw error;
      toast.success(newStatus ? 'Compte officiellement certifié !' : 'Badge révoqué.');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: currentStatus } : u));
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    const previousUsers = [...users];
    setProcessingId(userId);
    
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      toast.success(`Nouveau rôle assigné : ${newRole.toUpperCase()}`);
    } catch (err) {
      toast.error('Erreur lors du changement de rôle');
      setUsers(previousUsers);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`⚠️ ATTENTION ⚠️\n\nVoulez-vous vraiment supprimer le compte de ${userEmail} ?`)) return;
    
    const previousUsers = [...users];
    setProcessingId(userId);
    
    setUsers(prev => prev.filter(u => u.id !== userId));

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      toast.success('Dossier utilisateur supprimé');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      setUsers(previousUsers);
    } finally {
      setProcessingId(null);
    }
  };

  const RoleBadge = ({ role }) => {
    const config = {
      admin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]',
      organisateur: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      client: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    const activeRole = role || 'client';
    return (
      <span className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border ${config[activeRole]}`}>
        {activeRole === 'admin' && <Shield size={10} className="inline mr-1.5 -mt-0.5" />}
        {activeRole === 'organisateur' && <UserCheck size={10} className="inline mr-1.5 -mt-0.5" />}
        {activeRole}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(search.toLowerCase()) || user.raw_user_meta_data?.nom?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || (user.role || 'client') === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    organisateurs: users.filter(u => u.role === 'organisateur').length,
    clients: users.filter(u => u.role === 'client' || !u.role).length,
    onlineTotal: activeVisitorsArray.length,
    onlineAnon: activeVisitorsArray.filter(v => v.isAnonymous).length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
      
      {/* HEADER */}
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-transparent to-emerald-500/10" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
              <Users size={14} className="text-indigo-400" />
              <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Annuaire Global</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${isLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
              {isUpdating ? <RefreshCw size={10} className="text-emerald-400 animate-spin" /> : <Activity size={10} className={`${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />}
              <span className={`text-[9px] font-bold tracking-widest uppercase ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>{isUpdating ? "Sync..." : isLive ? "Live DB" : "Hors ligne"}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-amber-500/10 border-amber-500/20 backdrop-blur-md">
              <Eye size={10} className="text-amber-400 animate-pulse" />
              <span className="text-[9px] font-bold tracking-widest text-amber-400 uppercase">{stats.onlineTotal} Sur le site</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">Gestion des <br className="md:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Utilisateurs</span></h1>
          <p className="text-white/50 text-sm font-medium tracking-wide">{stats.total} compte(s) enregistré(s) sur la plateforme.</p>
        </div>
      </div>

      {/* BLOC TEMPS RÉEL VISITEURS ACTIFS */}
      <div className={`p-6 rounded-[2rem] border ${theme.card}`}>
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <h2 className={`text-lg font-black uppercase tracking-wider ${theme.text}`}>Visites en direct ({stats.onlineTotal})</h2>
          <span className={`text-xs ${theme.sub}`}> — {stats.onlineAnon} visiteurs anonymes et {stats.onlineTotal - stats.onlineAnon} connectés</span>
        </div>

        {activeVisitorsArray.length === 0 ? (
          <p className={`text-sm italic ${theme.sub} py-2`}>Aucune activité détectée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeVisitorsArray.map((visitor) => (
              <div key={visitor.presenceId} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${dark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold truncate ${theme.text}`}>{visitor.nom || 'Visiteur Anonyme'}</p>
                  <p className={`text-xs truncate ${theme.sub}`}>{visitor.email || 'Pas de session d\'auth'}</p>
                  <span className="inline-block mt-1 text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md font-mono">
                    Page: {visitor.currentPath || '/'}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-4">
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-black font-mono">
                    <Clock size={12} />
                    {formatTimeSpent(visitor.joinedAt)}
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider mt-1 ${visitor.isAnonymous ? 'text-amber-500/70' : 'text-emerald-500'}`}>
                    {visitor.isAnonymous ? 'Anonyme' : 'Inscrit'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI DES INSCRITS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Inscrits', value: stats.total, color: '#6366f1', icon: Users },
          { label: 'Administrateurs', value: stats.admins, color: '#f43f5e', icon: ShieldAlert },
          { label: 'Organisateurs', value: stats.organisateurs, color: '#10b981', icon: UserCheck },
          { label: 'Clients Standards', value: stats.clients, color: '#f5a623', icon: Users },
        ].map((stat, idx) => (
          <div key={idx} className={`group relative p-6 rounded-[2rem] border transition-all duration-500 hover:-translate-y-1 hover:border-white/10 ${theme.card}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}><stat.icon size={20} strokeWidth={2} /></div>
            <p className={`text-3xl font-black tracking-tighter ${theme.text}`}>{stat.value}</p>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 ${theme.sub}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div className="flex flex-col md:flex-row gap-4 relative z-20">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input type="text" placeholder="Rechercher par email ou nom..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pl-12 pr-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all shadow-inner ${theme.input}`} />
        </div>
        <div className="relative w-full md:w-64 group">
          <Filter size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`w-full pl-12 pr-10 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer shadow-inner ${theme.input}`}>
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="organisateur">Organisateurs</option>
            <option value="client">Clients</option>
          </select>
        </div>
      </div>

      {/* LISTE DES INSCRITS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32"><Spinner size="xl" className="border-indigo-500 border-t-emerald-400" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-32 rounded-[2rem] border transition-colors ${dark ? 'border-white/5 bg-[#0A0A12]' : 'border-indigo-50 bg-white'}`}>
          <div className="w-24 h-24 bg-slate-500/5 text-slate-500 rounded-full flex items-center justify-center mb-6 border border-slate-500/10"><Users size={40} strokeWidth={1.5} /></div>
          <h4 className={`text-2xl font-black tracking-tighter mb-2 ${theme.text}`}>Aucun résultat</h4>
        </div>
      ) : (
        <div className="space-y-4 relative">
          {filteredUsers.map(user => (
            <div key={user.id} className={`group p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-xl hover:border-indigo-500/30 ${theme.card}`}>
              <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                
                {/* Avatar & Identité */}
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg shadow-indigo-500/30">
                    {user.raw_user_meta_data?.nom?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className={`text-xl font-black truncate flex items-center ${theme.text}`}>
                        {user.raw_user_meta_data?.nom || 'Utilisateur Anonyme'}
                        {user.is_verified && (
                          <BadgeCheck size={20} className="text-[#1d9bf0] ml-2 -mt-0.5 drop-shadow-[0_0_8px_rgba(29,155,240,0.5)]" fill="currentColor" stroke="white" strokeWidth={1.5} title="Compte Officiel Certifié" />
                        )}
                      </h3>
                      <RoleBadge role={user.role} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                      <div className={`flex items-center gap-2 ${theme.sub}`}><Mail size={14} className="text-indigo-400" /><span className="font-bold">{user.email}</span></div>
                      <div className={`flex items-center gap-2 ${theme.sub}`}><Calendar size={14} className="text-emerald-400" /><span className="font-bold">Rejoint le {new Date(user.created_at).toLocaleDateString('fr-FR')}</span></div>
                    </div>
                  </div>
                </div>

                {/* Actions Rapides */}
                <div className="flex flex-col sm:flex-row gap-3 xl:w-auto shrink-0 border-t xl:border-t-0 xl:border-l border-white/10 pt-4 xl:pt-0 xl:pl-6">
                  <button
                    onClick={() => handleToggleVerify(user.id, user.is_verified)}
                    disabled={processingId === user.id}
                    className={`flex-1 sm:flex-none px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      user.is_verified 
                        ? 'bg-[#1d9bf0]/10 text-[#1d9bf0] border-[#1d9bf0]/20 hover:bg-[#1d9bf0] hover:text-white' 
                        : dark ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-[#1d9bf0] hover:border-[#1d9bf0] hover:text-white' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-[#1d9bf0] hover:border-[#1d9bf0] hover:text-white'
                    }`}
                  >
                    {processingId === user.id ? <Spinner size="sm" /> : (
                      <><BadgeCheck size={16} className={user.is_verified ? "fill-[#1d9bf0] text-white" : ""} /> {user.is_verified ? 'Retirer' : 'Certifier'}</>
                    )}
                  </button>

                  <div className="relative flex-1 sm:w-40">
                    <select
                      value={user.role || 'client'}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      disabled={processingId === user.id}
                      className={`w-full px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border cursor-pointer focus:outline-none transition-all disabled:opacity-50 appearance-none text-center ${dark ? 'bg-[#0A0A12] border-white/10 text-white hover:border-indigo-505' : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-indigo-500'}`}
                    >
                      <option value="client">Client</option>
                      <option value="organisateur">Organisateur</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    disabled={processingId === user.id}
                    className="px-5 py-3.5 rounded-xl bg-rose-500/10 text-rose-500 text-[11px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500 hover:text-white active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    title="Supprimer l'utilisateur"
                  >
                    {processingId === user.id ? <Spinner size="sm" className="border-rose-500" /> : <Trash2 size={16} />}
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}