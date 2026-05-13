import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { 
  Vote, Plus, BarChart3, Calendar, Trash2, 
  Edit, Clock, CheckCircle2, DollarSign, 
  ImageIcon, UserPlus, UserRound 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

// IMPORT DE LA SIDEBAR ORGANISATEUR
import DashboardSidebar from '../../components/layout/DashboardSidebar';

// ==========================================
// COMPOSANT ENFANT OPTIMISÉ (React.memo)
// ==========================================
// Ce composant ne se re-rendra QUE si ses props (le vote spécifique) changent.
const VoteCard = memo(({ vote, theme, onAddCandidate, onEdit, onDelete, onResults }) => {
  const nbCandidats = vote.candidats?.[0]?.count || 0;

  const renderStatusBadge = (statusStr) => {
    const status = statusStr || 'termine';
    const normalized = status === 'actif' ? 'active' : status;

    switch (normalized) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/90 text-white shadow-lg">
            <CheckCircle2 size={12} /> En ligne
          </div>
        );
      case 'en_attente':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#f5a623]/90 text-black shadow-lg">
            <Clock size={12} /> En attente
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-500/90 text-white shadow-lg">
            Terminé
          </div>
        );
    }
  };

  return (
    <div className={`group flex flex-col rounded-[2rem] border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${theme.card}`}>
      <div className="relative h-48 sm:h-56 overflow-hidden bg-[#2A2640] content-visibility-auto">
        {vote.image_url ? (
          <img 
            src={vote.image_url} 
            alt={vote.titre} 
            loading="lazy" 
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-30 bg-gradient-to-br from-[#6c47ff] to-[#00d4aa]">
            <ImageIcon size={48} className="text-white mb-2" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#080812]/90 via-transparent to-transparent opacity-80 pointer-events-none" />

        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          {renderStatusBadge(vote.statut)}
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onAddCandidate(vote.id)}
              className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors"
              title="Ajouter un candidat"
            >
              <UserPlus size={14} />
            </button>

            <button
              onClick={() => onEdit(vote.id)}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg"
              title="Modifier"
            >
              <Edit size={14} />
            </button>
            
            <button
              onClick={() => onDelete(vote.id)}
              className="w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-md border border-red-500/20 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-grow p-6">
        <h3 className={`text-xl font-black mb-2 line-clamp-1 ${theme.text}`}>{vote.titre}</h3>
        <p className={`text-sm mb-6 line-clamp-2 min-h-[40px] ${theme.sub}`}>{vote.description || 'Aucune description.'}</p>

        <div className={`space-y-3 mb-8 p-4 rounded-[1.25rem] border ${theme.bg === 'bg-[#080812]' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'} flex-grow`}>
          
          <div className={`flex items-center gap-3 text-xs font-bold ${theme.text}`}>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><UserRound size={14} className="text-blue-500" /></div>
            <span className="flex-1">Candidats inscrits</span>
            <span className="text-base font-black text-blue-500">{nbCandidats}</span>
          </div>

          <div className={`flex items-center gap-3 text-xs font-bold ${theme.text}`}>
            <div className="w-8 h-8 rounded-full bg-[#6c47ff]/10 flex items-center justify-center"><Vote size={14} className="text-[#6c47ff]" /></div>
            <span className="flex-1">Votes du public</span>
            <span className="text-base font-black">{vote.total_votes || 0}</span>
          </div>

          <div className={`flex items-center gap-3 text-xs font-bold ${theme.text}`}>
            <div className="w-8 h-8 rounded-full bg-[#00d4aa]/10 flex items-center justify-center"><Calendar size={14} className="text-[#00d4aa]" /></div>
            <span className="flex-1">Clôture</span>
            <span>{vote.date_fin ? new Date(vote.date_fin).toLocaleDateString('fr-FR') : 'N/A'}</span>
          </div>

          {vote.prix_vote > 0 && (
            <div className={`flex items-center gap-3 text-xs font-bold ${theme.text}`}>
              <div className="w-8 h-8 rounded-full bg-[#f5a623]/10 flex items-center justify-center"><DollarSign size={14} className="text-[#f5a623]" /></div>
              <span className="flex-1">Revenus</span>
              <span className="text-[#f5a623] font-black">{(vote.revenu_total || 0).toLocaleString('fr-FR')} F</span>
            </div>
          )}
        </div>

        <button
          onClick={() => onResults(vote.id)}
          className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white transition-all hover:scale-[1.02] border ${theme.bg === 'bg-[#080812]' ? 'bg-white/10 hover:bg-white/20 border-white/10' : 'bg-gray-900 border-transparent'}`}
        >
          <BarChart3 size={16} /> Consulter les performances
        </button>
      </div>
    </div>
  );
});

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
export default function OrgVotesPage() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#080812]' : 'bg-[#f4f5f7]',
    card: dark ? 'bg-[#12121f]/80 backdrop-blur-2xl border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50',
    text: dark ? 'text-white' : 'text-gray-900',
    sub: dark ? 'text-gray-400' : 'text-gray-500',
  }), [dark]);

  const fetchVotes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id, titre, description, image_url, statut, total_votes, date_fin, prix_vote, revenu_total,
          candidats(count) 
        `)
        .eq('organisateur_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVotes(data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des votes');
      console.error("Erreur fetchVotes:", error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchVotes();

    const subscription = supabase
      .channel('votes-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'votes', filter: `organisateur_id=eq.${user.id}` },
        (payload) => {
          setVotes(currentVotes => 
            currentVotes.map(vote => 
              vote.id === payload.new.id ? { ...vote, ...payload.new } : vote
            )
          );
          if (payload.old.statut !== 'actif' && payload.new.statut === 'actif') {
            toast.success(`Le vote "${payload.new.titre}" vient d'être validé !`, { duration: 5000 });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user, fetchVotes]);

  // Callbacks mémorisés pour éviter les re-rendus inutiles des cartes enfants
  const handleAddCandidate = useCallback((id) => navigate(`/dashboard/votes/${id}/candidats/create`), [navigate]);
  const handleEdit = useCallback((id) => navigate(`/dashboard/votes/${id}/edit`), [navigate]);
  const handleResults = useCallback((id) => navigate(`/dashboard/votes/${id}/results`), [navigate]);
  
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce vote définitivement ?')) return;

    try {
      setVotes(prev => prev.filter(v => v.id !== id));
      const { error } = await supabase.from('votes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Vote supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      fetchVotes(); // Revert local state if deletion fails
    }
  }, [fetchVotes]);

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}><Spinner size="xl" /></div>;

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${theme.bg}`}>
      
      {/* MENU DE NAVIGATION */}
      <DashboardSidebar />

      {/* CONTENU DE LA PAGE */}
      <div className="flex-1 w-full lg:w-[calc(100%-18rem)] pt-8 pb-24 lg:pb-8 animate-fade-in overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-gray-500/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#6c47ff] animate-pulse" />
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>Espace Organisateur</p>
              </div>
              <h1 className={`text-3xl md:text-4xl font-black tracking-tighter ${theme.text}`}>Mes Votes</h1>
            </div>

            <Link to="/dashboard/votes/create" className="hidden sm:flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-black text-xs uppercase bg-[#6c47ff] text-white shadow-lg shadow-[#6c47ff]/25 hover:scale-[1.02] transition-all">
              <Plus size={16} /> Créer un Vote
            </Link>
          </div>

          {votes.length === 0 ? (
            <div className={`rounded-[2rem] border p-16 text-center ${theme.card}`}>
              <Vote size={40} className="text-[#6c47ff] mx-auto mb-6" />
              <h3 className={`text-2xl font-black mb-3 ${theme.text}`}>L'arène est vide</h3>
              <Link to="/dashboard/votes/create" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-xs uppercase text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] shadow-xl transition-all">
                <Plus size={18} /> Lancer mon premier vote
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {votes.map((vote) => (
                <VoteCard 
                  key={vote.id} 
                  vote={vote} 
                  theme={theme}
                  onAddCandidate={handleAddCandidate}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onResults={handleResults}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}