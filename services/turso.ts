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
            metadata TEXT
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
            metadata TEXT,
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
}
