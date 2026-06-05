import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Bell, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, Ticket, Gift, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseClient';

export default function Notifications() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compteur de notifications non lues
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Abonnement Temps Réel pour les nouvelles notifications
      const channel = supabase.channel('realtime_notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        }, (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          toast("Nouvelle notification", { icon: '🔔' });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
      toast.error("Impossible de charger vos notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id) => {
    // Mise à jour optimiste UI
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    // Mise à jour optimiste UI
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    toast.success("Toutes les notifications sont lues");

    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  const deleteNotification = async (id) => {
    // Mise à jour optimiste UI
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success("Notification supprimée");

    await supabase.from('notifications').delete().eq('id', id);
  };

  // Formatage de la date (ex: "Il y a 2 heures" ou date complète)
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Sélection de l'icône et des couleurs selon le type de notification
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'success': return { icon: <CheckCircle size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'warning': return { icon: <AlertTriangle size={20} />, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'ticket': return { icon: <Ticket size={20} />, color: 'text-[#6c47ff]', bg: 'bg-[#6c47ff]/10' };
      case 'promo': return { icon: <Gift size={20} />, color: 'text-[#f43f5e]', bg: 'bg-[#f43f5e]/10' };
      default: return { icon: <Info size={20} />, color: 'text-[#00d4aa]', bg: 'bg-[#00d4aa]/10' }; // info
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-6 ${dark ? 'bg-[#0a0a16]' : 'bg-[#f7f8fa]'}`}>
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`w-full h-24 rounded-2xl animate-pulse ${dark ? 'bg-white/5' : 'bg-gray-200'}`}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${dark ? 'bg-[#0a0a16]' : 'bg-[#f7f8fa]'}`}>
      
      {/* HEADER */}
      <div className={`sticky top-0 z-40 w-full backdrop-blur-xl border-b p-6 transition-colors ${dark ? 'bg-[#0a0a16]/80 border-white/5' : 'bg-white/90 border-gray-100 shadow-sm'}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-black tracking-tight flex items-center gap-3 ${dark ? 'text-white' : 'text-gray-900'}`}>
              Notifications
              {unreadCount > 0 && (
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#f43f5e] text-white text-xs font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className={`text-sm mt-1 font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Restez informé de l'activité de vos événements.
            </p>
          </div>

          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-[#6c47ff] hover:text-white transition-colors text-sm font-bold"
            >
              <CheckCheck size={16} />
              Tout lire
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8">
        
        {/* ÉTAT VIDE */}
        {notifications.length === 0 ? (
          <div className={`mt-10 text-center p-12 rounded-[2rem] border border-dashed ${dark ? 'bg-[#151522]/50 border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="w-20 h-20 mx-auto rounded-full bg-[#00d4aa]/10 flex items-center justify-center mb-6">
              <Bell size={32} className="text-[#00d4aa]" />
            </div>
            <h2 className={`text-2xl font-black mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Vous êtes à jour !</h2>
            <p className={`text-sm leading-relaxed max-w-sm mx-auto ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Vous n'avez aucune notification pour le moment. Nous vous préviendrons dès qu'il y aura du nouveau.
            </p>
          </div>
        ) : (
          
          /* LISTE DES NOTIFICATIONS */
          <div className="space-y-4">
            {notifications.map((notif) => {
              const style = getNotificationStyle(notif.type);
              
              return (
                <div 
                  key={notif.id} 
                  onMouseEnter={() => !notif.is_read && markAsRead(notif.id)}
                  className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                    !notif.is_read 
                      ? dark 
                        ? 'bg-[#1e1e2d] border-[#6c47ff]/30 shadow-lg shadow-[#6c47ff]/5' 
                        : 'bg-white border-[#6c47ff]/20 shadow-lg shadow-[#6c47ff]/5'
                      : dark 
                        ? 'bg-[#151522] border-white/5 opacity-80 hover:opacity-100' 
                        : 'bg-gray-50 border-gray-100 hover:bg-white'
                  }`}
                >
                  {/* Point indicateur Non-Lu */}
                  {!notif.is_read && (
                    <span className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-[#6c47ff] animate-pulse shadow-[0_0_10px_#6c47ff]"></span>
                  )}

                  {/* Icône */}
                  <div className={`shrink-0 p-3 rounded-xl ${style.bg} ${style.color}`}>
                    {style.icon}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className={`text-base font-bold truncate ${!notif.is_read ? (dark ? 'text-white' : 'text-gray-900') : (dark ? 'text-gray-300' : 'text-gray-700')}`}>
                        {notif.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock size={12} className={dark ? 'text-gray-500' : 'text-gray-400'} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`mt-1 text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notif.message}
                    </p>
                  </div>

                  {/* Actions Rapides (Corbeille au survol) */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className={`shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${dark ? 'hover:bg-white/10 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}