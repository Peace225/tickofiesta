import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSidebar from '../../components/layout/AdminSidebar';
import {
  CheckCircle2, XCircle, Clock, Calendar, MapPin, User,
  Search, Trophy, Activity, RefreshCw, Check, X, History, Inbox
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function Validations() {
  const { dark } = useSelector((s) => s.theme);
  const [viewMode, setViewMode] = useState('pending'); // 'pending' = En attente | 'history' = Validés
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'votes'
  
  const [events, setEvents] = useState([]);
  const [votes, setVotes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-indigo-50 shadow-2xl shadow-indigo-100/50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-slate-50 border-gray-200 text-slate-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20',
    tabContainer: dark ? 'bg-[#0A0A12] border-white/5' : 'bg-slate-100 border-gray-200',
  };

  // ✅ CHARGEMENT DYNAMIQUE : S'adapte au mode (Attente ou Historique)
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsUpdating(true);

    try {
      // Définition des filtres selon la vue active
      const eventStatusFilter = viewMode === 'pending' ? 'en_attente' : 'validé';
      const voteStatusFilter = viewMode === 'pending' ? 'en_attente' : 'actif';

      const [eventsRes, votesRes] = await Promise.all([
        supabase.from('events').select(`*, organisateur:profiles(id, nom, avatar_url)`).eq('statut', eventStatusFilter).order('created_at', { ascending: false }),
        supabase.from('votes').select('*').eq('statut', voteStatusFilter).order('created_at', { ascending: false })
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (votesRes.error) throw votesRes.error;

      setEvents(eventsRes.data || []);

      // Résolution des profils pour les votes
      const votesDataRaw = votesRes.data || [];
      let finalVotes = votesDataRaw;
      const orgIds = [...new Set(votesDataRaw.map(v => v.organisateur_id).filter(Boolean))];

      if (orgIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, nom').in('id', orgIds);
        const profileMap = profiles?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) || {};
        finalVotes = votesDataRaw.map(v => ({
          ...v,
          organisateur: profileMap[v.organisateur_id] || { nom: 'Inconnu' }
        }));
      }
      
      setVotes(finalVotes);
    } catch (err) {
      console.error('Erreur data:', err);
      if (!silent) toast.error('Échec de la synchronisation');
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [viewMode]); // Se recharge automatiquement quand on change de vue (Attente <-> Historique)

  // WebSockets pour le temps réel
  useEffect(() => {
    loadData();
    const channel = supabase.channel('admin_validations_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => loadData(true))
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // Actions de validation
  const handleEventAction = async (id, status) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.from('events').update({ statut: status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast.success(status === 'validé' ? 'Événement publié !' : 'Événement rejeté.');
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) { toast.error('Erreur lors de la validation'); } 
    finally { setProcessingId(null); }
  };

  const handleVoteAction = async (id, action) => {
    setProcessingId(id);
    try {
      const finalStatus = action === 'approuver' ? 'actif' : 'rejeté';
      const { error } = await supabase.from('votes').update({ statut: finalStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast.success(action === 'approuver' ? 'Concours activé !' : 'Demande rejetée.');
      setVotes(prev => prev.filter(v => v.id !== id));
    } catch (err) { toast.error('Erreur lors de la validation'); } 
    finally { setProcessingId(null); }
  };

  const filteredData = (activeTab === 'events' ? events : votes).filter(item => 
    item.titre?.toLowerCase().includes(search.toLowerCase()) || 
    item.organisateur?.nom?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
        
        {/* --- HEADER --- */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-indigo-500/10" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
                <Clock size={14} className="text-amber-400" />
                <span className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">Pôle Approbation</span>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${isLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                {isUpdating ? <RefreshCw size={10} className="text-emerald-400 animate-spin" /> : <Activity size={10} className={`${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />}
                <span className={`text-[9px] font-bold tracking-widest uppercase ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>{isUpdating ? "Sync..." : isLive ? "Live" : "Hors ligne"}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Gestion des <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Dossiers</span>
            </h1>
          </div>
          
          <div className="relative z-10 w-full lg:w-96">
            <div className="relative group">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pl-12 pr-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all shadow-inner ${theme.input}`} />
            </div>
          </div>
        </div>

        {/* --- NAVIGATION : VUE & ONGLETS --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Sélecteur Vue : En Attente vs Historique */}
          <div className={`flex gap-1 p-1.5 rounded-2xl border shadow-sm ${theme.tabContainer}`}>
            <button onClick={() => setViewMode('pending')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'pending' ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>
              <Inbox size={14} /> À Traiter
            </button>
            <button onClick={() => setViewMode('history')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-emerald-500/20 text-emerald-400 shadow-md' : 'text-slate-500 hover:text-white'}`}>
              <History size={14} /> Historique (Validés)
            </button>
          </div>

          {/* Sélecteur Type : Events vs Votes */}
          <div className={`flex gap-2 p-1.5 rounded-2xl border w-full md:w-auto shadow-sm ${theme.tabContainer}`}>
            <button onClick={() => setActiveTab('events')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'events' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              Événements <span className="opacity-50">({events.length})</span>
            </button>
            <button onClick={() => setActiveTab('votes')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'votes' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              Votes <span className="opacity-50">({votes.length})</span>
            </button>
          </div>
        </div>

        {/* --- CONTENT --- */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <Spinner size="xl" className="border-indigo-500 border-t-amber-400" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-32 rounded-[2rem] border transition-colors ${dark ? 'border-white/5 bg-[#0A0A12]' : 'border-indigo-50 bg-white'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border ${viewMode === 'history' ? 'bg-indigo-500/5 text-indigo-500 border-indigo-500/10' : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10'}`}>
              {viewMode === 'history' ? <History size={40} /> : <CheckCircle2 size={40} />}
            </div>
            <h4 className={`text-2xl font-black tracking-tighter mb-2 ${theme.text}`}>
              {viewMode === 'history' ? "Aucun historique" : "Dossiers à jour"}
            </h4>
            <p className={theme.sub}>
              {viewMode === 'history' ? "Vous n'avez pas encore validé de dossiers." : "Aucune demande en attente de validation."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 relative">
            {isUpdating && <div className="absolute inset-0 z-50 bg-black/5 dark:bg-white/5 backdrop-blur-[1px] rounded-[2.5rem] transition-all" />}

            {/* BOUCLE ÉVÉNEMENTS */}
            {activeTab === 'events' && filteredData.map(event => (
              <div key={event.id} className={`group p-6 md:p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-500/30 ${theme.card}`}>
                <div className="flex flex-col xl:flex-row gap-8">
                  <div className="relative w-full xl:w-72 h-56 xl:h-auto rounded-[1.5rem] overflow-hidden shadow-2xl flex-shrink-0 border border-white/10">
                    <img src={event.image || '/placeholder.jpg'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest">{event.categorie || 'Événement'}</div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center space-y-5">
                    <div>
                      <h3 className={`text-3xl font-black tracking-tight truncate ${theme.text}`}>{event.titre}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center"><User size={12} className="text-indigo-500" /></div>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${theme.sub}`}>Par <span className="text-indigo-500">{event.organisateur?.nom}</span></span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                       <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${theme.tabContainer}`}><Calendar size={14} className="text-emerald-500" /><span className={`text-xs font-bold ${theme.text}`}>{new Date(event.date).toLocaleDateString('fr-FR')}</span></div>
                       <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${theme.tabContainer}`}><MapPin size={14} className="text-rose-500" /><span className={`text-xs font-bold ${theme.text}`}>{event.lieu}</span></div>
                    </div>
                    <p className={`text-sm leading-relaxed line-clamp-2 ${theme.sub}`}>{event.description}</p>
                  </div>

                  {/* Actions conditionnelles (Attente vs Historique) */}
                  <div className="flex flex-row xl:flex-col justify-center gap-3 xl:w-48 shrink-0">
                    {viewMode === 'pending' ? (
                      <>
                        <button onClick={() => handleEventAction(event.id, 'validé')} disabled={processingId === event.id} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-500 text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all">
                          {processingId === event.id ? <Spinner size="sm" className="border-black"/> : <><Check size={16} strokeWidth={3} /> Approuver</>}
                        </button>
                        <button onClick={() => handleEventAction(event.id, 'refusé')} disabled={processingId === event.id} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-rose-500/30 text-rose-500 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all">
                          <X size={16} strokeWidth={3} /> Rejeter
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl w-full h-full">
                        <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Publié</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* BOUCLE VOTES */}
            {activeTab === 'votes' && filteredData.map(vote => (
              <div key={vote.id} className={`group p-6 md:p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:border-amber-500/30 ${theme.card}`}>
                <div className="flex flex-col xl:flex-row gap-8">
                  <div className="relative w-full xl:w-64 h-48 rounded-[1.5rem] bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl flex-shrink-0">
                    <Trophy size={64} className="text-white drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center space-y-5">
                    <div>
                      <h3 className={`text-3xl font-black tracking-tight truncate ${theme.text}`}>{vote.titre}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center"><User size={12} className="text-amber-500" /></div>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${theme.sub}`}>Par <span className="text-amber-500">{vote.organisateur?.nom}</span></span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className={`p-4 rounded-xl border ${theme.tabContainer}`}><span className="block text-[9px] font-black uppercase opacity-50 mb-1">Prix du vote</span><span className="text-xl font-black text-amber-500">{vote.prix_vote} FCFA</span></div>
                      <div className={`p-4 rounded-xl border ${theme.tabContainer}`}><span className="block text-[9px] font-black uppercase opacity-50 mb-1">Catégorie</span><span className={`text-sm font-bold ${theme.text}`}>{vote.categorie || 'Générale'}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-row xl:flex-col justify-center gap-3 xl:w-48 shrink-0">
                    {viewMode === 'pending' ? (
                      <>
                        <button onClick={() => handleVoteAction(vote.id, 'approuver')} disabled={processingId === vote.id} className="flex-1 px-6 py-4 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2">
                          {processingId === vote.id ? <Spinner size="sm" className="border-white"/> : <><Check size={16} strokeWidth={3} /> Activer</>}
                        </button>
                        <button onClick={() => handleVoteAction(vote.id, 'rejeté')} disabled={processingId === vote.id} className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-rose-500/30 text-rose-500 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all`}>
                          <X size={16} strokeWidth={3} /> Rejeter
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl w-full h-full">
                        <Trophy size={32} className="text-indigo-400 mb-2" />
                        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Concours Actif</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}