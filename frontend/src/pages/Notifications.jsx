import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Bell, CheckCircle, Loader2, Info } from 'lucide-react';
import { supabase } from '../config/supabaseClient';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth); // Récupération de l'utilisateur connecté

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- LOGIQUE SUPABASE ---
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Optionnel : Écouter les nouvelles notifications en temps réel
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
        setNotifications(current => [payload.new, ...current]);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [user]);

  // Marquer une notification comme lue
  const markAsRead = async (id, isRead) => {
    if (isRead) return; // Déjà lu, on ne fait rien

    try {
      // Mise à jour de l'état local immédiatement pour une meilleure UX (Optimistic UI)
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, is_read: true } : notif
      ));

      // Mise à jour en base de données
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur de mise à jour:', error.message);
    }
  };

  // Fonction pour calculer le temps écoulé (ex: "Il y a 2h")
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;
  };

  // État si l'utilisateur n'est pas connecté
  if (!user && !loading) {
    return (
      <div className={`min-h-screen pt-32 pb-20 flex items-center justify-center ${dark ? 'bg-[#0a0a16]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Info size={48} className={`mx-auto mb-4 ${dark ? 'text-[#6c47ff]' : 'text-gray-400'}`} />
          <h2 className={`text-2xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Connectez-vous</h2>
          <p className={`mb-6 ${dark ? 'text-white/60' : 'text-gray-600'}`}>Vous devez être connecté pour voir vos notifications.</p>
          <Link to="/login" className="px-6 py-2.5 rounded-full font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-32 pb-20 ${dark ? 'bg-[#0a0a16]' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* EN-TÊTE */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] flex items-center justify-center shadow-[0_0_20px_rgba(108,71,255,0.3)]">
              <Bell size={28} className="text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Notifications</h1>
              <p className={dark ? 'text-white/60' : 'text-gray-600'}>Vos dernières alertes</p>
            </div>
          </div>
          
          {/* Badge compteur de non-lus */}
          {notifications.filter(n => !n.is_read).length > 0 && (
            <div className="px-3 py-1 rounded-full bg-[#f43f5e]/10 border border-[#f43f5e]/20 text-[#f43f5e] font-bold text-sm">
              {notifications.filter(n => !n.is_read).length} nouvelle(s)
            </div>
          )}
        </div>

        {/* LISTE DES NOTIFICATIONS */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={40} className={`animate-spin ${dark ? 'text-[#6c47ff]' : 'text-gray-400'}`} />
            </div>
          ) : notifications.length === 0 ? (
            <div className={`rounded-xl border border-dashed p-12 text-center ${
              dark ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-300'
            }`}>
              <Bell size={40} className={`mx-auto mb-3 opacity-20 ${dark ? 'text-white' : 'text-gray-900'}`} />
              <p className={dark ? 'text-white/50' : 'text-gray-500'}>
                Vous n'avez aucune notification pour le moment.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id, notif.is_read)}
                className={`p-5 rounded-xl border backdrop-blur-xl transition-all cursor-pointer hover:scale-[1.01] ${
                  notif.is_read
                    ? dark ? 'bg-[#12121f]/40 border-white/5' : 'bg-gray-50 border-gray-100'
                    : dark ? 'bg-[#12121f]/80 border-[#6c47ff]/50 shadow-[0_0_15px_rgba(108,71,255,0.15)]' : 'bg-white border-[#6c47ff]/30 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    notif.is_read ? 'bg-gray-500/20' : 'bg-[#6c47ff]/20'
                  }`}>
                    <Bell size={18} className={notif.is_read ? 'text-gray-500' : 'text-[#6c47ff]'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-bold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{notif.title}</h3>
                        <p className={dark ? 'text-white/70' : 'text-gray-600'}>{notif.description}</p>
                      </div>
                      {notif.is_read && <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
                      {!notif.is_read && <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] flex-shrink-0 mt-1" />}
                    </div>
                    <p className={`text-xs mt-2 font-medium ${dark ? 'text-white/40' : 'text-gray-400'}`}>
                      {getRelativeTime(notif.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}