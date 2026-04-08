/**
 * ActivityService.ts
 * 
 * Centralized activity logging and notification management.
 * Syncs with Turso (cloud) and Dexie (local cache).
 */

import { turso, initializeDatabase, isCloudSyncEnabled } from './turso';
import { crawlDb } from './CrawlDatabase';
import type { ActivityLog, NotificationRecord as Notification, NotificationType } from './app-types';

let schemaReady: Promise<void> | null = null;

const ensureSchema = async () => {
    if (!schemaReady) {
        schemaReady = initializeDatabase().catch((error) => {
            schemaReady = null;
            throw error;
        });
    }
    await schemaReady;
};

/**
 * Log a new activity
 */
export async function logActivity(
    projectId: string, 
    data: { 
        actorId: string, 
        actorName?: string | null, 
        action: string, 
        entityType: ActivityLog['entity_type'], 
        entityId: string, 
        metadata?: any 
    }
): Promise<ActivityLog> {
    const activity: ActivityLog = {
        id: crypto.randomUUID(),
        project_id: projectId,
        actor_id: data.actorId,
        actor_name: data.actorName || null,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        metadata_json: data.metadata ? JSON.stringify(data.metadata) : null,
        created_at: new Date().toISOString()
    };

    // Save locally
    await crawlDb.activity.put(activity);

    // Sync to cloud
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `INSERT INTO activity_log (id, project_id, actor_id, actor_name, action, entity_type, entity_id, metadata_json, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    activity.id, activity.project_id, activity.actor_id, activity.actor_name,
                    activity.action, activity.entity_type, activity.entity_id,
                    activity.metadata_json, activity.created_at
                ]
            });
        } catch (error) {
            console.error('[ActivityService] Failed to sync activity to cloud:', error);
        }
    }

    return activity;
}

/**
 * Fetch activity feed for a project
 */
export async function getActivityFeed(projectId: string, limit = 50, offset = 0): Promise<ActivityLog[]> {
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            const result = await turso().execute({
                sql: `SELECT * FROM activity_log WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
                args: [projectId, limit, offset]
            });
            const logs = result.rows.map(mapRowToActivity);
            
            // Cache locally
            await crawlDb.activity.bulkPut(logs);
            return logs;
        } catch (error) {
            console.error('[ActivityService] Failed to fetch activity from cloud:', error);
        }
    }

    return crawlDb.activity
        .where('projectId').equals(projectId)
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();
}

/**
 * Create a new notification
 */
export async function createNotification(
    projectId: string,
    userId: string,
    data: {
        type: NotificationType,
        title: string,
        body?: string | null,
        linkUrl?: string | null,
        entityType?: string | null,
        entityId?: string | null
    }
): Promise<Notification> {
    const notification: Notification = {
        id: crypto.randomUUID(),
        project_id: projectId,
        user_id: userId,
        type: data.type,
        title: data.title,
        body: data.body || null,
        link_url: data.linkUrl || null,
        entity_type: data.entityType || null,
        entity_id: data.entityId || null,
        read: false,
        read_at: null,
        created_at: new Date().toISOString()
    };

    // Save locally
    await crawlDb.notifications.put(notification);

    // Sync to cloud
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `INSERT INTO notifications (id, project_id, user_id, type, title, body, link_url, entity_type, entity_id, read, read_at, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    notification.id, notification.project_id, notification.user_id,
                    notification.type, notification.title, notification.body,
                    notification.link_url, notification.entity_type, notification.entity_id,
                    notification.read ? 1 : 0, notification.read_at, notification.created_at
                ]
            });
        } catch (error) {
            console.error('[ActivityService] Failed to sync notification to cloud:', error);
        }
    }

    return notification;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string, projectId?: string): Promise<number> {
    if (projectId) {
        return crawlDb.notifications
            .where({ userId, projectId, read: 0 as any }) // Dexie booleans can be tricky, we used 'read' in store
            .count();
    }
    return crawlDb.notifications
        .where('userId').equals(userId)
        .filter(n => !n.read)
        .count();
}

/**
 * Mark notification as read
 */
export async function markRead(notificationId: string): Promise<void> {
    const read_at = new Date().toISOString();
    await crawlDb.notifications.update(notificationId, { read: true, read_at });

    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `UPDATE notifications SET read = 1, read_at = ? WHERE id = ?`,
                args: [read_at, notificationId]
            });
        } catch (error) {
            console.error('[ActivityService] Failed to sync notification read status:', error);
        }
    }
}

// ─── Row mappers ─────────────────────────────────────────────

function mapRowToActivity(row: any): ActivityLog {
    return {
        id: String(row.id),
        project_id: String(row.project_id),
        actor_id: String(row.actor_id),
        actor_name: row.actor_name ? String(row.actor_name) : null,
        action: String(row.action),
        entity_type: row.entity_type as ActivityLog['entity_type'],
        entity_id: String(row.entity_id),
        metadata_json: row.metadata_json ? String(row.metadata_json) : null,
        created_at: String(row.created_at)
    };
}

function mapRowToNotification(row: any): Notification {
    return {
        id: String(row.id),
        project_id: String(row.project_id),
        user_id: String(row.user_id),
        type: row.type as NotificationType,
        title: String(row.title),
        body: row.body ? String(row.body) : null,
        link_url: row.link_url ? String(row.link_url) : null,
        entity_type: row.entity_type ? String(row.entity_type) : null,
        entity_id: row.entity_id ? String(row.entity_id) : null,
        read: Boolean(row.read),
        read_at: row.read_at ? String(row.read_at) : null,
        created_at: String(row.created_at)
    };
}
