import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { Megaphone, Users, Search, TrendingUp, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import AnnonceModal from './AnnonceModal';

export default function Community() {
  const { user } = useSelector((state) => state.auth);
  const dark = useSelector((state) => state.theme?.dark) ?? false;
  
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchSubscribers = async () => {
      setLoading(true);
      try {
        // 1. Récupération des abonnements
        const { data: abonnements, error } = await supabase
          .from('abonnements')
          .select('user_id, created_at')
          .eq('organisateur_id', user.id);

        if (error) throw error;

        if (abonnements && abonnements.length > 0) {
          // 2. Récupération des profils associés
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, nom, avatar_url, email')
            .in('id', abonnements.map(a => a.user_id));

          const profilesList = profiles ?? [];
          
          // 3. Fusion des données
          setSubscribers(abonnements.map(ab => ({
            ...ab,
            profiles: profilesList.find(p => p.id === ab.user_id),
            tickets: Math.floor(Math.random() * 12) + 1,
          })));
        }
      } catch (error) {
        console.error("Erreur de récupération :", error);
        toast.error("Erreur lors du chargement des abonnés");
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, [user?.id]);

  const filteredData = useMemo(() => {
    return subscribers.filter(s => 
      (s.profiles?.full_name || s.profiles?.nom || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).filter(s => activeTab === 'vip' ? s.tickets >= 8 : true);
  }, [subscribers, searchQuery, activeTab]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${dark ? 'bg-[#0a0a0b]' : 'bg-[#fafafa]'}`}>
      <div className="p-8 max-w-7xl mx-auto">
        
        {/* HEADER PREMIUM */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-700 to-fuchsia-700 rounded-[2.5rem] p-10 mb-10 text-white shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                MA COMMUNAUTÉ <span className="text-xs bg-white/20 px-3 py-1 rounded-lg uppercase">Pro</span>
              </h1>
              <p className="text-violet-100 font-medium">Transformez vos abonnés en fans fidèles.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-white text-violet-700 px-8 py-4 rounded-2xl font-black hover:scale-105 transition-transform flex items-center gap-2 shadow-lg">
              <Megaphone size={20} /> Annoncer un événement
            </button>
          </div>
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Abonnés", value: subscribers.length, icon: Users, color: "text-violet-500" },
            { label: "Taux d'engagement", value: "84%", icon: TrendingUp, color: "text-emerald-500" },
            { label: "Billets moyens", value: "4.2", icon: Ticket, color: "text-amber-500" }
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-3xl border ${dark ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-gray-100'} shadow-sm flex items-center gap-4`}>
              <div className={`p-3 rounded-2xl ${dark ? 'bg-zinc-900' : 'bg-gray-50'}`}><stat.icon className={stat.color} size={24} /></div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* CONTROLES */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex bg-gray-100 dark:bg-zinc-900 p-2 rounded-2xl">
            {['all', 'vip', 'new'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === tab ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>
                {tab === 'all' ? 'Tous' : tab === 'vip' ? 'VIP' : 'Nouveaux'}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Rechercher un membre..." className={`w-full md:w-80 p-4 rounded-2xl border ${dark ? 'bg-zinc-900 border-zinc-800' : 'bg-white'}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {/* LISTE DES ABONNÉS */}
        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
          <div className="grid gap-4">
            {filteredData.map((sub) => {
              const displayName = sub.profiles?.full_name || sub.profiles?.nom || 'Utilisateur inconnu';
              return (
                <div key={sub.user_id} className={`p-4 rounded-2xl border flex items-center justify-between ${dark ? 'bg-[#18181b] border-zinc-800' : 'bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-700 overflow-hidden">
                      {sub.profiles?.avatar_url ? (
                        <img src={sub.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">{displayName}</h4>
                      <p className="text-sm text-gray-500">{sub.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Tickets</p>
                    <p className="font-black text-violet-600">{sub.tickets}</p>
                  </div>
                </div>
              );
            })}
            {filteredData.length === 0 && <p className="text-center text-gray-500 py-10">Aucun abonné trouvé.</p>}
          </div>
        )}

        {isModalOpen && (
          <AnnonceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} subscribers={filteredData} />
        )}
      </div>
    </div>
  );
}