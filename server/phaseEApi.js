import { createHash, createHmac, randomBytes } from 'crypto';
import { completeAI } from './aiGateway.js';

const apiRateTracker = new Map();

const jsonParse = (value, fallback) => {
    if (value === null || value === undefined || value === '') return fallback;
    try {
        return JSON.parse(String(value));
    } catch {
        return fallback;
    }
};

const createId = (prefix) => `${prefix}_${randomBytes(10).toString('hex')}`;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const signPayload = (secret, body) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

const toPaginationMeta = (total, offset, limit) => ({
    total,
    offset,
    limit,
    hasMore: offset + limit < total
});

const normalizeProject = (row) => ({
    id: String(row.id),
    name: String(row.name),
    url: String(row.url),
    domain: String(row.domain || ''),
    industry: String(row.industry || ''),
    lastCrawlAt: row.last_crawl_at ? String(row.last_crawl_at) : null,
    lastCrawlScore: row.last_crawl_score === null || row.last_crawl_score === undefined ? null : Number(row.last_crawl_score),
    lastCrawlGrade: row.last_crawl_grade ? String(row.last_crawl_grade) : null,
    crawlCount: Number(row.crawl_count || 0),
    createdAt: row.created_at ? String(row.created_at) : null
});

const normalizeRun = (row) => ({
    id: String(row.id),
    projectId: String(row.project_id),
    sessionId: String(row.session_id),
    jobId: String(row.job_id),
    status: String(row.status),
    crawlMode: String(row.crawl_mode),
    executionMode: String(row.execution_mode),
    policy: String(row.policy),
    retentionPolicy: String(row.retention_policy),
    url: String(row.url_crawled),
    summary: jsonParse(row.summary_json, {}),
    thematicScores: jsonParse(row.thematic_scores_json, {}),
    evidenceSources: jsonParse(row.evidence_sources_json, []),
    runtime: jsonParse(row.runtime_json, {}),
    topPages: jsonParse(row.top_pages_json, []),
    issueOverview: jsonParse(row.issue_overview_json, []),
    createdAt: row.created_at ? String(row.created_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null
});

const normalizeInsight = (row) => {
    const fullData = jsonParse(row.full_data_json, {});
    return {
        id: String(row.id),
        runId: String(row.run_id),
        projectId: String(row.project_id),
        sessionId: String(row.session_id),
        url: String(row.url),
        isChanged: Boolean(row.is_changed),
        isTopPage: Boolean(row.is_top_page),
        hasSevereIssues: Boolean(row.has_severe_issues),
        severityRank: Number(row.severity_rank || 0),
        priorityScore: Number(row.priority_score || 0),
        evidenceSources: jsonParse(row.evidence_sources_json, []),
        summary: jsonParse(row.summary_json, {}),
        fullData
    };
};

const normalizeIssueCluster = (row) => ({
    id: String(row.id),
    category: String(row.category),
    title: String(row.title),
    description: String(row.description),
    priority: String(row.priority),
    issueType: String(row.issue_type),
    affectedCount: Number(row.affected_count || 0),
    affectedUrls: jsonParse(row.affected_urls_json, []),
    effort: String(row.effort),
    scoreImpact: Number(row.score_impact || 0),
    aiFix: String(row.ai_fix || ''),
    trend: String(row.trend || 'new'),
    evidence: jsonParse(row.evidence_json, []),
    createdAt: row.created_at ? String(row.created_at) : null
});

const normalizeTask = (row) => ({
    id: String(row.id),
    projectId: String(row.project_id),
    sessionId: row.session_id ? String(row.session_id) : null,
    title: String(row.title),
    description: String(row.description || ''),
    status: String(row.status),
    priority: String(row.priority),
    category: String(row.category || ''),
    source: String(row.source || 'api'),
    linkedIssueId: row.linked_issue_id ? String(row.linked_issue_id) : null,
    affectedUrls: jsonParse(row.affected_urls_json, []),
    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
    assigneeName: row.assignee_name ? String(row.assignee_name) : null,
    tags: jsonParse(row.tags_json, []),
    dueDate: row.due_date ? String(row.due_date) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null
});

const matchesPageFilter = (page, query) => {
    if (query.status && Number(page.statusCode || page.fullData?.statusCode || 0) !== Number(query.status)) return false;
    if (query.filter === 'missing_meta' && page.fullData?.metaDesc) return false;
    return true;
};

async function initializePhaseETables(turso) {
    await turso.execute(`
        CREATE TABLE IF NOT EXISTS api_keys (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            scopes_json TEXT NOT NULL,
            rate_limit_per_minute INTEGER NOT NULL DEFAULT 100,
            last_used_at DATETIME,
            revoked_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await turso.execute(`
        CREATE TABLE IF NOT EXISTS webhook_endpoints (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            events_json TEXT NOT NULL,
            secret TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            last_delivery_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await turso.execute(`
        CREATE TABLE IF NOT EXISTS webhook_deliveries (
            id TEXT PRIMARY KEY,
            webhook_id TEXT NOT NULL,
            event_name TEXT NOT NULL,
            status_code INTEGER NOT NULL,
            response_body TEXT,
            latency_ms INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await turso.execute(`
        CREATE TABLE IF NOT EXISTS page_snapshots (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            url TEXT NOT NULL,
            content_hash TEXT,
            title TEXT,
            meta_desc TEXT,
            canonical TEXT,
            status_code INTEGER,
            schema_types_json TEXT,
            robots TEXT,
            snapshot_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            changed INTEGER NOT NULL DEFAULT 0,
            change_type TEXT
        )
    `);
}

async function authenticateApiKey(turso, req, scopes = []) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
        return { error: { status: 401, body: { error: 'Missing Bearer token.' } } };
    }

    const result = await turso.execute({
        sql: `SELECT * FROM api_keys WHERE token_hash = ? AND revoked_at IS NULL LIMIT 1`,
        args: [hashToken(token)]
    });

    if (result.rows.length === 0) {
        return { error: { status: 401, body: { error: 'Invalid API key.' } } };
    }

    const row = result.rows[0];
    const keyScopes = jsonParse(row.scopes_json, []);
    if (scopes.some((scope) => !keyScopes.includes(scope))) {
        return { error: { status: 403, body: { error: 'API key does not have the required scope.' } } };
    }

    const trackerKey = String(row.id);
    const now = Date.now();
    const tracker = apiRateTracker.get(trackerKey) || { minute: now, count: 0 };
    if (now - tracker.minute > 60_000) {
        tracker.minute = now;
        tracker.count = 0;
    }
    tracker.count += 1;
    apiRateTracker.set(trackerKey, tracker);

    if (tracker.count > Number(row.rate_limit_per_minute || 100)) {
        return { error: { status: 429, body: { error: 'API rate limit exceeded.' } } };
    }

    await turso.execute({
        sql: `UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [row.id]
    });

    return {
        record: {
            id: String(row.id),
            projectId: String(row.project_id),
            scopes: keyScopes
        }
    };
}

async function sendWebhook(turso, row, eventName, payload) {
    const body = JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        payload
    });
    const headers = {
        'Content-Type': 'application/json',
        'X-Headlight-Event': eventName
    };
    if (row.secret) {
        headers['X-Headlight-Signature'] = signPayload(String(row.secret), body);
    }

    const startedAt = Date.now();
    let statusCode = 500;
    let responseBody = '';

    try {
        const response = await fetch(String(row.url), {
            method: 'POST',
            headers,
            body
        });
        statusCode = response.status;
        responseBody = await response.text();
    } catch (error) {
        responseBody = error.message || 'Webhook delivery failed';
    }

    const latencyMs = Date.now() - startedAt;
    await turso.batch([
        {
            sql: `UPDATE webhook_endpoints SET last_delivery_at = CURRENT_TIMESTAMP WHERE id = ?`,
            args: [row.id]
        },
        {
            sql: `INSERT INTO webhook_deliveries (id, webhook_id, event_name, status_code, response_body, latency_ms) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [createId('whd'), row.id, eventName, statusCode, responseBody.slice(0, 1000), latencyMs]
        }
    ], 'write');
}

export async function notifyProjectWebhooks(turso, projectId, eventName, payload) {
    if (!projectId) return;
    const result = await turso.execute({
        sql: `SELECT * FROM webhook_endpoints WHERE project_id = ? AND is_active = 1`,
        args: [projectId]
    });

    const matchingHooks = result.rows.filter((row) => jsonParse(row.events_json, []).includes(eventName));
    await Promise.allSettled(matchingHooks.map((row) => sendWebhook(turso, row, eventName, payload)));
}

export async function registerPhaseERoutes(app, turso) {
    await initializePhaseETables(turso);

    app.post('/api/ai/chat', async (req, res) => {
        const { prompt, systemPrompt, maxTokens, format } = req.body || {};
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'A prompt string is required.' });
        }

        try {
            const aiResponse = await completeAI({
                prompt,
                systemPrompt: systemPrompt || 'You are Headlight, an SEO and GEO assistant. Be concise, practical, and data-aware.',
                maxTokens: Number(maxTokens || 600),
                format
            });
            return res.json({ text: aiResponse.text || 'No AI providers were available.' });
        } catch (error) {
            return res.status(500).json({ error: error.message || 'AI chat failed.' });
        }
    });

    app.get('/api/internal/projects/:projectId/api-keys', async (req, res) => {
        const result = await turso.execute({
            sql: `SELECT id, project_id, name, scopes_json, rate_limit_per_minute, last_used_at, created_at
                  FROM api_keys WHERE project_id = ? AND revoked_at IS NULL ORDER BY datetime(created_at) DESC`,
            args: [req.params.projectId]
        });
        return res.json({
            data: result.rows.map((row) => ({
                id: String(row.id),
                projectId: String(row.project_id),
                name: String(row.name),
                scopes: jsonParse(row.scopes_json, []),
                rateLimitPerMinute: Number(row.rate_limit_per_minute || 100),
                lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
                createdAt: String(row.created_at)
            }))
        });
    });

    app.post('/api/internal/projects/:projectId/api-keys', async (req, res) => {
        const { name, scopes, rateLimitPerMinute } = req.body || {};
        const token = `hl_${randomBytes(24).toString('hex')}`;
        const id = createId('key');
        const normalizedScopes = Array.isArray(scopes) && scopes.length ? scopes : ['read'];
        await turso.execute({
            sql: `INSERT INTO api_keys (id, project_id, name, token_hash, scopes_json, rate_limit_per_minute)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                req.params.projectId,
                String(name || 'Automation Key'),
                hashToken(token),
                JSON.stringify(normalizedScopes),
                Number(rateLimitPerMinute || 100)
            ]
        });
        return res.json({
            record: {
                id,
                projectId: req.params.projectId,
                name: String(name || 'Automation Key'),
                scopes: normalizedScopes,
                rateLimitPerMinute: Number(rateLimitPerMinute || 100),
                lastUsedAt: null,
                createdAt: new Date().toISOString()
            },
            token
        });
    });

    app.delete('/api/internal/projects/:projectId/api-keys/:keyId', async (req, res) => {
        await turso.execute({
            sql: `UPDATE api_keys SET revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND project_id = ?`,
            args: [req.params.keyId, req.params.projectId]
        });
        return res.json({ success: true });
    });

    app.get('/api/internal/projects/:projectId/webhooks', async (req, res) => {
        const result = await turso.execute({
            sql: `SELECT id, project_id, name, url, events_json, secret, last_delivery_at, created_at
                  FROM webhook_endpoints WHERE project_id = ? AND is_active = 1 ORDER BY datetime(created_at) DESC`,
            args: [req.params.projectId]
        });
        return res.json({
            data: result.rows.map((row) => ({
                id: String(row.id),
                projectId: String(row.project_id),
                name: String(row.name),
                url: String(row.url),
                events: jsonParse(row.events_json, []),
                secretConfigured: Boolean(row.secret),
                lastDeliveryAt: row.last_delivery_at ? String(row.last_delivery_at) : null,
                createdAt: String(row.created_at)
            }))
        });
    });

    app.post('/api/internal/projects/:projectId/webhooks', async (req, res) => {
        const { name, url, events, secret } = req.body || {};
        if (!url) return res.status(400).json({ error: 'Webhook URL is required.' });
        const id = createId('wh');
        await turso.execute({
            sql: `INSERT INTO webhook_endpoints (id, project_id, name, url, events_json, secret)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                req.params.projectId,
                String(name || 'Webhook'),
                String(url),
                JSON.stringify(Array.isArray(events) && events.length ? events : ['crawl.completed']),
                secret ? String(secret) : null
            ]
        });
        return res.json({
            record: {
                id,
                projectId: req.params.projectId,
                name: String(name || 'Webhook'),
                url: String(url),
                events: Array.isArray(events) && events.length ? events : ['crawl.completed'],
                secretConfigured: Boolean(secret),
                lastDeliveryAt: null,
                createdAt: new Date().toISOString()
            }
        });
    });

    app.delete('/api/internal/projects/:projectId/webhooks/:webhookId', async (req, res) => {
        await turso.execute({
            sql: `UPDATE webhook_endpoints SET is_active = 0 WHERE id = ? AND project_id = ?`,
            args: [req.params.webhookId, req.params.projectId]
        });
        return res.json({ success: true });
    });

    const withApiAuth = (scopes = []) => async (req, res, next) => {
        try {
            const auth = await authenticateApiKey(turso, req, scopes);
            if (auth.error) return res.status(auth.error.status).json(auth.error.body);
            req.apiKey = auth.record;
            next();
        } catch (error) {
            res.status(500).json({ error: error.message || 'API authentication failed.' });
        }
    };

    app.get('/api/v1/projects', withApiAuth(['read']), async (req, res) => {
        const result = await turso.execute({
            sql: `SELECT * FROM projects WHERE id = ? LIMIT 1`,
            args: [req.apiKey.projectId]
        });
        return res.json({ data: result.rows.map(normalizeProject), meta: { total: result.rows.length, offset: 0, limit: result.rows.length, hasMore: false } });
    });

    app.get('/api/v1/projects/:id', withApiAuth(['read']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const result = await turso.execute({
            sql: `SELECT * FROM projects WHERE id = ? LIMIT 1`,
            args: [req.params.id]
        });
        return res.json({ data: result.rows[0] ? normalizeProject(result.rows[0]) : null });
    });

    app.get('/api/v1/projects/:id/crawls', withApiAuth(['read']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const result = await turso.execute({
            sql: `SELECT * FROM crawl_runs WHERE project_id = ? ORDER BY datetime(created_at) DESC`,
            args: [req.params.id]
        });
        return res.json({ data: result.rows.map(normalizeRun), meta: { total: result.rows.length, offset: 0, limit: result.rows.length, hasMore: false } });
    });

    app.get('/api/v1/projects/:id/crawls/latest', withApiAuth(['read']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const result = await turso.execute({
            sql: `SELECT * FROM crawl_runs WHERE project_id = ? ORDER BY datetime(created_at) DESC LIMIT 1`,
            args: [req.params.id]
        });
        return res.json({ data: result.rows[0] ? normalizeRun(result.rows[0]) : null });
    });

    app.get('/api/v1/projects/:id/crawls/:crawlId', withApiAuth(['read']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const result = await turso.execute({
            sql: `SELECT * FROM crawl_runs WHERE id = ? AND project_id = ? LIMIT 1`,
            args: [req.params.crawlId, req.params.id]
        });
        return res.json({ data: result.rows[0] ? normalizeRun(result.rows[0]) : null });
    });

    app.get('/api/v1/projects/:id/crawls/:crawlId/pages', withApiAuth(['read']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
        const offset = Math.max(0, Number(req.query.offset || 0));
        const sortKey = String(req.query.sort || 'priorityScore');
        const sortDirection = String(req.query.order || 'desc') === 'asc' ? 1 : -1;
        const result = await turso.execute({
            sql: `SELECT * FROM crawl_page_insights WHERE run_id = ? ORDER BY datetime(created_at) DESC`,
            args: [req.params.crawlId]
        });
        let pages = result.rows.map(normalizeInsight).filter((page) => matchesPageFilter(page, req.query));
        pages = pages.sort((left, right) => {
            const a = left[sortKey] ?? left.fullData?.[sortKey] ?? 0;
            const b = right[sortKey] ?? right.fullData?.[sortKey] ?? 0;
            if (typeof a === 'string' || typeof b === 'string') return String(a).localeCompare(String(b)) * sortDirection;
            return (Number(a) - Number(b)) * sortDirection;
        });
        const paginated = pages.slice(offset, offset + limit);
        return res.json({ data: paginated, meta: toPaginationMeta(pages.length, offset, limit) });
    });

    app.get('/api/v1/projects/:id/crawls/:crawlId/pages/:encodedUrl', withApiAuth(['read']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const targetUrl = decodeURIComponent(req.params.encodedUrl);
        const result = await turso.execute({
            sql: `SELECT * FROM crawl_page_insights WHERE run_id = ? AND url = ? LIMIT 1`,
            args: [req.params.crawlId, targetUrl]
        });
        return res.json({ data: result.rows[0] ? normalizeInsight(result.rows[0]) : null });
    });

    app.get('/api/v1/projects/:id/crawls/:crawlId/issues', withApiAuth(['read']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const result = await turso.execute({
            sql: `SELECT * FROM crawl_issue_clusters WHERE run_id = ? ORDER BY score_impact DESC, affected_count DESC`,
            args: [req.params.crawlId]
        });
        return res.json({ data: result.rows.map(normalizeIssueCluster), meta: { total: result.rows.length, offset: 0, limit: result.rows.length, hasMore: false } });
    });

    app.get('/api/v1/projects/:id/crawls/:crawlId/compare/:otherCrawlId', withApiAuth(['read']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const [leftRun, rightRun] = await Promise.all([
            turso.execute({ sql: `SELECT * FROM crawl_runs WHERE id = ? LIMIT 1`, args: [req.params.crawlId] }),
            turso.execute({ sql: `SELECT * FROM crawl_runs WHERE id = ? LIMIT 1`, args: [req.params.otherCrawlId] })
        ]);
        const current = leftRun.rows[0] ? normalizeRun(leftRun.rows[0]) : null;
        const previous = rightRun.rows[0] ? normalizeRun(rightRun.rows[0]) : null;
        return res.json({
            data: {
                current,
                previous,
                scoreDelta: (current?.summary?.healthScore || 0) - (previous?.summary?.healthScore || 0),
                issueDelta: (current?.issueOverview?.length || 0) - (previous?.issueOverview?.length || 0)
            }
        });
    });

    app.get('/api/v1/projects/:id/tasks', withApiAuth(['read']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const result = await turso.execute({
            sql: `SELECT * FROM crawl_tasks WHERE project_id = ? ORDER BY sort_order ASC, datetime(created_at) DESC`,
            args: [req.params.id]
        });
        return res.json({ data: result.rows.map(normalizeTask), meta: { total: result.rows.length, offset: 0, limit: result.rows.length, hasMore: false } });
    });

    app.post('/api/v1/projects/:id/tasks', withApiAuth(['write']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const taskId = createId('task');
        const now = new Date().toISOString();
        const title = String(req.body?.title || 'API Task');
        await turso.execute({
            sql: `INSERT INTO crawl_tasks (id, project_id, session_id, title, description, status, priority, category, source, linked_issue_id, affected_urls_json, assignee_id, assignee_name, assignee_avatar, created_by, due_date, tags_json, sort_order, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                taskId,
                req.params.id,
                req.body?.sessionId || null,
                title,
                String(req.body?.description || ''),
                String(req.body?.status || 'todo'),
                String(req.body?.priority || 'medium'),
                String(req.body?.category || 'api'),
                'api',
                req.body?.linkedIssueId || null,
                JSON.stringify(Array.isArray(req.body?.affectedUrls) ? req.body.affectedUrls : []),
                req.body?.assigneeId || null,
                req.body?.assigneeName || null,
                req.body?.assigneeAvatar || null,
                'api',
                req.body?.dueDate || null,
                JSON.stringify(Array.isArray(req.body?.tags) ? req.body.tags : []),
                Number(req.body?.sortOrder || 0),
                now,
                now
            ]
        });
        const created = {
            id: taskId,
            projectId: req.params.id,
            sessionId: req.body?.sessionId || null,
            title,
            description: String(req.body?.description || ''),
            status: String(req.body?.status || 'todo'),
            priority: String(req.body?.priority || 'medium'),
            category: String(req.body?.category || 'api'),
            source: 'api',
            affectedUrls: Array.isArray(req.body?.affectedUrls) ? req.body.affectedUrls : [],
            createdAt: now,
            updatedAt: now
        };
        await notifyProjectWebhooks(turso, req.params.id, 'task.created', created);
        return res.status(201).json({ data: created });
    });

    app.post('/api/v1/projects/:id/crawls', withApiAuth(['crawl']), async (req, res) => {
        if (req.params.id !== req.apiKey.projectId) {
            return res.status(403).json({ error: 'API key cannot access this project.' });
        }
        const jobId = createId('job');
        const sessionId = createId('session');
        await turso.execute({
            sql: `INSERT INTO crawl_jobs (id, project_id, session_id, execution_mode, policy, retention_policy, entry_urls_json, limits_json)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                jobId,
                req.params.id,
                sessionId,
                String(req.body?.executionMode || 'api'),
                String(req.body?.policy || 'manual'),
                String(req.body?.retentionPolicy || 'standard'),
                JSON.stringify(req.body?.startUrls || []),
                JSON.stringify(req.body?.limits || {})
            ]
        });
        return res.status(202).json({
            data: {
                accepted: true,
                jobId,
                sessionId,
                status: 'queued',
                note: 'The crawl job was recorded. Use the websocket crawler session to execute the crawl.'
            }
        });
    });
}
