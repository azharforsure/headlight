import { turso } from './turso';

const DB_NAME = 'headlight_crawler';
const DB_VERSION = 2;
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
    robotsTxt?: { raw: string; sitemaps: string[]; crawlDelay: number } | null;
    sitemapData?: { totalUrls: number; sources: string[] } | null;
}

export interface CrawlPageSnapshot {
    sessionId: string;
    url: string;
    data: any;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
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
        };
    });
}

/** 
 * Cloud Sync: Push session to Turso
 */
async function syncSessionToCloud(session: CrawlSession) {
    try {
        await turso.execute({
            sql: `INSERT OR REPLACE INTO crawl_sessions (id, url, status, metadata) VALUES (?, ?, ?, ?)`,
            args: [session.id, session.url, session.status, JSON.stringify(session)]
        });
    } catch (err) {
        console.warn('Cloud sync failed (offline?):', err);
    }
}

export async function saveSession(session: CrawlSession): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        tx.objectStore(SESSIONS_STORE).put(session);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    // Fire and forget cloud sync
    syncSessionToCloud(session);
}

export async function getSessions(limit = 50): Promise<CrawlSession[]> {
    // Always read local sessions first; they contain the full source of truth for
    // page snapshots and are required for reliable local restore behavior.
    const db = await openDB();
    const localSessions = await new Promise<CrawlSession[]>((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
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
        req.onerror = () => reject(req.error);
    });

    const merged = new Map<string, CrawlSession>(localSessions.map((session) => [session.id, session]));

    // Merge cloud metadata as a supplement, not a replacement.
    try {
        const cloudResult = await turso.execute(`SELECT metadata FROM crawl_sessions ORDER BY created_at DESC LIMIT ${limit}`);
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
    try {
        await turso.batch([
            { sql: `DELETE FROM crawl_pages WHERE session_id = ?`, args: [id] },
            { sql: `DELETE FROM crawl_sessions WHERE id = ?`, args: [id] }
        ]);
    } catch (err) {
        console.warn('Cloud delete failed:', err);
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

export function diffSessions(oldPages: any[], newPages: any[]) {
    const oldMap = new Map(oldPages.map(p => [p.url, p]));
    const newMap = new Map(newPages.map(p => [p.url, p]));

    const added = newPages.filter(p => !oldMap.has(p.url));
    const removed = oldPages.filter(p => !newMap.has(p.url));

    const changed: any[] = [];
    let unchanged = 0;

    for (const [url, newP] of newMap.entries()) {
        const oldP = oldMap.get(url);
        if (!oldP) continue;

        const diffs: string[] = [];
        const checkFields = ['statusCode', 'title', 'metaDesc', 'h1_1', 'indexable', 'canonical', 'loadTime', 'wordCount'];
        for (const field of checkFields) {
            if (oldP[field] !== newP[field]) diffs.push(field);
        }
        if (diffs.length > 0) {
            changed.push({ url, oldData: oldP, newData: newP, changes: diffs });
        } else {
            unchanged++;
        }
    }

    return { added, removed, changed, unchanged };
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
