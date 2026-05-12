import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Bookmark, Calendar, MapPin, Loader2, HeartOff, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';

export default function Favorites() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- LOGIQUE SUPABASE ---
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        // Récupère les favoris ET fait une jointure avec la table events
        // (Assure-toi que les noms de colonnes "titre", "date", "lieu" correspondent à ta table d'événements)
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            event_id,
            events (
              id,
              titre,
              date,
              lieu,
              image_url
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFavorites(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  // Fonction pour retirer un événement des favoris
  const removeFavorite = async (favoriteId) => {
    try {
      // 1. Mise à jour UI immédiate pour la fluidité (Optimistic Update)
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));

      // 2. Suppression en base de données
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error.message);
      // En cas d'erreur grave, on pourrait recharger la liste ici
    }
  };

  // État si l'utilisateur n'est pas connecté
  if (!user && !loading) {
    return (
      <div className={`min-h-screen pt-32 pb-20 flex items-center justify-center ${dark ? 'bg-[#0a0a16]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Info size={48} className={`mx-auto mb-4 ${dark ? 'text-[#6c47ff]' : 'text-gray-400'}`} />
          <h2 className={`text-2xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Connectez-vous</h2>
          <p className={`mb-6 ${dark ? 'text-white/60' : 'text-gray-600'}`}>Vous devez être connecté pour voir vos favoris.</p>
          <Link to="/login" className="px-6 py-2.5 rounded-full font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-32 pb-20 ${dark ? 'bg-[#0a0a16]' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* EN-TÊTE */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] flex items-center justify-center shadow-[0_0_20px_rgba(108,71,255,0.3)]">
            <Bookmark size={28} className="text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Événements Favoris</h1>
            <p className={dark ? 'text-white/60' : 'text-gray-600'}>Vos événements sauvegardés</p>
          </div>
        </div>

        {/* CONTENU */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={48} className={`animate-spin ${dark ? 'text-[#6c47ff]' : 'text-[#6c47ff]'}`} />
          </div>
        ) : favorites.length === 0 ? (
          <div className={`rounded-2xl border backdrop-blur-xl p-12 text-center ${
            dark ? 'bg-[#12121f]/60 border-white/10' : 'bg-white border-gray-200'
          }`}>
            <Bookmark size={48} className="mx-auto mb-4 text-[#6c47ff]" />
            <h3 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
              Aucun favori pour le moment
            </h3>
            <p className={`mb-6 ${dark ? 'text-white/70' : 'text-gray-600'}`}>
              Cliquez sur le cœur des événements pour les ajouter ici
            </p>
            <Link
              to="/events"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] shadow-lg shadow-[#6c47ff]/30 hover:shadow-[#6c47ff]/50 hover:scale-105 transition-all"
            >
              Découvrir des événements
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              // Extraction sécurisée des détails de l'événement
              const event = Array.isArray(fav.events) ? fav.events[0] : fav.events;
              if (!event) return null;

              return (
                <div key={fav.id} className={`group relative rounded-2xl border overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${
                  dark ? 'bg-[#12121f]/60 border-white/10' : 'bg-white border-gray-200'
                }`}>
                  {/* Bouton de suppression */}
                  <button
                    onClick={() => removeFavorite(fav.id)}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                    title="Retirer des favoris"
                  >
                    <HeartOff size={18} />
                  </button>

                  <Link to={`/events/${event.id}`} className="block">
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <img 
                        src={event.image_url || '/placeholder-event.jpg'} 
                        alt={event.titre}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className={`text-lg font-bold mb-3 line-clamp-1 ${dark ? 'text-white' : 'text-gray-900'}`}>
                        {event.titre || 'Événement sans titre'}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 text-sm ${dark ? 'text-white/60' : 'text-gray-600'}`}>
                          <Calendar size={16} className="text-[#6c47ff]" />
                          <span>{event.date ? new Date(event.date).toLocaleDateString('fr-FR') : 'Date à venir'}</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${dark ? 'text-white/60' : 'text-gray-600'}`}>
                          <MapPin size={16} className="text-[#00d4aa]" />
                          <span className="line-clamp-1">{event.lieu || 'Lieu non défini'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}