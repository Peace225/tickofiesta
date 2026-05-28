import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { Vote, Plus, Sparkles, TrendingUp, Users, Zap, Edit3, Trash2, Calendar, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgVotesPage() {
  const { dark } = useSelector(s => s.theme);
  const { user } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchVotes();
  }, [user]);

  const fetchVotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        // CORRECTION MAJEURE ICI : 'organizer_id' au lieu de 'organisateur_id'
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVotes(data || []);
    } catch (err) {
      console.error("Erreur chargement:", err);
      toast.error("Erreur de chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette compétition ?')) return;

    const { error } = await supabase.from('votes').delete().eq('id', id);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      setVotes(v => v.filter(x => x.id !== id));
      toast.success('Compétition supprimée avec succès');
    }
  };

  // Statistiques calculées automatiquement
  const stats = useMemo(() => ({
    total: votes.length,
    actifs: votes.filter(v => v.statut === 'actif').length,
    totalVotes: votes.reduce((a, v) => a + (parseInt(v.total_votes) || 0), 0),
  }), [votes]);

  // Thème Ultra Premium
  const theme = {
    bg: dark ? 'bg-[#030305]' : 'bg-[#f8f9fa]',
    card: dark ? 'bg-[#0a0a16]/80 backdrop-blur-xl border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300',
    statCard: dark ? 'bg-gradient-to-br from-white/5 to-transparent border-white/5' : 'bg-white border-slate-200',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
  };

  return (
    <div className={`min-h-screen ${theme.bg} py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${theme.text}`}>Compétitions & Votes</h1>
            <p className={`text-sm mt-1 ${theme.sub}`}>Gérez vos campagnes de votes en temps réel.</p>
          </div>
          
          <Link 
            to="/dashboard/votes/create" 
            className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white text-sm font-bold shadow-lg shadow-[#6c47ff]/25 hover:shadow-[#6c47ff]/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> 
            Créer un vote
          </Link>
        </div>

        {/* BANDEAU DE STATISTIQUES */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-5 rounded-3xl border ${theme.statCard} flex items-center gap-4`}>
              <div className="w-12 h-12 rounded-2xl bg-[#6c47ff]/10 flex items-center justify-center text-[#6c47ff]">
                <Vote size={24} />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${theme.sub}`}>Total Campagnes</p>
                <p className={`text-2xl font-black ${theme.text}`}>{stats.total}</p>
              </div>
            </div>
            
            <div className={`p-5 rounded-3xl border ${theme.statCard} flex items-center gap-4`}>
              <div className="w-12 h-12 rounded-2xl bg-[#00d4aa]/10 flex items-center justify-center text-[#00d4aa]">
                <Activity size={24} />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${theme.sub}`}>Campagnes Actives</p>
                <p className={`text-2xl font-black ${theme.text}`}>{stats.actifs}</p>
              </div>
            </div>
            
            <div className={`p-5 rounded-3xl border ${theme.statCard} flex items-center gap-4`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${theme.sub}`}>Total Votes Reçus</p>
                <p className={`text-2xl font-black ${theme.text}`}>{stats.totalVotes.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* GRILLE DES COMPÉTITIONS */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-64 rounded-3xl animate-pulse ${theme.card}`} />
            ))}
          </div>
        ) : votes.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border border-dashed ${theme.card}`}>
            <div className="w-20 h-20 mx-auto rounded-full bg-[#6c47ff]/10 flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-[#6c47ff]" />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${theme.text}`}>Aucune compétition</h3>
            <p className={`text-sm mb-6 ${theme.sub}`}>Vous n'avez pas encore lancé de campagne de vote.</p>
            <Link to="/dashboard/votes/create" className="text-[#6c47ff] font-bold text-sm hover:underline">
              Créer ma première compétition →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {votes.map((v) => (
              <div 
                key={v.id} 
                className={`group relative p-5 rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden flex flex-col ${theme.card}`}
              >
                {/* Image / Couverture */}
                <div className="w-full h-32 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 mb-4 overflow-hidden relative">
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.title || v.titre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <Vote size={48} className="text-white" />
                    </div>
                  )}
                  
                  {/* Badge Statut */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${v.statut === 'actif' ? 'bg-[#00d4aa] animate-pulse' : 'bg-slate-400'}`} />
                    {v.statut || 'Brouillon'}
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex-1">
                  <h3 className={`text-lg font-black leading-tight mb-2 line-clamp-1 ${theme.text}`}>
                    {v.title || v.titre || 'Compétition sans titre'}
                  </h3>
                  
                  <div className={`flex items-center gap-2 text-xs font-semibold mb-4 ${theme.sub}`}>
                    <Calendar size={14} className="text-[#6c47ff]" />
                    <span>Fin : {v.end_at ? new Date(v.end_at).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                  </div>
                  
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-wider ${theme.sub}`}>Votes récoltés</span>
                    <span className={`text-lg font-black ${theme.text}`}>{v.total_votes || 0}</span>
                  </div>
                </div>

                {/* Actions (Gérer / Éditer / Supprimer) */}
                <div className="flex gap-2 mt-5">
                  <button 
                    onClick={() => navigate(`/dashboard/votes/${v.id}/edit`)} 
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#6c47ff]/10 text-[#6c47ff] hover:bg-[#6c47ff] hover:text-white text-xs font-bold transition-colors"
                  >
                    <Edit3 size={14} /> Gérer
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, v.id)} 
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}