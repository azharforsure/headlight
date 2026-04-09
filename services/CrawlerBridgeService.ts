import { turso } from './turso';

/**
 * CrawlerBridgeService
 * Central data access layer for app views to consume crawler data from Turso.
 */

// Dashboard
export async function getDashboardCrawlSummary(projectId: string) {
    const client = turso();
    const runResult = await client.execute({
        sql: `SELECT * FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1`,
        args: [projectId]
    });
    
    if (runResult.rows.length === 0) return null;
    
    const run = runResult.rows[0];
    const summary = JSON.parse(String(run.summary_json || '{}'));
    
    const trendResult = await client.execute({
        sql: `SELECT metrics_json, snapshot_at FROM trend_snapshots WHERE project_id = ? ORDER BY snapshot_at ASC LIMIT 30`,
        args: [projectId]
    });
    
    return {
        runId: run.id,
        sessionId: run.session_id,
        summary,
        thematicScores: JSON.parse(String(run.thematic_scores_json || '{}')),
        issueOverview: JSON.parse(String(run.issue_overview_json || '{}')),
        trendSnapshots: trendResult.rows.map(row => ({
            at: row.snapshot_at,
            metrics: JSON.parse(String(row.metrics_json || '{}'))
        })),
        completedAt: run.completed_at
    };
}

// Site Audit — Overview & Issues
export async function getAuditIssues(projectId: string, runId?: string) {
    const client = turso();
    let sql = `SELECT * FROM crawl_issue_clusters WHERE project_id = ?`;
    const args: any[] = [projectId];
    
    if (runId) {
        sql += ` AND run_id = ?`;
        args.push(runId);
    } else {
        // Get issues from the latest run
        sql += ` AND run_id = (SELECT id FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1)`;
        args.push(projectId);
    }
    
    const result = await client.execute({ sql, args });
    return result.rows.map(row => ({
        id: row.id,
        category: row.category,
        title: row.title,
        description: row.description,
        priority: row.priority,
        type: row.issue_type,
        count: row.affected_count,
        affectedUrls: JSON.parse(String(row.affected_urls_json || '[]')),
        effort: row.effort,
        impact: row.score_impact,
        aiFix: row.ai_fix,
        trend: row.trend
    }));
}

// Site Audit — Pages Explorer
export async function getPagesList(projectId: string, sessionId: string, filters?: any) {
    const client = turso();
    // Simplified query, in a real app this would be more complex with dynamic WHERE clauses
    const result = await client.execute({
        sql: `SELECT p.*, i.priority_score, i.summary_json as ai_summary 
              FROM crawl_pages p
              LEFT JOIN crawl_page_insights i ON p.url = i.url AND p.session_id = i.session_id
              WHERE p.session_id = ?`,
        args: [sessionId]
    });
    
    return result.rows.map(row => ({
        ...row,
        metadata: JSON.parse(String(row.metadata || '{}')),
        aiSummary: JSON.parse(String(row.ai_summary || '{}'))
    }));
}

// Keywords
export async function getExtractedKeywords(projectId: string) {
    const client = turso();
    // This is a placeholder for a more complex query that extracts keywords from page metadata
    const result = await client.execute({
        sql: `SELECT url, title, metadata FROM crawl_pages 
              WHERE session_id = (SELECT session_id FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1)`,
        args: [projectId]
    });
    
    return result.rows.map(row => {
        const meta = JSON.parse(String(row.metadata || '{}'));
        return {
            url: row.url,
            title: row.title,
            mainKeyword: meta.mainKeyword || '',
            bestKeyword: meta.bestKeyword || '',
            gscClicks: row.gsc_clicks,
            gscImpressions: row.gsc_impressions
        };
    });
}

// Content
export async function getContentQuality(projectId: string) {
    const client = turso();
    const result = await client.execute({
        sql: `SELECT url, title, health_score, metadata FROM crawl_pages 
              WHERE session_id = (SELECT session_id FROM crawl_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1)`,
        args: [projectId]
    });
    
    return result.rows.map(row => {
        const meta = JSON.parse(String(row.metadata || '{}'));
        return {
            url: row.url,
            title: row.title,
            score: row.health_score,
            wordCount: meta.wordCount || 0,
            readability: meta.readability || 'Normal',
            contentDecay: meta.contentDecay || 0
        };
    });
}

// Internal Link Graph
export async function getInternalLinkGraph(projectId: string, sessionId: string) {
    const client = turso();
    const result = await client.execute({
        sql: `SELECT url, internal_pagerank, metadata FROM crawl_pages WHERE session_id = ?`,
        args: [sessionId]
    });
    
    return result.rows.map(row => {
        const meta = JSON.parse(String(row.metadata || '{}'));
        return {
            url: row.url,
            rank: row.internal_pagerank,
            inlinks: meta.inlinksCount || 0,
            outlinks: meta.outlinksCount || 0
        };
    });
}
