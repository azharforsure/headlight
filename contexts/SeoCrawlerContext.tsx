import React, { createContext, useContext, useState, useRef, useMemo, useEffect, useCallback, useDeferredValue, startTransition, ReactNode } from 'react';
import {
    CATEGORIES,
    ALL_COLUMNS,
    SEO_ISSUES_TAXONOMY,
    ISSUE_TO_CHECK_MAP,
    resolveIssueCheckId,
    matchesCategoryFilter,
    AI_INSIGHTS_CATEGORY
} from '../components/seo-crawler/constants';
import { AUDIT_MODES } from '../services/AuditModeConfig';
import {
    DEFAULT_FILTER_STATE,
    type AuditFilterState,
    getActiveCategoryTreeIds,
    getActiveCheckIds
} from '../services/CheckFilterEngine';
import type { AuditMode, IndustryFilter } from '../services/CheckRegistry';
import {
    fetchPresetsFromCloud,
    getLocalPresets,
    saveLocalPreset,
    syncPresetsToCloud,
    type CustomAuditPreset
} from '../services/AuditPresetService';
import { 
    saveSession, getSessions, getPages, getSession, deleteSession, 
    generateSessionId, diffSessions, CrawlSession, upsertPages
} from '../services/CrawlHistoryService';
import { useAuth } from '../services/AuthContext';
import { useOptionalProject } from '../services/ProjectContext';
import { calculateInternalPageRank, calculatePredictiveScore } from '../services/StrategicIntelligence';
import { persistCrawlResults, syncCrawlStatus, persistEnrichmentStatus } from '../services/CrawlPersistenceService';
import { syncFromCrawl } from '../services/DashboardDataService';
import { 
    CrawlerIntegrationConnection,
    CrawlerIntegrationProvider,
    fetchProjectCrawlerIntegrations,
    getAnonymousCrawlerIntegrations,
    promoteAnonymousCrawlerIntegrationsToProject,
    replaceProjectCrawlerIntegrations,
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
import { GscClientService } from '../services/GscClientService';
import { Ga4ClientService } from '../services/Ga4ClientService';
import { BacklinkClientService } from '../services/BacklinkClientService';
import { PostCrawlEnrichment } from '../services/PostCrawlEnrichment';
import { refreshGoogleToken } from '../services/GoogleOAuthHelper';
import { initializeDatabase } from '../services/turso';
import { useLiveQuery } from 'dexie-react-hooks';
import { crawlDb } from '../services/CrawlDatabase';
import { GoogleSelectionResolver, EffectiveGoogleSelection } from '../services/googleSelectionResolver';
import { UrlNormalization } from '../services/UrlNormalization';
import { refreshWithLock } from '../services/TokenRefreshLock';
import { getAIEngine } from '../services/ai';
import type { PageAIResult } from '../services/ai/AIAnalysisEngine';

export type InspectorTab =
    | 'general'
    | 'seo'
    | 'content'
    | 'links'
    | 'schema'
    | 'performance'
    | 'images'
    | 'social'
    | 'gsc'
    | 'ga4'
    | 'ai'
    | 'details'
    | 'headers'
    | 'serp'
    | 'source';

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
    logs: any[];
    setLogs: (l: any[]) => void;
    crawlStartTime: number | null;
    setCrawlStartTime: (t: number | null) => void;
    activeCategories: Array<{ group: string; sub: string }>;
    setActiveCategories: React.Dispatch<React.SetStateAction<Array<{ group: string; sub: string }>>>;
    activeCategory: { group: string; sub: string };
    setActiveCategory: (c: { group: string; sub: string }) => void;
    auditFilter: AuditFilterState;
    activeCheckIds: Set<string>;
    activeCheckCategories: Set<string>;
    filteredIssuePages: Array<{ category: string; issues: any[] }>;
    customPresets: CustomAuditPreset[];
    applyAuditMode: (modes: AuditMode[], industry: IndustryFilter) => void;
    saveCustomPreset: (name: string, modes: AuditMode[], industry: IndustryFilter) => void;
    loadCustomPreset: (preset: CustomAuditPreset) => void;
    openCategories: string[];
    setOpenCategories: (c: string[]) => void;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    selectedPage: any | null;
    setSelectedPage: (p: any | null) => void;
    activeTab: InspectorTab;
    setActiveTab: (t: InspectorTab) => void;
    inspectorCollapsed: boolean;
    setInspectorCollapsed: (c: boolean) => void;
    showAuditSidebar: boolean;
    setShowAuditSidebar: (s: boolean) => void;
    activeAuditTab: 'overview' | 'issues' | 'opportunities' | 'ai' | 'history' | 'logs' | 'robots' | 'sitemap';
    setActiveAuditTab: (t: 'overview' | 'issues' | 'opportunities' | 'ai' | 'history' | 'logs' | 'robots' | 'sitemap') => void;
    showSettings: boolean;
    setShowSettings: (s: boolean) => void;
    activeMacro: string | null;
    setActiveMacro: (m: string | null) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    setSortConfig: (c: { key: string; direction: 'asc' | 'desc' } | null) => void;
    showColumnPicker: boolean;
    setShowColumnPicker: (s: boolean) => void;
    visibleColumns: string[];
    setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
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
    logTypeFilter: 'all' | 'info' | 'warn' | 'error' | 'success';
    setLogTypeFilter: (f: 'all' | 'info' | 'warn' | 'error' | 'success') => void;
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
    crawlDb: typeof crawlDb;
    runFullEnrichment: () => Promise<void>;
    runIncrementalEnrichment: () => Promise<void>;
    runSelectedEnrichment: (urls: string[]) => Promise<void>;
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
    setAutoFixItems: React.Dispatch<React.SetStateAction<any[]>>;
    isFixing: boolean;
    setIsFixing: (f: boolean) => void;
    autoFixProgress: number;
    setAutoFixProgress: (p: number) => void;
    stats: any;
    setStats: (s: any) => void;
    dynamicClusters: string[];
    categoryCounts: Record<string, Record<string, number>>;
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
    handleImport: (file: File) => Promise<void>;
    detectedGscSite: string | null;
    setDetectedGscSite: (s: string | null) => void;
    detectedGa4Property: string | null;
    setDetectedGa4Property: (p: string | null) => void;
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
    sitemapData: { totalUrls: number; sources: string[]; coverageParsed?: boolean } | null;
    columns: any[];
    config: any;
    setConfig: (c: any) => void;
    settingsTab: string;
    setSettingsTab: React.Dispatch<React.SetStateAction<string>>;
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    integrationConnections: Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>;
    integrationsLoading: boolean;
    integrationsSource: 'anonymous' | 'project' | 'project-cache' | 'none';
    saveIntegrationConnection: (provider: CrawlerIntegrationProvider, connection: Omit<CrawlerIntegrationConnection, 'provider' | 'connectedAt' | 'ownership'>) => void;
    removeIntegrationConnection: (provider: CrawlerIntegrationProvider) => void;
    wsRef: React.RefObject<any>;
    addLog: (msg: string, type?: 'info' | 'warn' | 'error' | 'success', meta?: { source?: 'crawler' | 'session' | 'history' | 'analysis' | 'system'; url?: string; detail?: string }) => void;
    toggleCategory: (c: string) => void;
    handleStartPause: (forceResume?: boolean) => void;
    clearCrawlerWorkspace: () => void;
    showTrialLimitAlert: boolean;
    setShowTrialLimitAlert: (s: boolean) => void;

    // AI Layer
    aiResults: Map<string, PageAIResult>;
    aiProgress: { done: number; total: number; url: string } | null;
    aiNarrative: string;
    isAnalyzingAI: boolean;
    runAIAnalysis: (pagesToAnalyze?: any[]) => Promise<void>;
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

    const params = new URLSearchParams(window.location.search || '');
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');

    if (queryIndex >= 0) {
        const hashParams = new URLSearchParams(hash.slice(queryIndex + 1));
        hashParams.forEach((value, key) => {
            params.set(key, value);
        });
    }

    return params;
};

const replaceHashRouteSearchParams = (mutate: (params: URLSearchParams) => void) => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash || '';
    const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const [pathPart] = normalizedHash.split('?');
    // Use empty path — the React Router path already provides /crawler
    const path = '';
    const params = getHashRouteSearchParams();

    mutate(params);

    const nextQuery = params.toString();
    const nextHash = nextQuery ? `#?${nextQuery}` : '';

    if (window.location.hash === nextHash) return;

    window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}${nextHash}`
    );
};

const normalizeComparableText = (value: any) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const mergePagesByUrl = (existingPages: any[], nextPages: any[]) => {
    const pageMap = new Map<string, any>();

    existingPages.forEach((page) => {
        if (page?.url) pageMap.set(page.url, page);
    });

    nextPages.forEach((page) => {
        if (!page?.url) return;
        pageMap.set(page.url, {
            ...(pageMap.get(page.url) || {}),
            ...page
        });
    });

    return Array.from(pageMap.values());
};

const normalizeCrawlerPage = (page: any) => {
    if (!page || typeof page.url !== 'string') return null;

    const url = page.url.trim();
    if (!url) return null;

    const redirectChain = Array.isArray(page.redirectChain)
        ? page.redirectChain.filter((item: unknown): item is string => typeof item === 'string' && item.length > 0)
        : [];

    let recommendedActionFactors = null;
    if (typeof page.recommendedActionFactors === 'string') {
        recommendedActionFactors = page.recommendedActionFactors;
    } else if (Array.isArray(page.recommendedActionFactors)) {
        try {
            recommendedActionFactors = JSON.stringify(page.recommendedActionFactors);
        } catch {
            recommendedActionFactors = null;
        }
    }

    return {
        ...page,
        url,
        status: typeof page.status === 'string' ? page.status : '',
        title: typeof page.title === 'string' ? page.title : '',
        metaDesc: typeof page.metaDesc === 'string' ? page.metaDesc : '',
        h1_1: typeof page.h1_1 === 'string' ? page.h1_1 : '',
        h1_2: typeof page.h1_2 === 'string' ? page.h1_2 : '',
        h2_1: typeof page.h2_1 === 'string' ? page.h2_1 : '',
        h2_2: typeof page.h2_2 === 'string' ? page.h2_2 : '',
        contentType: typeof page.contentType === 'string' ? page.contentType : '',
        canonical: typeof page.canonical === 'string' ? page.canonical : '',
        indexabilityStatus: typeof page.indexabilityStatus === 'string' ? page.indexabilityStatus : '',
        metaRobots1: typeof page.metaRobots1 === 'string' ? page.metaRobots1 : '',
        metaRobots2: typeof page.metaRobots2 === 'string' ? page.metaRobots2 : '',
        xRobots: typeof page.xRobots === 'string' ? page.xRobots : '',
        xRobotsNoindex: page.xRobotsNoindex === true,
        xRobotsNofollow: page.xRobotsNofollow === true,
        topicCluster: typeof page.topicCluster === 'string' ? page.topicCluster : '',
        funnelStage: typeof page.funnelStage === 'string' ? page.funnelStage : '',
        searchIntent: typeof page.searchIntent === 'string' ? page.searchIntent : '',
        language: typeof page.language === 'string' ? page.language : '',
        readability: typeof page.readability === 'string' ? page.readability : '',
        redirectUrl: typeof page.redirectUrl === 'string' ? page.redirectUrl : '',
        finalUrl: typeof page.finalUrl === 'string'
            ? page.finalUrl
            : (typeof page.redirectUrl === 'string' && page.redirectUrl)
                ? page.redirectUrl
                : url,
        redirectChain,
        redirectChainLength: Number.isFinite(Number(page.redirectChainLength))
            ? Number(page.redirectChainLength)
            : Math.max(0, redirectChain.length - 1),
        inlinksList: Array.isArray(page.inlinksList) ? page.inlinksList : [],
        outlinksList: Array.isArray(page.outlinksList) ? page.outlinksList : [],
        externalLinks: Array.isArray(page.externalLinks) ? page.externalLinks : [],
        images: Array.isArray(page.images) ? page.images : [],
        headingHierarchy: Array.isArray(page.headingHierarchy) ? page.headingHierarchy : [],
        schemaTypes: Array.isArray(page.schemaTypes) ? page.schemaTypes : [],
        fontDisplayValues: Array.isArray(page.fontDisplayValues) ? page.fontDisplayValues : [],
        uniqueThirdPartyDomains: Array.isArray(page.uniqueThirdPartyDomains) ? page.uniqueThirdPartyDomains : [],
        exposedEmails: Array.isArray(page.exposedEmails) ? page.exposedEmails : [],
        cookieDetails: Array.isArray(page.cookieDetails) ? page.cookieDetails : [],
        hasHsts: typeof page.hasHsts === 'boolean'
            ? page.hasHsts
            : (typeof page.hstsMissing === 'boolean' ? !page.hstsMissing : undefined),
        hasCsp: typeof page.hasCsp === 'boolean'
            ? page.hasCsp
            : (typeof page.cspPresent === 'boolean' ? page.cspPresent : undefined),
        hasXFrameOptions: typeof page.hasXFrameOptions === 'boolean'
            ? page.hasXFrameOptions
            : (typeof page.xFrameMissing === 'boolean' ? !page.xFrameMissing : undefined),
        hasXContentTypeOptions: typeof page.hasXContentTypeOptions === 'boolean'
            ? page.hasXContentTypeOptions
            : (typeof page.xContentTypeNoSniff === 'boolean' ? page.xContentTypeNoSniff : undefined),
        hasCacheControl: typeof page.hasCacheControl === 'boolean' ? page.hasCacheControl : undefined,
        hasEtag: typeof page.hasEtag === 'boolean' ? page.hasEtag : undefined,
        hasLastModified: typeof page.hasLastModified === 'boolean' ? page.hasLastModified : undefined,
        hasExpires: typeof page.hasExpires === 'boolean' ? page.hasExpires : undefined,
        hasViewportMeta: typeof page.hasViewportMeta === 'boolean' ? page.hasViewportMeta : undefined,
        viewportWidth: typeof page.viewportWidth === 'boolean' ? page.viewportWidth : undefined,
        sslValid: typeof page.sslValid === 'boolean' ? page.sslValid : undefined,
        responseHeaders: page.responseHeaders && typeof page.responseHeaders === 'object' ? page.responseHeaders : null,
        recommendedActionFactors,

        // Consolidated Volume Metrics (Main)
        mainKwVolume: Number(page.mainKwSearchVolume || page.mainKwEstimatedVolume || 0),
        mainKwVolumeSource: page.mainKwSearchVolume ? 'db' : (page.mainKwEstimatedVolume ? 'gsc' : 'none'),

        // Consolidated Volume Metrics (Best)
        bestKwVolume: Number(page.bestKwSearchVolume || page.bestKwEstimatedVolume || 0),
        bestKwVolumeSource: page.bestKwSearchVolume ? 'db' : (page.bestKwEstimatedVolume ? 'gsc' : 'none'),
    };
};

const buildSitemapState = (
    totalUrls: unknown,
    sources: unknown,
    coverageParsed = true
): { totalUrls: number; sources: string[]; coverageParsed?: boolean } | null => {
    const normalizedSources = Array.isArray(sources)
        ? sources.filter((source: unknown): source is string => typeof source === 'string' && source.trim().length > 0)
        : [];

    const parsedTotal = Number(totalUrls);
    const normalizedTotal = Number.isFinite(parsedTotal) && parsedTotal >= 0 ? parsedTotal : 0;

    if (normalizedSources.length === 0 && normalizedTotal <= 0) {
        return null;
    }

    return {
        totalUrls: normalizedTotal,
        sources: normalizedSources,
        coverageParsed
    };
};

const hasOwn = (value: Record<string, any>, key: string) =>
    Object.prototype.hasOwnProperty.call(value, key);

const derivePageIntelligence = (page: any) => {
    const impressions = Number(page.gscImpressions || 0);
    const clicks = Number(page.gscClicks || 0);
    const ctr = Number(page.gscCtr || 0);
    const position = Number(page.gscPosition || 0);
    const sessions = Number(page.ga4Sessions || 0);
    const users = Number(page.ga4Users || 0);
    const bounceRate = Number(page.ga4BounceRate || 0);
    const avgSessionDuration = Number(page.ga4EngagementTimePerPage || page.ga4AvgSessionDuration || 0);
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

    const computedAuthorityScore = clampScore((referringDomains * 2.5) + (urlRating * 4) + (linkEquity * 6));
    const computedBusinessValueScore = clampScore((sessions * 2) + (users * 1.5) + Math.max(0, avgSessionDuration / 3) - (bounceRate * 30));
    const computedOpportunityScore = clampScore((impressions / 25) + ((position > 0 && position <= 20) ? (24 - position) * 2 : 0) + ((ctr > 0 && ctr < 0.03) ? 18 : 0) + (computedAuthorityScore * 0.25) + (computedBusinessValueScore * 0.2) - technicalPenalty);
    const authorityScore = Number(page.authorityScore ?? computedAuthorityScore);
    const businessValueScore = Number(page.businessValueScore ?? computedBusinessValueScore);
    const opportunityScore = Number(page.opportunityScore ?? computedOpportunityScore);
    const engagementRisk = clampScore((bounceRate * 100) - Math.min(40, avgSessionDuration / 5));
    const trafficQuality = clampScore((businessValueScore * 0.65) + (Math.max(0, 1 - bounceRate) * 35));
    const coverageParts = [
        impressions > 0 || clicks > 0 ? 1 : 0,
        sessions > 0 || users > 0 ? 1 : 0,
        referringDomains > 0 || urlRating > 0 ? 1 : 0
    ];
    const coverage = coverageParts.length > 0 ? Math.round((coverageParts.reduce((sum, item) => sum + item, 0) / coverageParts.length) * 100) : 0;
    const recommendedAction = page.recommendedAction || 'Monitor';
    const recommendedActionReason = page.recommendedActionReason || '';
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
    const updateProject = projectContext?.updateProject || null;
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
    
    const [logs, setLogs] = useState<{
        msg: string;
        type: 'info' | 'warn' | 'error' | 'success';
        time: number;
        source?: 'crawler' | 'session' | 'history' | 'analysis' | 'system' | 'enrichment';
        url?: string;
        sessionId?: string;
        detail?: string;
    }[]>([]);
    const [crawlStartTime, setCrawlStartTime] = useState<number | null>(null);
    
    // UI states
    const [activeCategories, setActiveCategories] = useState<Array<{ group: string; sub: string }>>([
        { group: 'internal', sub: 'All' }
    ]);
    const activeCategory = activeCategories[0] || { group: 'internal', sub: 'All' };
    const setActiveCategory = useCallback((category: { group: string; sub: string }) => {
        setActiveCategories([category]);
    }, []);
    const [auditFilter, setAuditFilter] = useState<AuditFilterState>(DEFAULT_FILTER_STATE);
    const [customPresets, setCustomPresets] = useState<CustomAuditPreset[]>(() => getLocalPresets());
    const [openCategories, setOpenCategories] = useState<string[]>(() => CATEGORIES.map((category) => category.id));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPage, setSelectedPage] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<InspectorTab>('general');
    const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
    const [showAuditSidebar, setShowAuditSidebar] = useState(false);
    const [activeAuditTab, setActiveAuditTab] = useState<'overview' | 'issues' | 'opportunities' | 'ai' | 'history' | 'logs' | 'robots' | 'sitemap'>('overview');

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
    const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'success'>('all');

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
    const [detectedGscSite, setDetectedGscSite] = useState<string | null>(null);
    const [detectedGa4Property, setDetectedGa4Property] = useState<string | null>(null);

    // Live query for pages from IndexedDB (moved after currentSessionId)
    const pages = useLiveQuery(
        () => currentSessionId
            ? crawlDb.pages.where('crawlId').equals(currentSessionId).toArray().then((rows) =>
                rows
                    .map(normalizeCrawlerPage)
                    .filter((page): page is any => Boolean(page))
            )
            : Promise.resolve([]),
        [currentSessionId],
        [] as any[]
    );

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
    const [sitemapData, setSitemapData] = useState<{ totalUrls: number; sources: string[]; coverageParsed?: boolean } | null>(null);

    // --- Column Width Overrides (Already declared above) ---

    const columns = useMemo(() => ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)), [visibleColumns]);

    // Config & Settings
    const [config, setConfig] = useState<any>({ 
        limit: '', maxDepth: '', threads: 5, crawlSpeed: 'normal',
        userAgent: 'Headlight Scanner 1.0', respectRobots: true, 
        excludeRules: '', includeRules: '', ignoreQueryParams: false,
        jsRendering: false, extractCss: '', extractRegex: '', viewportWidth: 1920, viewportHeight: 1080,
        generateEmbeddings: false, aiCategorization: true, aiSentiment: false,
        aiEnabled: true, aiAutoRotation: true, aiBatchSize: 20,
        fetchWebVitals: false, crawlResources: false,
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
    const [crawlRuntime, setCrawlRuntime] = useState<CrawlerContextType['crawlRuntime']>({
        stage: 'idle',
        queued: 0,
        activeWorkers: 0,
        discovered: 0,
        crawled: 0,
        maxDepthSeen: 0,
        concurrency: 0,
        mode: 'spider',
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
    const [hasHydrated, setHasHydrated] = useState(false);
    const initialUrlStateHydratedRef = useRef(false);
    const autoRestoreAttemptedRef = useRef(false);
    const inMemoryPageLimitAlertedRef = useRef(false);
    const currentSessionIdRef = useRef<string | null>(null);
    const integrationsHydratedRef = useRef(false);
    const ghostCrawlerRef = useRef<GhostCrawler | null>(null);
    const routeProjectId = getHashRouteSearchParams().get('projectId');
    const integrationProjectId = activeProject?.id || routeProjectId || null;
    const integrationSecretScope = getCrawlerSecretScope(integrationProjectId);

    useEffect(() => {
        if (!integrationProjectId) return;
        let cancelled = false;

        fetchPresetsFromCloud(integrationProjectId)
            .then((cloudPresets) => {
                if (cancelled || cloudPresets.length === 0) return;
                setCustomPresets(cloudPresets);
            })
            .catch(() => {
                // Keep local presets when cloud fetch is unavailable.
            });

        return () => {
            cancelled = true;
        };
    }, [integrationProjectId]);

    useEffect(() => {
        if (!integrationProjectId) return;
        syncPresetsToCloud(integrationProjectId, customPresets).catch(() => {
            // Cloud sync is best-effort.
        });
    }, [integrationProjectId, customPresets]);

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
                if (isAuthenticated && integrationProjectId) {
                    const promotion = await promoteAnonymousCrawlerIntegrationsToProject(integrationProjectId);
                    if (cancelled) return;

                    if (promotion.promoted) {
                        setIntegrationConnections(promotion.connections);
                        setIntegrationsSource('project');
                    }

                    const result = await fetchProjectCrawlerIntegrations(integrationProjectId);
                    if (cancelled) return;

                    setIntegrationConnections(result.connections);
                    setIntegrationsSource(result.source);
                    saveProjectCachedCrawlerIntegrations(integrationProjectId, result.connections);
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
    }, [isAuthenticated, integrationProjectId]);

    useEffect(() => {
        const googleSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'google');
        const bingSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'bingWebmaster');
        
        setConfig((prev: any) => ({
            ...prev,
            gscApiKey: googleSecrets.accessToken || googleSecrets.access_token || prev.gscApiKey || '',
            gscRefreshToken: googleSecrets.refreshToken || googleSecrets.refresh_token || prev.gscRefreshToken || '',
            gscSiteUrl: integrationConnections.google?.sync?.siteUrl || integrationConnections.google?.selection?.siteUrl || prev.gscSiteUrl || '',
            ga4PropertyId: integrationConnections.google?.sync?.propertyId || integrationConnections.google?.selection?.propertyId || prev.ga4PropertyId || '',
            bingAccessToken: bingSecrets.accessToken || prev.bingAccessToken || '',
        }));
    }, [integrationConnections.google, integrationConnections.bingWebmaster, integrationSecretScope]);

    // ─── Legacy Migration Effect ─────────────────────
    useEffect(() => {
        if (!integrationsHydratedRef.current) return;
        
        const legacyGsc = (integrationConnections as any)['googleSearchConsole'];
        const legacyGa4 = (integrationConnections as any)['googleAnalytics'];

        if (legacyGsc || legacyGa4) {
            setIntegrationConnections((prev: any) => {
                const next = { ...prev };
                const googleConnection: any = next.google || {
                    provider: 'google',
                    label: 'Google Unified',
                    status: 'connected',
                    authType: 'oauth',
                    ownership: activeProject?.id ? 'project' : 'anonymous',
                    connectedAt: Date.now(),
                    accountLabel: legacyGsc?.accountLabel || legacyGa4?.accountLabel || 'Migrated Account',
                    sync: { status: 'idle' }
                };

                if (legacyGsc?.selection?.siteUrl) {
                    googleConnection.sync = { ...googleConnection.sync, siteUrl: legacyGsc.selection.siteUrl };
                }
                if (legacyGa4?.selection?.propertyId) {
                    googleConnection.sync = { ...googleConnection.sync, propertyId: legacyGa4.selection.propertyId };
                }

                next.google = googleConnection;
                delete next['googleSearchConsole'];
                delete next['googleAnalytics'];
                
                // Migrate secrets too
                const gscSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'googleSearchConsole' as any);
                const ga4Secrets = getCrawlerIntegrationSecret(integrationSecretScope, 'googleAnalytics' as any);
                const accessToken = gscSecrets?.accessToken || gscSecrets?.access_token || ga4Secrets?.accessToken || ga4Secrets?.access_token;
                const refreshToken = gscSecrets?.refreshToken || gscSecrets?.refresh_token || ga4Secrets?.refreshToken || ga4Secrets?.refresh_token;
                if (accessToken || refreshToken) {
                    storeCrawlerIntegrationSecret(integrationSecretScope, 'google', {
                        accessToken: accessToken || '',
                        access_token: accessToken || '',
                        refreshToken: refreshToken || '',
                        refresh_token: refreshToken || ''
                    });
                }

                return next;
            });

            if (integrationProjectId) {
                const migratedConnections = {
                    ...integrationConnections,
                    google: {
                        provider: 'google',
                        label: legacyGsc?.label || legacyGa4?.label || 'Google Search & Analytics',
                        status: 'connected',
                        authType: 'oauth',
                        ownership: 'project' as const,
                        connectedAt: Date.now(),
                        accountLabel: legacyGsc?.accountLabel || legacyGa4?.accountLabel || 'Migrated Account',
                        selection: {
                            siteUrl: legacyGsc?.selection?.siteUrl || integrationConnections.google?.selection?.siteUrl,
                            propertyId: legacyGa4?.selection?.propertyId || integrationConnections.google?.selection?.propertyId
                        },
                        sync: {
                            ...(integrationConnections.google?.sync || { status: 'idle' }),
                            siteUrl: legacyGsc?.selection?.siteUrl || integrationConnections.google?.sync?.siteUrl,
                            propertyId: legacyGa4?.selection?.propertyId || integrationConnections.google?.sync?.propertyId
                        },
                        hasCredentials: Boolean(
                            getCrawlerIntegrationSecret(integrationSecretScope, 'google' as any).accessToken ||
                            getCrawlerIntegrationSecret(integrationSecretScope, 'google' as any).access_token ||
                            getCrawlerIntegrationSecret(integrationSecretScope, 'googleSearchConsole' as any).accessToken ||
                            getCrawlerIntegrationSecret(integrationSecretScope, 'googleSearchConsole' as any).access_token ||
                            getCrawlerIntegrationSecret(integrationSecretScope, 'googleAnalytics' as any).accessToken ||
                            getCrawlerIntegrationSecret(integrationSecretScope, 'googleAnalytics' as any).access_token
                        ),
                        credentials: {}
                    }
                } as Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>;

                delete (migratedConnections as any).googleSearchConsole;
                delete (migratedConnections as any).googleAnalytics;

                replaceProjectCrawlerIntegrations(integrationProjectId, migratedConnections).catch((error) => {
                    console.error('Failed to persist migrated Google integration:', error);
                });
            }
        }
    }, [integrationConnections, integrationSecretScope, integrationProjectId]);

    useEffect(() => {
        if (autoRestoreAttemptedRef.current || !hasHydrated || isLoadingHistory) return;
        if (isAuthenticated && integrationProjectId) {
            saveProjectCachedCrawlerIntegrations(integrationProjectId, integrationConnections);
            return;
        }
        saveAnonymousCrawlerIntegrations(integrationConnections);
    }, [integrationConnections, isAuthenticated, integrationProjectId]);

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
        if (!hasHydrated) return; // Wait until hydrated

        try {
            if (currentSessionId) {
                window.localStorage.setItem(CRAWLER_LAST_SESSION_STORAGE_KEY, currentSessionId);
            } else {
                window.localStorage.removeItem(CRAWLER_LAST_SESSION_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to persist last crawler session:', error);
        }
    }, [currentSessionId, hasHydrated]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!hasHydrated) return;
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
    }, [currentSessionId, urlInput, listUrls, crawlingMode, config, hasHydrated]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        replaceHashRouteSearchParams((params) => {
            if (currentSessionId) params.set('session', currentSessionId);
            else params.delete('session');

            if (crawlingMode !== 'spider') params.set('mode', crawlingMode);
            else params.delete('mode');

            // Don't sync urlInput to hash here — only sync on scan start
            // This prevents the URL bar from changing while the user is typing
        });
    }, [currentSessionId, crawlingMode]);

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

    const addLog = useCallback((
        msg: string,
        type: 'info' | 'warn' | 'error' | 'success' = 'info',
        meta?: { source?: 'crawler' | 'session' | 'history' | 'analysis' | 'system' | 'enrichment'; url?: string; detail?: string }
    ) => {
        setLogs(prev => [...prev.slice(-499), {
            msg,
            type,
            time: Date.now(),
            sessionId: currentSessionIdRef.current ?? undefined,
            source: meta?.source ?? 'crawler',
            url: meta?.url,
            detail: meta?.detail,
        }]);
    }, []);

    const loadCrawlHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const sessions = await getSessions(50);
            setCrawlHistory(sessions);
        } catch (err: any) {
            addLog(`Failed to load scan history: ${err.message}`, 'error', { source: 'history' });
            setCrawlHistory([]);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [addLog]);

    // ─── Load crawl history on mount ───
    useEffect(() => {
        loadCrawlHistory();
    }, [loadCrawlHistory]);

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


    const flushPendingPageUpdates = useCallback(() => {
        pendingPagesFlushRef.current = null;
        const updates = Array.from(pendingPageUpdatesRef.current.values()) as any[];
        pendingPageUpdatesRef.current.clear();

        if (updates.length === 0) return;

        const existingPageMap = new Map<string, any>(
            pagesRef.current
                .filter((page) => page?.url)
                .map((page) => [page.url, page])
        );

        // Socket UPDATE_PAGE events are often partial payloads. Persist the
        // fully merged record so late inlink/derived updates do not erase the
        // fields captured earlier in PAGE_CRAWLED.
        const mergedUpdates = updates.map((payload) => {
            const existingPage = existingPageMap.get(payload.url) || {};
            const mergedPage = {
                ...existingPage,
                ...payload,
                crawlId: currentSessionIdRef.current || existingPage.crawlId || '',
                gscClicks: hasOwn(payload, 'gscClicks') ? payload.gscClicks : existingPage.gscClicks ?? null,
                gscImpressions: hasOwn(payload, 'gscImpressions') ? payload.gscImpressions : existingPage.gscImpressions ?? null,
                gscCtr: hasOwn(payload, 'gscCtr') ? payload.gscCtr : existingPage.gscCtr ?? null,
                gscPosition: hasOwn(payload, 'gscPosition') ? payload.gscPosition : existingPage.gscPosition ?? null,
                mainKeyword: hasOwn(payload, 'mainKeyword') ? payload.mainKeyword : existingPage.mainKeyword ?? null,
                mainKeywordSource: hasOwn(payload, 'mainKeywordSource') ? payload.mainKeywordSource : existingPage.mainKeywordSource ?? null,
                mainKwVolume: hasOwn(payload, 'mainKwVolume') ? payload.mainKwVolume : existingPage.mainKwVolume ?? null,
                mainKwSearchVolume: hasOwn(payload, 'mainKwSearchVolume') ? payload.mainKwSearchVolume : existingPage.mainKwSearchVolume ?? null,
                mainKwEstimatedVolume: hasOwn(payload, 'mainKwEstimatedVolume') ? payload.mainKwEstimatedVolume : existingPage.mainKwEstimatedVolume ?? null,
                mainKwPosition: hasOwn(payload, 'mainKwPosition') ? payload.mainKwPosition : existingPage.mainKwPosition ?? null,
                bestKeyword: hasOwn(payload, 'bestKeyword') ? payload.bestKeyword : existingPage.bestKeyword ?? null,
                bestKeywordSource: hasOwn(payload, 'bestKeywordSource') ? payload.bestKeywordSource : existingPage.bestKeywordSource ?? null,
                bestKwVolume: hasOwn(payload, 'bestKwVolume') ? payload.bestKwVolume : existingPage.bestKwVolume ?? null,
                bestKwSearchVolume: hasOwn(payload, 'bestKwSearchVolume') ? payload.bestKwSearchVolume : existingPage.bestKwSearchVolume ?? null,
                bestKwEstimatedVolume: hasOwn(payload, 'bestKwEstimatedVolume') ? payload.bestKwEstimatedVolume : existingPage.bestKwEstimatedVolume ?? null,
                bestKwPosition: hasOwn(payload, 'bestKwPosition') ? payload.bestKwPosition : existingPage.bestKwPosition ?? null,
                ga4Views: hasOwn(payload, 'ga4Views') ? payload.ga4Views : existingPage.ga4Views ?? null,
                ga4Sessions: hasOwn(payload, 'ga4Sessions') ? payload.ga4Sessions : existingPage.ga4Sessions ?? null,
                ga4Users: hasOwn(payload, 'ga4Users') ? payload.ga4Users : existingPage.ga4Users ?? null,
                ga4BounceRate: hasOwn(payload, 'ga4BounceRate') ? payload.ga4BounceRate : existingPage.ga4BounceRate ?? null,
                ga4EngagementTimePerPage: hasOwn(payload, 'ga4EngagementTimePerPage') ? payload.ga4EngagementTimePerPage : existingPage.ga4EngagementTimePerPage ?? null,
                ga4EngagementRate: hasOwn(payload, 'ga4EngagementRate') ? payload.ga4EngagementRate : existingPage.ga4EngagementRate ?? null,
                ga4AvgSessionDuration: hasOwn(payload, 'ga4AvgSessionDuration') ? payload.ga4AvgSessionDuration : existingPage.ga4AvgSessionDuration ?? null,
                ga4Conversions: hasOwn(payload, 'ga4Conversions') ? payload.ga4Conversions : existingPage.ga4Conversions ?? null,
                ga4ConversionRate: hasOwn(payload, 'ga4ConversionRate') ? payload.ga4ConversionRate : existingPage.ga4ConversionRate ?? null,
                ga4Revenue: hasOwn(payload, 'ga4Revenue') ? payload.ga4Revenue : existingPage.ga4Revenue ?? null,
                sessionsDelta: hasOwn(payload, 'sessionsDelta') ? payload.sessionsDelta : existingPage.sessionsDelta ?? null,
                sessionsDeltaAbsolute: hasOwn(payload, 'sessionsDeltaAbsolute') ? payload.sessionsDeltaAbsolute : existingPage.sessionsDeltaAbsolute ?? null,
                sessionsDeltaPct: hasOwn(payload, 'sessionsDeltaPct') ? payload.sessionsDeltaPct : existingPage.sessionsDeltaPct ?? null,
                isLosingTraffic: hasOwn(payload, 'isLosingTraffic') ? payload.isLosingTraffic : existingPage.isLosingTraffic ?? null,
                urlRating: hasOwn(payload, 'urlRating') ? payload.urlRating : existingPage.urlRating ?? null,
                referringDomains: hasOwn(payload, 'referringDomains') ? payload.referringDomains : existingPage.referringDomains ?? null,
                backlinks: hasOwn(payload, 'backlinks') ? payload.backlinks : existingPage.backlinks ?? null,
                opportunityScore: calculatePredictiveScore({ ...existingPage, ...payload }),
                isHtmlPage: hasOwn(payload, 'isHtmlPage') ? payload.isHtmlPage : existingPage.isHtmlPage ?? false,
                timestamp: Date.now()
            };

            existingPageMap.set(payload.url, mergedPage);
            return mergedPage;
        });

        // Keep the in-memory session snapshot in sync immediately so completion,
        // scoring, and checkpoint saves see the full crawl before Dexie/liveQuery catches up.
        pagesRef.current = mergePagesByUrl(pagesRef.current, mergedUpdates);

        // Persist to Dexie (IndexedDB)
        if (currentSessionIdRef.current) {
            crawlDb.pages.bulkPut(mergedUpdates).catch(err => {
                console.error('[CrawlDB] Failed to batch put pages:', err);
            });
        }

        // Update selected page if it was part of the batch
        setSelectedPage(prev => {
            if (!prev) return prev;
            const selectedUpdate = mergedUpdates.find(update => update.url === prev.url);
            return selectedUpdate ? { ...prev, ...selectedUpdate } : prev;
        });
    }, []);

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
        setAnalysisPages([]);
        setLogs([]);
        setSelectedPage(null);
        setSelectedRows(new Set());
        setCurrentSessionId(null);
        currentSessionIdRef.current = null;
        setCompareSessionId(null);
        setDiffResult(null);
        setActiveMacro('all');
        setSearchQuery('');
        setRobotsTxt(null);
        setSitemapData(null);
        setCrawlStartTime(null);
        setUrlInput('');
        setListUrls('');
        replaceHashRouteSearchParams((params) => {
            params.delete('url');
        });
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

    const handleStartPause = (forceResumeParam?: boolean | React.MouseEvent | React.KeyboardEvent) => {
        const forceResume = forceResumeParam === true;
        if (isCrawling) {
            // Check ghostCrawlerRef directly — Ghost Engine may be auto-selected
            // even when config.useGhostEngine is false (no WS URL configured)
            if (ghostCrawlerRef.current) {
                ghostCrawlerRef.current.stop();
                ghostCrawlerRef.current = null;
            }
            if (wsRef.current) {
                // Send STOP and let the server respond with CRAWL_STOPPED
                wsRef.current.send(JSON.stringify({ type: 'STOP_CRAWL' }));
                // Safety net: force close after 3s if server doesn't respond
                const ws = wsRef.current;
                setTimeout(() => {
                    if (wsRef.current === ws) {
                        closeCrawlerSocket();
                    }
                }, 3000);
            }
            setIsCrawling(false);
            setCrawlRuntime(prev => ({
                ...prev,
                stage: 'paused',
                activeWorkers: 0,
                workerUtilization: 0
            }));
            flushPendingPageUpdates();
            // Save current session as paused (with pages for reload safety)
            if (currentSessionId) {
                saveCrawlSession('paused');
            }
            return;
        }

        const urlsToScan = buildEntryUrls();

        if (!urlsToScan.length || !urlsToScan[0]) {
            addLog(`Please provide a valid ${crawlingMode === 'list' ? 'list of URLs' : 'web address'}.`, 'error', { source: 'system' });
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

        // If we think it's a resume but there's no session to resume, force a new session
        if (isResume && !sessionId) {
            isResume = false;
        }

        if (!isResume) {
            // Create new session
            sessionId = generateSessionId();
            sessionEntrySignatureRef.current = requestedSignature;
            inMemoryPageLimitAlertedRef.current = false;
            currentSessionIdRef.current = sessionId;
            setCurrentSessionId(sessionId);
            setCrawlStartTime(Date.now());
            setLogs([]); setSelectedPage(null); setSelectedRows(new Set());
            setActiveMacro('all'); setSearchQuery('');
            setRobotsTxt(null); setSitemapData(null);
            setDiffResult(null); // Clear any old diff
        } else if (!sessionEntrySignatureRef.current) {
            sessionEntrySignatureRef.current = requestedSignature;
        }

        // --- Phase 1: Google Property Resolution (Pre-flight) ---
        const googleConn = integrationConnections.google;
        const gscToken = config.gscApiKey; // Confusingly named, but holds the access token
        
        if (googleConn && gscToken && !isResume) {
            addLog(`Resolving Google properties for ${urlsToScan[0]}...`, 'info', { source: 'system' });
            
            GoogleSelectionResolver.resolveEffectiveGoogleSelection({
                accessToken: gscToken,
                crawlUrl: urlsToScan[0],
                existingSelection: googleConn.selection as any,
                // history can be added here once we have a way to track it
            }).then(resolution => {
                if (resolution.siteUrl || resolution.propertyId) {
                    const updates: any = {
                        selection: {
                            ...googleConn.selection,
                            siteUrl: resolution.siteUrl || googleConn.selection?.siteUrl,
                            propertyId: resolution.propertyId || googleConn.selection?.propertyId,
                            gscConfidence: resolution.gscConfidence,
                            ga4Confidence: resolution.ga4Confidence,
                            source: resolution.source
                        }
                    };
                    
                    // If we found something new or more confident, log it
                    if (resolution.siteUrl !== googleConn.selection?.siteUrl && resolution.siteUrl) {
                        addLog(`Auto-detected GSC property: ${resolution.siteUrl} (Confidence: ${resolution.gscConfidence}%)`, 'success', { source: 'system' });
                        setDetectedGscSite(resolution.siteUrl);
                    }
                    if (resolution.propertyId !== googleConn.selection?.propertyId && resolution.propertyId) {
                        addLog(`Auto-detected GA4 property: ${resolution.propertyId} (Confidence: ${resolution.ga4Confidence}%)`, 'success', { source: 'system' });
                        setDetectedGa4Property(resolution.propertyId);
                    }
                    
                    // Persist to project/account
                    if (targetProjectId) {
                        upsertProjectCrawlerIntegration(targetProjectId, { ...googleConn, ...updates });
                    } else {
                        saveAnonymousCrawlerIntegrations({ 
                            ...integrationConnections, 
                            google: { ...googleConn, ...updates } 
                        });
                    }
                    
                    // Update state to trigger re-render in IntegrationsTab
                    setIntegrationConnections(prev => ({
                        ...prev,
                        google: { ...prev.google!, ...updates }
                    }));
                }
            }).catch(err => {
                console.error('[GoogleResolver] Failed to resolve properties:', err);
                addLog('Google property resolution failed. Crawl will continue without search data.', 'warn', { source: 'system' });
            });
        }

        setIsCrawling(true);
        // Sync URL to browser address bar only when scan starts (not on typing)
        replaceHashRouteSearchParams((params) => {
            if (crawlingMode === 'list') {
                params.delete('url');
            } else if (urlInput.trim()) {
                params.set('url', urlInput.trim());
            } else {
                params.delete('url');
            }
        });
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
        
        // Auto-use Ghost if no remote URL is configured AND we're not on localhost
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const shouldAutoUseGhost = !config.useGhostEngine && !configuredWsUrl && !isLocalhost;
        const useGhostMode = Boolean(config.useGhostEngine || shouldAutoUseGhost);

        if (!useGhostMode) {
            addLog(`Connecting to scanner...`, 'info', { source: 'system' });
        } else if (shouldAutoUseGhost) {
            addLog('No remote scanner configured. Using Ghost Engine (Local-Only).', 'info', { source: 'system' });
        }


        if (sessionId) {
            // ✅ CRITICAL: Adopt the new session ID so all subsequent saves work
            setCurrentSessionId(sessionId);
            currentSessionIdRef.current = sessionId;

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
            addLog(`Initializing Ghost Engine (Local-Only)...`, 'info', { source: 'system' });
            
            const ghost = new GhostCrawler({
                maxConcurrent: parseInt(String(config.threads), 10) || 5,
                maxDepth: parseInt(config.maxDepth) || 10,
                limit: parseInt(config.limit) || 0,
                userAgent: config.userAgent,
                crawlResources: config.crawlResources
            });
            
            ghostCrawlerRef.current = ghost;
            
            ghost.on('log', (message: string, type: string) => {
                addLog(message, type as any);
            });

            ghost.on('sitemap', (payload: { totalUrls: number; sitemapSources: string[]; coverageParsed?: boolean; urls?: Set<string> }) => {
                setSitemapData(buildSitemapState(
                    payload.totalUrls,
                    payload.sitemapSources,
                    payload.coverageParsed !== false
                ));

                // Back-fill sitemap status for already-crawled pages (Local Scan)
                if (payload.urls && pagesRef.current.length > 0) {
                    const sitemapUrls = payload.urls;
                    const pagesToUpdate: any[] = [];
                    
                    pagesRef.current.forEach(page => {
                        if (page.inSitemap) return;
                        const canonical = UrlNormalization.toCanonical(page.finalUrl || page.url);
                        if (sitemapUrls.has(canonical)) {
                            pagesToUpdate.push({ ...page, inSitemap: true });
                        }
                    });

                    if (pagesToUpdate.length > 0) {
                        addLog(`Sitemap parse complete: Back-filled status for ${pagesToUpdate.length} pages.`, 'info');
                        // Use queuePageUpdate or bulk update
                        pagesToUpdate.forEach(p => queuePageUpdate(p));
                    }
                }
            });

            ghost.on('page', (pageData: any) => {
                // UI Instant Reaction: Still queue for the grid, though Ghost handles persistence now
                queuePageUpdate(pageData); 
                const now = Date.now();
                if (now - lastFetchLogAtRef.current > 1200) {
                    lastFetchLogAtRef.current = now;
                    addLog(`Scanning (Local): ${pageData.url}`, 'info', { source: 'crawler', url: pageData.url });
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
                // If it's already stopped by the user, don't show the 'complete' log
                if (ghostCrawlerRef.current === null) return;

                flushPendingPageUpdates();
                const totalFound = pagesRef.current.length;
                addLog(`Local scan complete. Found ${totalFound} URLs.`, 'success');
                setIsCrawling(false);
                setCrawlStartTime(null);
                setCrawlRuntime(prev => ({ ...prev, stage: 'completed', queued: 0, activeWorkers: 0, workerUtilization: 0 }));
                
                // Re-calculate PageRank
                const completedPages = pagesRef.current;
                if (completedPages.length > 0) {
                    addLog('Calculating Strategic PageRank & Health Scores...', 'info', { source: 'analysis' });
                    const ranks = calculateInternalPageRank(completedPages);
                    const updated = completedPages.map(p => {
                        const internalPageRank = ranks[p.url] || 0;
                        const updatedPage = { ...p, internalPageRank };
                        return { ...updatedPage, healthScore: calculatePredictiveScore(updatedPage) };
                    });
                    
                    // Final Persistence Pass to Dexie
                    if (currentSessionIdRef.current) {
                        crawlDb.pages.bulkPut(updated).catch(err => {
                            console.error('[CrawlDB] Failed to save PageRank updates:', err);
                        });
                    }
                    addLog('Strategic analysis complete.', 'success', { source: 'analysis' });

                    // Persist crawl results to Turso for Dashboard (Ghost Engine path)
                    if (activeProject?.id) {
                        const crawlDuration = crawlStartTime ? Date.now() - crawlStartTime : 0;
                        persistCrawlResults({
                            projectId: activeProject.id,
                            sessionId: currentSessionIdRef.current || sessionId || '',
                            urlCrawled: pagesRef.current[0]?.url || urlInput,
                            pages: pagesRef.current,
                            crawlMode: crawlingMode,
                            crawlDuration,
                            crawlRate: crawlRuntime.rate || 0,
                            maxDepthSeen: crawlRuntime.maxDepthSeen || 0,
                            strategicSummary: {},
                            sitemapCoverage: null,
                            robotsTxt: robotsTxt?.raw || ''
                        }).then(result => {
                            if (result) {
                                addLog(`Dashboard synced — Health Score: ${result.score}/100, ${result.issues.length} issues detected.`, 'success', { source: 'system' });
                                if (updateProject && activeProject?.id) {
                                    const grade = result.score >= 90 ? 'A' : result.score >= 80 ? 'B' : result.score >= 65 ? 'C' : result.score >= 50 ? 'D' : 'F';
                                    updateProject(activeProject.id, {
                                        last_crawl_at: new Date().toISOString(),
                                        last_crawl_score: result.score,
                                        last_crawl_grade: grade,
                                        crawl_count: (activeProject.crawl_count || 0) + 1
                                    });
                                }
                                // Auto-populate Dashboard: keywords, competitors, mentions
                                syncFromCrawl(activeProject!.id, pagesRef.current, activeProject!.name).then(sync => {
                                    if (sync.keywordsImported > 0 || sync.competitorsFound > 0) {
                                        addLog(`Auto-discovered: ${sync.keywordsImported} keywords, ${sync.competitorsFound} competitors.`, 'info', { source: 'analysis' });
                                    }
                                }).catch(() => {});
                            }
                        }).catch(err => {
                            console.error('[CrawlPersistence] Ghost crawl dashboard sync failed:', err);
                        });
                    }
                }
                
                window.setTimeout(() => {
                    saveCrawlSession('completed');
                }, 500);

                ghostCrawlerRef.current = null;
            });

            ghost.on('error', (err: any) => {
                addLog(`Ghost Engine error: ${err.message}`, 'error', { source: 'crawler', detail: err.message });
                setIsCrawling(false);
            });

            ghost.start(urlsToScan[0], sessionId);
            setCrawlRuntime(prev => ({ ...prev, stage: 'crawling' }));
            return;
        }
        
        try {
            closeCrawlerSocket();
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = async () => {
                const googleConnection = integrationConnections.google;
                
                // Helper to get a fresh token, optionally refreshing if needed
                const getOrRefreshGoogleToken = async () => {
                    const email = googleConnection?.accountLabel || googleConnection?.sync?.email || (googleConnection?.metadata?.email as string);
                    const secrets = googleConnection ? getCrawlerIntegrationSecret(integrationSecretScope, 'google') : null;
                    let token = secrets?.accessToken || secrets?.access_token;
                    const refreshToken = secrets?.refreshToken || secrets?.refresh_token;

                    if (!token && email) {
                        addLog('Refreshing Google access token...', 'info', { source: 'system' });
                        token = await refreshGoogleToken(email) || undefined;
                    }
                    return { token, email, refreshToken };
                };

                const { token: googleAccessToken, email: googleEmail, refreshToken: googleRefreshToken } = await getOrRefreshGoogleToken();
                let currentGsc = config.gscSiteUrl || googleConnection?.selection?.siteUrl;
                let currentGa4 = config.ga4PropertyId || googleConnection?.selection?.propertyId;

                if (googleConnection && !googleAccessToken && !googleEmail) {
                    addLog('Google connection metadata is incomplete. Please reconnect Google in the Integrations tab.', 'warn', { source: 'system' });
                }

                if (googleAccessToken && (!currentGsc || !currentGa4)) {
                    addLog('Auto-detecting Google properties for this domain...', 'info');
                    const resolution = await GoogleSelectionResolver.resolveEffectiveGoogleSelection({
                        accessToken: googleAccessToken,
                        crawlUrl: urlsToScan[0]
                    });
                    if (resolution.siteUrl && !currentGsc) {
                        currentGsc = resolution.siteUrl;
                        setDetectedGscSite(currentGsc);
                        addLog(`Auto-detected GSC property: ${currentGsc} (Confidence: ${resolution.gscConfidence}%)`, 'success');
                    }
                    if (resolution.propertyId && !currentGa4) {
                        currentGa4 = resolution.propertyId;
                        setDetectedGa4Property(currentGa4);
                        addLog(`Auto-detected GA4 property: ${currentGa4} (Confidence: ${resolution.ga4Confidence}%)`, 'success');
                    }

                    if ((resolution.siteUrl && !config.gscSiteUrl) || (resolution.propertyId && !config.ga4PropertyId)) {
                        saveIntegrationConnection('google', {
                            label: 'Google (GSC/GA4)',
                            status: 'connected',
                            authType: 'oauth',
                            selection: {
                                siteUrl: currentGsc || undefined,
                                propertyId: currentGa4 || undefined
                            }
                        });
                    }
                }

                if (googleAccessToken && !currentGsc) {
                    addLog('GSC sync will be skipped: No Search Console property selected.', 'warn', { source: 'system' });
                }
                if (googleAccessToken && !currentGa4) {
                    addLog('GA4 sync will be skipped: No Analytics property ID selected.', 'warn', { source: 'system' });
                }

                addLog("Connected. Starting scan...", 'success', { source: 'system' });
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
                        crawlResources: config.crawlResources,
                        
                        // Unified Google & Other Integrations
                        google: {
                            email: googleEmail,
                            accountLabel: googleEmail,
                            accessToken: googleAccessToken || config.gscApiKey,
                            refreshToken: googleRefreshToken || config.gscRefreshToken,
                            gscSiteUrl: currentGsc,
                            ga4PropertyId: currentGa4,
                            selection: {
                                siteUrl: currentGsc,
                                propertyId: currentGa4
                            }
                        },
                        bing: {
                            accessToken: getCrawlerIntegrationSecret(integrationSecretScope, 'bingWebmaster').accessToken || config.bingAccessToken
                        },
                        uploads: {
                            backlinks: integrationConnections.backlinkUpload?.uploadData,
                            keywords: integrationConnections.keywordUpload?.uploadData,
                            sitemap: integrationConnections.sitemapUpload?.uploadData,
                            contentInventory: integrationConnections.contentInventory?.uploadData
                        }
                    } 
                }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'FETCHING') {
                    const now = Date.now();
                    if (now - lastFetchLogAtRef.current > 1200) {
                        lastFetchLogAtRef.current = now;
                        addLog(`Scanning: ${data.payload.url}`, 'info', { source: 'crawler', url: data.payload.url });
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
                    setSitemapData((prev) => prev ?? buildSitemapState(0, data.payload.sitemaps, false));
                }
                else if (data.type === 'LOG') {
                    addLog(data.payload.message, data.payload.type || 'info', { source: 'crawler' });
                }
                else if (data.type === 'SITEMAP_PARSED') {
                    setSitemapData(buildSitemapState(
                        data.payload.totalUrls,
                        data.payload.sitemapSources,
                        true
                    ));
                }
                else if (data.type === 'PAGE_CRAWLED') {
                    const crawlerPayload = data.payload;
                    if (crawlerPayload.isHtmlPage === undefined) {
                        crawlerPayload.isHtmlPage = Boolean(crawlerPayload.contentType?.includes('text/html') || crawlerPayload.contentType?.includes('application/xhtml'));
                    }
                    
                    const pendingSize = pendingPageUpdatesRef.current.has(crawlerPayload.url) ? 0 : 1;
                    if (!isAuthenticated && pagesRef.current.length + pendingPageUpdatesRef.current.size + pendingSize > trialPagesLimit) {
                        wsRef.current?.send(JSON.stringify({ type: 'STOP_CRAWL' }));
                        // Important: flush FIRST so the UI shows exactly the limit amount
                        flushPendingPageUpdates();
                        addLog(`Trial limit reached (${trialPagesLimit} pages). Sign in for unlimited scanning.`, 'info', { source: 'system' });
                        setShowTrialLimitAlert(true);
                        setIsCrawling(false);
                        return;
                    }

                    queuePageUpdate(crawlerPayload);
                }
                else if (data.type === 'UPDATE_PAGE') {
                    queuePageUpdate(data.payload);
                }
                else if (data.type === 'CRAWL_STOPPED') {
                    flushPendingPageUpdates();
                    addLog(data.payload.message || 'Scan paused.', 'info', { source: 'system' });
                    setIsCrawling(false);
                    setCrawlStartTime(null);
                    setCrawlRuntime(prev => ({ ...prev, stage: 'paused', activeWorkers: 0, workerUtilization: 0 }));
                }
                else if (data.type === 'TOKEN_REFRESHED') {
                    const { provider, accessToken } = data.payload;
                    addLog(`${provider} access token refreshed.`, 'info', { source: 'system' });
                    if (provider !== 'google') {
                        mergeCrawlerIntegrationSecret(integrationSecretScope, provider as CrawlerIntegrationProvider, { accessToken });
                    }
                    setConfig((prev: any) => {
                        if (provider === 'google') return { ...prev, gscApiKey: accessToken };
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
                else if (data.type === 'ERROR') {
                    const errMsg = data.payload.message || 'Error encountered';
                    // Skip redundant abort logs that we've already handled
                    if (errMsg === 'Crawler stopped' || errMsg.includes('aborted')) return;
                    
                    addLog(errMsg, 'error', { source: 'crawler', detail: errMsg });
                    flushPendingPageUpdates();
                    setIsCrawling(false);
                    setCrawlStartTime(null);
                    setCrawlRuntime(prev => ({ ...prev, stage: 'error', activeWorkers: 0, workerUtilization: 0 }));
                }
                else if (data.type === 'CRAWL_FINISHED') { 
                    flushPendingPageUpdates();
                    const successCount = Number(data.payload?.successfulPages ?? data.payload?.payloadPages ?? pagesRef.current.length);
                    const foundCount = Number(data.payload?.totalPages ?? successCount);
                    const failedCount = Number(data.payload?.failedPages ?? Math.max(0, foundCount - successCount));
                    addLog(`Scan complete. Found ${foundCount} URLs; captured ${successCount}; failed ${failedCount}.`, 'success', { source: 'crawler' }); 
                    
                    if (Array.isArray(data.payload?.failedUrlSamples)) {
                        data.payload.failedUrlSamples.forEach((entry: any) => {
                            if (!entry?.url || !entry?.message) return;
                            addLog(`Failed ${entry.url}: ${entry.message}`, 'error', { source: 'crawler', url: entry.url, detail: entry.message });
                        });
                    }
                    
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
                    const completedPages = [...pagesRef.current];
                    if (completedPages.length > 0) {
                        addLog('Calculating Strategic PageRank & Health Scores...', 'info', { source: 'analysis' });
                        const ranks = calculateInternalPageRank(completedPages);
                        const updated = completedPages.map(p => {
                            const internalPageRank = ranks[p.url] || 0;
                            const updatedPage = { ...p, internalPageRank };
                            return { ...updatedPage, healthScore: calculatePredictiveScore(updatedPage) };
                        });
                        
                        // Final Persistence Pass to Dexie -> Enrichment -> Dashboard
                        const runPostCrawlFlow = async () => {
                            if (currentSessionIdRef.current) {
                                try {
                                    // 1. Save analyzed pages to local DB
                                    await crawlDb.pages.bulkPut(updated);
                                    addLog('Strategic analysis complete.', 'success', { source: 'analysis' });

                                    // 2. Enrichment
                                    const googleConn = integrationConnections.google;
                                    const effectiveSelection = googleConn?.selection as any;

                                    if (googleConn && effectiveSelection) {
                                        const email = googleConn.accountLabel || googleConn?.sync?.email || (googleConn.metadata?.email as string);
                                        if (email) {
                                            addLog('Refreshing Google credentials for enrichment...', 'info', { source: 'system' });
                                            const freshToken = await refreshGoogleToken(email);
                                            
                                            if (freshToken) {
                                                addLog('Starting batch data enrichment (GSC/GA4)...', 'info', { source: 'system' });
                                                await PostCrawlEnrichment.runUnifiedEnrichment({
                                                    sessionId: currentSessionIdRef.current || '',
                                                    googleAccessToken: freshToken,
                                                    googleEmail: email,
                                                    gscSiteUrl: effectiveSelection.siteUrl,
                                                    ga4PropertyId: effectiveSelection.propertyId
                                                }, (msg) => addLog(msg, 'info', { source: 'system' }));
                                                
                                                addLog('Data enrichment complete.', 'success', { source: 'system' });
                                            } else {
                                                addLog('Enrichment skipped: Could not refresh Google access token.', 'warn', { source: 'system' });
                                            }
                                        } else {
                                            addLog('Enrichment skipped: No email associated with Google connection.', 'warn', { source: 'system' });
                                        }
                                    }

                                    // 3. UI Hydration & Dashboard Sync
                                    const freshPages = await crawlDb.pages.where('crawlId').equals(currentSessionIdRef.current).toArray();
                                    
                                    // Refresh table
                                    const normalized = freshPages.map(normalizeCrawlerPage).filter(Boolean) as any[];
                                    setAnalysisPages(normalized);

                                    if (activeProject?.id && freshPages.length > 0) {
                                        const crawlDuration = crawlStartTime ? Date.now() - crawlStartTime : 0;
                                        const result = await persistCrawlResults({
                                            projectId: activeProject.id,
                                            sessionId: currentSessionIdRef.current || '',
                                            urlCrawled: freshPages[0]?.url || urlInput,
                                            pages: freshPages,
                                            crawlMode: crawlingMode,
                                            crawlDuration,
                                            crawlRate: crawlRuntime.rate || 0,
                                            maxDepthSeen: crawlRuntime.maxDepthSeen || 0,
                                            strategicSummary: {},
                                            sitemapCoverage: null,
                                            robotsTxt: robotsTxt?.raw || ''
                                        });

                                        if (result) {
                                            addLog(`Dashboard synced — Health Score: ${result.score}/100`, 'success', { source: 'system' });
                                            if (updateProject && activeProject?.id) {
                                                const grade = result.score >= 90 ? 'A' : result.score >= 80 ? 'B' : result.score >= 65 ? 'C' : result.score >= 50 ? 'D' : 'F';
                                                updateProject(activeProject.id, {
                                                    last_crawl_at: new Date().toISOString(),
                                                    last_crawl_score: result.score,
                                                    last_crawl_grade: grade,
                                                    crawl_count: (activeProject.crawl_count || 0) + 1
                                                });
                                            }
                                            await syncFromCrawl(activeProject!.id, freshPages, activeProject!.name);
                                        }
                                    }
                                    
                                    // 4. Save session status
                                    saveCrawlSession('completed');

                                } catch (err: any) {
                                    console.error('[PostCrawl] Processing failed:', err);
                                    addLog(`Post-crawl processing error: ${err.message}`, 'error', { source: 'system' });
                                }
                            }
                        };
                        
                        runPostCrawlFlow();
                    }
                }
            };

            ws.onerror = () => { addLog("Failed to connect. Check local scraper engine.", 'error', { source: 'system' }); setIsCrawling(false); setCrawlStartTime(null); setCrawlRuntime(prev => ({ ...prev, stage: 'error', activeWorkers: 0, workerUtilization: 0 })); };
            ws.onclose = () => { flushPendingPageUpdates(); wsRef.current = null; setIsCrawling(false); setCrawlStartTime(null); };
        } catch (err) {
            addLog("Connection dropped.", 'error', { source: 'system' });
            setIsCrawling(false);
            setCrawlRuntime(prev => ({ ...prev, stage: 'error', activeWorkers: 0, workerUtilization: 0 }));
        }
    };

    // ─── Save crawl session to IndexedDB ───
    // Session hooks moved to bottom to resolve declaration order issues

    const dynamicClusters = useMemo(() => {
        const clusters = new Set<string>();
        analysisPages.forEach(p => {
            if (typeof p.topicCluster === 'string' && p.topicCluster.trim()) {
                clusters.add(p.topicCluster.trim());
            }
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

    const activeCheckIds = useMemo(() => getActiveCheckIds(auditFilter), [auditFilter]);
    const activeCheckCategories = useMemo(() => getActiveCategoryTreeIds(auditFilter), [auditFilter]);

    const filteredIssuePages = useMemo(() => {
        const isFullAudit = auditFilter.modes.includes('full') && auditFilter.industry === 'all';

        return SEO_ISSUES_TAXONOMY
            .map((group) => ({
                ...group,
                issues: group.issues.filter((issue: any) => {
                    const checkId = resolveIssueCheckId(issue.id, issue.checkId);
                    if (isFullAudit) return true;
                    if (!checkId) return true;
                    return activeCheckIds.has(checkId);
                })
            }))
            .filter((group) => group.issues.length > 0);
    }, [activeCheckIds, auditFilter.industry, auditFilter.modes]);

    const applyAuditMode = useCallback((modes: AuditMode[], industry: IndustryFilter) => {
        const normalizedModes: AuditMode[] = modes.length > 0 ? modes : ['full'];
        setAuditFilter((previous) => ({ ...previous, modes: normalizedModes, industry }));
        setLeftSidebarPreset(null);
        setActiveMacro(null);
    }, []);

    const saveCustomPreset = useCallback((name: string, modes: AuditMode[], industry: IndustryFilter) => {
        const preset: CustomAuditPreset = {
            id: `preset-${Date.now()}`,
            name,
            modes: modes.length > 0 ? modes : ['full'],
            industry,
            enabledCheckOverrides: auditFilter.customOverrides?.enabled || [],
            disabledCheckOverrides: auditFilter.customOverrides?.disabled || [],
            columnPreset: visibleColumns,
            createdAt: Date.now()
        };

        const next = saveLocalPreset(preset);
        setCustomPresets(next);
    }, [auditFilter.customOverrides, visibleColumns]);

    const loadCustomPreset = useCallback((preset: CustomAuditPreset) => {
        setAuditFilter({
            modes: preset.modes.length > 0 ? preset.modes : ['full'],
            industry: preset.industry,
            customOverrides: {
                enabled: preset.enabledCheckOverrides || [],
                disabled: preset.disabledCheckOverrides || []
            }
        });

        if (Array.isArray(preset.columnPreset) && preset.columnPreset.length > 0) {
            setVisibleColumns(preset.columnPreset);
        }
    }, []);

    useEffect(() => {
        const primaryMode = auditFilter.modes[0];
        if (!primaryMode) return;

        const modeConfig = AUDIT_MODES.find((mode) => mode.id === primaryMode);
        if (!modeConfig || modeConfig.defaultColumns.length === 0) return;

        const validColumns = new Set(ALL_COLUMNS.map((column) => column.key));
        const nextColumns = modeConfig.defaultColumns.filter((column) => validColumns.has(column));
        if (nextColumns.length > 0) {
            setVisibleColumns(nextColumns);
        }
    }, [auditFilter.modes]);

    useEffect(() => {
        if (!activeMacro || activeMacro === 'all') return;
        const exists = filteredIssuePages.some((group) => group.issues.some((issue: any) => issue.id === activeMacro));
        if (!exists) {
            setActiveMacro(null);
        }
    }, [activeMacro, filteredIssuePages]);

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

    const hasAiInsights = useMemo(() => {
        return pagesWithDerivedSignals.some((page) =>
            Boolean(
                page?.strategicPriority ||
                page?.opportunityScore ||
                page?.techHealthScore ||
                page?.isCannibalized ||
                page?.hasContentGap ||
                page?.contentDecay
            )
        );
    }, [pagesWithDerivedSignals]);

    const categoryCounts = useMemo(() => {
        if (pagesWithDerivedSignals.length === 0) return {} as Record<string, Record<string, number>>;
        const counts: Record<string, Record<string, number>> = {};

        const allCats = [
            ...CATEGORIES,
            ...(hasAiInsights ? [AI_INSIGHTS_CATEGORY] : []),
            ...(dynamicClusters.length > 0
                ? [{ id: 'ai-clusters', label: 'AI Topic Clusters', icon: null, sub: ['All', ...dynamicClusters] }]
                : [])
        ];

        for (const category of allCats) {
            counts[category.id] = {};
            for (const sub of category.sub) {
                if (category.id === 'ai-clusters') {
                    counts[category.id][sub] = pagesWithDerivedSignals.filter((page) =>
                        sub === 'All' ? Boolean(page?.topicCluster) : page?.topicCluster === sub
                    ).length;
                    continue;
                }

                counts[category.id][sub] = pagesWithDerivedSignals.filter((page) =>
                    matchesCategoryFilter(category.id, sub, page, { rootHostname })
                ).length;
            }
        }

        return counts;
    }, [pagesWithDerivedSignals, dynamicClusters, hasAiInsights, rootHostname]);

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

        if (ignoredUrls.size > 0) {
            list = list.filter((page) => !ignoredUrls.has(page.url));
        }

        if (deferredSearchQuery) {
            const query = deferredSearchQuery.toLowerCase();
            list = list.filter((page) =>
                page.url.toLowerCase().includes(query) ||
                String(page.title || '').toLowerCase().includes(query) ||
                String(page.metaDesc || '').toLowerCase().includes(query) ||
                String(page.h1_1 || '').toLowerCase().includes(query)
            );
        }

        if (activeMacro) {
            if (activeMacro !== 'all' && MACRO_FILTERS[activeMacro]) {
                list = list.filter(MACRO_FILTERS[activeMacro]);
            } else if (activeMacro !== 'all') {
                let issueCondition: ((page: any) => boolean) | null = null;
                for (const issueGroup of filteredIssuePages) {
                    const issue = issueGroup.issues.find((entry) => entry.id === activeMacro);
                    if (issue) {
                        issueCondition = issue.condition;
                        break;
                    }
                }
                if (issueCondition) {
                    list = list.filter(issueCondition);
                }
            }
        }

        const sanitizedSelections = activeCategories
            .filter((selection) => selection?.group && selection?.sub)
            .filter((selection, index, arr) => arr.findIndex((entry) => entry.group === selection.group && entry.sub === selection.sub) === index);

        const hasEffectiveSelection = sanitizedSelections.some(
            (selection) => !(selection.group === 'internal' && selection.sub === 'All')
        );

        if (hasEffectiveSelection) {
            list = list.filter((page) =>
                sanitizedSelections.some((selection) =>
                    matchesCategoryFilter(selection.group, selection.sub, page, { rootHostname })
                )
            );
        }

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
    }, [pagesWithDerivedSignals, activeCategories, deferredSearchQuery, activeMacro, sortConfig, MACRO_FILTERS, ignoredUrls, rootHostname, filteredIssuePages]);

    const handleImport = async (file: File) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.sessionId || !Array.isArray(data.pages)) {
                throw new Error('Invalid crawl data format.');
            }

            // Save session meta
            await saveSession({
                sessionId: data.sessionId,
                url: data.url || data.pages[0]?.url || 'Imported Browse',
                timestamp: data.timestamp || Date.now(),
                pageCount: data.pages.length,
                status: 'completed',
                config: data.config || {}
            } as any);

            // Save pages to IndexedDB
            await upsertPages(data.sessionId, data.pages.map((p: any) => ({ ...p, crawlId: data.sessionId })));
            
            await loadCrawlHistory();
            await loadSession(data.sessionId);
            
            addLog(`Successfully imported ${data.pages.length} pages.`, 'success', { source: 'history' });
        } catch (err: any) {
            console.error('Import failed:', err);
            addLog(`Failed to import crawl data: ${err.message}`, 'error', { source: 'history' });
        }
    };

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

        const isIssueEnabled = (issueId: string) => {
            const checkId = ISSUE_TO_CHECK_MAP[issueId] || issueId;
            return activeCheckIds.has(checkId);
        };

        const brokenPenalty = (isIssueEnabled('404') || isIssueEnabled('500')) ? (stats.broken * 5) : 0;
        const serverPenalty = isIssueEnabled('500') ? (stats.serverErrors * 10) : 0;
        const titlePenalty = isIssueEnabled('title_missing') ? (stats.missingTitles * 2) : 0;
        const metaPenalty = isIssueEnabled('meta_missing') ? (stats.missingMetaDesc * 1) : 0;
        const speedPenalty = isIssueEnabled('slow_response') ? (stats.slowPages * 3) : 0;
        const indexPenalty = (isIssueEnabled('noindex') || isIssueEnabled('blocked_robots')) ? (stats.nonIndexable * 1) : 0;

        const raw = Math.max(
            0,
            Math.min(
                100,
                100 - brokenPenalty - serverPenalty - titlePenalty - metaPenalty - speedPenalty - indexPenalty
            )
        );

        let grade = 'F';
        if (raw >= 90) grade = 'A';
        else if (raw >= 80) grade = 'B';
        else if (raw >= 65) grade = 'C';
        else if (raw >= 50) grade = 'D';
        return { score: raw, grade };
    }, [analysisPages.length, stats, activeCheckIds]);

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
            sitemapData,
            auditModes: auditFilter.modes,
            industryFilter: auditFilter.industry
        };

        await saveSession(session);
        if (options?.includePages !== false) {
            await upsertPages(sessionId, pagesRef.current);
        }
    }, [crawlingMode, listUrls, urlInput, crawlStartTime, stats.totalIssues, healthScore.score, healthScore.grade, config, isCrawling, crawlRuntime, ignoredUrls, urlTags, columnWidths, robotsTxt, sitemapData, auditFilter.industry, auditFilter.modes]);

    // Periodic checkpoint during crawl — save metadata every 1.5s, pages every 30s
    const lastPagesCheckpointRef = useRef<number>(0);

    useEffect(() => {
        if (!currentSessionId) return;
        if (pages.length === 0 && !isCrawling) return;

        if (sessionCheckpointTimeoutRef.current !== null) {
            window.clearTimeout(sessionCheckpointTimeoutRef.current);
        }

        sessionCheckpointTimeoutRef.current = window.setTimeout(() => {
            const now = Date.now();
            const shouldIncludePages = isCrawling && (now - lastPagesCheckpointRef.current > 30000);
            if (shouldIncludePages) {
                lastPagesCheckpointRef.current = now;
            }
            persistSessionCheckpoint(isCrawling ? 'running' : undefined, {
                includePages: shouldIncludePages || !isCrawling
            }).catch((err) => {
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

    // Save pages on tab close / reload so data isn't lost
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (!currentSessionIdRef.current || pagesRef.current.length === 0) return;
            // Synchronous write to IndexedDB isn't possible, but we can fire it off
            // The browser usually gives about 100ms for beforeunload to complete
            const status = isCrawling ? 'paused' : 'completed';
            persistSessionCheckpoint(status, { includePages: true }).catch(() => {});
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isCrawling, persistSessionCheckpoint]);

    const auditInsights = useMemo(() => {
        if (analysisPages.length === 0) return [];
        const insights: any[] = [];

        const isIssueEnabled = (issueId: string) => {
            const checkId = ISSUE_TO_CHECK_MAP[issueId] || issueId;
            return activeCheckIds.has(checkId);
        };
        
        if (stats.broken > 0 && (isIssueEnabled('404') || isIssueEnabled('500'))) {
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
        
        if (stats.missingTitles > 0 && isIssueEnabled('title_missing')) {
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

        if (stats.slowPages > 0 && isIssueEnabled('slow_response')) {
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

        if (stats.nonIndexable > 0 && (isIssueEnabled('noindex') || isIssueEnabled('blocked_robots'))) {
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

        if (stats.missingMetaDesc > 0 && isIssueEnabled('meta_missing')) {
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
    }, [analysisPages.length, stats, activeCheckIds]);

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

    // AI Layer States
    const [aiResults, setAiResults] = useState<Map<string, PageAIResult>>(new Map());
    const [aiProgress, setAiProgress] = useState<{ done: number; total: number; url: string } | null>(null);
    const [aiNarrative, setAiNarrative] = useState<string>('');
    const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

    // ─── Trigger AI analysis after crawl completes ─────
    const runAIAnalysis = useCallback(async (pagesToAnalyze?: any[]) => {
        const targetPages = pagesToAnalyze || pages.filter(p => p.isHtmlPage && p.statusCode === 200);
        if (targetPages.length === 0) return;

        setIsAnalyzingAI(true);
        const engine = getAIEngine();
        addLog(`Starting AI Analysis for ${targetPages.length} pages...`, 'info', { source: 'analysis' });

        try {
            // 1. Analyze individual pages
            const results = await engine.analyzePages(
                targetPages.map(p => ({
                    url: p.url,
                    title: p.title || '',
                    metaDesc: p.metaDesc || '',
                    h1_1: p.h1_1 || '',
                    textContent: p.textContent || '',
                    wordCount: p.wordCount || 0,
                    issues: auditInsights
                        .filter((issue: any) => issue.condition?.(p))
                        .map((issue: any) => ({ id: issue.id, label: issue.label })),
                })),
                (done, total, url) => setAiProgress({ done, total, url })
            );

            // 2. Merge AI results into page data
            const resultMap = new Map<string, PageAIResult>();
            for (const r of results) {
                resultMap.set(r.url, r);
            }
            setAiResults(resultMap);

            // 3. Update page objects with AI data for the grid columns
            const updatedPages = targetPages.map(p => {
                const ai = resultMap.get(p.url);
                if (!ai) return p;
                return {
                    ...p,
                    topicCluster: ai.topicCluster || p.topicCluster,
                    searchIntent: ai.searchIntent || p.searchIntent,
                    funnelStage: ai.searchIntent === 'transactional' ? 'Transactional'
                        : ai.searchIntent === 'commercial' ? 'Commercial'
                        : ai.searchIntent === 'navigational' ? 'Navigational'
                        : 'Informational',
                    contentQualityScore: ai.contentQualityScore ?? p.contentQualityScore,
                    strategicPriority: ai.contentQualityScore != null
                        ? (ai.contentQualityScore < 40 ? 'High' : ai.contentQualityScore < 70 ? 'Medium' : 'Low')
                        : p.strategicPriority,
                    recommendedAction: ai.fixSuggestions?.[0]?.fix || p.recommendedAction,
                    recommendedActionReason: ai.contentWeaknesses?.[0] || p.recommendedActionReason,
                    aiSummary: ai.summary,
                };
            });

            // Persist updated pages to Dexie
            if (currentSessionIdRef.current) {
                await crawlDb.pages.bulkPut(updatedPages);
                // Also update the in-memory analysisPages for the grid
                setAnalysisPages(prev => {
                    const next = [...prev];
                    updatedPages.forEach(up => {
                        const idx = next.findIndex(p => p.url === up.url);
                        if (idx !== -1) next[idx] = up;
                        else next.push(up);
                    });
                    return next;
                });
            }

            // 4. Generate crawl narrative
            const narrative = await engine.generateCrawlNarrative({
                domain: targetPages[0]?.url ? new URL(targetPages[0].url).hostname : '',
                total: stats?.total || 0,
                healthy: stats?.total - (stats?.broken || 0) - (stats?.redirects || 0),
                errors: stats?.broken || 0,
                healthScore: healthScore.score,
                grade: healthScore.grade,
                topIssues: auditInsights.slice(0, 5).map((i: any) => i.label),
            });
            setAiNarrative(narrative);
            addLog('AI analysis complete.', 'success', { source: 'analysis' });

        } catch (err) {
            console.error('AI analysis failed:', err);
            addLog(`AI analysis error: ${(err as Error).message}`, 'error', { source: 'analysis' });
        } finally {
            setIsAnalyzingAI(false);
            setAiProgress(null);
        }
    }, [pages, stats, healthScore, auditInsights, addLog]);

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
            addLog('Raw DB export complete.', 'success', { source: 'system' });
        } catch (error) {
            console.error('Failed to export raw DB:', error);
            addLog('Failed to export raw DB.', 'error', { source: 'system' });
        }
    };

    // ─── AI-prioritized category ordering ───
    const prioritizedCategories = useMemo(() => {
        if (!prioritizeByIssues || analysisPages.length === 0) return CATEGORIES;
        
        const catScores = CATEGORIES.map(cat => {
            const counts = categoryCounts[cat.id] || {};
            const totalIssues = (Object.entries(counts) as Array<[string, number]>)
                .filter(([sub]) => sub !== 'All')
                .reduce((sum, [, value]) => sum + Number(value || 0), 0);
            // Weight "problem" categories higher
            const isProblematic = ['security', 'codes', 'indexability', 'performance', 'content', 'mobile'].includes(cat.id);
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
            // Always include pages when explicitly saving — this is what the History tab reads
            await persistSessionCheckpoint(status, { includePages: true });
            await loadCrawlHistory();
            addLog(`Session saved locally (${pagesRef.current.length} pages).`, 'success', { source: 'session' });
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
                const normalizedSavedPages = savedPages
                    .map((page: any) => normalizeCrawlerPage({
                        ...page,
                        crawlId: page?.crawlId || sessionId
                    }))
                    .filter((page): page is any => Boolean(page));

                if (normalizedSavedPages.length > 0) {
                    await crawlDb.pages.bulkPut(
                        normalizedSavedPages
                    );
                }

                setSelectedPage(null);
                setSelectedRows(new Set());
                setCurrentSessionId(sessionId);
                currentSessionIdRef.current = sessionId;
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
                setAuditFilter({
                    modes: Array.isArray(sess.auditModes) && sess.auditModes.length > 0
                        ? (sess.auditModes as AuditMode[])
                        : ['full'],
                    industry: (sess.industryFilter as IndustryFilter) || 'all'
                });
                setIgnoredUrls(new Set(sess.ignoredUrls || []));
                setUrlTags(sess.urlTags || {});
                setColumnWidths(sess.columnWidths || {});
                setRobotsTxt(sess.robotsTxt || null);
                setSitemapData(
                    buildSitemapState(
                        sess.sitemapData?.totalUrls ?? normalizedSavedPages.filter((page: any) => page.inSitemap).length,
                        sess.sitemapData?.sources ?? sess.robotsTxt?.sitemaps,
                        !!sess.sitemapData
                    )
                );
                setCrawlStartTime(sess.startedAt || null);
                setCrawlRuntime(sess.runtime || {
                    stage: sess.status === 'completed' ? 'completed' : sess.status === 'failed' ? 'error' : 'paused',
                    queued: 0,
                    activeWorkers: 0,
                    discovered: normalizedSavedPages.length,
                    crawled: normalizedSavedPages.length,
                    maxDepthSeen: Math.max(0, ...normalizedSavedPages.map((page: any) => page.crawlDepth || 0)),
                    concurrency: parseInt(String(sess.config?.threads), 10) || 5,
                    mode: sess.crawlingMode || sess.config?.crawlingMode || 'spider',
                    rate: 0,
                    workerUtilization: 0
                });
                setIsCrawling(false);

                addLog(`Loaded session with ${normalizedSavedPages.length} pages.`, 'success', { source: 'history' });
            }
        } catch (err) {
            addLog('Failed to load session.', 'error', { source: 'history' });
        } finally {
            setIsLoadingHistory(false);
        }
    }, [buildSessionSignature, config, setSelectedPage, setSelectedRows, setCurrentSessionId, setIgnoredUrls, setUrlTags, setColumnWidths]);

    // ─── DB init (runs once, separate from restore logic) ───
    useEffect(() => {
        initializeDatabase().catch(err => console.warn('Failed to initialize Turso DB:', err));
    }, []);

    // ─── URL param hydration (runs once) ───
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (initialUrlStateHydratedRef.current) return;

        const params = getHashRouteSearchParams();
        const urlParam = params.get('url');
        const modeParam = params.get('mode');

        if (urlParam && !urlInput) setUrlInput(urlParam);
        if (modeParam === 'spider' || modeParam === 'list' || modeParam === 'sitemap') {
            setCrawlingMode(modeParam);
        }
        initialUrlStateHydratedRef.current = true;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Auto-restore: waits for history to load first ───
    useEffect(() => {
        // Don't attempt restore until history has been fetched from IndexedDB
        if (isLoadingHistory) return;
        // Don't restore if already active
        if (currentSessionId) {
            setHasHydrated(true);
            return;
        }
        // Only run once
        if (autoRestoreAttemptedRef.current) return;

        if (typeof window === 'undefined') {
            autoRestoreAttemptedRef.current = true;
            setHasHydrated(true);
            return;
        }

        const sessionIdFromUrl = getHashRouteSearchParams().get('session');
        const preferredSessionId = sessionIdFromUrl || window.localStorage.getItem(CRAWLER_LAST_SESSION_STORAGE_KEY);
        const draftRaw = window.localStorage.getItem(CRAWLER_DRAFT_STORAGE_KEY);

        // Restore draft form state (URL input, mode, config) — always safe, no async
        if (draftRaw) {
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

        // Nothing to restore a session from
        if (!draftRaw && !preferredSessionId) {
            autoRestoreAttemptedRef.current = true;
            setHasHydrated(true);
            return;
        }

        // History hasn't loaded yet — wait for the next render when it does
        // This is the critical fix: we only proceed when crawlHistory is populated
        if (crawlHistory.length === 0 && preferredSessionId) {
            // If there's a preferredSessionId but history is empty, we might just be
            // waiting on the async DB read. Don't mark as attempted yet.
            return;
        }

        const restoreTarget = crawlHistory.find((s) => s.id === preferredSessionId)?.id
            ?? (crawlHistory.length > 0 ? crawlHistory[0].id : null);

        autoRestoreAttemptedRef.current = true;

        if (restoreTarget) {
            loadSession(restoreTarget)
                .catch((error) => console.error('Failed to auto-restore crawler session:', error))
                .finally(() => setHasHydrated(true));
        } else {
            setHasHydrated(true);
        }
    }, [crawlHistory, isLoadingHistory, currentSessionId, loadSession, urlInput, listUrls]);

    const resumeCrawlSession = useCallback(async (sessionId: string) => {
        await loadSession(sessionId);
        addLog('Session restored. Restarting crawl with saved configuration...', 'info', { source: 'session' });
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
            // If we're deleting the currently active session, clear the workspace
            if (currentSessionIdRef.current === sessionId) {
                clearCrawlerWorkspace();
            }
            await loadCrawlHistory();
            addLog('Session deleted.', 'info', { source: 'history' });
        } catch (err) {
            addLog('Failed to delete session.', 'error', { source: 'history' });
        }
    }, [loadCrawlHistory, clearCrawlerWorkspace]);

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
            ownership: isAuthenticated && integrationProjectId ? 'project' : 'anonymous',
            sync: connection.sync || { status: 'idle' },
            ...connection,
            credentials: {},
            hasCredentials: Boolean(connection.credentials && Object.keys(connection.credentials).length > 0) || (provider === 'google' && !!connection.accountLabel)
        };

        setIntegrationConnections((prev) => {
            const next = {
                ...prev,
                [provider]: nextConnection
            };

            if (isAuthenticated && integrationProjectId) {
                upsertProjectCrawlerIntegration(integrationProjectId, nextConnection).catch((error) => {
                    console.error('Failed to persist project crawler integration:', error);
                });
            } else {
                saveAnonymousCrawlerIntegrations(next);
            }

            return next;
        });
    }, [isAuthenticated, integrationProjectId, integrationSecretScope]);

    const removeIntegrationConnection = useCallback((provider: CrawlerIntegrationProvider) => {
        setIntegrationConnections((prev) => {
            const next = { ...prev };
            delete next[provider];
            clearCrawlerIntegrationSecret(integrationSecretScope, provider);

            if (isAuthenticated && integrationProjectId) {
                removeProjectCrawlerIntegration(integrationProjectId, provider).catch((error) => {
                    console.error('Failed to remove project crawler integration:', error);
                });
            } else {
                saveAnonymousCrawlerIntegrations(next);
            }

            return next;
        });
    }, [isAuthenticated, integrationProjectId, integrationSecretScope]);

    // Legacy refreshGoogleToken removed - Now handled by GoogleOAuthHelper.refreshGoogleToken(email)

    const runFullEnrichment = useCallback(async () => {
        if (!currentSessionId) {
            addLog('No active crawl session to enrich.', 'error');
            return;
        }

        const googleConnection = integrationConnections.google;
        const googleEmail = googleConnection?.accountLabel || null;
        
        // Providers
        const ahrefsSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'ahrefs' as any);
        const semrushSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'semrush' as any);
        const ahrefsToken = ahrefsSecrets?.api_key || null;
        const semrushApiKey = semrushSecrets?.api_key || null;

        // Auto-detect targets / manual overrides
        let gscSiteUrl = config.gscSiteUrl || googleConnection?.selection?.siteUrl || urlInput;
        let ga4PropertyId = config.ga4PropertyId 
            || googleConnection?.sync?.propertyId 
            || googleConnection?.selection?.propertyId;

        try {
            addLog('Starting Unified SEO Data Enrichment...', 'info');
            
            let googleAccessToken: string | undefined;
            if (googleEmail) {
                addLog('Verifying Google connection...', 'info');
                googleAccessToken = await refreshGoogleToken(googleEmail) || undefined;
                if (!googleAccessToken) {
                    addLog('Google connection metadata is present, but no stored access token was found. Reconnect Google to sync GSC/GA4.', 'warn');
                } else {
                    // Perform proactive auto-detection if IDs are missing
                    if (!gscSiteUrl || !ga4PropertyId) {
                        const sampleUrl = pagesRef.current[0]?.url || urlInput;
                        try {
                            const resolution = await GoogleSelectionResolver.resolveEffectiveGoogleSelection({
                                accessToken: googleAccessToken,
                                crawlUrl: sampleUrl
                            });
                            if (resolution.siteUrl && !gscSiteUrl) {
                                gscSiteUrl = resolution.siteUrl;
                                addLog(`Auto-detected GSC property for enrichment: ${gscSiteUrl} (Confidence: ${resolution.gscConfidence}%)`, 'success');
                            }
                            if (resolution.propertyId && !ga4PropertyId) {
                                ga4PropertyId = resolution.propertyId;
                                addLog(`Auto-detected GA4 property for enrichment: ${ga4PropertyId} (Confidence: ${resolution.ga4Confidence}%)`, 'success');
                            }
                        } catch (e) {
                            console.warn('Auto-detection during enrichment failed:', e);
                        }
                    }
                }
            }

            if (googleAccessToken && !gscSiteUrl) {
                addLog('GSC sync will be skipped: no Search Console property found for this domain.', 'warn', { source: 'system' });
            }
            if (googleAccessToken && !ga4PropertyId) {
                addLog('GA4 sync will be skipped: no Analytics property found for this domain.', 'warn', { source: 'system' });
            }

            await PostCrawlEnrichment.runUnifiedEnrichment({
                sessionId: currentSessionId,
                googleAccessToken,
                googleEmail: googleEmail || undefined,
                gscSiteUrl: gscSiteUrl || undefined,
                ga4PropertyId: ga4PropertyId || undefined,
                ahrefsToken,
                semrushApiKey,
                keywordCsvData: integrationConnections.keywordUpload?.uploadData,
                backlinkCsvData: integrationConnections.backlinkUpload?.uploadData
            }, (msg) => addLog(msg, 'info', { source: 'enrichment' }));

            // Persistent Sync Coverage Check
            const enrichedPages = await crawlDb.pages.where('crawlId').equals(currentSessionId).toArray();
            const htmlPages = enrichedPages.filter((page) => page.isHtmlPage);
            const gscMatched = htmlPages.filter((page) => page.gscEnrichedAt !== null).length;
            const ga4Matched = htmlPages.filter((page) => page.ga4EnrichedAt !== null).length;
            const backlinkMatched = htmlPages.filter((page) =>
                page.backlinkEnrichedAt !== null ||
                page.backlinkUploadOverride ||
                page.backlinkSource === 'upload'
            ).length;

            await persistEnrichmentStatus({
                sessionId: currentSessionId,
                gsc: { matched: gscMatched, total: htmlPages.length, status: gscMatched > 0 ? 'success' : 'partial' },
                ga4: { matched: ga4Matched, total: htmlPages.length, status: ga4Matched > 0 ? 'success' : 'partial' },
                backlinks: { matched: backlinkMatched, total: htmlPages.length, status: backlinkMatched > 0 ? 'success' : 'partial' }
            });

            // Update local dashboard sync
            if (activeProject?.id) {
                await persistCrawlResults({
                    projectId: activeProject.id,
                    sessionId: currentSessionId,
                    urlCrawled: enrichedPages[0]?.url || urlInput,
                    pages: enrichedPages,
                    crawlMode: crawlingMode,
                    crawlDuration: 0,
                    crawlRate: Number(crawlRuntime.rate || 0),
                    maxDepthSeen: Number(crawlRuntime.maxDepthSeen || 0),
                    sitemapCoverage: sitemapData,
                    robotsTxt: robotsTxt?.raw || ''
                });
            }

            addLog('Enrichment complete. Strategic opportunities updated.', 'success');
        } catch (error: any) {
            console.error('[Full Enrichment] Failed:', error);
            addLog(`Pipeline failed: ${error.message}`, 'error');
        }
    }, [
        currentSessionId, 
        integrationConnections, 
        integrationSecretScope, 
        addLog, 
        detectedGscSite, 
        detectedGa4Property, 
        config.gscSiteUrl, 
        config.ga4PropertyId, 
        urlInput,
        activeProject?.id,
        crawlingMode,
        crawlRuntime.rate,
        crawlRuntime.maxDepthSeen,
        sitemapData,
        robotsTxt?.raw
    ]);

    const runIncrementalEnrichment = useCallback(async () => {
        if (!currentSessionId) {
            addLog('No active crawl session to enrich.', 'error');
            return;
        }

        const googleConnection = integrationConnections.google;
        const googleEmail = googleConnection?.accountLabel || null;
        const ahrefsSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'ahrefs' as any);
        const semrushSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'semrush' as any);

        try {
            addLog('Resuming Data Enrichment...', 'info');
            let googleAccessToken: string | undefined;
            if (googleEmail) {
                googleAccessToken = await refreshWithLock(googleEmail, refreshGoogleToken) || undefined;
            }

            await PostCrawlEnrichment.runIncrementalEnrichment({
                sessionId: currentSessionId,
                googleAccessToken,
                googleEmail: googleEmail || undefined,
                gscSiteUrl: config.gscSiteUrl || googleConnection?.selection?.siteUrl || urlInput,
                ga4PropertyId: config.ga4PropertyId || googleConnection?.selection?.propertyId,
                ahrefsToken: ahrefsSecrets?.api_key,
                semrushApiKey: semrushSecrets?.api_key
            }, (msg) => {
                addLog(msg, 'info', { source: 'analysis' });
            });
            addLog('Incremental enrichment step finished.', 'success');
        } catch (err: any) {
            addLog(`Incremental enrichment failed: ${err.message}`, 'error');
        }
    }, [currentSessionId, integrationConnections, integrationSecretScope, config, urlInput, addLog]);

    const runSelectedEnrichment = useCallback(async (urls: string[]) => {
        if (!currentSessionId || urls.length === 0) return;

        const googleConnection = integrationConnections.google;
        const googleEmail = googleConnection?.accountLabel || null;

        try {
            addLog(`Re-enriching ${urls.length} selected pages...`, 'info');
            let googleAccessToken: string | undefined;
            if (googleEmail) {
                googleAccessToken = await refreshWithLock(googleEmail, refreshGoogleToken) || undefined;
            }

            await PostCrawlEnrichment.enrichSelectedPages({
                sessionId: currentSessionId,
                googleAccessToken,
                googleEmail: googleEmail || undefined,
                gscSiteUrl: config.gscSiteUrl || googleConnection?.selection?.siteUrl || urlInput,
                ga4PropertyId: config.ga4PropertyId || googleConnection?.selection?.propertyId
            }, urls, (msg) => {
                addLog(msg, 'info', { source: 'analysis' });
            });
            addLog('Selective enrichment finished.', 'success');
        } catch (err: any) {
            addLog(`Selective enrichment failed: ${err.message}`, 'error');
        }
    }, [currentSessionId, integrationConnections, config, urlInput, addLog]);

    const value = {
        crawlingMode, setCrawlingMode, urlInput, setUrlInput, listUrls, setListUrls, showListModal, setShowListModal,
        isCrawling, setIsCrawling, pages: pagesWithDerivedSignals, logs, setLogs, crawlStartTime, setCrawlStartTime,
        crawlDb,
        activeCategories, setActiveCategories,
        activeCategory, setActiveCategory,
        auditFilter, activeCheckIds, activeCheckCategories, filteredIssuePages,
        customPresets, applyAuditMode, saveCustomPreset, loadCustomPreset,
        openCategories, setOpenCategories, searchQuery, setSearchQuery,
        selectedPage, setSelectedPage, activeTab, setActiveTab, inspectorCollapsed, setInspectorCollapsed, showAuditSidebar, setShowAuditSidebar,
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
        showTrialLimitAlert, setShowTrialLimitAlert,
        dynamicClusters, categoryCounts, healthScore, auditInsights, strategicOpportunities, crawlRate, crawlRuntime, elapsedTime, setElapsedTime,
        formatBytes, handleExport, handleExportRawDB, handleImport, filteredPages, handleSort, graphData, handleNodeClick,
        crawlHistory, currentSessionId, compareSessionId, diffResult, isLoadingHistory,
        saveCrawlSession, loadSession, resumeCrawlSession, compareSessions, deleteCrawlSession, loadCrawlHistory,
        detectedGscSite, setDetectedGscSite, detectedGa4Property, setDetectedGa4Property,
        runFullEnrichment, runIncrementalEnrichment, runSelectedEnrichment,
        isAuthenticated, user, profile, signOut, trialPagesLimit,
        prioritizedCategories, prioritizeByIssues, setPrioritizeByIssues,
        sidebarCollapsed, setSidebarCollapsed,
        showScheduleModal, setShowScheduleModal,
        ignoredUrls, setIgnoredUrls, urlTags, setUrlTags,
        robotsTxt, sitemapData,
        columnWidths, setColumnWidths,
        aiResults, aiProgress, aiNarrative, isAnalyzingAI, runAIAnalysis
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
