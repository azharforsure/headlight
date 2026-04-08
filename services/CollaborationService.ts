/**
 * CollaborationService.ts
 * 
 * Manages comments, mentions, and reactions.
 * Syncs with Turso (cloud) and Dexie (local cache).
 */

import { turso, initializeDatabase, isCloudSyncEnabled } from './turso';
import { crawlDb } from './CrawlDatabase';
import { logActivity, createNotification } from './ActivityService';
import type { CrawlComment, CommentTargetType } from './app-types';

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
 * Create a new comment
 */
export async function createComment(
    projectId: string,
    data: {
        sessionId?: string | null,
        targetType: CommentTargetType,
        targetId: string,
        userId: string,
        userName?: string | null,
        userAvatar?: string | null,
        text: string,
        parentId?: string | null,
        mentions?: string[]
    }
): Promise<CrawlComment> {
    const comment: CrawlComment = {
        id: crypto.randomUUID(),
        project_id: projectId,
        session_id: data.sessionId || null,
        target_type: data.targetType,
        target_id: data.targetId,
        parent_id: data.parentId || null,
        user_id: data.userId,
        user_name: data.userName || null,
        user_avatar: data.userAvatar || null,
        text: data.text,
        mentions_json: data.mentions ? JSON.stringify(data.mentions) : null,
        reactions_json: null,
        attachments_json: null,
        resolved: false,
        resolved_by: null,
        resolved_at: null,
        edited_at: null,
        created_at: new Date().toISOString()
    };

    // Save locally
    await crawlDb.comments.put(comment);

    // Sync to cloud
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `INSERT INTO crawl_comments (id, project_id, session_id, target_type, target_id, parent_id, user_id, user_name, user_avatar, text, mentions_json, resolved, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    comment.id, comment.project_id, comment.session_id, comment.target_type,
                    comment.target_id, comment.parent_id, comment.user_id, comment.user_name,
                    comment.user_avatar, comment.text, comment.mentions_json,
                    comment.resolved ? 1 : 0, comment.created_at
                ]
            });
        } catch (error) {
            console.error('[CollaborationService] Failed to sync comment to cloud:', error);
        }
    }

    // Log activity
    await logActivity(projectId, {
        actorId: data.userId,
        actorName: data.userName,
        action: 'comment_added',
        entityType: 'comment',
        entityId: comment.id,
        metadata: { targetType: data.targetType, targetId: data.targetId }
    });

    // Notify mentioned users
    if (data.mentions && data.mentions.length > 0) {
        for (const mentionedUserId of data.mentions) {
            await createNotification(projectId, mentionedUserId, {
                type: 'mention',
                title: `${data.userName || 'Someone'} mentioned you in a comment`,
                body: data.text.substring(0, 100),
                linkUrl: `/project/${projectId}/collaboration?commentId=${comment.id}`, // Placeholder link
                entityType: 'comment',
                entityId: comment.id
            });
        }
    }

    return comment;
}

/**
 * Fetch comments for a specific target
 */
export async function getComments(
    projectId: string, 
    targetType: CommentTargetType, 
    targetId: string
): Promise<CrawlComment[]> {
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            const result = await turso().execute({
                sql: `SELECT * FROM crawl_comments WHERE project_id = ? AND target_type = ? AND target_id = ? ORDER BY created_at ASC`,
                args: [projectId, targetType, targetId]
            });
            const comments = result.rows.map(mapRowToComment);
            
            // Sync local cache for this target
            await crawlDb.comments
                .where({ projectId, targetType, targetId })
                .delete();
            await crawlDb.comments.bulkPut(comments);
            
            return comments;
        } catch (error) {
            console.error('[CollaborationService] Failed to fetch comments from cloud:', error);
        }
    }

    return crawlDb.comments
        .where({ projectId, targetType, targetId })
        .sortBy('createdAt');
}

/**
 * Resolve a comment thread
 */
export async function resolveComment(commentId: string, userId: string): Promise<void> {
    const resolved_at = new Date().toISOString();
    await crawlDb.comments.update(commentId, { resolved: true, resolved_by: userId, resolved_at });

    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `UPDATE crawl_comments SET resolved = 1, resolved_by = ?, resolved_at = ? WHERE id = ?`,
                args: [userId, resolved_at, commentId]
            });
        } catch (error) {
            console.error('[CollaborationService] Failed to sync comment resolution:', error);
        }
    }
}

/**
 * Add reaction to a comment
 */
export async function addReaction(commentId: string, userId: string, emoji: string): Promise<void> {
    const comment = await crawlDb.comments.get(commentId);
    if (!comment) return;

    const reactions = comment.reactions_json ? JSON.parse(comment.reactions_json) : {};
    if (!reactions[emoji]) reactions[emoji] = [];
    if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId);
    }

    const reactionsJson = JSON.stringify(reactions);
    await crawlDb.comments.update(commentId, { reactions_json: reactionsJson });

    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `UPDATE crawl_comments SET reactions_json = ? WHERE id = ?`,
                args: [reactionsJson, commentId]
            });
        } catch (error) {
            console.error('[CollaborationService] Failed to sync reaction:', error);
        }
    }
}

// ─── Row mapper ─────────────────────────────────────────────

function mapRowToComment(row: any): CrawlComment {
    return {
        id: String(row.id),
        project_id: String(row.project_id),
        session_id: row.session_id ? String(row.session_id) : null,
        target_type: row.target_type as CommentTargetType,
        target_id: String(row.target_id),
        parent_id: row.parent_id ? String(row.parent_id) : null,
        user_id: String(row.user_id),
        user_name: row.user_name ? String(row.user_name) : null,
        user_avatar: row.user_avatar ? String(row.user_avatar) : null,
        text: String(row.text),
        mentions_json: row.mentions_json ? String(row.mentions_json) : null,
        reactions_json: row.reactions_json ? String(row.reactions_json) : null,
        attachments_json: row.attachments_json ? String(row.attachments_json) : null,
        resolved: Boolean(row.resolved),
        resolved_by: row.resolved_by ? String(row.resolved_by) : null,
        resolved_at: row.resolved_at ? String(row.resolved_at) : null,
        edited_at: row.edited_at ? String(row.edited_at) : null,
        created_at: String(row.created_at)
    };
}
