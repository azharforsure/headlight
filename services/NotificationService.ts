import { crawlDb } from './CrawlDatabase';
import { getUnreadCount as getUnreadCountFromActivity, markRead } from './ActivityService';
import type { NotificationRecord } from './app-types';

export async function getNotifications(userId: string, limit: number = 20): Promise<NotificationRecord[]> {
  return crawlDb.notifications
    .where('userId')
    .equals(userId)
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getUnreadCount(userId: string, projectId?: string): Promise<number> {
  return getUnreadCountFromActivity(userId, projectId);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await markRead(notificationId);
}

export async function markAllNotificationsRead(userId: string, projectId?: string): Promise<void> {
  await import('./ActivityService').then(m => m.markAllRead(userId, projectId));
}
