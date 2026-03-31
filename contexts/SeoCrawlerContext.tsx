import React, { createContext, useContext, useState, useRef, useMemo, useEffect, useCallback, useDeferredValue, startTransition, ReactNode } from 'react';
import { CATEGORIES, ALL_COLUMNS, SEO_ISSUES_TAXONOMY } from '../components/seo-crawler/constants';
import { 
    saveSession, getSessions, getPages, getSession, deleteSession, 
    generateSessionId, diffSessions, CrawlSession, upsertPages
} from '../services/CrawlHistoryService';
import { useAuth } from '../services/AuthContext';
import { useOptionalProject } from '../services/ProjectContext';
import { calculateInternalPageRank, calculatePredictiveScore } from '../services/StrategicIntelligence';
import { persistCrawlResults, syncCrawlStatus } from '../services/CrawlPersistenceService';
import {
    CrawlerIntegrationConnection,
    CrawlerIntegrationProvider,
    fetchProjectCrawlerIntegrations,
    getAnonymousCrawlerIntegrations,
    promoteAnonymousCrawlerIntegrationsToProject,
    removeProjectCrawlerIntegration,
    saveAnonymousCrawlerIntegrations,
    saveProjectCachedCrawlerIntegrations,
    upsertProjectCrawlerIntegration
} from '../services/CrawlerIntegrationsService';
import {
    clearCrawlerIntegrationSecret,
    getCrawlerIntegrationSecret,
    getCrawlerSecretScope,
    mergeCrawlerIntegrationSecret,
    storeCrawlerIntegrationSecret
} from '../services/CrawlerSecretVault';
import { GhostCrawler } from '../services/GhostCrawler';
import { initializeDatabase } from '../services/turso';

export interface CrawlerContextType {
    crawlingMode: 'spider' | 'list' | 'sitemap';
    setCrawlingMode: (m: 'spider' | 'list' | 'sitemap') => void;
    urlInput: string;
    setUrlInput: (u: string) => void;
    listUrls: string;
    setListUrls: (u: string) => void;
    showListModal: boolean;
    setShowListModal: (s: boolean) => void;
    isCrawling: boolean;
    setIsCrawling: (s: boolean) => void;
    pages: any[];
    setPages: (p: any[]) => void;
    logs: any[];
    setLogs: (l: any[]) => void;
    crawlStartTime: number | null;
    setCrawlStartTime: (t: number | null) => void;
    activeCategory: { group: string; sub: string };
    setActiveCategory: (c: { group: string; sub: string }) => void;
    openCategories: string[];
    setOpenCategories: (c: string[]) => void;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    selectedPage: any | null;
    setSelectedPage: (p: any | null) => void;
    activeTab: string;
    setActiveTab: (t: string) => void;
    showAuditSidebar: boolean;
    setShowAuditSidebar: (s: boolean) => void;
    activeAuditTab: 'overview' | 'issues' | 'opportunities' | 'history' | 'logs' | 'robots' | 'sitemap';
    setActiveAuditTab: (t: 'overview' | 'issues' | 'opportunities' | 'history' | 'logs' | 'robots' | 'sitemap') => void;
    showSettings: boolean;
    setShowSettings: (s: boolean) => void;
    activeMacro: string | null;
    setActiveMacro: (m: string | null) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    setSortConfig: (c: { key: string; direction: 'asc' | 'desc' } | null) => void;
    showColumnPicker: boolean;
    setShowColumnPicker: (s: boolean) => void;
    visibleColumns: string[];
    setVisibleColumns: (c: string[]) => void;
    viewMode: 'grid' | 'map';
    setViewMode: (v: 'grid' | 'map') => void;
    showAiInsights: boolean;
    setShowAiInsights: (s: boolean) => void;
    graphDimensions: { width: number; height: number };
    setGraphDimensions: (d: { width: number; height: number }) => void;
    graphContainerRef: React.RefObject<HTMLDivElement>;
    fgRef: React.RefObject<any>;
    categorySearch: string;
    setCategorySearch: (s: string) => void;
    leftSidebarPreset: string | null;
    setLeftSidebarPreset: (p: string | null) => void;
    logSearch: string;
    setLogSearch: (s: string) => void;
    logTypeFilter: 'all' | 'info' | 'error' | 'success';
    setLogTypeFilter: (f: 'all' | 'info' | 'error' | 'success') => void;
    selectedRows: Set<string>;
    setSelectedRows: (s: Set<string>) => void;
    gridScrollTop: number;
    setGridScrollTop: (t: number) => void;
    ROW_HEIGHT: number;
    VISIBLE_BUFFER: number;
    leftSidebarWidth: number;
    setLeftSidebarWidth: (w: number) => void;
    auditSidebarWidth: number;
    setAuditSidebarWidth: (w: number) => void;
    detailsHeight: number;
    setDetailsHeight: (h: number) => void;
    gridScrollOffset: number;
    setGridScrollOffset: (o: number) => void;
    isDraggingLeftSidebar: boolean;
    setIsDraggingLeftSidebar: (d: boolean) => void;
    isDraggingSidebar: boolean;
    setIsDraggingSidebar: (d: boolean) => void;
    isDraggingDetails: boolean;
    setIsDraggingDetails: (d: boolean) => void;
    showAutoFixModal: boolean;
    setShowAutoFixModal: (s: boolean) => void;
    autoFixItems: any[];
    setAutoFixItems: (i: any[]) => void;
    isFixing: boolean;
    setIsFixing: (f: boolean) => void;
    autoFixProgress: number;
    setAutoFixProgress: (p: number) => void;
    stats: any;
    setStats: (s: any) => void;
    healthScore: { score: number; grade: string };
    auditInsights: any[];
    strategicOpportunities: any[];
    crawlRate: string | number;
    crawlRuntime: {
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
    elapsedTime: string;
    setElapsedTime: (t: string) => void;
    formatBytes: (b: any) => string;
    handleExport: () => void;
    handleExportRawDB: () => Promise<void>;
    filteredPages: any[];
    handleSort: (k: string) => void;
    graphData: any;
    handleNodeClick: (n: any) => void;
    crawlHistory: CrawlSession[];
    currentSessionId: string | null;
    compareSessionId: string | null;
    diffResult: any | null;
    isLoadingHistory: boolean;
    saveCrawlSession: (status?: 'completed' | 'paused' | 'failed') => Promise<void>;
    loadSession: (id: string) => Promise<void>;
    resumeCrawlSession: (id: string) => Promise<void>;
    compareSessions: (id1: string, id2: string) => Promise<void>;
    deleteCrawlSession: (id: string) => Promise<void>;
    loadCrawlHistory: () => Promise<void>;
    isAuthenticated: boolean;
    user: any;
    profile: any;
    signOut: () => Promise<void>;
    trialPagesLimit: number;
    prioritizedCategories: any[];
    prioritizeByIssues: boolean;
    setPrioritizeByIssues: (p: boolean) => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (c: boolean) => void;
    showScheduleModal: boolean;
    setShowScheduleModal: (s: boolean) => void;
    ignoredUrls: Set<string>;
    setIgnoredUrls: (s: Set<string>) => void;
    urlTags: Record<string, string[]>;
    setUrlTags: (t: Record<string, string[]>) => void;
    columnWidths: Record<string, number>;
    setColumnWidths: (w: Record<string, number> | ((p: Record<string, number>) => Record<string, number>)) => void;
    robotsTxt: { raw: string; sitemaps: string[]; crawlDelay: number } | null;
    sitemapData: { totalUrls: number; sources: string[] } | null;
    columns: any[];
    config: any;
    setConfig: (c: any) => void;
    settingsTab: string;
    setSettingsTab: (t: string) => void;
    theme: string;
    setTheme: (t: string) => void;
    integrationConnections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>;
    integrationsLoading: boolean;
    integrationsSource: 'anonymous' | 'project' | 'project-cache' | 'none';
    saveIntegrationConnection: (provider: CrawlerIntegrationProvider, connection: Omit<CrawlerIntegrationConnection, 'provider' | 'connectedAt' | 'ownership'>) => void;
    removeIntegrationConnection: (provider: CrawlerIntegrationProvider) => void;
    wsRef: React.RefObject<any>;
    addLog: (msg: string, type?: 'info' | 'error' | 'success') => void;
    toggleCategory: (c: string) => void;
    handleStartPause: (forceResume?: boolean) => void;
    clearCrawlerWorkspace: () => void;
    showTrialLimitAlert: boolean;
    setShowTrialLimitAlert: (s: boolean) => void;
}

const SeoCrawlerContext = createContext<CrawlerContextType | undefined>(undefined);
const MAX_IN_MEMORY_PAGES = 50000;
const CRAWLER_LAYOUT_STORAGE_KEY = 'headlight:seo-crawler-layout';
const CRAWLER_LAST_SESSION_STORAGE_KEY = 'headlight:seo-crawler-last-session';
const CRAWLER_DRAFT_STORAGE_KEY = 'headlight:seo-crawler-draft';
const DEFAULT_VISIBLE_COLUMNS = [
    'url',
    'statusCode',
    'indexabilityStatus',
    'title',
    'metaDesc',
    'crawlDepth',
    'inlinks',
    'outlinks',
    'loadTime',
    'gscClicks',
    'gscImpressions',
    'ga4Sessions',
    'opportunityScore',
    'businessValueScore',
    'authorityScore',
    'recommendedAction'
];

const getHashRouteSearchParams = () => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
};

const replaceHashRouteSearchParams = (mutate: (params: URLSearchParams) => void) => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    mutate(params);
    const nextQuery = params.toString();
    const nextSearch = nextQuery ? `?${nextQuery}` : '';

    if (window.location.search === nextSearch) return;

    window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${nextSearch}${window.location.hash}`
    );
};

const normalizeComparableText = (value: any) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const derivePageIntelligence = (page: any) => {
    const impressions = Number(page.gscImpressions || 0);
    const clicks = Number(page.gscClicks || 0);
    const ctr = Number(page.gscCtr || 0);
    const position = Number(page.gscPosition || 0);
    const sessions = Number(page.ga4Sessions || 0);
    const users = Number(page.ga4Users || 0);
    const bounceRate = Number(page.ga4BounceRate || 0);
    const avgSessionDuration = Number(page.ga4AvgSessionDuration || 0);
    const referringDomains = Number(page.referringDomains || 0);
    const urlRating = Number(page.urlRating || 0);
    const linkEquity = Number(page.linkEquity || 0);
    const technicalPenalty = [
        page.statusCode >= 400,
        page.indexable === false,
        !page.title,
        !page.metaDesc,
        page.loadTime > 1500
    ].filter(Boolean).length * 12;

    const authorityScore = clampScore((referringDomains * 2.5) + (urlRating * 4) + (linkEquity * 6));
    const businessValueScore = clampScore((sessions * 2) + (users * 1.5) + Math.max(0, avgSessionDuration / 3) - (bounceRate * 30));
    const opportunityScore = clampScore((impressions / 25) + ((position > 0 && position <= 20) ? (24 - position) * 2 : 0) + ((ctr > 0 && ctr < 0.03) ? 18 : 0) + (authorityScore * 0.25) + (businessValueScore * 0.2) - technicalPenalty);
    const engagementRisk = clampScore((bounceRate * 100) - Math.min(40, avgSessionDuration / 5));
    const trafficQuality = clampScore((businessValueScore * 0.65) + (Math.max(0, 1 - bounceRate) * 35));
    const coverageParts = [
        impressions > 0 || clicks > 0 ? 1 : 0,
        sessions > 0 || users > 0 ? 1 : 0,
        referringDomains > 0 || urlRating > 0 ? 1 : 0
    ];
    const coverage = coverageParts.length > 0 ? Math.round((coverageParts.reduce((sum, item) => sum + item, 0) / coverageParts.length) * 100) : 0;

    let recommendedAction = 'Monitor';
    let recommendedActionReason = 'This URL has limited external or behavioral signals, so monitor changes before making major moves.';

    if (impressions > 1000 && ctr < 0.02) {
        recommendedAction = 'Rewrite SERP Assets';
        recommendedActionReason = 'This page earns visibility but underperforms on CTR, so titles and descriptions are likely suppressing clicks.';
    } else if (sessions > 100 && bounceRate > 0.65) {
        recommendedAction = 'Improve Content / UX';
        recommendedActionReason = 'Users land here but disengage quickly, which suggests weak intent match, content depth, or page experience.';
    } else if (businessValueScore > 55 && linkEquity < 3) {
        recommendedAction = 'Boost Internal Links';
        recommendedActionReason = 'The page creates value, but internal equity is too weak for its business importance.';
    } else if (authorityScore > 55 && position > 12) {
        recommendedAction = 'Fix Technical / Intent Mismatch';
        recommendedActionReason = 'The page has off-site authority but is still under-ranking, which usually points to technical or intent alignment issues.';
    } else if (page.exactDuplicate || (sessions < 5 && clicks < 5 && page.wordCount > 0 && page.wordCount < 250)) {
        recommendedAction = 'Consolidate / Prune';
        recommendedActionReason = 'This URL shows weak value signals and likely overlaps with stronger pages, making consolidation the better bet.';
    } else if ((clicks > 50 || sessions > 100) && technicalPenalty >= 24) {
        recommendedAction = 'Protect Winner';
        recommendedActionReason = 'The page already produces search or user value, so technical issues here have disproportionate downside.';
    }

    const insightConfidence = clampScore((coverage * 0.6) + (impressions > 0 ? 15 : 0) + (sessions > 0 ? 15 : 0) + (referringDomains > 0 ? 10 : 0));

    return {
        opportunityScore,
        businessValueScore,
        authorityScore,
        engagementRisk,
        trafficQuality,
        recommendedAction,
        recommendedActionReason,
        dataCoverage: coverage,
        insightConfidence
    };
};

export function SeoCrawlerProvider({ children }: { children: ReactNode }) {
    // ─── Real auth from AuthContext ───
    const { session, user, profile, signOut } = useAuth();
    const projectContext = useOptionalProject();
    const activeProject = projectContext?.activeProject || null;
    const isAuthenticated = !!session;
    // Crawling mode & input
    const [crawlingMode, setCrawlingMode] = useState<'spider' | 'list' | 'sitemap'>('spider');
    // Pre-fill URL from search params (Dashboard → Crawler redirect)
    const [urlInput, setUrlInput] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = getHashRouteSearchParams();
            return params.get('url') || '';
        }
        return '';
    });
    const [listUrls, setListUrls] = useState<string>('');
    const [showListModal, setShowListModal] = useState(false);
    
    // Engine States
    const [isCrawling, setIsCrawling] = useState(false);
    const [pages, setPages] = useState<any[]>([]);
    const [logs, setLogs] = useState<{msg: string, type: 'info' | 'error' | 'success', time: number}[]>([]);
    const [crawlStartTime, setCrawlStartTime] = useState<number | null>(null);
    
    // UI states
    const [activeCategory, setActiveCategory] = useState({ group: 'internal', sub: 'All' });
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPage, setSelectedPage] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState('details'); // used by PageDetails
    const [showAuditSidebar, setShowAuditSidebar] = useState(false); 
    const [activeAuditTab, setActiveAuditTab] = useState<'overview' | 'issues' | 'opportunities' | 'history' | 'logs' | 'robots' | 'sitemap'>('overview');
    const [showSettings, setShowSettings] = useState(false);
    const [activeMacro, setActiveMacro] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [showColumnPicker, setShowColumnPicker] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [showAiInsights, setShowAiInsights] = useState(false);
    const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });
    const graphContainerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);

    // Left Sidebar State
    const [categorySearch, setCategorySearch] = useState('');
    const [leftSidebarPreset, setLeftSidebarPreset] = useState<string | null>(null);

    // Right Sidebar State
    const [logSearch, setLogSearch] = useState('');
    const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'info' | 'error' | 'success'>('all');

    // Grid State
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [gridScrollTop, setGridScrollTop] = useState(0);
    const ROW_HEIGHT = 32;
    const VISIBLE_BUFFER = 20;

    // Resizing States
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(220);
    const [auditSidebarWidth, setAuditSidebarWidth] = useState(320); 
    const [detailsHeight, setDetailsHeight] = useState(280); 
    const lastSyncTimeRef = useRef<number>(0);
    const [gridScrollOffset, setGridScrollOffset] = useState(0);
    const [isDraggingLeftSidebar, setIsDraggingLeftSidebar] = useState(false);
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false); 
    const [isDraggingDetails, setIsDraggingDetails] = useState(false); 
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

    // Auto-Fix State
    const [showAutoFixModal, setShowAutoFixModal] = useState(false);
    const [autoFixItems, setAutoFixItems] = useState<any[]>([]);
    const [isFixing, setIsFixing] = useState(false);
    const [autoFixProgress, setAutoFixProgress] = useState(0);
    const [stats, setStats] = useState<any>({
        total: 0, html: 0, img: 0, broken: 0, redirects: 0, missingTitles: 0,
        missingMetaDesc: 0, missingH1: 0, slowPages: 0, largePages: 0,
        serverErrors: 0, nonIndexable: 0, missingHreflang: 0, poorLCP: 0,
        mixedContent: 0, multipleH1s: 0, duplicateTitles: 0, totalIssues: 0
    });
    
    const statsWorkerRef = useRef<Worker | null>(null);

    // ─── Crawl History State ───
    const [crawlHistory, setCrawlHistory] = useState<CrawlSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [compareSessionId, setCompareSessionId] = useState<string | null>(null);
    const [diffResult, setDiffResult] = useState<any | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [analysisPages, setAnalysisPages] = useState<any[]>([]);

    // ─── Auth-aware states (isAuthenticated from real session above) ───
    const trialPagesLimit = 100;
    const [showTrialLimitAlert, setShowTrialLimitAlert] = useState(false);

    // ─── Left sidebar AI-priority reordering ───
    const [prioritizeByIssues, setPrioritizeByIssues] = useState(true);

    // ─── Right sidebar collapse-to-pill ───
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    // ─── Scheduled Scans ───
    const [showScheduleModal, setShowScheduleModal] = useState(false);


    // ─── Bulk Actions: Ignored URLs & Tags ───
    const [ignoredUrls, setIgnoredUrls] = useState<Set<string>>(new Set());
    const [urlTags, setUrlTags] = useState<Record<string, string[]>>({});
    const [robotsTxt, setRobotsTxt] = useState<{ raw: string; sitemaps: string[]; crawlDelay: number } | null>(null);
    const [sitemapData, setSitemapData] = useState<{ totalUrls: number; sources: string[] } | null>(null);

    // --- Column Width Overrides (Already declared above) ---

    const columns = useMemo(() => ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)), [visibleColumns]);

    // Config & Settings
    const [config, setConfig] = useState<any>({ 
        limit: '', maxDepth: '', threads: 5, crawlSpeed: 'normal',
        userAgent: 'Headlight Scanner 1.0', respectRobots: true, 
        excludeRules: '', includeRules: '', ignoreQueryParams: false,
        jsRendering: false, extractCss: '', extractRegex: '', viewportWidth: 1920, viewportHeight: 1080,
        generateEmbeddings: false, aiCategorization: true, aiSentiment: false,
        fetchWebVitals: false,
        gscApiKey: '', gscSiteUrl: '', ga4PropertyId: '', openAiKey: '', ahrefsToken: '', semrushApiKey: '', bingAccessToken: '',
        customHeaders: '', customCookies: '', authUser: '', authPass: '',
        useProxy: false, proxyUrl: '', proxyPort: '', proxyUser: '', proxyPass: '',
        scheduleEnabled: false, scheduleCron: '0 0 * * *'
    });
    const [settingsTab, setSettingsTab] = useState<'general'|'extraction'|'rules'|'ai'|'integrations'|'auth'|'proxies'|'scheduling'|'display'>('general');
    const [theme, setTheme] = useState<'dark'|'light'|'system'|'high-contrast'>('dark');
    const [integrationConnections, setIntegrationConnections] = useState<Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>>({});
    const [integrationsLoading, setIntegrationsLoading] = useState(false);
    const [integrationsSource, setIntegrationsSource] = useState<'anonymous' | 'project' | 'project-cache' | 'none'>('none');
    const [crawlRuntime, setCrawlRuntime] = useState({
        stage: 'idle' as const,
        queued: 0,
        activeWorkers: 0,
        discovered: 0,
        crawled: 0,
        maxDepthSeen: 0,
        concurrency: 0,
        mode: 'spider' as 'spider' | 'list' | 'sitemap',
        rate: 0,
        workerUtilization: 0
    });

    const wsRef = useRef<WebSocket | null>(null);
    const pagesRef = useRef<any[]>([]);
    const pendingPageUpdatesRef = useRef<Map<string, any>>(new Map());
    const pendingPagesFlushRef = useRef<number | null>(null);
    const sessionCheckpointTimeoutRef = useRef<number | null>(null);
    const lastFetchLogAtRef = useRef(0);
    const sessionEntrySignatureRef = useRef<string | null>(null);
    const inMemoryPageLimitAlertedRef = useRef(false);
    const autoRestoreAttemptedRef = useRef(false);
    const initialUrlStateHydratedRef = useRef(false);
    const persistenceReadyRef = useRef(false);
    const currentSessionIdRef = useRef<string | null>(null);
    const integrationsHydratedRef = useRef(false);
    const ghostCrawlerRef = useRef<GhostCrawler | null>(null);
    const integrationSecretScope = getCrawlerSecretScope(activeProject?.id || null);

    const buildEntryUrls = useCallback(() => {
        if (crawlingMode === 'list') {
            return listUrls.split('\n').map(u => u.trim()).filter(Boolean);
        }
        return urlInput.trim() ? [urlInput.trim()] : [];
    }, [crawlingMode, listUrls, urlInput]);

    const buildSessionSignature = useCallback((mode: 'spider' | 'list' | 'sitemap', urls: string[]) => {
        return JSON.stringify({
            mode,
            urls: urls.map(url => url.trim()).filter(Boolean)
        });
    }, []);

    // ─── Load crawl history on mount ───
    useEffect(() => {
        loadCrawlHistory();
    }, []);

    useEffect(() => {
        pagesRef.current = pages;
    }, [pages]);

    useEffect(() => {
        currentSessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const raw = window.localStorage.getItem(CRAWLER_LAYOUT_STORAGE_KEY);
            if (!raw) return;

            const saved = JSON.parse(raw);

            if (typeof saved.leftSidebarWidth === 'number') {
                setLeftSidebarWidth(Math.min(420, Math.max(180, saved.leftSidebarWidth)));
            }
            if (typeof saved.auditSidebarWidth === 'number') {
                setAuditSidebarWidth(Math.min(640, Math.max(260, saved.auditSidebarWidth)));
            }
            if (typeof saved.detailsHeight === 'number') {
                setDetailsHeight(Math.min(520, Math.max(180, saved.detailsHeight)));
            }
        } catch (error) {
            console.error('Failed to restore crawler layout preferences:', error);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const hydrateIntegrations = async () => {
            setIntegrationsLoading(true);

            try {
                if (isAuthenticated && activeProject?.id) {
                    const promotion = await promoteAnonymousCrawlerIntegrationsToProject(activeProject.id);
                    if (cancelled) return;

                    if (promotion.promoted) {
                        setIntegrationConnections(promotion.connections);
                        setIntegrationsSource('project');
                    }

                    const result = await fetchProjectCrawlerIntegrations(activeProject.id);
                    if (cancelled) return;

                    setIntegrationConnections(result.connections);
                    setIntegrationsSource(result.source);
                    saveProjectCachedCrawlerIntegrations(activeProject.id, result.connections);
                } else {
                    const anonymousConnections = getAnonymousCrawlerIntegrations();
                    if (cancelled) return;

                    setIntegrationConnections(anonymousConnections);
                    setIntegrationsSource(Object.keys(anonymousConnections).length > 0 ? 'anonymous' : 'none');
                }
            } catch (error) {
                console.error('Failed to hydrate crawler integrations:', error);
            } finally {
                if (!cancelled) {
                    setIntegrationsLoading(false);
                    window.setTimeout(() => {
                        integrationsHydratedRef.current = true;
                    }, 0);
                }
            }
        };

        integrationsHydratedRef.current = false;
        hydrateIntegrations();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, activeProject?.id]);

    useEffect(() => {
        const gscSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'googleSearchConsole');
        const bingSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'bingWebmaster');
        const ahrefsSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'ahrefs');
        const semrushSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'semrush');
        setConfig((prev: any) => ({
            ...prev,
            gscApiKey: gscSecrets.accessToken || prev.gscApiKey || '',
            gscRefreshToken: gscSecrets.refreshToken || prev.gscRefreshToken || '',
            gscSiteUrl: integrationConnections.googleSearchConsole?.selection?.siteUrl || integrationConnections.googleSearchConsole?.metadata?.siteUrl || prev.gscSiteUrl || '',
            ga4PropertyId: integrationConnections.googleAnalytics?.selection?.propertyId || integrationConnections.googleAnalytics?.metadata?.propertyId || prev.ga4PropertyId || '',
            bingAccessToken: bingSecrets.accessToken || prev.bingAccessToken || '',
            ahrefsToken: ahrefsSecrets.apiToken || prev.ahrefsToken || '',
            semrushApiKey: semrushSecrets.apiKey || prev.semrushApiKey || ''
        }));
    }, [integrationConnections, integrationSecretScope]);

    useEffect(() => {
        if (!integrationsHydratedRef.current) return;
        if (isAuthenticated && activeProject?.id) {
            saveProjectCachedCrawlerIntegrations(activeProject.id, integrationConnections);
            return;
        }
        saveAnonymousCrawlerIntegrations(integrationConnections);
    }, [integrationConnections, isAuthenticated, activeProject?.id]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.setItem(CRAWLER_LAYOUT_STORAGE_KEY, JSON.stringify({
                leftSidebarWidth,
                auditSidebarWidth,
                detailsHeight
            }));
        } catch (error) {
            console.error('Failed to persist crawler layout preferences:', error);
        }
    }, [leftSidebarWidth, auditSidebarWidth, detailsHeight]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!persistenceReadyRef.current) return;

        try {
            if (currentSessionId) {
                window.localStorage.setItem(CRAWLER_LAST_SESSION_STORAGE_KEY, currentSessionId);
            } else {
                window.localStorage.removeItem(CRAWLER_LAST_SESSION_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to persist last crawler session:', error);
        }
    }, [currentSessionId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!persistenceReadyRef.current) return;
        if (!currentSessionId) {
            window.localStorage.removeItem(CRAWLER_DRAFT_STORAGE_KEY);
            return;
        }

        try {
            window.localStorage.setItem(CRAWLER_DRAFT_STORAGE_KEY, JSON.stringify({
                sessionId: currentSessionId,
                urlInput,
                listUrls,
                crawlingMode,
                config,
                currentSessionId
            }));
        } catch (error) {
            console.error('Failed to persist crawler draft state:', error);
        }
    }, [currentSessionId, urlInput, listUrls, crawlingMode, config]);

    useEffect(() => {
        if (!isCrawling) {
            setAnalysisPages(pages);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setAnalysisPages(pages);
        }, 1200);

        return () => window.clearTimeout(timeoutId);
    }, [pages, isCrawling]);

    useEffect(() => {
        if (!isCrawling || !crawlStartTime) {
            setElapsedTime('0s');
            return;
        }

        const formatElapsed = () => {
            const totalSeconds = Math.max(0, Math.floor((Date.now() - crawlStartTime) / 1000));
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
            if (minutes > 0) return `${minutes}m ${seconds}s`;
            return `${seconds}s`;
        };

        setElapsedTime(formatElapsed());
        const intervalId = window.setInterval(() => {
            setElapsedTime(formatElapsed());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [isCrawling, crawlStartTime]);

    useEffect(() => {
        if (!isDraggingLeftSidebar && !isDraggingSidebar && !isDraggingDetails) return;

        const handleMouseMove = (event: MouseEvent) => {
            if (isDraggingLeftSidebar) {
                const nextWidth = Math.min(420, Math.max(180, event.clientX));
                setLeftSidebarWidth(nextWidth);
            }

            if (isDraggingSidebar) {
                const nextWidth = Math.min(640, Math.max(260, window.innerWidth - event.clientX));
                setAuditSidebarWidth(nextWidth);
            }

            if (isDraggingDetails) {
                const nextHeight = Math.min(520, Math.max(180, window.innerHeight - event.clientY));
                setDetailsHeight(nextHeight);
            }
        };

        const handleMouseUp = () => {
            if (isDraggingLeftSidebar) setIsDraggingLeftSidebar(false);
            if (isDraggingSidebar) setIsDraggingSidebar(false);
            if (isDraggingDetails) setIsDraggingDetails(false);
        };

        document.body.style.cursor = (isDraggingLeftSidebar || isDraggingSidebar) ? 'ew-resize' : 'ns-resize';
        document.body.style.userSelect = 'none';

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingLeftSidebar, isDraggingSidebar, isDraggingDetails]);

    useEffect(() => {
        const container = graphContainerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') return;

        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setGraphDimensions({
                width: Math.max(0, Math.floor(width)),
                height: Math.max(0, Math.floor(height))
            });
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        return () => {
            if (pendingPagesFlushRef.current !== null) {
                window.clearTimeout(pendingPagesFlushRef.current);
            }
            if (sessionCheckpointTimeoutRef.current !== null) {
                window.clearTimeout(sessionCheckpointTimeoutRef.current);
            }
            wsRef.current?.close();
        };
    }, []);

    const loadCrawlHistory = useCallback(async () => {
        try {
            const sessions = await getSessions(50);
            setCrawlHistory(sessions);
        } catch (err) {
            console.error('Failed to load crawl history:', err);
        }
    }, []);

    // ─── Keyboard shortcuts ───
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl+F → focus search
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('headlight-grid-search');
                if (searchInput) searchInput.focus();
            }
            // Escape → clear selection / close panels
            if (e.key === 'Escape') {
                if (showSettings) { setShowSettings(false); return; }
                if (showAutoFixModal) { if (!isFixing) setShowAutoFixModal(false); return; }
                if (showListModal) { setShowListModal(false); return; }
                if (showScheduleModal) { setShowScheduleModal(false); return; }
                if (showColumnPicker) { setShowColumnPicker(false); return; }
                if (selectedPage) { setSelectedPage(null); return; }
                if (searchQuery) { setSearchQuery(''); return; }
            }
            // Cmd/Ctrl+E → export
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                handleExport();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                saveCrawlSession('completed');
            }
            // Cmd/Ctrl+Enter → start/pause crawl
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleStartPause();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSettings, showAutoFixModal, showListModal, showScheduleModal, showColumnPicker, selectedPage, searchQuery, isFixing]);

    const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
        setLogs(prev => [...prev.slice(-199), { msg, type, time: Date.now() }]);
    };

    const flushPendingPageUpdates = useCallback(() => {
        pendingPagesFlushRef.current = null;
        const updates = Array.from(pendingPageUpdatesRef.current.values()) as any[];
        pendingPageUpdatesRef.current.clear();

        if (updates.length === 0) return;

        // INCREMENTAL PERSISTENCE
        if (currentSessionId) {
            upsertPages(currentSessionId, updates).catch(console.error);
        }

        startTransition(() => {
            setPages(prev => {
                const next = [...prev];
                const indexByUrl = new Map(next.map((page, index) => [page.url, index]));

                updates.forEach((payload: any) => {
                    // Enrich payload with Strategic Intelligence Health Score
                    const enrichedPayload = {
                        ...payload,
                        healthScore: calculatePredictiveScore(payload)
                    };

                    const existingIndex = indexByUrl.get(payload.url);
                    if (existingIndex === undefined) {
                        if (next.length < MAX_IN_MEMORY_PAGES) {
                            indexByUrl.set(payload.url, next.length);
                            next.push(enrichedPayload);
                        }
                        return;
                    }

                    next[existingIndex] = { ...next[existingIndex], ...enrichedPayload };
                });

                return next;
            });

            setSelectedPage(prev => {
                if (!prev) return prev;
                const selectedUpdate = updates.find(update => update.url === prev.url);
                return selectedUpdate ? { ...prev, ...selectedUpdate } : prev;
            });
        });
    }, [currentSessionId]);

    const queuePageUpdate = useCallback((payload: any) => {
        const existing = pendingPageUpdatesRef.current.get(payload.url) || {};
        pendingPageUpdatesRef.current.set(payload.url, { ...existing, ...payload });

        if (pendingPagesFlushRef.current !== null) return;

        pendingPagesFlushRef.current = window.setTimeout(() => {
            flushPendingPageUpdates();
        }, 200); // 200ms for better UI thread stability at high speeds
    }, [flushPendingPageUpdates]);

    const closeCrawlerSocket = useCallback(() => {
        if (!wsRef.current) return;

        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
    }, []);

    const clearCrawlerWorkspace = useCallback(() => {
        if (isCrawling) {
            wsRef.current?.send(JSON.stringify({ type: 'STOP_CRAWL' }));
        }

        if (pendingPagesFlushRef.current !== null) {
            window.clearTimeout(pendingPagesFlushRef.current);
            pendingPagesFlushRef.current = null;
        }

        pendingPageUpdatesRef.current.clear();
        pagesRef.current = [];
        sessionEntrySignatureRef.current = null;
        inMemoryPageLimitAlertedRef.current = false;

        closeCrawlerSocket();
        setIsCrawling(false);
        setPages([]);
        setAnalysisPages([]);
        setLogs([]);
        setSelectedPage(null);
        setSelectedRows(new Set());
        setCurrentSessionId(null);
        setCompareSessionId(null);
        setDiffResult(null);
        setActiveMacro('all');
        setSearchQuery('');
        setRobotsTxt(null);
        setSitemapData(null);
        setCrawlStartTime(null);
        setUrlInput('');
        setListUrls('');
        setElapsedTime('0s');
        setCrawlRuntime({
            stage: 'idle',
            queued: 0,
            activeWorkers: 0,
            discovered: 0,
            crawled: 0,
            maxDepthSeen: 0,
            concurrency: parseInt(String(config.threads), 10) || 5,
            mode: 'spider',
            rate: 0,
            workerUtilization: 0
        });

        try {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(CRAWLER_LAST_SESSION_STORAGE_KEY);
                window.localStorage.removeItem(CRAWLER_DRAFT_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to clear last crawler session pointer:', error);
        }
    }, [isCrawling, closeCrawlerSocket, config.threads]);

    const toggleCategory = (id: string) => {
        setOpenCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const handleStartPause = (forceResume?: boolean) => {
        if (isCrawling) {
            if (config.useGhostEngine && ghostCrawlerRef.current) {
                ghostCrawlerRef.current.stop();
            } else {
                wsRef.current?.send(JSON.stringify({ type: 'STOP_CRAWL' }));
            }
            setIsCrawling(false);
            addLog("Scan paused.", 'info');
            flushPendingPageUpdates();
            // Save current session as paused
            if (currentSessionId) {
                saveCrawlSession('paused');
            }
            return;
        }

        const urlsToScan = buildEntryUrls();

        if (!urlsToScan.length || !urlsToScan[0]) {
            addLog(`Please provide a valid ${crawlingMode === 'list' ? 'list of URLs' : 'web address'}.`, 'error');
            return;
        }

        // Grab project ID from URL if we were redirected from Dashboard
        const params = getHashRouteSearchParams();
        const projectIdParam = params.get('projectId');
        
        // If we have an active project in context, use its ID, otherwise check URL params
        const targetProjectId = activeProject?.id || projectIdParam || undefined;

        const requestedSignature = buildSessionSignature(crawlingMode, urlsToScan);
        const canResumeCurrentSession = Boolean(
            currentSessionId &&
            crawlRuntime.stage === 'paused' &&
            sessionEntrySignatureRef.current === requestedSignature
        );
        let isResume = Boolean(forceResume || canResumeCurrentSession);
        let sessionId = currentSessionId;

        if (!isResume) {
            // Create new session
            sessionId = generateSessionId();
            sessionEntrySignatureRef.current = requestedSignature;
            inMemoryPageLimitAlertedRef.current = false;
            currentSessionIdRef.current = sessionId;
            setCurrentSessionId(sessionId);
            setCrawlStartTime(Date.now());
            setPages([]); setLogs([]); setSelectedPage(null); setSelectedRows(new Set());
            setActiveMacro('all'); setSearchQuery('');
            setRobotsTxt(null); setSitemapData(null);
            setDiffResult(null); // Clear any old diff
        } else if (!sessionEntrySignatureRef.current) {
            sessionEntrySignatureRef.current = requestedSignature;
        }

        replaceHashRouteSearchParams((params) => {
            if (sessionId) params.set('session', sessionId);
            else params.delete('session');

            if (crawlingMode !== 'spider') params.set('mode', crawlingMode);
            else params.delete('mode');

            if (crawlingMode === 'list') {
                params.delete('url');
            } else if (urlInput.trim()) {
                params.set('url', urlInput.trim());
            } else {
                params.delete('url');
            }
        });

        setIsCrawling(true);
        setCrawlRuntime({
            stage: 'connecting',
            queued: 0,
            activeWorkers: 0,
            discovered: 0,
            crawled: 0,
            maxDepthSeen: 0,
            concurrency: parseInt(String(config.threads), 10) || 5,
            mode: crawlingMode,
            rate: 0,
            workerUtilization: 0
        });
        setShowAuditSidebar(true);
        setActiveAuditTab('overview'); // Auto-switch to overview on scan start

        const configuredWsUrl = (import.meta as any).env?.VITE_CRAWLER_WS_URL;
        const wsUrl = configuredWsUrl || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3001`;
        const shouldAutoUseGhost = !config.useGhostEngine && !configuredWsUrl;
        const useGhostMode = Boolean(config.useGhostEngine || shouldAutoUseGhost);

        if (!useGhostMode) {
            addLog(`Connecting to scanner...`, 'info');
        } else if (shouldAutoUseGhost) {
            addLog('No remote scanner configured. Using Ghost Engine (Local-Only).', 'info');
        }

        if (sessionId) {
            const sessionDraft: CrawlSession = {
                id: sessionId,
                projectId: targetProjectId, // Bind project ID to the session
                url: urlInput || urlsToScan[0] || '',
                startedAt: crawlStartTime || Date.now(),
                completedAt: null,
                lastActivityAt: Date.now(),
                checkpointAt: Date.now(),
                totalPages: pagesRef.current.length,
                totalIssues: stats.totalIssues || 0,
                healthScore: healthScore.score || 0,
                healthGrade: healthScore.grade || '--',
                config: { ...config, crawlingMode },
                status: 'running',
                crawlingMode,
                entryUrls: urlsToScan,
                runtime: {
                    stage: 'connecting',
                    queued: 0,
                    activeWorkers: 0,
                    discovered: 0,
                    crawled: 0,
                    maxDepthSeen: 0,
                    concurrency: parseInt(String(config.threads), 10) || 5,
                    mode: crawlingMode,
                    rate: 0,
                    workerUtilization: 0
                },
                ignoredUrls: Array.from(ignoredUrls),
                urlTags,
                columnWidths,
                robotsTxt,
                sitemapData
            };

            saveSession(sessionDraft)
                .then(() => loadCrawlHistory())
                .catch((error) => console.error('Failed to create initial crawl draft:', error));
        }

        if (useGhostMode) {
            addLog(`Initializing Ghost Engine (Local-Only)...`, 'info');
            
            const ghost = new GhostCrawler({
                maxConcurrent: parseInt(String(config.threads), 10) || 5,
                maxDepth: parseInt(config.maxDepth) || 10,
                limit: parseInt(config.limit) || 0,
                userAgent: config.userAgent
            });
            
            ghostCrawlerRef.current = ghost;

            ghost.on('page', (pageData: any) => {
                queuePageUpdate(pageData);
                const now = Date.now();
                if (now - lastFetchLogAtRef.current > 1200) {
                    lastFetchLogAtRef.current = now;
                    addLog(`Scanning (Local): ${pageData.url}`, 'info');
                }
            });

            ghost.on('progress', (progress: any) => {
                setCrawlRuntime(prev => ({
                    ...prev,
                    stage: 'crawling',
                    queued: progress.queue,
                    crawled: progress.crawled,
                    discovered: progress.discovered,
                    maxDepthSeen: progress.maxDepthSeen,
                    rate: progress.rate
                }));
            });

            ghost.on('complete', () => {
                flushPendingPageUpdates();
                addLog(`Local scan complete. Found ${ghostCrawlerRef.current?.getCrawledCount()} URLs.`, 'success');
                setIsCrawling(false);
                setCrawlStartTime(null);
                setCrawlRuntime(prev => ({ ...prev, stage: 'completed', queued: 0, activeWorkers: 0, workerUtilization: 0 }));
                
                // Re-calculate PageRank
                const completedPages = pagesRef.current;
                if (completedPages.length > 0) {
                    addLog('Calculating Strategic PageRank & Health...', 'info');
                    startTransition(() => {
                        const ranks = calculateInternalPageRank(completedPages);
                        setPages(prev => {
                            const updated = prev.map(p => {
                                const internalPageRank = ranks[p.url] || 0;
                                const updatedPage = { ...p, internalPageRank };
                                return { ...updatedPage, healthScore: calculatePredictiveScore(updatedPage) };
                            });
                            // Final Persistence Pass
                            upsertPages(currentSessionIdRef.current || sessionId || '', updated);
                            return updated;
                        });
                    });
                }
                
                window.setTimeout(() => {
                    saveCrawlSession('completed');
                }, 500);
            });

            ghost.on('error', (err: any) => {
                addLog(`Ghost Engine error: ${err.message}`, 'error');
                setIsCrawling(false);
            });

            ghost.start(urlsToScan[0]);
            setCrawlRuntime(prev => ({ ...prev, stage: 'crawling' }));
            return;
        }
        
        try {
            closeCrawlerSocket();
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                addLog("Connected. Starting scan...", 'success');
                setCrawlRuntime(prev => ({ ...prev, stage: 'crawling' }));
                ws.send(JSON.stringify({ 
                    type: 'START_CRAWL', 
                    sessionId: isResume ? currentSessionId : sessionId,
                    config: {
                        startUrls: urlsToScan,
                        mode: crawlingMode,
                        limit: parseInt(config.limit) || 0,
                        maxDepth: parseInt(config.maxDepth) || null,
                        threads: parseInt(String(config.threads), 10) || 5,
                        crawlSpeed: config.crawlSpeed || 'normal',
                        userAgent: config.userAgent,
                        respectRobots: config.respectRobots,
                        includeRules: config.includeRules,
                        excludeRules: config.excludeRules,
                        ignoreQueryParams: config.ignoreQueryParams,
                        jsRendering: config.jsRendering,
                        viewportWidth: config.viewportWidth,
                        viewportHeight: config.viewportHeight,
                        customHeaders: config.customHeaders,
                        customCookies: config.customCookies,
                        authUser: config.authUser,
                        authPass: config.authPass,
                        fetchWebVitals: config.fetchWebVitals,
                        generateEmbeddings: config.generateEmbeddings,
                        gscApiKey: getCrawlerIntegrationSecret(integrationSecretScope, 'googleSearchConsole').accessToken || config.gscApiKey,
                        gscSiteUrl: config.gscSiteUrl,
                        ga4PropertyId: config.ga4PropertyId,
                        bingAccessToken: getCrawlerIntegrationSecret(integrationSecretScope, 'bingWebmaster').accessToken || config.bingAccessToken,
                        ahrefsToken: getCrawlerIntegrationSecret(integrationSecretScope, 'ahrefs').apiToken || config.ahrefsToken,
                        semrushApiKey: getCrawlerIntegrationSecret(integrationSecretScope, 'semrush').apiKey || config.semrushApiKey
                    } 
                }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'FETCHING') {
                    const now = Date.now();
                    if (now - lastFetchLogAtRef.current > 1200) {
                        lastFetchLogAtRef.current = now;
                        addLog(`Scanning: ${data.payload.url}`, 'info');
                    }
                }
                else if (data.type === 'CRAWL_PROGRESS') {
                    const payload = data.payload;
                    const next = {
                        stage: payload.stage || 'crawling',
                        queued: payload.queueLength || 0,
                        activeWorkers: payload.activeWorkers || 0,
                        discovered: payload.discovered || 0,
                        crawled: payload.crawled || 0,
                        maxDepthSeen: payload.maxDepthSeen || 0,
                        concurrency: payload.concurrency || (parseInt(String(config.threads), 10) || 5),
                        mode: payload.mode || crawlingMode,
                        rate: Number(payload.rate || 0),
                        workerUtilization: Number(payload.workerUtilization || 0)
                    };
                    setCrawlRuntime(next);

                    // Throttled sync to Supabase for the Dashboard
                    const now = Date.now();
                    if (activeProject?.id && now - lastSyncTimeRef.current > 2000) {
                        lastSyncTimeRef.current = now;
                        const progress = next.discovered > 0 ? (next.crawled / next.discovered) * 100 : 0;
                        syncCrawlStatus({
                            projectId: activeProject.id,
                            status: 'running',
                            progress,
                            currentUrl: payload.currentUrl,
                            urlsCrawled: next.crawled,
                            sessionId: currentSessionIdRef.current || '',
                            lastEventType: 'CRAWL_PROGRESS'
                        });
                    }
                }
                else if (data.type === 'ROBOTS_TXT') {
                    setRobotsTxt({
                        raw: data.payload.raw,
                        sitemaps: data.payload.sitemaps,
                        crawlDelay: data.payload.crawlDelay
                    });
                }
                else if (data.type === 'SITEMAP_PARSED') {
                    setSitemapData({
                        totalUrls: data.payload.totalUrls,
                        sources: data.payload.sitemapSources
                    });
                }
                else if (data.type === 'PAGE_CRAWLED') {
                    const pendingSize = pendingPageUpdatesRef.current.has(data.payload.url) ? 0 : 1;
                    if (!isAuthenticated && pagesRef.current.length + pendingPageUpdatesRef.current.size + pendingSize > trialPagesLimit) {
                        wsRef.current?.send(JSON.stringify({ type: 'STOP_CRAWL' }));
                        // Important: flush FIRST so the UI shows exactly the limit amount
                        flushPendingPageUpdates();
                        addLog(`Trial limit reached (${trialPagesLimit} pages). Sign in for unlimited scanning.`, 'info');
                        setShowTrialLimitAlert(true);
                        setIsCrawling(false);
                        return;
                    }

                    queuePageUpdate(data.payload);
                }
                else if (data.type === 'UPDATE_PAGE') {
                    queuePageUpdate(data.payload);
                }
                else if (data.type === 'CRAWL_STOPPED') {
                    flushPendingPageUpdates();
                    addLog(data.payload.message || 'Scan paused.', 'info');
                    setIsCrawling(false);
                    setCrawlStartTime(null);
                    setCrawlRuntime(prev => ({ ...prev, stage: 'paused', activeWorkers: 0, workerUtilization: 0 }));
                }
                else if (data.type === 'TOKEN_REFRESHED') {
                    const { provider, accessToken } = data.payload;
                    addLog(`${provider} access token refreshed.`, 'info');
                    mergeCrawlerIntegrationSecret(integrationSecretScope, provider as CrawlerIntegrationProvider, { accessToken });
                    setConfig((prev: any) => {
                        if (provider === 'googleSearchConsole') return { ...prev, gscApiKey: accessToken };
                        if (provider === 'bingWebmaster') return { ...prev, bingAccessToken: accessToken };
                        return prev;
                    });
                    setIntegrationConnections(prev => {
                        const conn = prev[provider as any];
                        if (!conn) return prev;
                        return {
                            ...prev,
                            [provider]: {
                                ...conn,
                                hasCredentials: true
                            }
                        };
                    });
                }
                else if (data.type === 'ERROR') { addLog(data.payload.message || 'Error encountered', 'error'); flushPendingPageUpdates(); setIsCrawling(false); setCrawlStartTime(null); setCrawlRuntime(prev => ({ ...prev, stage: 'error', activeWorkers: 0, workerUtilization: 0 })); }
                else if (data.type === 'CRAWL_FINISHED') { 
                    flushPendingPageUpdates();
                    addLog(`Scan complete. Found ${data.payload.totalPages} URLs.`, 'success'); 
                    setIsCrawling(false); 
                    setCrawlStartTime(null); 
                    setCrawlRuntime(prev => ({ ...prev, stage: 'completed', queued: 0, activeWorkers: 0, workerUtilization: 0 }));
                    
                    if (activeProject?.id) {
                        syncCrawlStatus({
                            projectId: activeProject.id,
                            status: 'completed',
                            progress: 100,
                            urlsCrawled: data.payload.totalPages,
                            sessionId: currentSessionIdRef.current || '',
                            lastEventType: 'CRAWL_FINISHED'
                        });
                    }
                    
                    // PHASE 3: STRATEGIC INTELLIGENCE - Run PageRank & Scoring
                    const completedPages = pagesRef.current;
                    if (completedPages.length > 0) {
                        addLog('Calculating Strategic PageRank & Health Scores...', 'info');
                        startTransition(() => {
                            const ranks = calculateInternalPageRank(completedPages);
                            setPages(prev => {
                                const updated = prev.map(p => {
                                    const internalPageRank = ranks[p.url] || 0;
                                    const updatedPage = { ...p, internalPageRank };
                                    return { ...updatedPage, healthScore: calculatePredictiveScore(updatedPage) };
                                });
                                // Final Persistence Pass to Turso for Cloud Sync
                                upsertPages(currentSessionIdRef.current || sessionId || '', updated);
                                addLog('Strategic analysis complete.', 'success');
                                return updated;
                            });
                        });
                    }

                    // Auto-save completed session
                    window.setTimeout(() => {
                        saveCrawlSession('completed');
                    }, 500);

                    // Persist crawl results to Supabase for Dashboard consumption
                    if (activeProject?.id && completedPages.length > 0) {
                        const crawlDuration = crawlStartTime ? Date.now() - crawlStartTime : 0;
                        persistCrawlResults({
                            projectId: activeProject.id,
                            sessionId: currentSessionIdRef.current || '',
                            urlCrawled: pagesRef.current[0]?.url || urlInput,
                            pages: pagesRef.current,
                            crawlMode: crawlingMode,
                            crawlDuration,
                            crawlRate: data.payload?.rate || crawlRuntime.rate || 0,
                            maxDepthSeen: data.payload?.maxDepthSeen || crawlRuntime.maxDepthSeen || 0,
                            strategicSummary: data.payload?.strategicSummary || {},
                            sitemapCoverage: data.payload?.sitemapCoverage || null,
                            robotsTxt: data.payload?.robotsTxt || robotsTxt?.raw || ''
                        }).then(result => {
                            if (result) {
                                addLog(`Dashboard synced — Health Score: ${result.score}/100, ${result.issues.length} issues detected.`, 'success');
                            }
                        }).catch(err => {
                            console.error('[CrawlPersistence] Failed to sync to dashboard:', err);
                            addLog('Dashboard sync failed (results saved locally).', 'error');
                        });
                    }
                }
            };

            ws.onerror = () => { addLog("Failed to connect. Check local scraper engine.", 'error'); setIsCrawling(false); setCrawlStartTime(null); setCrawlRuntime(prev => ({ ...prev, stage: 'error', activeWorkers: 0, workerUtilization: 0 })); };
            ws.onclose = () => { flushPendingPageUpdates(); wsRef.current = null; setIsCrawling(false); setCrawlStartTime(null); };
        } catch (err) {
            addLog("Connection dropped.", 'error');
            setIsCrawling(false);
            setCrawlRuntime(prev => ({ ...prev, stage: 'error', activeWorkers: 0, workerUtilization: 0 }));
        }
    };

    // ─── Save crawl session to IndexedDB ───
    // Session hooks moved to bottom to resolve declaration order issues

    const dynamicClusters = useMemo(() => {
        const clusters = new Set<string>();
        analysisPages.forEach(p => {
            if (p.topicCluster) clusters.add(p.topicCluster);
        });
        return Array.from(clusters).sort();
    }, [analysisPages]);

    const deferredSearchQuery = useDeferredValue(searchQuery);

    const rootHostname = useMemo(() => {
        try {
            return pages[0]?.url ? new URL(pages[0].url).hostname : '';
        } catch {
            return '';
        }
    }, [pages]);

    const duplicateTitleSet = useMemo(() => {
        const map = new Map();
        analysisPages.forEach(p => {
            if (p.title) {
                const t = normalizeComparableText(p.title);
                map.set(t, (map.get(t) || 0) + 1);
            }
        });
        return new Set([...map.entries()].filter(([, count]) => count > 1).map(([t]) => t));
    }, [analysisPages]);

    const duplicateMetaDescSet = useMemo(() => {
        const map = new Map();
        analysisPages.forEach(p => {
            if (p.metaDesc) {
                const d = normalizeComparableText(p.metaDesc);
                map.set(d, (map.get(d) || 0) + 1);
            }
        });
        return new Set([...map.entries()].filter(([, count]) => count > 1).map(([d]) => d));
    }, [analysisPages]);

    const duplicateH1Set = useMemo(() => {
        const map = new Map();
        analysisPages.forEach(p => {
            const h1 = normalizeComparableText(p.h1_1);
            if (h1) {
                map.set(h1, (map.get(h1) || 0) + 1);
            }
        });
        return new Set([...map.entries()].filter(([, count]) => count > 1).map(([h1]) => h1));
    }, [analysisPages]);

    const duplicateHashSet = useMemo(() => {
        const map = new Map();
        analysisPages.forEach(p => {
            if (p.hash) {
                map.set(p.hash, (map.get(p.hash) || 0) + 1);
            }
        });
        return new Set([...map.entries()].filter(([, count]) => count > 1).map(([hash]) => hash));
    }, [analysisPages]);

    const pagesWithDerivedSignals = useMemo(() => {
        if (pages.length === 0) return pages;

        return pages.map((page) => {
            const titleKey = normalizeComparableText(page.title);
            const metaKey = normalizeComparableText(page.metaDesc);
            const h1Key = normalizeComparableText(page.h1_1);
            const h1_2 = typeof page.h1_2 === 'string' ? page.h1_2.trim() : '';

            return {
                ...page,
                multipleH1s: page.multipleH1s === true || Boolean(h1_2),
                isDuplicateTitle: Boolean(titleKey) && duplicateTitleSet.has(titleKey),
                isDuplicateMetaDesc: Boolean(metaKey) && duplicateMetaDescSet.has(metaKey),
                isDuplicateH1: Boolean(h1Key) && duplicateH1Set.has(h1Key),
                exactDuplicate: Boolean(page.hash) && duplicateHashSet.has(page.hash),
                ...derivePageIntelligence(page)
            };
        });
    }, [pages, duplicateTitleSet, duplicateMetaDescSet, duplicateH1Set, duplicateHashSet]);

    useEffect(() => {
        // Initialize stats worker
        statsWorkerRef.current = new Worker(new URL('../workers/statsWorker.ts', import.meta.url), { type: 'module' });
        
        statsWorkerRef.current.onmessage = (e) => {
            if (e.data.type === 'STATS_RESULT') {
                setStats(e.data.stats);
            }
        };

        return () => {
            statsWorkerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        if (analysisPages.length === 0) {
            setStats({
                total: 0, html: 0, img: 0, broken: 0, redirects: 0, missingTitles: 0,
                missingMetaDesc: 0, missingH1: 0, slowPages: 0, largePages: 0,
                serverErrors: 0, nonIndexable: 0, missingHreflang: 0, poorLCP: 0,
                mixedContent: 0, multipleH1s: 0, duplicateTitles: 0, totalIssues: 0
            });
            return;
        }

        // Offload stats calculation to worker
        statsWorkerRef.current?.postMessage({
            type: 'CALCULATE_STATS',
            payload: {
                pages: analysisPages,
                duplicateTitleSet,
                duplicateMetaDescSet
            }
        });
    }, [analysisPages, duplicateTitleSet, duplicateMetaDescSet]);

    const categoryCounts = useMemo(() => {
        if (analysisPages.length === 0) return {} as Record<string, Record<string, number>>;
        const counts: Record<string, Record<string, number>> = {};
        
        const allCats = [
            ...CATEGORIES,
            ...(dynamicClusters.length > 0 ? [{ id: 'ai-clusters', label: 'AI Topic Clusters', icon: null, sub: ['All', ...dynamicClusters] }] : [])
        ];

        for (const cat of allCats) {
            counts[cat.id] = {};
            for (const sub of cat.sub) {
                let c = 0;
                for (const p of analysisPages) {
                    if (cat.id === 'internal') {
                        if (sub === 'All') { c = analysisPages.length; break; }
                        if (sub === 'HTML' && p.contentType?.includes('html')) c++;
                        else if (sub === 'JavaScript' && p.contentType?.includes('javascript')) c++;
                        else if (sub === 'CSS' && p.contentType?.includes('css')) c++;
                        else if (sub === 'Images' && p.contentType?.includes('image')) c++;
                        else if (sub === 'PDF' && p.contentType?.includes('pdf')) c++;
                    } else if (cat.id === 'external') {
                        if (sub === 'All' && rootHostname && !p.url.includes(rootHostname)) c++;
                    } else if (cat.id === 'security') {
                        if (sub === 'Mixed Content' && p.mixedContent === true) c++;
                        else if (sub === 'Insecure Forms' && p.insecureForms === true) c++;
                        else if (sub === 'Missing HSTS' && p.hstsMissing === true) c++;
                    } else if (cat.id === 'codes') {
                        if (sub === 'Success (2xx)' && p.statusCode >= 200 && p.statusCode < 300) c++;
                        else if (sub === 'Redirection (3xx)' && p.statusCode >= 300 && p.statusCode < 400) c++;
                        else if (sub === 'Client Error (4xx)' && p.statusCode >= 400 && p.statusCode < 500) c++;
                        else if (sub === 'Server Error (5xx)' && p.statusCode >= 500) c++;
                    } else if (cat.id === 'indexability') {
                        if (sub === 'Indexable' && p.indexable === true) c++;
                        else if (sub === 'Non-Indexable' && p.indexable === false) c++;
                        else if (sub === 'Canonicalized' && p.canonical && p.canonical !== p.url) c++;
                        else if (sub === 'Noindex' && p.metaRobots1?.toLowerCase().includes('noindex')) c++;
                    } else if (cat.id === 'titles') {
                        if (sub === 'Missing' && (!p.title || p.title.trim() === '')) c++;
                        else if (sub === 'Duplicate' && duplicateTitleSet.has(normalizeComparableText(p.title))) c++;
                        else if (sub === 'Over 60 Characters' && p.titleLength > 60) c++;
                        else if (sub === 'Below 30 Characters' && p.titleLength > 0 && p.titleLength < 30) c++;
                    } else if (cat.id === 'meta') {
                        if (sub === 'Missing' && (!p.metaDesc || p.metaDesc.trim() === '')) c++;
                        else if (sub === 'Duplicate' && duplicateMetaDescSet.has(normalizeComparableText(p.metaDesc))) c++;
                        else if (sub === 'Over 155 Characters' && p.metaDescLength > 155) c++;
                        else if (sub === 'Below 70 Characters' && p.metaDescLength > 0 && p.metaDescLength < 70) c++;
                    } else if (cat.id === 'headings') {
                        if (sub === 'Missing H1' && (!p.h1_1 || p.h1_1.trim() === '')) c++;
                        else if (sub === 'Multiple H1' && p.multipleH1s === true) c++;
                        else if (sub === 'Missing H2' && (!p.h2_1 || p.h2_1.trim() === '')) c++;
                        else if (sub === 'Incorrect Order' && p.incorrectHeadingOrder === true) c++;
                    } else if (cat.id === 'links') {
                        if (sub === 'Internal' && p.inlinks > 0) c++;
                        else if (sub === 'External' && (p.externalOutlinks > 0 || p.uniqueExternalOutlinks > 0)) c++;
                        else if (sub === 'Broken' && p.statusCode >= 400) c++;
                        else if (sub === 'Redirects' && p.statusCode >= 300 && p.statusCode < 400) c++;
                    } else if (cat.id === 'images') {
                        if (sub === 'Missing Alt' && p.missingAltImages > 0) c++;
                        else if (sub === 'Long Alt' && p.longAltImages > 0) c++;
                        else if (sub === 'Has Images' && p.totalImages > 0) c++;
                    } else if (cat.id === 'performance') {
                        if (sub === 'Slow Pages' && p.loadTime > 1500) c++;
                        else if (sub === 'Large Pages' && p.sizeBytes > 2 * 1024 * 1024) c++;
                        else if (sub === 'Poor LCP' && p.lcp > 2500) c++;
                        else if (sub === 'Poor CLS' && p.cls > 0.1) c++;
                    } else if (cat.id === 'international') {
                        if (sub === 'Missing Hreflang' && (!Array.isArray(p.hreflang) || p.hreflang.length === 0)) c++;
                        else if (sub === 'Hreflang Errors' && (p.hreflangErrors === true || p.hreflangNoSelf === true || p.hreflangInvalid === true)) c++;
                    } else if (cat.id === 'structured') {
                        if (sub === 'Missing Schema' && (!p.schema || (Array.isArray(p.schema) && p.schema.length === 0))) c++;
                        else if (sub === 'Schema Errors' && p.schemaErrors > 0) c++;
                        else if (sub === 'Schema Warnings' && p.schemaWarnings > 0) c++;
                    } else if (cat.id === 'mobile') {
                        if (sub === 'Missing AMP' && !p.amphtml) c++;
                        else if (sub === 'Missing Mobile Alternate' && !p.mobileAlt) c++;
                    } else if (cat.id === 'pagination') {
                        if (sub === 'Missing rel=next' && !p.relNextTag) c++;
                        else if (sub === 'Missing rel=prev' && !p.relPrevTag) c++;
                        else if (sub === 'Paginated Noindex' && (p.relNextTag || p.relPrevTag) && p.metaRobots1?.toLowerCase().includes('noindex')) c++;
                    } else if (cat.id === 'architecture') {
                        if (sub === 'Depth 0-2' && p.crawlDepth <= 2) c++;
                        else if (sub === 'Depth 3-4' && (p.crawlDepth === 3 || p.crawlDepth === 4)) c++;
                        else if (sub === 'Depth 5+' && p.crawlDepth >= 5) c++;
                        else if (sub === 'Orphan Pages' && p.inlinks === 0 && p.crawlDepth > 0) c++;
                    } else if (cat.id === 'custom') {
                        if (sub === 'Has Extraction' && p.customExtraction?.length > 0) c++;
                        else if (sub === 'Missing Extraction' && (!p.customExtraction || p.customExtraction.length === 0)) c++;
                    } else if (cat.id === 'ai-clusters') {
                        if (sub === 'All' && !!p.topicCluster) c++;
                        else if (p.topicCluster === sub) c++;
                    }
                }
                counts[cat.id][sub] = c;
            }
        }
        return counts;
    }, [analysisPages, dynamicClusters, rootHostname, duplicateTitleSet, duplicateMetaDescSet]);

    // Stats are now handled by the statsWorker useEffect above

    const MACRO_FILTERS: Record<string, (p: any) => boolean> = useMemo(() => ({
        'broken': (p: any) => p.statusCode >= 400 && p.statusCode < 500,
        'serverErrors': (p: any) => p.statusCode >= 500,
        'redirects': (p: any) => p.statusCode >= 300 && p.statusCode < 400,
        'missingTitles': (p: any) => !p.title || p.title.trim() === '',
        'missingMetaDesc': (p: any) => !p.metaDesc || p.metaDesc.trim() === '',
        'slow': (p: any) => p.loadTime > 1500,
        'nonIndexable': (p: any) => p.indexable === false,
    }), []);

    const filteredPages = useMemo(() => {
        let list = pagesWithDerivedSignals;

        // Exclude ignored URLs
        if (ignoredUrls.size > 0) {
            list = list.filter(p => !ignoredUrls.has(p.url));
        }

        // Global search — checks URL, title, meta description, H1
        if (deferredSearchQuery) {
            const q = deferredSearchQuery.toLowerCase();
            list = list.filter(p => 
                p.url.toLowerCase().includes(q) || 
                (p.title && p.title.toLowerCase().includes(q)) ||
                (p.metaDesc && p.metaDesc.toLowerCase().includes(q)) ||
                (p.h1_1 && p.h1_1.toLowerCase().includes(q))
            );
        }
        if (activeMacro) {
            if (activeMacro === 'all') {
                // If 'all' is explicitly set, we've already done search filtering above, 
                // so we just proceed to return 'list' at the end or sort if needed.
            } else if (MACRO_FILTERS[activeMacro]) {
                list = list.filter(MACRO_FILTERS[activeMacro]);
                if (sortConfig) {
                    list = [...list].sort((a, b) => {
                        const aVal = a[sortConfig.key];
                        const bVal = b[sortConfig.key];
                        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                        return 0;
                    });
                }
                return list;
            }
            let foundIssue: any = null;
            for (const group of SEO_ISSUES_TAXONOMY) {
                const issue = group.issues.find(i => i.id === activeMacro);
                if (issue) { foundIssue = issue; break; }
            }
            if (foundIssue) {
                list = list.filter(foundIssue.condition);
                if (sortConfig) {
                    list = [...list].sort((a, b) => {
                        const aVal = a[sortConfig.key];
                        const bVal = b[sortConfig.key];
                        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                        return 0;
                    });
                }
                return list;
            }
        }
        list = list.filter(p => {
            const group = activeCategory.group;
            const sub = activeCategory.sub;
            if (group === 'internal') {
                if (sub === 'All') return true;
                if (sub === 'HTML') return p.contentType?.includes('html');
                if (sub === 'Images') return p.contentType?.includes('image');
                if (sub === 'JavaScript') return p.contentType?.includes('javascript');
                if (sub === 'CSS') return p.contentType?.includes('css');
                if (sub === 'PDF') return p.contentType?.includes('pdf');
                return true;
            }
            if (group === 'external') {
                if (sub === 'All') return rootHostname ? !p.url.includes(rootHostname) : false;
                return false;
            }
            if (group === 'security') {
                if (sub === 'Mixed Content') return p.mixedContent === true;
                if (sub === 'Insecure Forms') return p.insecureForms === true;
                if (sub === 'Missing HSTS') return p.hstsMissing === true;
                return true;
            }
            if (group === 'indexability') {
                if (sub === 'Indexable') return p.indexable === true;
                if (sub === 'Non-Indexable') return p.indexable === false;
                if (sub === 'Canonicalized') return p.canonical && p.canonical !== p.url;
                if (sub === 'Noindex') return p.metaRobots1?.toLowerCase().includes('noindex');
                return true;
            }
            if (group === 'codes') {
                if (sub === 'Success (2xx)') return p.statusCode >= 200 && p.statusCode < 300;
                if (sub === 'Redirection (3xx)') return p.statusCode >= 300 && p.statusCode < 400;
                if (sub === 'Client Error (4xx)') return p.statusCode >= 400 && p.statusCode < 500;
                if (sub === 'Server Error (5xx)') return p.statusCode >= 500;
                return true;
            }
            if (group === 'titles') {
                if (sub === 'Missing') return !p.title || p.title.trim() === '';
                if (sub === 'Duplicate') return duplicateTitleSet.has(normalizeComparableText(p.title));
                if (sub === 'Over 60 Characters') return p.titleLength > 60;
                if (sub === 'Below 30 Characters') return p.titleLength > 0 && p.titleLength < 30;
                return true;
            }
            if (group === 'meta') {
                if (sub === 'Missing') return !p.metaDesc || p.metaDesc.trim() === '';
                if (sub === 'Duplicate') return duplicateMetaDescSet.has(normalizeComparableText(p.metaDesc));
                if (sub === 'Over 155 Characters') return p.metaDescLength > 155;
                if (sub === 'Below 70 Characters') return p.metaDescLength > 0 && p.metaDescLength < 70;
                return true;
            }
            if (group === 'headings') {
                if (sub === 'Missing H1') return !p.h1_1 || p.h1_1.trim() === '';
                if (sub === 'Multiple H1') return p.multipleH1s === true;
                if (sub === 'Missing H2') return !p.h2_1 || p.h2_1.trim() === '';
                if (sub === 'Incorrect Order') return p.incorrectHeadingOrder === true;
                return true;
            }
            if (group === 'links') {
                if (sub === 'Internal') return p.inlinks > 0;
                if (sub === 'External') return p.externalOutlinks > 0 || p.uniqueExternalOutlinks > 0;
                if (sub === 'Broken') return p.statusCode >= 400;
                if (sub === 'Redirects') return p.statusCode >= 300 && p.statusCode < 400;
                return true;
            }
            if (group === 'images') {
                if (sub === 'Missing Alt') return p.missingAltImages > 0;
                if (sub === 'Long Alt') return p.longAltImages > 0;
                if (sub === 'Has Images') return p.totalImages > 0;
                return true;
            }
            if (group === 'performance') {
                if (sub === 'Slow Pages') return p.loadTime > 1500;
                if (sub === 'Large Pages') return p.sizeBytes > 2 * 1024 * 1024;
                if (sub === 'Poor LCP') return p.lcp > 2500;
                if (sub === 'Poor CLS') return p.cls > 0.1;
                return true;
            }
            if (group === 'international') {
                if (sub === 'Missing Hreflang') return !Array.isArray(p.hreflang) || p.hreflang.length === 0;
                if (sub === 'Hreflang Errors') return p.hreflangErrors === true || p.hreflangNoSelf === true || p.hreflangInvalid === true;
                return true;
            }
            if (group === 'structured') {
                if (sub === 'Missing Schema') return !p.schema || (Array.isArray(p.schema) && p.schema.length === 0);
                if (sub === 'Schema Errors') return p.schemaErrors > 0;
                if (sub === 'Schema Warnings') return p.schemaWarnings > 0;
                return true;
            }
            if (group === 'mobile') {
                if (sub === 'Missing AMP') return !p.amphtml;
                if (sub === 'Missing Mobile Alternate') return !p.mobileAlt;
                return true;
            }
            if (group === 'pagination') {
                if (sub === 'Missing rel=next') return !p.relNextTag;
                if (sub === 'Missing rel=prev') return !p.relPrevTag;
                if (sub === 'Paginated Noindex') return (p.relNextTag || p.relPrevTag) && p.metaRobots1?.toLowerCase().includes('noindex');
                return true;
            }
            if (group === 'architecture') {
                if (sub === 'Depth 0-2') return p.crawlDepth <= 2;
                if (sub === 'Depth 3-4') return p.crawlDepth === 3 || p.crawlDepth === 4;
                if (sub === 'Depth 5+') return p.crawlDepth >= 5;
                if (sub === 'Orphan Pages') return p.inlinks === 0 && p.crawlDepth > 0;
                return true;
            }
            if (group === 'custom') {
                if (sub === 'Has Extraction') return p.customExtraction && p.customExtraction.length > 0;
                if (sub === 'Missing Extraction') return !p.customExtraction || p.customExtraction.length === 0;
                return true;
            }
            if (group === 'ai-clusters') {
                if (sub === 'All') return !!p.topicCluster;
                return p.topicCluster === sub;
            }
            return true;
        });


        if (sortConfig) {
            list = [...list].sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return list;
    }, [pagesWithDerivedSignals, activeCategory, deferredSearchQuery, activeMacro, sortConfig, MACRO_FILTERS, ignoredUrls, rootHostname, duplicateTitleSet, duplicateMetaDescSet]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const graphData = useMemo(() => {
        if (analysisPages.length === 0) return { nodes: [], links: [] };

        const nodes: any[] = [];
        const links: any[] = [];
        const addedNodes = new Set<string>();
        const addedLinks = new Set<string>();
        const validPageUrls = new Set<string>(analysisPages.map(page => page.url));
        const pageByUrl = new Map<string, any>(analysisPages.map(page => [page.url, page]));
        const rootUrl = analysisPages[0]?.url;
        const sectionBuckets = new Map<string, string[]>();

        analysisPages.forEach(page => {
            let nodeName = page.url;
            let dirPath = '/';
            let sectionKey = 'Homepage';
            let templateKey = 'root';

            try {
                const parsedUrl = new URL(page.url);
                const segments = parsedUrl.pathname.split('/').filter(Boolean);
                nodeName = parsedUrl.pathname === '/' ? (parsedUrl.hostname || page.url) : (parsedUrl.pathname || page.url);
                dirPath = segments.length > 0 ? `/${segments.slice(0, 1).join('/')}` : '/';
                sectionKey = segments[0]
                    ? segments[0].replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
                    : 'Homepage';
                templateKey = segments.slice(0, 2).join('/') || 'root';
            } catch {
                nodeName = page.url;
            }

            if (!addedNodes.has(page.url)) {
                if (!sectionBuckets.has(sectionKey)) sectionBuckets.set(sectionKey, []);
                sectionBuckets.get(sectionKey)?.push(page.url);

                let group = 1;
                if (page.contentType?.includes('image')) group = 2;
                else if (page.contentType?.includes('javascript')) group = 3;
                else if (page.contentType?.includes('css')) group = 4;

                const issueCount = [
                    page.statusCode >= 400,
                    !page.title,
                    !page.metaDesc,
                    page.nonIndexable,
                    page.loadTime > 3000
                ].filter(Boolean).length;

                nodes.push({
                    id: page.url,
                    name: nodeName,
                    val: page.url === rootUrl ? 22 : Math.min(14, 4 + (page.inlinks || 0)),
                    group: page.statusCode >= 400 ? 5 : group,
                    status: page.statusCode,
                    fullUrl: page.url,
                    inlinks: Number(page.inlinks || 0),
                    outlinks: Number(page.outlinks || 0),
                    internalPageRank: Number(page.internalPageRank || 0),
                    crawlDepth: Number(page.crawlDepth || 0),
                    dirPath,
                    title: page.title || nodeName,
                    sectionKey,
                    templateKey,
                    issueCount
                });
                addedNodes.add(page.url);
            }
        });

        const orderedSections = Array.from(sectionBuckets.keys()).sort((a, b) => {
            if (a === 'Homepage') return -1;
            if (b === 'Homepage') return 1;
            return a.localeCompare(b);
        });
        const sectionCenters = new Map<string, { y: number; z: number }>();
        const sectionSpacing = 240;
        orderedSections.forEach((section, index) => {
            const centeredIndex = index - ((orderedSections.length - 1) / 2);
            const curveOffset = Math.sin(index * 0.9) * 180;
            sectionCenters.set(section, {
                y: centeredIndex * sectionSpacing,
                z: curveOffset
            });
        });

        const nodeOrderBySectionDepth = new Map<string, any[]>();
        nodes.forEach((node) => {
            const key = `${node.sectionKey}::${node.crawlDepth}`;
            if (!nodeOrderBySectionDepth.has(key)) nodeOrderBySectionDepth.set(key, []);
            nodeOrderBySectionDepth.get(key)?.push(node);
        });
        nodeOrderBySectionDepth.forEach((bucket) => {
            bucket.sort((a, b) => {
                const scoreA = (a.internalPageRank * 10) + (a.inlinks * 2) - (a.issueCount * 4);
                const scoreB = (b.internalPageRank * 10) + (b.inlinks * 2) - (b.issueCount * 4);
                if (scoreA !== scoreB) return scoreB - scoreA;
                return String(a.name).localeCompare(String(b.name));
            });
        });

        nodes.forEach((node) => {
            const bucketKey = `${node.sectionKey}::${node.crawlDepth}`;
            const bucket = nodeOrderBySectionDepth.get(bucketKey) || [node];
            const bucketIndex = Math.max(0, bucket.findIndex((entry) => entry.id === node.id));
            const center = sectionCenters.get(node.sectionKey) || { y: 0, z: 0 };
            const siblingOffset = bucketIndex - ((bucket.length - 1) / 2);

            node.x = 120 + (node.crawlDepth * 240);
            node.y = center.y + (siblingOffset * 92);
            node.z = center.z + (siblingOffset * 70) + (((bucketIndex % 3) - 1) * 60);
        });

        analysisPages.forEach(page => {
            if (!page.outlinksList || !Array.isArray(page.outlinksList)) return;

            page.outlinksList.forEach((targetUrl: string) => {
                if (!validPageUrls.has(targetUrl)) return;

                const linkKey = `${page.url}::${targetUrl}`;
                if (addedLinks.has(linkKey)) return;

                addedLinks.add(linkKey);

                const targetPage = pageByUrl.get(targetUrl);
                const sourceDepth = Number(page.crawlDepth || 0);
                const targetDepth = Number(targetPage?.crawlDepth || 0);
                const isStructural = Boolean(targetPage) && (
                    targetDepth === sourceDepth + 1 ||
                    (targetDepth === sourceDepth && targetPage?.url.startsWith(page.url.replace(/\/$/, '')))
                );

                links.push({
                    source: page.url,
                    target: targetUrl,
                    isStructural,
                    isCrossLink: !isStructural,
                    sameSection: Boolean(targetPage) && nodes.find((node) => node.id === page.url)?.sectionKey === nodes.find((node) => node.id === targetUrl)?.sectionKey
                });
            });
        });

        return { nodes, links };
    }, [analysisPages]);

    const handleNodeClick = (node: any) => {
        const foundPage = pages.find(p => p.url === node.id);
        if (foundPage) {
            setSelectedPage(foundPage);
            if (fgRef.current) {
                const distance = 150;
                const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
                fgRef.current.cameraPosition(
                    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                    node,
                    3000
                );
            }
        }
    };

    const healthScore = useMemo(() => {
        if (analysisPages.length === 0) return { score: 0, grade: '--' };
        const raw = Math.max(0, Math.min(100, 100 - (stats.broken * 5) - (stats.missingTitles * 2) - (stats.serverErrors * 10) - (stats.missingMetaDesc * 1) - (stats.slowPages * 3) - (stats.nonIndexable * 1)));
        let grade = 'F';
        if (raw >= 90) grade = 'A';
        else if (raw >= 80) grade = 'B';
        else if (raw >= 65) grade = 'C';
        else if (raw >= 50) grade = 'D';
        return { score: raw, grade };
    }, [analysisPages.length, stats]);

    const persistSessionCheckpoint = useCallback(async (
        statusOverride?: 'running' | 'completed' | 'paused' | 'failed',
        options?: { includePages?: boolean }
    ) => {
        const sessionId = currentSessionIdRef.current;
        if (!sessionId) return;

        const resolvedEntryUrls = crawlingMode === 'list'
            ? listUrls.split('\n').map(u => u.trim()).filter(Boolean)
            : [urlInput.trim()].filter(Boolean);
        const resolvedStatus = statusOverride || (isCrawling ? 'running' : (crawlRuntime.stage === 'completed' ? 'completed' : crawlRuntime.stage === 'error' ? 'failed' : 'paused'));

        const session: CrawlSession = {
            id: sessionId,
            url: urlInput || pagesRef.current[0]?.url || resolvedEntryUrls[0] || '',
            startedAt: crawlStartTime || Date.now(),
            completedAt: resolvedStatus === 'completed' ? Date.now() : null,
            lastActivityAt: Date.now(),
            checkpointAt: Date.now(),
            totalPages: pagesRef.current.length,
            totalIssues: stats.totalIssues,
            healthScore: healthScore.score,
            healthGrade: healthScore.grade,
            config: { ...config, crawlingMode },
            status: resolvedStatus,
            crawlingMode,
            entryUrls: resolvedEntryUrls,
            runtime: crawlRuntime,
            ignoredUrls: Array.from(ignoredUrls),
            urlTags,
            columnWidths,
            robotsTxt,
            sitemapData
        };

        await saveSession(session);
        if (options?.includePages !== false) {
            await upsertPages(sessionId, pagesRef.current);
        }
    }, [crawlingMode, listUrls, urlInput, crawlStartTime, stats.totalIssues, healthScore.score, healthScore.grade, config, isCrawling, crawlRuntime, ignoredUrls, urlTags, columnWidths, robotsTxt, sitemapData]);

    useEffect(() => {
        if (!currentSessionId) return;
        if (pages.length === 0 && !isCrawling) return;

        if (sessionCheckpointTimeoutRef.current !== null) {
            window.clearTimeout(sessionCheckpointTimeoutRef.current);
        }

        sessionCheckpointTimeoutRef.current = window.setTimeout(() => {
            persistSessionCheckpoint(isCrawling ? 'running' : undefined, { includePages: false }).catch((err) => {
                console.error('Failed to checkpoint crawl session:', err);
            });
        }, isCrawling ? 1500 : 400);

        return () => {
            if (sessionCheckpointTimeoutRef.current !== null) {
                window.clearTimeout(sessionCheckpointTimeoutRef.current);
                sessionCheckpointTimeoutRef.current = null;
            }
        };
    }, [currentSessionId, pages, crawlRuntime, isCrawling, persistSessionCheckpoint]);

    const auditInsights = useMemo(() => {
        if (analysisPages.length === 0) return [];
        const insights: any[] = [];
        
        if (stats.broken > 0) {
            insights.push({
                id: 'broken',
                track: 'Technical',
                count: stats.broken,
                label: 'Fix Broken Pages',
                summary: `${stats.broken} pages are returning 4xx/5xx errors.`,
                impact: 'High',
                effort: 'Low'
            });
        }
        
        if (stats.missingTitles > 0) {
            insights.push({
                id: 'missingTitles',
                track: 'Content',
                count: stats.missingTitles,
                label: 'Add Missing Titles',
                summary: `${stats.missingTitles} pages are missing title tags.`,
                impact: 'High',
                effort: 'Low'
            });
        }

        if (stats.slowPages > 0) {
            insights.push({
                id: 'slow',
                track: 'Performance',
                count: stats.slowPages,
                label: 'Optimize Page Speed',
                summary: `${stats.slowPages} pages take longer than 1.5s to load.`,
                impact: 'Medium',
                effort: 'Medium'
            });
        }

        if (stats.nonIndexable > 0) {
            insights.push({
                id: 'nonIndexable',
                track: 'Indexability',
                count: stats.nonIndexable,
                label: 'Review Non-Indexable URLs',
                summary: `${stats.nonIndexable} pages are blocked from search engines.`,
                impact: 'Medium',
                effort: 'Low'
            });
        }

        if (stats.missingMetaDesc > 0) {
            insights.push({
                id: 'missingMetaDesc',
                track: 'Content',
                count: stats.missingMetaDesc,
                label: 'Improve Meta Descriptions',
                summary: `${stats.missingMetaDesc} pages have no meta description.`,
                impact: 'Medium',
                effort: 'Low'
            });
        }

        return insights.sort((a, b) => {
            const impactOrder: any = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return impactOrder[b.impact] - impactOrder[a.impact];
        });
    }, [analysisPages.length, stats]);

    const strategicOpportunities = useMemo(() => {
        if (pagesWithDerivedSignals.length === 0) return [];

        return [...pagesWithDerivedSignals]
            .filter((page) => page.recommendedAction && page.recommendedAction !== 'Monitor')
            .sort((a, b) => {
                const scoreA = Number(a.opportunityScore || 0) + Number(a.businessValueScore || 0);
                const scoreB = Number(b.opportunityScore || 0) + Number(b.businessValueScore || 0);
                return scoreB - scoreA;
            })
            .slice(0, 12)
            .map((page) => ({
                url: page.url,
                title: page.title || page.url,
                recommendedAction: page.recommendedAction,
                recommendedActionReason: page.recommendedActionReason,
                opportunityScore: Number(page.opportunityScore || 0),
                businessValueScore: Number(page.businessValueScore || 0),
                insightConfidence: Number(page.insightConfidence || 0)
            }));
    }, [pagesWithDerivedSignals]);

    const crawlRate = useMemo(() => {
        if (crawlRuntime.rate > 0) return crawlRuntime.rate.toFixed(1);
        if (!crawlStartTime || pages.length === 0) return 0;
        const elapsed = (Date.now() - crawlStartTime) / 1000;
        return elapsed > 0 ? (pages.length / elapsed).toFixed(1) : '0';
    }, [pages.length, crawlStartTime, crawlRuntime.rate]);

    const [elapsedTime, setElapsedTime] = useState('0s');

    const formatBytes = (bytes: any) => {
        if (!bytes || isNaN(Number(bytes))) return '-';
        const b = Number(bytes);
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    };

    const handleExport = () => {
        if (pages.length === 0) return;
        const headers = ALL_COLUMNS.map(col => col.label).join(',');
        const rows = pages.map(page => 
            ALL_COLUMNS.map(col => {
                const val = (page[col.key] === null || page[col.key] === undefined) ? '' : page[col.key];
                // Handle potential object/array values in custom fields
                const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                return `"${strVal.replace(/"/g, '""')}"`;
            }).join(',')
        );
        // Optimize memory by creating Blob directly from array of strings (no massive join)
        const blob = new Blob([headers + "\n", ...rows.map(r => r + "\n")], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `headlight_scan_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportRawDB = async () => {
        if (!currentSessionIdRef.current) return;
        try {
            const { exportSessionData } = await import('../services/CrawlHistoryService');
            const blob = await exportSessionData(currentSessionIdRef.current);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `headlight_raw_dump_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addLog('Raw DB export complete.', 'success');
        } catch (error) {
            console.error('Failed to export raw DB:', error);
            addLog('Failed to export raw DB.', 'error');
        }
    };

    // ─── AI-prioritized category ordering ───
    const prioritizedCategories = useMemo(() => {
        if (!prioritizeByIssues || analysisPages.length === 0) return CATEGORIES;
        
        const catScores = CATEGORIES.map(cat => {
            const counts = categoryCounts[cat.id] || {};
            const totalIssues = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
            // Weight "problem" categories higher
            const isProblematic = ['security', 'codes', 'titles', 'meta', 'performance'].includes(cat.id);
            return { ...cat, score: isProblematic && totalIssues > 0 ? totalIssues * 10 : totalIssues };
        });
        
        // Keep 'internal' first always, then sort by score descending
        const internal = catScores.find(c => c.id === 'internal');
        const rest = catScores.filter(c => c.id !== 'internal').sort((a, b) => b.score - a.score);
        return internal ? [internal, ...rest] : rest;
    }, [categoryCounts, analysisPages.length, prioritizeByIssues]);

    // ─── Session Management Hooks ───
    const saveCrawlSession = useCallback(async (status: 'completed' | 'paused' | 'failed' = 'completed') => {
        if (!currentSessionIdRef.current) return;
        try {
            await persistSessionCheckpoint(status);
            await loadCrawlHistory();
            addLog(`Session saved locally (${pagesRef.current.length} pages).`, 'success');
        } catch (err) {
            console.error('Failed to save session:', err);
        }
    }, [loadCrawlHistory, persistSessionCheckpoint]);

    const loadSession = useCallback(async (sessionId: string) => {
        setIsLoadingHistory(true);
        try {
            const savedPages = await getPages(sessionId);
            const sess = await getSession(sessionId);
            if (sess) {
                setPages(savedPages);
                setSelectedPage(null);
                setSelectedRows(new Set());
                setCurrentSessionId(sessionId);
                setDiffResult(null);
                setCompareSessionId(null);

                setCrawlingMode(sess.crawlingMode || sess.config?.crawlingMode || 'spider');
                const entryUrls = sess.entryUrls || [];
                if ((sess.crawlingMode || sess.config?.crawlingMode) === 'list') {
                    setListUrls(entryUrls.join('\n'));
                } else {
                    setUrlInput(entryUrls[0] || sess.url || '');
                }
                if ((sess.crawlingMode || sess.config?.crawlingMode) !== 'list') {
                    setListUrls('');
                }
                sessionEntrySignatureRef.current = buildSessionSignature(
                    sess.crawlingMode || sess.config?.crawlingMode || 'spider',
                    entryUrls
                );
                setConfig(sess.config || config);
                setIgnoredUrls(new Set(sess.ignoredUrls || []));
                setUrlTags(sess.urlTags || {});
                setColumnWidths(sess.columnWidths || {});
                setRobotsTxt(sess.robotsTxt || null);
                setSitemapData(sess.sitemapData || null);
                setCrawlStartTime(sess.startedAt || null);
                setCrawlRuntime(sess.runtime || {
                    stage: sess.status === 'completed' ? 'completed' : sess.status === 'failed' ? 'error' : 'paused',
                    queued: 0,
                    activeWorkers: 0,
                    discovered: savedPages.length,
                    crawled: savedPages.length,
                    maxDepthSeen: Math.max(0, ...savedPages.map((page: any) => page.crawlDepth || 0)),
                    concurrency: parseInt(String(sess.config?.threads), 10) || 5,
                    mode: sess.crawlingMode || sess.config?.crawlingMode || 'spider',
                    rate: 0,
                    workerUtilization: 0
                });
                setIsCrawling(false);

                addLog(`Loaded session with ${savedPages.length} pages.`, 'success');
            }
        } catch (err) {
            addLog('Failed to load session.', 'error');
        } finally {
            setIsLoadingHistory(false);
        }
    }, [buildSessionSignature, config, setPages, setSelectedPage, setSelectedRows, setCurrentSessionId, setIgnoredUrls, setUrlTags, setColumnWidths]);

    useEffect(() => {
        // Initialize the persistent data layer (Turso)
        initializeDatabase().catch(err => console.warn('Failed to initialize Turso DB:', err));

        if (typeof window === 'undefined') return;
        if (!initialUrlStateHydratedRef.current) {
            const params = getHashRouteSearchParams();
            const urlParam = params.get('url');
            const modeParam = params.get('mode');

            if (urlParam && !urlInput) {
                setUrlInput(urlParam);
            }
            if (modeParam === 'spider' || modeParam === 'list' || modeParam === 'sitemap') {
                setCrawlingMode(modeParam);
            }

            initialUrlStateHydratedRef.current = true;
        }

        const sessionIdFromUrl = getHashRouteSearchParams().get('session');
        const preferredSessionId = sessionIdFromUrl || window.localStorage.getItem(CRAWLER_LAST_SESSION_STORAGE_KEY);
        const draftRaw = window.localStorage.getItem(CRAWLER_DRAFT_STORAGE_KEY);

        if (!draftRaw && !preferredSessionId) {
            autoRestoreAttemptedRef.current = true;
            persistenceReadyRef.current = true;
            return;
        }

        if (draftRaw && !autoRestoreAttemptedRef.current) {
            try {
                const draft = JSON.parse(draftRaw);
                if (!urlInput && typeof draft.urlInput === 'string') setUrlInput(draft.urlInput);
                if (!listUrls && typeof draft.listUrls === 'string') setListUrls(draft.listUrls);
                if (draft.crawlingMode && ['spider', 'list', 'sitemap'].includes(draft.crawlingMode)) {
                    setCrawlingMode(draft.crawlingMode);
                }
                if (draft.config && typeof draft.config === 'object') {
                    setConfig((prev: any) => ({ ...prev, ...draft.config }));
                }
            } catch (error) {
                console.error('Failed to restore crawler draft state:', error);
            }
        }

        if (currentSessionId || isLoadingHistory) return;
        if (autoRestoreAttemptedRef.current) {
            persistenceReadyRef.current = true;
            return;
        }
        if (crawlHistory.length === 0) return;

        const restoreTarget = crawlHistory.find((session) => session.id === preferredSessionId)?.id;

        autoRestoreAttemptedRef.current = true;
        persistenceReadyRef.current = true;

        if (!restoreTarget) return;

        loadSession(restoreTarget).catch((error) => {
            console.error('Failed to auto-restore crawler session:', error);
        });
    }, [crawlHistory, currentSessionId, isLoadingHistory, loadSession, urlInput, listUrls]);

    const resumeCrawlSession = useCallback(async (sessionId: string) => {
        await loadSession(sessionId);
        addLog('Session restored. Restarting crawl with saved configuration...', 'info');
        // Give loadSession's state updates a moment to flush to React's internal queue
        // then trigger restart explicitly signaling a resume
        window.setTimeout(() => {
            handleStartPause(true);
        }, 150);
    }, [loadSession]);

    const compareSessions = useCallback(async (oldSessionId: string, newSessionId: string) => {
        try {
            if (oldSessionId === newSessionId) {
                addLog('Choose two different sessions to compare.', 'info');
                return;
            }
            const oldPages = await getPages(oldSessionId);
            const newPages = await getPages(newSessionId);
            const diff = diffSessions(oldPages, newPages);
            setDiffResult(diff);
            setCompareSessionId(oldSessionId);
            addLog(`Compared sessions: ${oldPages.length} pages vs ${newPages.length} pages.`, 'success');
        } catch (err) {
            addLog('Failed to compare sessions.', 'error');
        }
    }, []);

    const deleteCrawlSession = useCallback(async (sessionId: string) => {
        try {
            await deleteSession(sessionId);
            await loadCrawlHistory();
            addLog('Session deleted.', 'info');
        } catch (err) {
            addLog('Failed to delete session.', 'error');
        }
    }, [loadCrawlHistory]);

    const saveIntegrationConnection = useCallback((
        provider: CrawlerIntegrationProvider,
        connection: Omit<CrawlerIntegrationConnection, 'provider' | 'connectedAt' | 'ownership'>
    ) => {
        if (connection.credentials && Object.keys(connection.credentials).length > 0) {
            storeCrawlerIntegrationSecret(integrationSecretScope, provider, connection.credentials);
        }

        const nextConnection: CrawlerIntegrationConnection = {
            provider,
            connectedAt: Date.now(),
            ownership: isAuthenticated && activeProject?.id ? 'project' : 'anonymous',
            sync: connection.sync || { status: 'idle' },
            ...connection,
            credentials: {},
            hasCredentials: Boolean(connection.credentials && Object.keys(connection.credentials).length > 0)
        };

        setIntegrationConnections((prev) => {
            const next = {
                ...prev,
                [provider]: nextConnection
            };

            if (isAuthenticated && activeProject?.id) {
                upsertProjectCrawlerIntegration(activeProject.id, nextConnection).catch((error) => {
                    console.error('Failed to persist project crawler integration:', error);
                });
            } else {
                saveAnonymousCrawlerIntegrations(next);
            }

            return next;
        });
    }, [isAuthenticated, activeProject?.id]);

    const removeIntegrationConnection = useCallback((provider: CrawlerIntegrationProvider) => {
        setIntegrationConnections((prev) => {
            const next = { ...prev };
            delete next[provider];
            clearCrawlerIntegrationSecret(integrationSecretScope, provider);

            if (isAuthenticated && activeProject?.id) {
                removeProjectCrawlerIntegration(activeProject.id, provider).catch((error) => {
                    console.error('Failed to remove project crawler integration:', error);
                });
            } else {
                saveAnonymousCrawlerIntegrations(next);
            }

            return next;
        });
    }, [isAuthenticated, activeProject?.id, integrationSecretScope]);

    const value = {
        crawlingMode, setCrawlingMode, urlInput, setUrlInput, listUrls, setListUrls, showListModal, setShowListModal,
        isCrawling, setIsCrawling, pages: pagesWithDerivedSignals, setPages, logs, setLogs, crawlStartTime, setCrawlStartTime,
        activeCategory, setActiveCategory, openCategories, setOpenCategories, searchQuery, setSearchQuery,
        selectedPage, setSelectedPage, activeTab, setActiveTab, showAuditSidebar, setShowAuditSidebar,
        activeAuditTab, setActiveAuditTab, showSettings, setShowSettings, activeMacro, setActiveMacro,
        sortConfig, setSortConfig, showColumnPicker, setShowColumnPicker, visibleColumns, setVisibleColumns,
        viewMode, setViewMode, showAiInsights, setShowAiInsights, graphDimensions, setGraphDimensions,
        graphContainerRef, fgRef, categorySearch, setCategorySearch, leftSidebarPreset, setLeftSidebarPreset,
        logSearch, setLogSearch, logTypeFilter, setLogTypeFilter, selectedRows, setSelectedRows,
        gridScrollTop, setGridScrollTop, ROW_HEIGHT, VISIBLE_BUFFER, leftSidebarWidth, setLeftSidebarWidth,
        auditSidebarWidth, setAuditSidebarWidth, detailsHeight, setDetailsHeight, 
        gridScrollOffset, setGridScrollOffset, isDraggingLeftSidebar, setIsDraggingLeftSidebar, isDraggingSidebar, setIsDraggingSidebar,
        isDraggingDetails, setIsDraggingDetails, 
        showAutoFixModal, setShowAutoFixModal, autoFixItems, setAutoFixItems,
        isFixing, setIsFixing, autoFixProgress, setAutoFixProgress, stats, setStats, columns, config, setConfig, settingsTab, setSettingsTab,
        theme, setTheme, integrationConnections, integrationsLoading, integrationsSource, saveIntegrationConnection, removeIntegrationConnection, wsRef, addLog, toggleCategory, handleStartPause,
        clearCrawlerWorkspace,
        dynamicClusters, categoryCounts, healthScore, auditInsights, strategicOpportunities, crawlRate, crawlRuntime, elapsedTime, setElapsedTime,
        formatBytes, handleExport, handleExportRawDB, filteredPages, handleSort, graphData, handleNodeClick,
        crawlHistory, currentSessionId, compareSessionId, diffResult, isLoadingHistory,
        saveCrawlSession, loadSession, resumeCrawlSession, compareSessions, deleteCrawlSession, loadCrawlHistory,
        isAuthenticated, user, profile, signOut, trialPagesLimit,
        prioritizedCategories, prioritizeByIssues, setPrioritizeByIssues,
        sidebarCollapsed, setSidebarCollapsed,
        showScheduleModal, setShowScheduleModal,
        ignoredUrls, setIgnoredUrls, urlTags, setUrlTags,
        robotsTxt, sitemapData,
        columnWidths, setColumnWidths
    };

    return (
        <SeoCrawlerContext.Provider value={value}>
            {children}
        </SeoCrawlerContext.Provider>
    );
}

export function useSeoCrawler() {
    const context = useContext(SeoCrawlerContext);
    if (context === undefined) {
        throw new Error('useSeoCrawler must be used within a SeoCrawlerProvider');
    }
    return context;
}
