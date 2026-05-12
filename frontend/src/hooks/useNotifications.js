import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { useSelector } from 'react-redux';

export default function useNotifications() {
  const { user } = useSelector((s) => s.auth);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
   .from('notifications')
   .select('id')
   .eq('user_id', user.id)
   .eq('lu', false);
      setUnreadCount(data?.length || 0);
    };

    load();

    const channel = supabase
 .channel('notifs')
 .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        load
      )
 .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  return { unreadCount };
}