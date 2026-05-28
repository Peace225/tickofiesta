import React, { useState, useEffect, useMemo } from 'react';
import { Archive, Search, Filter, Calendar, ExternalLink, Download, Clock, Database } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

export default function ArchivesPage() {
  const [loading, setLoading] = useState(true);
  const [archives, setArchives] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Initial + Realtime Subscription
  useEffect(() => {
    fetchArchives();

    // Ecoute en temps réel des changements sur la table events
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          // Si un événement passe en "terminé" ou "annulé", on rafraîchit
          if (['termine', 'annule'].includes(payload.new?.statut) || 
              ['termine', 'annule'].includes(payload.old?.statut)) {
            fetchArchives();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('statut', ['termine', 'annule']) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArchives(data || []);
    } catch (error) {
      console.error('Erreur archives:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage côté client pour une réactivité instantanée
  const filteredArchives = useMemo(() => {
    return archives.filter(item => 
      item.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, archives]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Database size={20} />
            </div>
            <span className="text-[10px] font-black tracking-[0.3em] text-indigo-500 uppercase">Système de stockage</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-red-500">ARCHIVES <span className="text-indigo-500">GLOBALES</span></h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md leading-relaxed">
            Accès sécurisé à l'historique immuable des activités clôturées du système.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="group flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-2xl">
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> 
            EXPORTER LE REGISTRE
          </button>
        </div>
      </div>

      {/* --- STATS RAPIDES (Style Premium) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Archivé', val: archives.length, icon: Archive, color: 'indigo' },
          { label: 'Flux Temps Réel', val: 'Actif', icon: Clock, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="relative overflow-hidden group p-6 rounded-[2rem] bg-gradient-to-br from-[#131224] to-[#0f0e1a] border border-white/5 shadow-2xl transition-all hover:border-indigo-500/30">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 blur-3xl -mr-8 -mt-8 group-hover:bg-${stat.color}-500/10 transition-all`} />
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-400 mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-white mt-1">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* --- RECHERCHE & FILTRES (Glassmorphism) --- */}
      <div className="p-2 rounded-[1.5rem] bg-white/5 border border-white/10 backdrop-blur-md flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Rechercher dans le registre (Titre, ID...)"
            className="w-full bg-black/40 border-none rounded-xl py-4 pl-14 pr-4 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center gap-3">
          <Filter size={16} /> Appliquer Filtres
        </button>
      </div>

      {/* --- TABLEAU (Ultra-Premium) --- */}
      <div className="rounded-[2rem] bg-[#0f0e1a] border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">Élément de Registre</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">Date de Clôture</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">Statut Final</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && archives.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Synchronisation...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredArchives.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-slate-500 font-bold uppercase text-xs tracking-widest">
                    Aucune archive trouvée
                  </td>
                </tr>
              ) : (
                filteredArchives.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-all duration-500">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{item.titre}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 opacity-60">REF-{item.id.slice(0,12).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-300 font-bold">{new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">à {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        item.statut === 'termine' 
                        ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' 
                        : 'bg-red-500/5 text-red-500 border-red-500/20'
                      }`}>
                        ● {item.statut}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-indigo-600 transition-all duration-300 group/btn">
                        <span className="text-[10px] font-black uppercase tracking-widest overflow-hidden max-w-0 group-hover/btn:max-w-[100px] transition-all duration-500">Détails</span>
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}