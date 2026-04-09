import { createClient, Client } from '@libsql/client/web';

const tursoUrl = import.meta.env.VITE_TURSO_DATABASE_URL;
const tursoToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;

/**
 * Headlight Turso Client (Lazy & Browser-Safe)
 * 
 * In the browser, libSQL's 'file:' scheme throws an error because there is no filesystem.
 * We now only initialize the cloud client if a valid remote URL is provided.
 */
export const isCloudSyncEnabled = Boolean(
    tursoUrl &&
    tursoUrl !== 'file:headlight.db' &&
    !tursoUrl.startsWith('file:')
);

// Lazily-initialized client
let _turso: Client | null = null;

function getTurso(): Client {
    if (!isCloudSyncEnabled) {
        throw new Error('Cloud sync is not configured. Set VITE_TURSO_DATABASE_URL to enable it.');
    }
    if (!_turso) {
        _turso = createClient({ url: tursoUrl!, authToken: tursoToken });
    }
    return _turso;
}

export { getTurso as turso };

/**
 * Initialize the remote Turso schema (only if cloud sync is enabled).
 * This will NOT throw in the browser even if no database is configured.
 */
export async function initializeDatabase(): Promise<void> {
    if (!isCloudSyncEnabled) {
        console.info('[Headlight] Cloud sync disabled. Using local IndexedDB only.');
        return;
    }

    const client = getTurso();

    // ─── Core Schema ───
    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_sessions (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            status TEXT DEFAULT 'idle',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            audit_modes TEXT,
            industry_filter TEXT
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_pages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            url TEXT NOT NULL,
            title TEXT,
            status_code INTEGER,
            load_time INTEGER,
            gsc_clicks INTEGER DEFAULT 0,
            gsc_impressions INTEGER DEFAULT 0,
            internal_pagerank REAL DEFAULT 0,
            health_score INTEGER DEFAULT 100,
            content_hash TEXT,
            last_modified TEXT,
            etag TEXT,
            metadata TEXT,
            ssl_valid INTEGER,
            dom_node_count INTEGER,
            has_hsts INTEGER,
            FOREIGN KEY (session_id) REFERENCES crawl_sessions(id)
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_jobs (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            execution_mode TEXT NOT NULL,
            policy TEXT NOT NULL,
            retention_policy TEXT NOT NULL,
            entry_urls_json TEXT NOT NULL,
            limits_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_runs (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            status TEXT NOT NULL,
            crawl_mode TEXT NOT NULL,
            execution_mode TEXT NOT NULL,
            policy TEXT NOT NULL,
            retention_policy TEXT NOT NULL,
            url_crawled TEXT NOT NULL,
            summary_json TEXT NOT NULL,
            thematic_scores_json TEXT NOT NULL,
            evidence_sources_json TEXT NOT NULL,
            runtime_json TEXT NOT NULL,
            top_pages_json TEXT NOT NULL,
            issue_overview_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (job_id) REFERENCES crawl_jobs(id)
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_issue_clusters (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            priority TEXT NOT NULL,
            issue_type TEXT NOT NULL,
            affected_count INTEGER NOT NULL DEFAULT 0,
            affected_urls_json TEXT NOT NULL,
            effort TEXT NOT NULL,
            score_impact INTEGER NOT NULL DEFAULT 0,
            ai_fix TEXT NOT NULL,
            trend TEXT NOT NULL DEFAULT 'new',
            evidence_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES crawl_runs(id)
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_page_insights (
            id TEXT PRIMARY KEY,
            run_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            url TEXT NOT NULL,
            is_changed INTEGER NOT NULL DEFAULT 0,
            is_top_page INTEGER NOT NULL DEFAULT 0,
            has_severe_issues INTEGER NOT NULL DEFAULT 0,
            severity_rank INTEGER NOT NULL DEFAULT 0,
            priority_score REAL NOT NULL DEFAULT 0,
            evidence_sources_json TEXT NOT NULL,
            summary_json TEXT NOT NULL,
            full_data_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES crawl_runs(id)
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS trend_snapshots (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            run_id TEXT NOT NULL,
            snapshot_at DATETIME NOT NULL,
            metrics_json TEXT NOT NULL,
            FOREIGN KEY (run_id) REFERENCES crawl_runs(id)
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS integration_connections (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            label TEXT NOT NULL,
            status TEXT NOT NULL,
            auth_type TEXT NOT NULL,
            account_label TEXT,
            scopes_json TEXT NOT NULL,
            metadata_json TEXT NOT NULL,
            selection_json TEXT NOT NULL,
            sync_json TEXT NOT NULL,
            secret_ref TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_status (
            project_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            progress REAL NOT NULL DEFAULT 0,
            current_url TEXT,
            urls_crawled INTEGER NOT NULL DEFAULT 0,
            session_id TEXT,
            event_type TEXT,
            event_message TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_audit_presets (
            project_id TEXT PRIMARY KEY,
            presets_json TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawler_configs (
            id TEXT PRIMARY KEY,
            config_json TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // ─── Collaboration & Tasks Schema (P5) ───
    await client.execute(`
        CREATE TABLE IF NOT EXISTS project_members (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            email TEXT NOT NULL,
            name TEXT,
            avatar_url TEXT,
            role TEXT NOT NULL DEFAULT 'member',
            invited_by TEXT,
            invited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            accepted_at DATETIME,
            UNIQUE(project_id, user_id)
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_comments (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            session_id TEXT,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            parent_id TEXT,
            user_id TEXT NOT NULL,
            user_name TEXT,
            user_avatar TEXT,
            text TEXT NOT NULL,
            mentions_json TEXT,
            reactions_json TEXT,
            attachments_json TEXT,
            resolved INTEGER NOT NULL DEFAULT 0,
            resolved_by TEXT,
            resolved_at DATETIME,
            edited_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            session_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            priority TEXT NOT NULL DEFAULT 'medium',
            category TEXT,
            source TEXT NOT NULL DEFAULT 'manual',
            linked_issue_id TEXT,
            affected_urls_json TEXT,
            assignee_id TEXT,
            assignee_name TEXT,
            assignee_avatar TEXT,
            created_by TEXT NOT NULL,
            due_date TEXT,
            completed_at DATETIME,
            tags_json TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS crawl_subtasks (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            completed_at DATETIME,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES crawl_tasks(id) ON DELETE CASCADE
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS activity_log (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            actor_id TEXT NOT NULL,
            actor_name TEXT,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            metadata_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS assignment_rules (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            trigger_type TEXT NOT NULL,
            trigger_condition_json TEXT NOT NULL,
            action_type TEXT NOT NULL DEFAULT 'create_task',
            assignee_id TEXT,
            assignee_strategy TEXT NOT NULL DEFAULT 'specific',
            priority_override TEXT,
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT,
            link_url TEXT,
            entity_type TEXT,
            entity_id TEXT,
            read INTEGER NOT NULL DEFAULT 0,
            read_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            domain TEXT NOT NULL DEFAULT '',
            industry TEXT NOT NULL DEFAULT 'ecommerce',
            last_crawl_at DATETIME,
            last_crawl_score INTEGER,
            last_crawl_grade TEXT,
            crawl_count INTEGER NOT NULL DEFAULT 0,
            gsc_connected INTEGER NOT NULL DEFAULT 0,
            ga4_connected INTEGER NOT NULL DEFAULT 0,
            auto_crawl_enabled INTEGER NOT NULL DEFAULT 0,
            auto_crawl_interval TEXT NOT NULL DEFAULT 'weekly',
            notification_email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS shared_reports (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            share_token TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            created_by TEXT NOT NULL,
            expires_at DATETIME,
            is_active INTEGER NOT NULL DEFAULT 1,
            white_label INTEGER NOT NULL DEFAULT 0,
            custom_logo_url TEXT,
            custom_company_name TEXT,
            include_sections_json TEXT NOT NULL DEFAULT '["summary","issues","performance","content","recommendations"]',
            password_hash TEXT,
            view_count INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON shared_reports(share_token);
    `);

    // ─── Schema Migrations (Add missing columns to existing tables) ───
    const migrate = async (sql: string) => {
        try {
            await client.execute(sql);
        } catch (e: any) {
            if (!e.message?.includes('duplicate column name') && !e.message?.includes('already exists')) {
                console.warn('[Turso] Migration failed:', sql, e.message);
            }
        }
    };

    await migrate('ALTER TABLE projects ADD COLUMN last_crawl_at DATETIME');
    await migrate('ALTER TABLE projects ADD COLUMN last_crawl_score INTEGER');
    await migrate('ALTER TABLE projects ADD COLUMN last_crawl_grade TEXT');
    await migrate('ALTER TABLE projects ADD COLUMN crawl_count INTEGER NOT NULL DEFAULT 0');
    await migrate('ALTER TABLE projects ADD COLUMN gsc_connected INTEGER NOT NULL DEFAULT 0');
    await migrate('ALTER TABLE projects ADD COLUMN ga4_connected INTEGER NOT NULL DEFAULT 0');
    await migrate('ALTER TABLE projects ADD COLUMN auto_crawl_enabled INTEGER NOT NULL DEFAULT 0');
    await migrate('ALTER TABLE projects ADD COLUMN auto_crawl_interval TEXT NOT NULL DEFAULT \'weekly\'');
    await migrate('ALTER TABLE projects ADD COLUMN notification_email TEXT');
    await migrate('ALTER TABLE crawl_sessions ADD COLUMN audit_modes TEXT');
    await migrate('ALTER TABLE crawl_sessions ADD COLUMN industry_filter TEXT');

    // Optional indexed crawl-page fields for faster filtering on common security/perf checks.
    await migrate('ALTER TABLE crawl_pages ADD COLUMN ssl_valid INTEGER');
    await migrate('ALTER TABLE crawl_pages ADD COLUMN dom_node_count INTEGER');
    await migrate('ALTER TABLE crawl_pages ADD COLUMN has_hsts INTEGER');
    await migrate('ALTER TABLE crawl_pages ADD COLUMN last_modified TEXT');
    await migrate('ALTER TABLE crawl_pages ADD COLUMN etag TEXT');
}
