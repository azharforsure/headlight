/**
 * TeamService.ts
 * 
 * Manages project members and roles.
 * Syncs with Turso (cloud) and Dexie (local cache).
 */

import { turso, initializeDatabase, isCloudSyncEnabled } from './turso';
import { crawlDb } from './CrawlDatabase';
import type { ProjectMember, TeamRole } from './app-types';

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
 * Fetch all members for a project
 */
export async function getMembers(projectId: string): Promise<ProjectMember[]> {
    // 1. Try cloud if enabled
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            const result = await turso().execute({
                sql: `SELECT * FROM project_members WHERE project_id = ?`,
                args: [projectId]
            });
            const members = result.rows.map(mapRowToMember);
            
            // Update local cache
            await crawlDb.members.where('projectId').equals(projectId).delete();
            await crawlDb.members.bulkPut(members);
            
            return members;
        } catch (error) {
            console.error('[TeamService] Failed to fetch members from cloud:', error);
        }
    }

    // 2. Fallback to local cache
    return crawlDb.members.where('projectId').equals(projectId).toArray();
}

/**
 * Invite a member to a project
 */
export async function inviteMember(
    projectId: string, 
    data: { email: string, role: TeamRole, invitedBy: string, name?: string }
): Promise<ProjectMember> {
    const member: ProjectMember = {
        id: crypto.randomUUID(),
        project_id: projectId,
        user_id: '', // Empty until they accept/login
        email: data.email,
        name: data.name || null,
        avatar_url: null,
        role: data.role,
        invited_by: data.invitedBy,
        invited_at: new Date().toISOString(),
        accepted_at: null
    };

    // Save locally
    await crawlDb.members.put(member);

    // Sync to cloud
    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `INSERT INTO project_members (id, project_id, user_id, email, name, avatar_url, role, invited_by, invited_at, accepted_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    member.id, member.project_id, member.user_id, member.email, 
                    member.name, member.avatar_url, member.role, 
                    member.invited_by, member.invited_at, member.accepted_at
                ]
            });
        } catch (error) {
            console.error('[TeamService] Failed to sync invite to cloud:', error);
        }
    }

    return member;
}

/**
 * Update a member's role
 */
export async function updateMemberRole(memberId: string, role: TeamRole): Promise<void> {
    await crawlDb.members.update(memberId, { role });

    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `UPDATE project_members SET role = ? WHERE id = ?`,
                args: [role, memberId]
            });
        } catch (error) {
            console.error('[TeamService] Failed to sync role update to cloud:', error);
        }
    }
}

/**
 * Remove a member from a project
 */
export async function removeMember(memberId: string): Promise<void> {
    await crawlDb.members.delete(memberId);

    if (isCloudSyncEnabled) {
        try {
            await ensureSchema();
            await turso().execute({
                sql: `DELETE FROM project_members WHERE id = ?`,
                args: [memberId]
            });
        } catch (error) {
            console.error('[TeamService] Failed to sync member removal to cloud:', error);
        }
    }
}

/**
 * Get owners for round-robin / category assignment
 */
export async function getCategoryOwners(projectId: string): Promise<ProjectMember[]> {
    const members = await getMembers(projectId);
    // For now, any admin/manager/owner can be a category owner
    return members.filter(m => ['owner', 'admin', 'manager'].includes(m.role));
}

// ─── Row mapper ─────────────────────────────────────────────

function mapRowToMember(row: any): ProjectMember {
    return {
        id: String(row.id),
        project_id: String(row.project_id),
        user_id: String(row.user_id || ''),
        email: String(row.email),
        name: row.name ? String(row.name) : null,
        avatar_url: row.avatar_url ? String(row.avatar_url) : null,
        role: (row.role || 'member') as TeamRole,
        invited_by: row.invited_by ? String(row.invited_by) : null,
        invited_at: String(row.invited_at),
        accepted_at: row.accepted_at ? String(row.accepted_at) : null,
    };
}
