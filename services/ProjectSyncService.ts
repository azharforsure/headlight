/**
 * ProjectSyncService.ts
 *
 * Cloud persistence for projects via Turso.
 * Used by ProjectContext for Turso-first storage with localStorage fallback.
 */

import { turso, initializeDatabase } from './turso';
import type { ProjectRecord, IndustryType } from './app-types';

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
 * Extract the root domain from a URL (e.g. "https://www.example.com/page" → "example.com")
 */
export function extractDomain(url: string): string {
    try {
        const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        return hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

/**
 * Fetch all projects for a user from Turso
 */
export async function fetchCloudProjects(userId: string): Promise<ProjectRecord[]> {
    await ensureSchema();
    const result = await turso.execute({
        sql: `SELECT * FROM projects WHERE user_id = ? ORDER BY datetime(created_at) DESC`,
        args: [userId]
    });
    return result.rows.map(mapRowToProject);
}

/**
 * Create a new project in Turso
 */
export async function createCloudProject(project: ProjectRecord): Promise<void> {
    await ensureSchema();
    const domain = project.domain || extractDomain(project.url);
    await turso.execute({
        sql: `INSERT OR REPLACE INTO projects (id, user_id, name, url, domain, industry, last_crawl_at, last_crawl_score, last_crawl_grade, crawl_count, gsc_connected, ga4_connected, auto_crawl_enabled, auto_crawl_interval, notification_email, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            project.id,
            project.user_id,
            project.name,
            project.url,
            domain,
            project.industry || 'ecommerce',
            project.last_crawl_at || null,
            project.last_crawl_score ?? null,
            project.last_crawl_grade || null,
            project.crawl_count || 0,
            project.gsc_connected ? 1 : 0,
            project.ga4_connected ? 1 : 0,
            project.auto_crawl_enabled ? 1 : 0,
            project.auto_crawl_interval || 'weekly',
            project.notification_email || null,
            project.created_at || new Date().toISOString()
        ]
    });
}

/**
 * Update specific fields of a project in Turso
 */
export async function updateCloudProject(id: string, updates: Partial<ProjectRecord>): Promise<void> {
    await ensureSchema();

    // Build dynamic SET clause from the updates object
    const fieldMapping: Record<string, string> = {
        name: 'name',
        url: 'url',
        domain: 'domain',
        industry: 'industry',
        last_crawl_at: 'last_crawl_at',
        last_crawl_score: 'last_crawl_score',
        last_crawl_grade: 'last_crawl_grade',
        crawl_count: 'crawl_count',
        gsc_connected: 'gsc_connected',
        ga4_connected: 'ga4_connected',
        auto_crawl_enabled: 'auto_crawl_enabled',
        auto_crawl_interval: 'auto_crawl_interval',
        notification_email: 'notification_email'
    };

    const setClauses: string[] = [];
    const args: any[] = [];

    for (const [key, column] of Object.entries(fieldMapping)) {
        if (key in updates) {
            let value = (updates as any)[key];
            // Convert booleans to integers for SQLite
            if (typeof value === 'boolean') value = value ? 1 : 0;
            setClauses.push(`${column} = ?`);
            args.push(value ?? null);
        }
    }

    // If URL is being updated, also update domain
    if (updates.url && !updates.domain) {
        setClauses.push('domain = ?');
        args.push(extractDomain(updates.url));
    }

    if (setClauses.length === 0) return;

    args.push(id);
    await turso.execute({
        sql: `UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`,
        args
    });
}

/**
 * Delete a project from Turso
 */
export async function deleteCloudProject(id: string): Promise<void> {
    await ensureSchema();
    await turso.execute({
        sql: `DELETE FROM projects WHERE id = ?`,
        args: [id]
    });
}

/**
 * Migrate existing localStorage projects to Turso (one-time sync)
 */
export async function migrateLocalProjectsToCloud(
    userId: string,
    localProjects: ProjectRecord[]
): Promise<number> {
    if (!localProjects.length) return 0;
    await ensureSchema();

    // Fetch existing cloud projects to avoid duplicates
    const existing = await fetchCloudProjects(userId);
    const existingIds = new Set(existing.map(p => p.id));

    let migrated = 0;
    for (const project of localProjects) {
        if (existingIds.has(project.id)) continue;
        await createCloudProject({ ...project, user_id: userId });
        migrated++;
    }
    return migrated;
}

// ─── Row mapper ─────────────────────────────────────────────

function mapRowToProject(row: any): ProjectRecord {
    return {
        id: String(row.id),
        user_id: String(row.user_id),
        name: String(row.name || ''),
        url: String(row.url || ''),
        domain: String(row.domain || ''),
        industry: (row.industry || 'ecommerce') as IndustryType,
        created_at: String(row.created_at || ''),
        last_crawl_at: row.last_crawl_at ? String(row.last_crawl_at) : undefined,
        last_crawl_score: row.last_crawl_score != null ? Number(row.last_crawl_score) : undefined,
        last_crawl_grade: row.last_crawl_grade ? String(row.last_crawl_grade) : undefined,
        crawl_count: Number(row.crawl_count || 0),
        gsc_connected: Boolean(row.gsc_connected),
        ga4_connected: Boolean(row.ga4_connected),
        auto_crawl_enabled: Boolean(row.auto_crawl_enabled),
        auto_crawl_interval: (row.auto_crawl_interval || 'weekly') as ProjectRecord['auto_crawl_interval'],
        notification_email: row.notification_email ? String(row.notification_email) : undefined,
    };
}
