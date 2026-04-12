import { useEffect, useState } from 'react';
import type { NotificationRecord } from '../services/app-types';
import { getNotifications, getUnreadCount, markNotificationRead } from '../services/NotificationService';

export function useNotifications(userId?: string, projectId?: string) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [list, unread] = await Promise.all([
          getNotifications(userId, 20),
          getUnreadCount(userId, projectId)
        ]);
        if (cancelled) return;
        setNotifications(list);
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [userId, projectId]);

  const markAsRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
    setNotifications((prev) => prev.map((item) => item.id === notificationId ? { ...item, read: true } : item));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    await import('../services/NotificationService').then(m => m.markAllNotificationsRead(userId, projectId));
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
