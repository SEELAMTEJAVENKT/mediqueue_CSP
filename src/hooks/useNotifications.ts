import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  hospital_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  appointment_id: string | null;
  created_at: string | null;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (err) {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    if (!userId) return;
    // Poll every 15 seconds for new notifications (lightweight real-time)
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications, userId]);

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true } as any).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase.from('notifications').update({ is_read: true } as any).eq('user_id', userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, loading, unreadCount, fetchNotifications, markRead, markAllRead };
}
