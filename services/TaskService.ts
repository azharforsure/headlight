/**
 * TaskService.ts
 * 
 * Manages tasks and subtasks.
 * Syncs with Turso (cloud) and Dexie (local cache).
 */

import { turso, initializeDatabase, isCloudSyncEnabled } from './turso';
import { crawlDb } from './CrawlDatabase';
import { logActivity, createNotification } from './ActivityService';
import type { CrawlTask, CrawlSubtask, TaskStatus, TaskPriority, TaskSource } from './app-types';

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
 * Create a new task
 */
export async function createTask(
    projectId: string,
    data: {
        sessionId?: string | null,
        title: string,
        description?: string | null,
        priority?: TaskPriority,
        category?: string | null,
        source?: TaskSource,
        linkedIssueId?: string | null,
        affectedUrls?: string[],
        assigneeId?: string | null,
        assigneeName?: string | null,
        assigneeAvatar?: string | null,
        createdBy: string,
        dueDate?: string | null,
        tags?: string[]
    }
): Promise<CrawlTask> {
    const task: CrawlTask = {
        id: crypto.randomUUID(),
        project_id: projectId,
        session_id: data.sessionId || null,
        title: data.title,
        description: data.description || null,
        status: 'todo',
        priority: data.priority || 'medium',
        category: data.category || null,
        source: data.source || 'manual',
        linked_issue_id: data.linkedIssueId || null,
        affected_urls_json: data.affectedUrls ? JSON.stringify(data.affectedUrls) : null,
        assignee_id: data.assigneeId || null,
        assignee_name: data.assigneeName || null,
        assignee_avatar: data.assigneeAvatar || null,
        created_by: data.createdBy,
        due_date: data.dueDate || null,
        completed_at: null,
        tags_json: data.tags ? JSON.stringify(data.tags) : null,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Save locally
    await crawlDb.tasks.put(task);

    // Sync to cloud
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `INSERT INTO crawl_tasks (id, project_id, session_id, title, description, status, priority, category, source, linked_issue_id, affected_urls_json, assignee_id, assignee_name, assignee_avatar, created_by, due_date, tags_json, sort_order, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    task.id, task.project_id, task.session_id, task.title, task.description,
                    task.status, task.priority, task.category, task.source,
                    task.linked_issue_id, task.affected_urls_json, task.assignee_id,
                    task.assignee_name, task.assignee_avatar, task.created_by,
                    task.due_date, task.tags_json, task.sort_order,
                    task.created_at, task.updated_at
                ]
            });
        } catch (error) {
            console.error('[TaskService] Failed to sync task to cloud:', error);
        }
    }

    // Log activity
    await logActivity(projectId, {
        actorId: data.createdBy,
        action: 'task_created',
        entityType: 'task',
        entityId: task.id,
        metadata: { title: task.title }
    });

    // Notify assignee
    if (task.assignee_id) {
        await createNotification(projectId, task.assignee_id, {
            type: 'task_assigned',
            title: `New task assigned: ${task.title}`,
            body: task.priority === 'critical' ? 'High priority task requires attention.' : null,
            linkUrl: `/project/${projectId}/tasks?taskId=${task.id}`,
            entityType: 'task',
            entityId: task.id
        });
    }

    return task;
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, updates: Partial<CrawlTask>): Promise<void> {
    const updatedAt = new Date().toISOString();
    const finalUpdates = { ...updates, updated_at: updatedAt };
    
    if (updates.status === 'done' && !updates.completed_at) {
        finalUpdates.completed_at = updatedAt;
    }

    await crawlDb.tasks.update(taskId, finalUpdates);

    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            
            // Generate SET clause
            const setClauses: string[] = [];
            const args: any[] = [];
            
            for (const [key, value] of Object.entries(finalUpdates)) {
                if (key === 'id' || key === 'project_id') continue;
                setClauses.push(`${key} = ?`);
                args.push(value === undefined ? null : value);
            }
            
            if (setClauses.length > 0) {
                args.push(taskId);
                await turso().execute({
                    sql: `UPDATE crawl_tasks SET ${setClauses.join(', ')} WHERE id = ?`,
                    args
                });
            }
        } catch (error) {
            console.error('[TaskService] Failed to sync task update to cloud:', error);
        }
    }
}

/**
 * Fetch tasks for a project
 */
export async function getTasks(projectId: string): Promise<CrawlTask[]> {
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            const result = await turso().execute({
                sql: `SELECT * FROM crawl_tasks WHERE project_id = ? ORDER BY sort_order ASC, created_at DESC`,
                args: [projectId]
            });
            const tasks = result.rows.map(mapRowToTask);
            
            // Sync local cache
            await crawlDb.tasks.where('projectId').equals(projectId).delete();
            await crawlDb.tasks.bulkPut(tasks);
            
            return tasks;
        } catch (error) {
            console.error('[TaskService] Failed to fetch tasks from cloud:', error);
        }
    }

    return crawlDb.tasks.where('projectId').equals(projectId).toArray();
}

/**
 * Manage subtasks
 */
export async function createSubtask(taskId: string, title: string): Promise<CrawlSubtask> {
    const subtask: CrawlSubtask = {
        id: crypto.randomUUID(),
        task_id: taskId,
        title,
        completed: false,
        completed_at: null,
        sort_order: 0,
        created_at: new Date().toISOString()
    };

    await crawlDb.subtasks.put(subtask);

    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `INSERT INTO crawl_subtasks (id, task_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)`,
                args: [subtask.id, subtask.task_id, subtask.title, 0, subtask.created_at]
            });
        } catch (error) {
            console.error('[TaskService] Failed to sync subtask to cloud:', error);
        }
    }

    return subtask;
}

export async function toggleSubtask(subtaskId: string, completed: boolean): Promise<void> {
    const completedAt = completed ? new Date().toISOString() : null;
    await crawlDb.subtasks.update(subtaskId, { completed, completed_at: completedAt });

    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `UPDATE crawl_subtasks SET completed = ?, completed_at = ? WHERE id = ?`,
                args: [completed ? 1 : 0, completedAt, subtaskId]
            });
        } catch (error) {
            console.error('[TaskService] Failed to sync subtask toggle:', error);
        }
    }
}

// ─── Row mappers ─────────────────────────────────────────────

function mapRowToTask(row: any): CrawlTask {
    return {
        id: String(row.id),
        project_id: String(row.project_id),
        session_id: row.session_id ? String(row.session_id) : null,
        title: String(row.title),
        description: row.description ? String(row.description) : null,
        status: row.status as TaskStatus,
        priority: row.priority as TaskPriority,
        category: row.category ? String(row.category) : null,
        source: row.source as TaskSource,
        linked_issue_id: row.linked_issue_id ? String(row.linked_issue_id) : null,
        affected_urls_json: row.affected_urls_json ? String(row.affected_urls_json) : null,
        assignee_id: row.assignee_id ? String(row.assignee_id) : null,
        assignee_name: row.assignee_name ? String(row.assignee_name) : null,
        assignee_avatar: row.assignee_avatar ? String(row.assignee_avatar) : null,
        created_by: String(row.created_by),
        due_date: row.due_date ? String(row.due_date) : null,
        completed_at: row.completed_at ? String(row.completed_at) : null,
        tags_json: row.tags_json ? String(row.tags_json) : null,
        sort_order: Number(row.sort_order || 0),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at)
    };
}
