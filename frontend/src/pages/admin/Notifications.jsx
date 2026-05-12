import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Bell, Check, Trash2, Filter, Calendar, Ticket, Trophy, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [processingId, setProcessingId] = useState(null);

  const theme = {
    card: dark? 'bg-[#0f0e1a]/80 backdrop-blur-xl border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/40',
    text: dark? 'text-white' : 'text-slate-900',
    sub: dark? 'text-slate-400' : 'text-slate-500',
    hover: dark? 'hover:bg-white/5' : 'hover:bg-gray-50',
    unread: dark? 'bg-[#6c47ff]/10 border-[#6c47ff]/20' : 'bg-[#6c47ff]/5 border-[#6c47ff]/10',
  };

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
     .from('notifications')
     .select('*')
     .eq('user_id', user.id)
     .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('lu', false);
      } else if (filter === 'read') {
        query = query.eq('lu', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Real-time
    const channel = supabase
  .channel('notifications')
  .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        () => loadNotifications()
      )
  .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, filter]);

  const markAsRead = async (id) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id? {...n, lu: true } : n));
    } catch (err) {
      console.error(err);
      toast.error('Erreur');
    } finally {
      setProcessingId(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('user_id', user.id)
    .eq('lu', false);

      if (error) throw error;
      toast.success('Toutes marquées comme lues');
      loadNotifications();
    } catch (err) {
      console.error(err);
      toast.error('Erreur');
    }
  };

  const deleteNotification = async (id) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id!== id));
      toast.success('Notification supprimée');
    } catch (err) {
      console.error(err);
      toast.error('Erreur');
    } finally {
      setProcessingId(null);
    }
  };

  const handleClick = async (notif) => {
    if (!notif.lu) await markAsRead(notif.id);

    // Redirection selon le type
    if (notif.lien) {
      navigate(notif.lien);
    } else if (notif.type === 'event') {
      navigate(`/events/${notif.entity_id}`);
    } else if (notif.type === 'ticket') {
      navigate('/mes-billets');
    } else if (notif.type === 'vote') {
      navigate(`/votes/${notif.entity_id}`);
    }
  };

  const getIcon = (type) => {
    const icons = {
      event: Calendar,
      ticket: Ticket,
      vote: Trophy,
      system: AlertCircle,
      default: Bell
    };
    return icons[type] || icons.default;
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#6c47ff]/10 border border-[#6c47ff]/20 rounded-full px-4 py-1.5 mb-3">
              <Bell size={14} className="text-[#6c47ff]" />
              <span className="text-[#6c47ff] text- font-black uppercase tracking-widest">
                Centre de Notifications
              </span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-black tracking-tighter ${theme.text}`}>
              Notifications
            </h1>
            <p className={`text-sm mt-2 ${theme.sub}`}>
              {unreadCount > 0? `${unreadCount} non lue${unreadCount > 1? 's' : ''}` : 'Tout est lu'}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6c47ff] text-white text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#6c47ff]/30"
            >
              <Check size={18} />
              Tout marquer lu
            </button>
          )}
        </div>

        {/* Filters */}
        <div className={`flex gap-2 p-1 rounded-xl border w-fit ${theme.card}`}>
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'unread', label: 'Non lues' },
            { value: 'read', label: 'Lues' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                filter === f.value
             ? 'bg-[#6c47ff] text-white'
                  : `${theme.text} hover:bg-white/5`
              }`}
            >
              {f.label}
              {f.value === 'unread' && unreadCount > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text- ${
                  filter === 'unread'? 'bg-white/20' : 'bg-[#6c47ff]/10 text-[#6c47ff]'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading? (
          <div className="flex justify-center items-center py-32">
            <Spinner size="lg" />
          </div>
        ) : notifications.length === 0? (
          <div className={`py-20 text-center rounded-2xl border-2 border-dashed ${dark? 'border-white/5' : 'border-gray-200'}`}>
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p className={`text-lg font-black ${theme.text}`}>
              {filter === 'unread'? 'Aucune notification non lue' : 'Aucune notification'}
            </p>
            <p className={`text-sm mt-2 ${theme.sub}`}>
              Vous êtes à jour 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => {
              const Icon = getIcon(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${theme.card} ${theme.hover} ${
                    !notif.lu? theme.unread : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      !notif.lu? 'bg-[#6c47ff]/20 text-[#6c47ff]' : 'bg-white/5 text-slate-400'
                    }`}>
                      <Icon size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className={`text-base font-black ${theme.text}`}>
                          {notif.titre}
                        </h3>
                        {!notif.lu && (
                          <div className="w-2 h-2 rounded-full bg-[#6c47ff] flex-shrink-0 mt-2" />
                        )}
                      </div>

                      <p className={`text-sm ${theme.sub}`}>
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <p className={`text-xs ${theme.sub}`}>
                          {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>

                        <div className="flex gap-2">
                          {!notif.lu && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif.id);
                              }}
                              disabled={processingId === notif.id}
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            disabled={processingId === notif.id}
                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            {processingId === notif.id? <Spinner size="sm" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}