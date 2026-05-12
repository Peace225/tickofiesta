import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Users, MessageCircle, Heart, Share2, Send, Loader2 } from 'lucide-react';
import { supabase } from '../config/supabaseClient'; // Ajuste le chemin si nécessaire

export default function Community() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth); // Pour vérifier si l'utilisateur est connecté
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Charger les publications au montage
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // On récupère les posts ET on fait une jointure avec la table profiles pour avoir le nom et l'avatar
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          likes_count,
          created_at,
          profiles:user_id (nom, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des discussions:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([{ user_id: user.id, content: newPost.trim() }])
        .select(`
          id,
          content,
          likes_count,
          created_at,
          profiles:user_id (nom, avatar_url)
        `)
        .single(); // On récupère le post fraîchement créé

      if (error) throw error;
      
      // On ajoute le nouveau post en haut de la liste sans recharger la page
      setPosts([data, ...posts]);
      setNewPost('');
    } catch (error) {
      console.error('Erreur lors de la publication:', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className={`min-h-screen pt-32 pb-20 ${dark ? 'bg-[#0a0a16]' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* EN-TÊTE */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] mb-6 shadow-[0_0_30px_rgba(108,71,255,0.3)]">
            <Users size={32} className="text-white" />
          </div>
          <h1 className={`text-4xl font-black mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Ma <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">Communauté</span>
          </h1>
          <p className={`text-lg ${dark ? 'text-white/60' : 'text-gray-600'}`}>
            Discutez, partagez vos expériences et suivez vos organisateurs favoris.
          </p>
        </div>

        {/* ZONE DE CRÉATION DE POST */}
        <div className={`mb-8 rounded-2xl border p-4 backdrop-blur-xl transition-all ${
          dark ? 'bg-[#12121f]/60 border-white/10' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          {user ? (
            <form onSubmit={handlePostSubmit}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Partagez vos impressions sur le dernier événement..."
                className={`w-full p-4 rounded-xl resize-none focus:outline-none transition-colors ${
                  dark 
                    ? 'bg-white/5 border border-white/5 text-white placeholder-white/30 focus:border-[#6c47ff]/50' 
                    : 'bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 focus:border-[#6c47ff]/50 focus:bg-white'
                }`}
                rows="3"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={!newPost.trim() || submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Publier
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <MessageCircle size={32} className={`mx-auto mb-3 ${dark ? 'text-white/30' : 'text-gray-300'}`} />
              <p className={`font-medium ${dark ? 'text-white/70' : 'text-gray-600'}`}>
                Connectez-vous pour rejoindre la discussion.
              </p>
            </div>
          )}
        </div>

        {/* FLUX DE DISCUSSIONS (FEED) */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={40} className={`animate-spin ${dark ? 'text-[#6c47ff]' : 'text-gray-400'}`} />
            </div>
          ) : posts.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-12 text-center ${
              dark ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-300'
            }`}>
              <p className={dark ? 'text-white/50' : 'text-gray-500'}>
                Aucune discussion pour le moment. Soyez le premier à lancer un sujet !
              </p>
            </div>
          ) : (
            posts.map((post) => {
              // Extraction sécurisée des données du profil
              const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
              const authorName = profile?.nom || 'Utilisateur anonyme';
              const authorInitial = authorName.charAt(0).toUpperCase();

              return (
                <div key={post.id} className={`rounded-2xl border p-5 transition-all ${
                  dark ? 'bg-[#12121f]/40 border-white/10 hover:bg-[#12121f]/80' : 'bg-white border-gray-100 hover:shadow-md'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={authorName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-600 to-gray-400 flex items-center justify-center">
                        <span className="text-white font-bold">{authorInitial}</span>
                      </div>
                    )}
                    <div>
                      <h4 className={`font-bold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>
                        {authorName}
                      </h4>
                      <p className={`text-xs ${dark ? 'text-white/40' : 'text-gray-500'}`}>
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-4 leading-relaxed ${dark ? 'text-white/80' : 'text-gray-700'}`}>
                    {post.content}
                  </p>
                  
                  <div className={`flex items-center gap-6 pt-3 border-t ${dark ? 'border-white/5' : 'border-gray-50'}`}>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors">
                      <Heart size={16} />
                      <span>{post.likes_count}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#6c47ff] transition-colors">
                      <Share2 size={16} />
                      <span>Partager</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}