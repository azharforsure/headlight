import { initializeDatabase, turso, isCloudSyncEnabled } from './turso';

export type CrawlerIntegrationProvider =
    | 'google'            // UNIFIED: replaces separate googleSearchConsole + googleAnalytics
    | 'bingWebmaster'
    | 'googleBusinessProfile'
    | 'backlinkUpload'    // NEW: CSV upload
    | 'keywordUpload'     // NEW: CSV upload
    | 'sitemapUpload'     // NEW: file upload
    | 'contentInventory'  // NEW: CSV upload
    | 'crawlExport';      // NEW: import/export

export type CrawlerIntegrationAuthType = 'oauth' | 'token' | 'property' | 'upload';
export type CrawlerIntegrationOwnership = 'anonymous' | 'project';
export type CrawlerIntegrationStatus = 'connected' | 'configured' | 'degraded' | 'error';
export type CrawlerIntegrationSyncStatus = 'idle' | 'syncing' | 'success' | 'partial' | 'error';

export interface CrawlerIntegrationSelection {
    siteUrl?: string;
    propertyId?: string;
    profileId?: string;
}

export interface CrawlerIntegrationSyncState {
    status: CrawlerIntegrationSyncStatus;
    lastSyncedAt?: number;
    lastAttemptedAt?: number;
    coverage?: number;
    coverageLabel?: string;
    errorCode?: string;
    errorMessage?: string;
    // For migration compatibility
    siteUrl?: string;
    propertyId?: string;
}

export interface CsvUploadMeta {
    fileName: string;
    uploadedAt: number;
    rowCount: number;
    matchedColumns: string[];
    unmatchedColumns: string[];
}

export interface GoogleDetectedProperties {
    gscSiteUrl?: string;
    ga4PropertyId?: string;
    ga4PropertyName?: string;
    detectedAt?: number;
    email?: string;
}

export interface CrawlerIntegrationConnection {
    provider: CrawlerIntegrationProvider;
    label: string;
    status: CrawlerIntegrationStatus;
    authType: CrawlerIntegrationAuthType;
    ownership: CrawlerIntegrationOwnership;
    connectedAt: number;
    accountLabel?: string;
    scopes?: string[];
    credentials?: Record<string, string>;
    hasCredentials?: boolean;
    metadata?: Record<string, any>;
    selection?: CrawlerIntegrationSelection;
    sync?: CrawlerIntegrationSyncState;
    // Upload fields
    uploadMeta?: CsvUploadMeta;
    uploadData?: any[];
}

export interface CrawlerIntegrationsLoadResult {
    connections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>;
    source: 'anonymous' | 'project' | 'project-cache' | 'none';
}

type IntegrationRecord = {
    id?: string;
    provider: CrawlerIntegrationProvider;
    project_id: string;
    label: string;
    status: CrawlerIntegrationStatus;
    auth_type: CrawlerIntegrationAuthType;
    ownership: CrawlerIntegrationOwnership;
    connected_at: number;
    account_label?: string | null;
    scopes?: string[] | null;
    credentials?: Record<string, string> | null;
    metadata?: Record<string, any> | null;
    selection?: CrawlerIntegrationSelection | null;
    sync?: CrawlerIntegrationSyncState | null;
};

const ANON_STORAGE_KEY = 'headlight:seo-crawler-integrations:anonymous';
const PROJECT_STORAGE_KEY_PREFIX = 'headlight:seo-crawler-integrations:project:';

const isBrowser = () => typeof window !== 'undefined';

const projectStorageKey = (projectId: string) => `${PROJECT_STORAGE_KEY_PREFIX}${projectId}`;
let dbReady: Promise<void> | null = null;

const ensureDb = async () => {
    if (!dbReady) {
        dbReady = initializeDatabase().catch((error) => {
            dbReady = null;
            throw error;
        });
    }
    await dbReady;
};

const parseJson = <T>(value: unknown, fallback: T): T => {
    if (!value) return fallback;
    try {
        return JSON.parse(String(value)) as T;
    } catch {
        return fallback;
    }
};

const sanitizeConnection = (connection: CrawlerIntegrationConnection): CrawlerIntegrationConnection => {
    const nextMetadata = { ...(connection.metadata || {}) };
    if (connection.credentials?.filename && !nextMetadata.filename) {
        nextMetadata.filename = connection.credentials.filename;
    }

    return {
        ...connection,
        credentials: {},
        hasCredentials: Boolean(connection.hasCredentials || (connection.credentials && Object.keys(connection.credentials).length > 0)),
        metadata: nextMetadata
    };
};

const normalizeConnectionMap = (
    connections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>> | Record<string, any>
) => {
    const next = { ...(connections || {}) } as Record<string, any>;
    const legacyGsc = next.googleSearchConsole;
    const legacyGa4 = next.googleAnalytics;

    if (legacyGsc || legacyGa4) {
        const currentGoogle = next.google || {};
        next.google = {
            provider: 'google',
            label: currentGoogle.label || legacyGsc?.label || legacyGa4?.label || 'Google Search & Analytics',
            status: currentGoogle.status || legacyGsc?.status || legacyGa4?.status || 'connected',
            authType: 'oauth',
            ownership: currentGoogle.ownership || legacyGsc?.ownership || legacyGa4?.ownership || 'project',
            connectedAt: currentGoogle.connectedAt || legacyGsc?.connectedAt || legacyGa4?.connectedAt || Date.now(),
            accountLabel: currentGoogle.accountLabel || legacyGsc?.accountLabel || legacyGa4?.accountLabel,
            scopes: currentGoogle.scopes || legacyGsc?.scopes || legacyGa4?.scopes || [],
            credentials: currentGoogle.credentials || {},
            hasCredentials: Boolean(currentGoogle.hasCredentials || legacyGsc?.hasCredentials || legacyGa4?.hasCredentials),
            metadata: {
                ...(legacyGsc?.metadata || {}),
                ...(legacyGa4?.metadata || {}),
                ...(currentGoogle.metadata || {})
            },
            selection: {
                siteUrl: currentGoogle.selection?.siteUrl || currentGoogle.sync?.siteUrl || legacyGsc?.selection?.siteUrl || legacyGsc?.metadata?.siteUrl,
                propertyId: currentGoogle.selection?.propertyId || currentGoogle.sync?.propertyId || legacyGa4?.selection?.propertyId || legacyGa4?.metadata?.propertyId
            },
            sync: {
                status: currentGoogle.sync?.status || legacyGsc?.sync?.status || legacyGa4?.sync?.status || 'idle',
                lastSyncedAt: currentGoogle.sync?.lastSyncedAt || legacyGsc?.sync?.lastSyncedAt || legacyGa4?.sync?.lastSyncedAt,
                lastAttemptedAt: currentGoogle.sync?.lastAttemptedAt || legacyGsc?.sync?.lastAttemptedAt || legacyGa4?.sync?.lastAttemptedAt,
                siteUrl: currentGoogle.sync?.siteUrl || legacyGsc?.sync?.siteUrl || legacyGsc?.selection?.siteUrl || legacyGsc?.metadata?.siteUrl,
                propertyId: currentGoogle.sync?.propertyId || legacyGa4?.sync?.propertyId || legacyGa4?.selection?.propertyId || legacyGa4?.metadata?.propertyId
            }
        };

        delete next.googleSearchConsole;
        delete next.googleAnalytics;
    }

    return next as Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>;
};

const sanitizeConnectionMap = (
    connections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>
) => {
    const normalizedConnections = normalizeConnectionMap(connections);
    return Object.fromEntries(
        Object.entries(normalizedConnections).map(([provider, connection]) => [
            provider,
            connection ? sanitizeConnection(connection) : connection
        ])
    ) as Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>;
};

const readStorage = (key: string): Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>> => {
    if (!isBrowser()) return {};

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return {};
        return sanitizeConnectionMap(normalizeConnectionMap(JSON.parse(raw)));
    } catch (error) {
        console.error(`Failed to restore crawler integrations from ${key}:`, error);
        return {};
    }
};

const writeStorage = (key: string, connections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>) => {
    if (!isBrowser()) return;

    try {
        window.localStorage.setItem(key, JSON.stringify(sanitizeConnectionMap(connections)));
    } catch (error) {
        console.error(`Failed to persist crawler integrations to ${key}:`, error);
    }
};

const removeStorage = (key: string) => {
    if (!isBrowser()) return;

    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        console.error(`Failed to remove crawler integrations from ${key}:`, error);
    }
};

const toConnectionMap = (rows: IntegrationRecord[] | null | undefined): Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>> => {
    const mapped = (rows || []).reduce((acc, row) => {
        acc[row.provider] = {
            provider: row.provider,
            label: row.label,
            status: row.status,
            authType: row.auth_type,
            ownership: row.ownership,
            connectedAt: row.connected_at,
            accountLabel: row.account_label || undefined,
            scopes: Array.isArray(row.scopes) ? row.scopes : [],
            credentials: {},
            hasCredentials: Boolean(row.credentials && Object.keys(row.credentials).length > 0),
            metadata: row.metadata || {},
            selection: row.selection || {},
            sync: row.sync || { status: 'idle' }
        };
        return acc;
    }, {} as Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>);
    return sanitizeConnectionMap(normalizeConnectionMap(mapped));
};

const toRecord = (projectId: string, connection: CrawlerIntegrationConnection): IntegrationRecord => ({
    id: `${projectId}:${connection.provider}`,
    project_id: projectId,
    provider: connection.provider,
    label: connection.label,
    status: connection.status,
    auth_type: connection.authType,
    ownership: 'project',
    connected_at: connection.connectedAt,
    account_label: connection.accountLabel || null,
    scopes: connection.scopes || [],
    credentials: {},
    metadata: connection.metadata || {},
    selection: connection.selection || {},
    sync: connection.sync || { status: 'idle' }
});

const mapDbRows = (rows: any[]): IntegrationRecord[] => {
    return rows.map((row) => ({
        id: String(row.id || ''),
        project_id: String(row.project_id),
        provider: row.provider as CrawlerIntegrationProvider,
        label: String(row.label),
        status: row.status as CrawlerIntegrationStatus,
        auth_type: row.auth_type as CrawlerIntegrationAuthType,
        ownership: 'project',
        connected_at: Number(row.updated_at ? new Date(String(row.updated_at)).getTime() : Date.now()),
        account_label: row.account_label ? String(row.account_label) : null,
        scopes: parseJson<string[]>(row.scopes_json, []),
        credentials: {},
        metadata: parseJson<Record<string, any>>(row.metadata_json, {}),
        selection: parseJson<CrawlerIntegrationSelection>(row.selection_json, {}),
        sync: parseJson<CrawlerIntegrationSyncState>(row.sync_json, { status: 'idle' })
    }));
};

export const getAnonymousCrawlerIntegrations = () => readStorage(ANON_STORAGE_KEY);

export const saveAnonymousCrawlerIntegrations = (
    connections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>
) => {
    const normalized = sanitizeConnectionMap(Object.fromEntries(
        Object.entries(connections).map(([provider, connection]) => [
            provider,
            connection ? { ...connection, ownership: 'anonymous' as const } : connection
        ])
    ) as Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>);

    writeStorage(ANON_STORAGE_KEY, normalized);
};

export const clearAnonymousCrawlerIntegrations = () => {
    removeStorage(ANON_STORAGE_KEY);
};

export const getProjectCachedCrawlerIntegrations = (projectId: string) => readStorage(projectStorageKey(projectId));

export const saveProjectCachedCrawlerIntegrations = (
    projectId: string,
    connections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>
) => {
    const normalized = sanitizeConnectionMap(Object.fromEntries(
        Object.entries(connections).map(([provider, connection]) => [
            provider,
            connection ? { ...connection, ownership: 'project' as const } : connection
        ])
    ) as Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>);

    writeStorage(projectStorageKey(projectId), normalized);
};

export const fetchProjectCrawlerIntegrations = async (projectId: string): Promise<CrawlerIntegrationsLoadResult> => {
    if (!isCloudSyncEnabled) {
        const cached = getProjectCachedCrawlerIntegrations(projectId);
        return {
            connections: cached,
            source: Object.keys(cached).length > 0 ? 'project-cache' : 'none'
        };
    }
    try {
        await ensureDb();
        const result = await turso().execute({
            sql: `SELECT * FROM integration_connections WHERE project_id = ? ORDER BY updated_at DESC`,
            args: [projectId]
        });
        const connections = toConnectionMap(mapDbRows(result.rows));
        saveProjectCachedCrawlerIntegrations(projectId, connections);
        return {
            connections,
            source: 'project'
        };
    } catch (error) {
        console.error('Failed to fetch project crawler integrations:', error);
        const cached = getProjectCachedCrawlerIntegrations(projectId);
        return {
            connections: cached,
            source: Object.keys(cached).length > 0 ? 'project-cache' : 'none'
        };
    }
};

export const upsertProjectCrawlerIntegration = async (projectId: string, connection: CrawlerIntegrationConnection) => {
    const sanitized = sanitizeConnection({ ...connection, ownership: 'project' });
    const payload = toRecord(projectId, sanitized);
    if (isCloudSyncEnabled) {
        await ensureDb();
        await turso().execute({
            sql: `INSERT OR REPLACE INTO integration_connections
                  (id, project_id, provider, label, status, auth_type, account_label, scopes_json, metadata_json, selection_json, sync_json, secret_ref, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                payload.id || `${projectId}:${connection.provider}`,
                projectId,
                payload.provider,
                payload.label,
                payload.status,
                payload.auth_type,
                payload.account_label || '',
                JSON.stringify(payload.scopes || []),
                JSON.stringify(payload.metadata || {}),
                JSON.stringify(payload.selection || {}),
                JSON.stringify(payload.sync || { status: 'idle' }),
                `${projectId}:${payload.provider}`,
                new Date().toISOString()
            ]
        });
    }

    const cached = getProjectCachedCrawlerIntegrations(projectId);
    const next = {
        ...cached,
        [connection.provider]: sanitized
    };
    saveProjectCachedCrawlerIntegrations(projectId, next);
};

export const removeProjectCrawlerIntegration = async (projectId: string, provider: CrawlerIntegrationProvider) => {
    if (isCloudSyncEnabled) {
        await ensureDb();
        await turso().execute({
            sql: `DELETE FROM integration_connections WHERE project_id = ? AND provider = ?`,
            args: [projectId, provider]
        });
    }

    const cached = { ...getProjectCachedCrawlerIntegrations(projectId) };
    delete cached[provider];
    saveProjectCachedCrawlerIntegrations(projectId, cached);
};

export const replaceProjectCrawlerIntegrations = async (
    projectId: string,
    connections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>
) => {
    await ensureDb();
    const rows = Object.values(sanitizeConnectionMap(connections))
        .filter((connection): connection is CrawlerIntegrationConnection => Boolean(connection))
        .map((connection) => toRecord(projectId, connection));

    if (isCloudSyncEnabled) {
        await turso().execute({
            sql: `DELETE FROM integration_connections WHERE project_id = ?`,
            args: [projectId]
        });
    }

    if (rows.length > 0 && isCloudSyncEnabled) {
        await turso().batch(rows.map((row) => ({
            sql: `INSERT OR REPLACE INTO integration_connections
                  (id, project_id, provider, label, status, auth_type, account_label, scopes_json, metadata_json, selection_json, sync_json, secret_ref, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                row.id || `${projectId}:${row.provider}`,
                projectId,
                row.provider,
                row.label,
                row.status,
                row.auth_type,
                row.account_label || '',
                JSON.stringify(row.scopes || []),
                JSON.stringify(row.metadata || {}),
                JSON.stringify(row.selection || {}),
                JSON.stringify(row.sync || { status: 'idle' }),
                `${projectId}:${row.provider}`,
                new Date().toISOString()
            ]
        })));
    }

    saveProjectCachedCrawlerIntegrations(projectId, sanitizeConnectionMap(connections));
};

export const promoteAnonymousCrawlerIntegrationsToProject = async (projectId: string) => {
    const anonymousConnections = getAnonymousCrawlerIntegrations();
    if (Object.keys(anonymousConnections).length === 0) {
        return {
            promoted: false,
            connections: {} as Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>
        };
    }

    const existingResult = await fetchProjectCrawlerIntegrations(projectId);
    const normalized = Object.fromEntries(
        Object.entries(anonymousConnections).map(([provider, connection]) => [
            provider,
            connection ? { ...connection, ownership: 'project' as const } : connection
        ])
    ) as Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>;

    const mergedConnections = {
        ...existingResult.connections,
        ...normalized
    };

    await replaceProjectCrawlerIntegrations(projectId, mergedConnections);
    clearAnonymousCrawlerIntegrations();

    return {
        promoted: true,
        connections: mergedConnections
    };
};

export const saveCrawlerIntegrationsForSession = async (
    projectId: string | null,
    connections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>
) => {
    if (projectId) {
        await replaceProjectCrawlerIntegrations(projectId, connections);
        return;
    }

    saveAnonymousCrawlerIntegrations(connections);
};
