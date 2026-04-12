import { turso, isCloudSyncEnabled } from './turso';
import { SEO_ISSUES_TAXONOMY } from '../components/seo-crawler/IssueTaxonomy';

const DB_NAME = 'headlight_crawler';
const DB_VERSION = 4;
const SESSIONS_STORE = 'crawl_sessions';
const PAGES_STORE = 'crawl_pages';

export interface CrawlSession {
    id: string;
    projectId?: string;
    url: string;
    startedAt: number;
    completedAt: number | null;
    lastActivityAt: number;
    checkpointAt?: number | null;
    totalPages: number;
    totalIssues: number;
    healthScore: number;
    healthGrade: string;
    config: any;
    status: 'running' | 'completed' | 'paused' | 'failed';
    crawlingMode?: 'spider' | 'list' | 'sitemap';
    entryUrls?: string[];
    runtime?: {
        stage: 'idle' | 'connecting' | 'crawling' | 'paused' | 'completed' | 'error';
        queued: number;
        activeWorkers: number;
        discovered: number;
        crawled: number;
        maxDepthSeen: number;
        concurrency: number;
        mode: 'spider' | 'list' | 'sitemap';
        rate: number;
        workerUtilization: number;
    };
    ignoredUrls?: string[];
    urlTags?: Record<string, string[]>;
    columnWidths?: Record<string, number>;
    robotsTxt?: {
        raw: string;
        sitemaps: string[];
        crawlDelay: number;
        hasLlmsTxt?: boolean;
        aiBotRules?: Record<string, boolean>;
        aiBotAccess?: Record<string, string>;
        llmsTxt?: {
            raw: string;
            sections: Array<{ heading: string; lines: string[] }>;
            allow: string[];
            disallow: string[];
            summary: string;
        } | null;
    } | null;
    sitemapData?: { totalUrls: number; sources: string[]; coverageParsed?: boolean } | null;
    auditModes?: string[];
    industryFilter?: string;
}

export interface CrawlPageSnapshot {
    sessionId: string;
    url: string;
    data: any;
}

const COMPARISON_FIELDS = [
    // Core Identity & Infrastructure
    'statusCode',
    'title',
    'metaDesc',
    'h1_1',
    'indexable',
    'canonical',
    'loadTime',
    'wordCount',
    'sizeBytes',
    'contentType',
    'crawlDepth',
    'redirectUrl',
    'redirectType',
    'inlinks',
    'internalOutlinks',
    'externalOutlinks',
    'inSitemap',

    // Search Performance (GSC)
    'gscClicks',
    'gscImpressions',
    'gscCtr',
    'gscPosition',
    'mainKeyword',
    'mainKwPosition',
    'bestKeyword',
    'bestKwPosition',

    // User Engagement (GA4)
    'ga4Sessions',
    'ga4Users',
    'ga4Views',
    'ga4BounceRate',
    'ga4Conversions',
    'ga4Revenue',
    'ga4EngagementRate',
    'ga4EngagementTimePerPage',

    // Authority & Backlinks
    'urlRating',
    'referringDomains',
    'backlinks',

    // Strategic & Quality Scores
    'opportunityScore',
    'businessValueScore',
    'authorityScore',
    'techHealthScore',
    'contentQualityScore',
    'searchVisibilityScore',
    'engagementScore',

    // AI Intelligence & Discoverability
    'topicCluster',
    'primaryTopic',
    'searchIntent',
    'sentiment',
    'eeatScore',
    'originalityScore',
    'aiLikelihood',
    'passageReadiness',
    'voiceSearchScore',
    'geoScore',
    'citationWorthiness',
    'aiOverviewFit',
    'hasLlmsTxt',
    'answerBoxReady',

    // Technical & Web Vitals
    'fieldLcp',
    'fieldCls',
    'fieldInp',
    'lighthousePerformance',
    'lighthouseSeo',
    'domNodeCount',
    'jsRenderDiff',

    // Security & Infrastructure
    'securityGrade',
    'securityScore',
    'sslGrade',
    'sslValid',
    'hasHsts',
    'hasCsp',
    'hasXFrameOptions',
    'hasXContentTypeOptions',

    // Crawl Logistics & Sustainability
    'googlebotVisits30d',
    'botResponseTime',
    'aiBotVisits30d',
    'visualChangeDetected',
    'visualDiffPercent',
    'co2Mg',
    'carbonRating'
];

const normalizeComparableValue = (value: any) => {
    if (Array.isArray(value)) {
        return JSON.stringify([...value].map((item) => String(item ?? '')).sort());
    }
    if (value && typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return value ?? null;
};

const normalizeDiffUrl = (rawUrl: string) => {
    try {
        const url = new URL(String(rawUrl || '').trim());
        const hostname = url.hostname.replace(/^www\./i, '').toLowerCase();
        const pathname = (url.pathname || '/').replace(/\/+$/, '') || '/';
        return `${hostname}${pathname}`;
    } catch {
        return String(rawUrl || '')
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/+$/, '');
    }
};

const valuesEqual = (left: any, right: any) => normalizeComparableValue(left) === normalizeComparableValue(right);

const collectPageIssues = (page: any) => {
    const issues: Array<{ id: string; label: string; type: 'error' | 'warning' | 'notice' }> = [];

    for (const group of SEO_ISSUES_TAXONOMY) {
        for (const issue of group.issues) {
            try {
                if (issue.condition(page)) {
                    issues.push({
                        id: issue.id,
                        label: issue.label,
                        type: issue.type as 'error' | 'warning' | 'notice'
                    });
                }
            } catch {
                // Ignore malformed issue evaluators for this snapshot.
            }
        }
    }

    return issues;
};

const hasStructuredData = (page: any) => {
    const schema = Array.isArray(page?.schema) ? page.schema : [];
    const schemaTypes = Array.isArray(page?.schemaTypes) ? page.schemaTypes : [];
    return schema.length > 0 || schemaTypes.length > 0;
};

const average = (values: number[]) => {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getSessionHealthScore = (pages: any[], session?: CrawlSession) => {
    if (typeof session?.healthScore === 'number') return session.healthScore;
    return Math.round(average(
        pages
            .map((page) => Number(page?.healthScore ?? page?.score ?? 0))
            .filter((value) => Number.isFinite(value) && value > 0)
    ));
};

const buildSummaryMetrics = (pages: any[], session?: CrawlSession) => {
    const issues = pages.flatMap((page) => collectPageIssues(page));
    const lcpValues = pages
        .map((page) => Number(page?.lcp || page?.fieldLcp || 0))
        .filter((value) => Number.isFinite(value) && value > 0);
    const pagesWithSchema = pages.filter((page) => hasStructuredData(page)).length;

    // Enterprise Summaries
    const totalClicks = pages.reduce((sum, p) => sum + (Number(p.gscClicks) || 0), 0);
    const totalSessions = pages.reduce((sum, p) => sum + (Number(p.ga4Sessions) || 0), 0);
    const avgGeoScore = average(pages.map(p => Number(p.geoScore || 0)).filter(v => v > 0));
    const avgContentQuality = average(pages.map(p => Number(p.contentQualityScore || 0)).filter(v => v > 0));
    const googlebotVisits = pages.reduce((sum, p) => sum + (Number(p.googlebotVisits30d) || 0), 0);

    return {
        totalPages: pages.length,
        healthScore: getSessionHealthScore(pages, session),
        criticalIssues: issues.filter((issue) => issue.type === 'error').length,
        warnings: issues.filter((issue) => issue.type === 'warning').length,
        avgLcp: Math.round(average(lcpValues)),
        schemaCoverage: pages.length > 0 ? Math.round((pagesWithSchema / pages.length) * 100) : 0,
        notFoundPages: pages.filter((page) => Number(page?.statusCode || 0) === 404).length,
        totalClicks,
        totalSessions,
        avgGeoScore: Math.round(avgGeoScore),
        avgContentQuality: Math.round(avgContentQuality),
        googlebotVisits
    };
};

const buildSummaryDelta = (oldPages: any[], newPages: any[], oldSession?: CrawlSession, newSession?: CrawlSession) => {
    const oldSummary = buildSummaryMetrics(oldPages, oldSession);
    const newSummary = buildSummaryMetrics(newPages, newSession);

    return Object.fromEntries(
        Object.keys(oldSummary).map((key) => {
            const oldValue = oldSummary[key as keyof typeof oldSummary];
            const newValue = newSummary[key as keyof typeof newSummary];
            return [
                key,
                {
                    old: oldValue,
                    new: newValue,
                    delta: newValue - oldValue
                }
            ];
        })
    );
};

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => {
            reject(req.error);
        };
        req.onsuccess = () => {
            resolve(req.result);
        };
        req.onupgradeneeded = (e) => {
            const oldVersion = e.oldVersion;
            const db = (e.target as IDBOpenDBRequest).result;

            // Fresh install or legacy upgrade
            if (oldVersion < 1) {
                if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
                    const sessStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
                    sessStore.createIndex('url', 'url', { unique: false });
                    sessStore.createIndex('startedAt', 'startedAt', { unique: false });
                    sessStore.createIndex('status', 'status', { unique: false });
                    sessStore.createIndex('lastActivityAt', 'lastActivityAt', { unique: false });
                }
                if (!db.objectStoreNames.contains(PAGES_STORE)) {
                    const pageStore = db.createObjectStore(PAGES_STORE, { keyPath: ['sessionId', 'url'] });
                    pageStore.createIndex('sessionId', 'sessionId', { unique: false });
                }
            }

            // Version 2+ handling (Ensure all indexes exist)
            if (oldVersion < 2) {
                const tx = (e.target as IDBOpenDBRequest).transaction!;
                const sessStore = tx.objectStore(SESSIONS_STORE);
                if (!sessStore.indexNames.contains('url')) sessStore.createIndex('url', 'url', { unique: false });
                if (!sessStore.indexNames.contains('startedAt')) sessStore.createIndex('startedAt', 'startedAt', { unique: false });
                if (!sessStore.indexNames.contains('status')) sessStore.createIndex('status', 'status', { unique: false });
                if (!sessStore.indexNames.contains('lastActivityAt')) sessStore.createIndex('lastActivityAt', 'lastActivityAt', { unique: false });
                
                if (db.objectStoreNames.contains(PAGES_STORE)) {
                    const pageStore = tx.objectStore(PAGES_STORE);
                    if (!pageStore.indexNames.contains('sessionId')) pageStore.createIndex('sessionId', 'sessionId', { unique: false });
                }
            }

            // Version 3 specific changes (Opening at v3 is enough to fix the crash, add any new logic here if needed)
            if (oldVersion < 3) {
            }

            // Version 4 aligns the local history store version with the
            // already-upgraded database observed in production browsers.
            if (oldVersion < 4) {
            }
        };
        req.onblocked = () => {
        };
    });
}

/** 
 * Cloud Sync: Push session to Turso
 */
async function syncSessionToCloud(session: CrawlSession) {
    if (!isCloudSyncEnabled) return;
    try {
        await turso().execute({
            sql: `INSERT OR REPLACE INTO crawl_sessions (id, url, status, metadata, audit_modes, industry_filter) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                session.id,
                session.url,
                session.status,
                JSON.stringify(session),
                JSON.stringify(session.auditModes || []),
                session.industryFilter || null
            ]
        });
    } catch (err) {
        console.warn('Cloud sync failed (offline?):', err);
    }
}

export async function saveSession(session: CrawlSession): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(SESSIONS_STORE, 'readwrite');
            tx.objectStore(SESSIONS_STORE).put(session);
            tx.oncomplete = () => {
                resolve();
            };
            tx.onerror = () => {
                reject(tx.error);
            };
        });
    } catch (err) {
        throw err;
    }

    // Fire and forget cloud sync
    syncSessionToCloud(session);
}

export async function getSessions(limit = 50): Promise<CrawlSession[]> {
    // Always read local sessions first; they contain the full source of truth for
    // page snapshots and are required for reliable local restore behavior.
    let localSessions: CrawlSession[] = [];
    try {
        const db = await openDB();
        localSessions = await new Promise<CrawlSession[]>((resolve, reject) => {
            const tx = db.transaction(SESSIONS_STORE, 'readonly');
            const store = tx.objectStore(SESSIONS_STORE);
            
            // Check if the index exists
            
            const idx = store.index('startedAt');
            const req = idx.openCursor(null, 'prev');
            const results: CrawlSession[] = [];
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            req.onerror = () => {
                reject(req.error);
            };
        });
    } catch (err) {
        return [];
    }

    const merged = new Map<string, CrawlSession>(localSessions.map((session) => [session.id, session]));

    // Merge cloud metadata as a supplement, not a replacement.
    if (isCloudSyncEnabled) {
        try {
            const cloudResult = await turso().execute(`SELECT metadata FROM crawl_sessions ORDER BY created_at DESC LIMIT ${limit}`);
            if (cloudResult.rows.length > 0) {
                cloudResult.rows.forEach((row) => {
                    try {
                        const session = JSON.parse(row.metadata as string) as CrawlSession;
                        if (!merged.has(session.id)) {
                            merged.set(session.id, session);
                        }
                    } catch {
                        // Ignore malformed cloud metadata rows and keep local state intact.
                    }
                });
            }
        } catch (err) {
            console.warn('Failed to fetch sessions from cloud, using local sessions:', err);
        }
    }

    return Array.from(merged.values())
        .sort((a, b) => (Number(b.startedAt) || 0) - (Number(a.startedAt) || 0))
        .slice(0, limit);
}

export async function getSession(id: string): Promise<CrawlSession | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const req = tx.objectStore(SESSIONS_STORE).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function deleteSession(id: string): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([SESSIONS_STORE, PAGES_STORE], 'readwrite');
        tx.objectStore(SESSIONS_STORE).delete(id);
        const pageStore = tx.objectStore(PAGES_STORE);
        const idx = pageStore.index('sessionId');
        const cursorReq = idx.openCursor(IDBKeyRange.only(id));
        cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    // Cloud delete
    if (isCloudSyncEnabled) {
        try {
            await turso().batch([
                { sql: `DELETE FROM crawl_pages WHERE session_id = ?`, args: [id] },
                { sql: `DELETE FROM crawl_sessions WHERE id = ?`, args: [id] }
            ]);
        } catch (err) {
            console.warn('Cloud delete failed:', err);
        }
    }
}

export async function upsertPages(sessionId: string, pages: any[]): Promise<void> {
    if (pages.length === 0) return;

    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(PAGES_STORE, 'readwrite');
        const store = tx.objectStore(PAGES_STORE);
        for (const page of pages) {
            store.put({ sessionId, url: page.url, data: page });
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    // Cloud sync has been explicitly disabled for raw crawl_pages to keep operational costs zero.
    // Dexie handles local persistence. Turso handles only aggregated metadata via CrawlPersistenceService.
}

export async function getPages(sessionId: string): Promise<any[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(PAGES_STORE, 'readonly');
        const idx = tx.objectStore(PAGES_STORE).index('sessionId');
        const req = idx.getAll(IDBKeyRange.only(sessionId));
        req.onsuccess = () => resolve((req.result || []).map(r => r.data));
        req.onerror = () => reject(req.error);
    });
}

export function diffSessions(oldPages: any[], newPages: any[], oldSession?: CrawlSession, newSession?: CrawlSession) {
    if (oldPages.length === 0 && newPages.length === 0) {
        return {
            added: [],
            removed: [],
            changed: [],
            unchanged: 0,
            issuesFixed: [],
            newIssues: [],
            summaryDelta: buildSummaryDelta(oldPages, newPages, oldSession, newSession),
            oldSessionId: oldSession?.id || null,
            newSessionId: newSession?.id || null,
            noChanges: true,
            message: 'No changes detected.'
        };
    }

    if (oldPages.length === 0) {
        return {
            added: newPages,
            removed: [],
            changed: [],
            unchanged: 0,
            issuesFixed: [],
            newIssues: [],
            summaryDelta: buildSummaryDelta(oldPages, newPages, oldSession, newSession),
            oldSessionId: oldSession?.id || null,
            newSessionId: newSession?.id || null
        };
    }

    if (newPages.length === 0) {
        return {
            added: [],
            removed: oldPages,
            changed: [],
            unchanged: 0,
            issuesFixed: [],
            newIssues: [],
            summaryDelta: buildSummaryDelta(oldPages, newPages, oldSession, newSession),
            oldSessionId: oldSession?.id || null,
            newSessionId: newSession?.id || null
        };
    }

    const oldMap = new Map(oldPages.map((p) => [normalizeDiffUrl(p.url), p]));
    const newMap = new Map(newPages.map((p) => [normalizeDiffUrl(p.url), p]));

    const added = newPages.filter((p) => !oldMap.has(normalizeDiffUrl(p.url)));
    const removed = oldPages.filter((p) => !newMap.has(normalizeDiffUrl(p.url)));

    const changed: any[] = [];
    const issuesFixed: any[] = [];
    const newIssues: any[] = [];
    let unchanged = 0;

    for (const [url, newP] of newMap.entries()) {
        const oldP = oldMap.get(url);
        if (!oldP) continue;

        const fieldChanges = COMPARISON_FIELDS
            .filter((field) => !valuesEqual(oldP[field], newP[field]))
            .map((field) => ({
                field,
                oldValue: oldP[field] ?? null,
                newValue: newP[field] ?? null
            }));

        const oldIssueMap = new Map(collectPageIssues(oldP).map((issue) => [issue.id, issue]));
        const newIssueMap = new Map(collectPageIssues(newP).map((issue) => [issue.id, issue]));

        const fixedIssues = [...oldIssueMap.entries()]
            .filter(([issueId]) => !newIssueMap.has(issueId))
            .map(([, issue]) => issue);

        const addedIssues = [...newIssueMap.entries()]
            .filter(([issueId]) => !oldIssueMap.has(issueId))
            .map(([, issue]) => issue);

        if (fieldChanges.length > 0 || fixedIssues.length > 0 || addedIssues.length > 0) {
            changed.push({
                url,
                oldData: oldP,
                newData: newP,
                changes: fieldChanges.map((entry) => entry.field),
                fieldChanges,
                fixedIssues,
                addedIssues
            });
        } else {
            unchanged++;
        }

        if (fixedIssues.length > 0) {
            issuesFixed.push({
                url,
                issues: fixedIssues,
                oldData: oldP,
                newData: newP
            });
        }

        if (addedIssues.length > 0) {
            newIssues.push({
                url,
                issues: addedIssues,
                oldData: oldP,
                newData: newP
            });
        }
    }

    const noChanges = added.length === 0 && removed.length === 0 && changed.length === 0;
    return {
        added,
        removed,
        changed,
        unchanged,
        issuesFixed,
        newIssues,
        summaryDelta: buildSummaryDelta(oldPages, newPages, oldSession, newSession),
        oldSessionId: oldSession?.id || null,
        newSessionId: newSession?.id || null,
        noChanges,
        message: noChanges ? 'No changes detected.' : undefined
    };
}

export async function exportSessionData(sessionId: string): Promise<Blob> {
    const session = await getSession(sessionId);
    const pages = await getPages(sessionId);
    
    const dump = {
        session,
        pages,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    const jsonString = JSON.stringify(dump);
    return new Blob([jsonString], { type: 'application/json' });
}

export async function importSessionData(blob: Blob): Promise<string> {
    const text = await blob.text();
    const dump = JSON.parse(text);
    
    if (!dump.session || !dump.session.id || !dump.pages) {
        throw new Error('Invalid crawl dump format.');
    }
    
    await saveSession(dump.session);
    await upsertPages(dump.session.id, dump.pages);
    
    return dump.session.id;
}

export function generateSessionId(): string {
    return `crawl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
