import React, { createContext, useContext, useState, useRef, useMemo, useEffect, useCallback, useDeferredValue, startTransition, ReactNode } from 'react';
// Force recompilation - 2026-04-13
import {
    CATEGORIES,
    ALL_COLUMNS,
    resolveIssueCheckId,
    matchesCategoryFilter,
    AI_INSIGHTS_CATEGORY,
    formatBytes
} from '../components/seo-crawler/constants';
import { UNIFIED_ISSUE_TAXONOMY, getIssuesForMode, getPageIssues, ISSUE_TO_CHECK_MAP } from '../services/UnifiedIssueTaxonomy';
import { AUDIT_MODES, getWqaDefaultVisibleColumns } from '../services/AuditModeConfig';
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
import { calculatePredictiveScore, calculateAuthorityScore, calculateBusinessValueScore, calculateOpportunityScore } from '../services/StrategicIntelligence';
import { persistCrawlResults, syncCrawlStatus, persistEnrichmentStatus, deleteCompetitorProfile, loadCompetitorProfiles as loadCompetitorProfilesCloud } from '../services/CrawlPersistenceService';
import { syncFromCrawl, listCompetitors, deleteCompetitor as removeCompetitorRecord } from '../services/DashboardDataService';
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
import { runCompetitorMicroCrawl } from '../services/CompetitorMicroCrawl';
import { getAIEngine } from '../services/ai';
import { refreshGoogleToken } from '../services/GoogleOAuthHelper';
import { initializeDatabase } from '../services/turso';
import { useLiveQuery } from 'dexie-react-hooks';
import { crawlDb } from '../services/CrawlDatabase';
import { GoogleSelectionResolver, EffectiveGoogleSelection } from '../services/googleSelectionResolver';
import { UrlNormalization } from '../services/UrlNormalization';
import { refreshWithLock } from '../services/TokenRefreshLock';
import { startScheduler } from '../services/CrawlScheduler';
import { dispatchAlert, AlertPayload } from '../services/AlertDispatcher';
import type { CompetitorProfile } from '../services/CompetitorMatrixConfig';
import { loadCompetitorProfiles, saveCompetitorProfile, getCompetitorSnapshots } from '../services/CrawlDatabase';
import { CompetitorProfileBuilder } from '../services/CompetitorProfileBuilder';
import {
  runPhaseB,
  runPhaseC,
  runPhaseF,
  type EnrichmentContext,
} from '../services/competitors/CompetitorEnrichmentPipeline';
import {
  type CompetitiveModeState,
  type CompetitiveBrief,
  type CompetitiveViewMode,
  type CompetitorSoVResult,
  DEFAULT_COMPETITIVE_STATE,
} from '../services/CompetitorModeTypes';
import { computeShareOfVoice, computeThreatScores } from '../services/CompetitorDiscoveryService';
import { detectSiteType, type DetectedIndustry, type SiteTypeResult } from '../services/SiteTypeDetector';
import { DEFAULT_WQA_STATE, getEffectiveIndustry, getEffectiveLanguage, type WebsiteQualityState, type WqaViewMode } from '../services/WebsiteQualityModeTypes';
import { computeWqaActionGroups, computeWqaSiteStats, deriveWqaScore } from '../services/WqaSidebarData';
// getPageIssues now imported from UnifiedIssueTaxonomy above

import {
  filterWqaPages,
  computeWqaFacets,
  DEFAULT_WQA_FILTER,
  EMPTY_FACETS,
  type WqaFilterState,
  type WqaFacets,
} from '../services/WqaFilterEngine';
import { ForecastService } from '../services/ForecastService';

import type { PageAIResult } from '../services/ai/AIAnalysisEngine';
import type { CrawlerConfig, SettingsTabId } from '../services/CrawlerConfigTypes';
import { exportToGoogleDrive } from '../services/GoogleDriveExportService';
import { exportToGitHub } from '../services/GitHubExportService';
import { CrawlerConfigValidator, validateCrawlConfig } from '../services/CrawlerConfigValidator';
import {
    normalizeComparableText,
    clampScore,
    mergePagesByUrl,
    normalizeCrawlerPage,
    buildSitemapState,
    hasOwn,
    runPostCrawlScoring,
    exportPagesAsCSV,
    exportRawSessionData
} from '../services/CrawlerDataUtils';
import { useGraphDataWorker } from '../hooks/useGraphDataWorker';
import { useParams } from 'react-router-dom';

// Collaboration Services (P5)
import { getTasks, createTask as createTaskService, updateTask as updateTaskService } from '../services/TaskService';
import { executeRules, reconcileTasksWithIssues } from '../services/AutoAssignmentService';
import { getMembers } from '../services/TeamService';
import { getAuditIssues } from '../services/CrawlerBridgeService';
import { createNotification } from '../services/ActivityService';
import { getComments, createComment as createCommentService } from '../services/CollaborationService';
import type { CrawlTask, CommentTargetType, ProjectMember } from '../services/app-types';
import { checkRunner, SiteContext } from '../services/checks';

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
    | 'source'
    | 'jsdiff'
    | 'visual';

export type AnalysisStage = 
    | 'idle' 
    | 'ai-analysis' 
    | 'strategic-audit' 
    | 'incremental-audit' 
    | 'completed' 
    | 'error';

export interface AnalysisRuntime {
    isAnalyzing: boolean;
    stage: AnalysisStage;
    progress: number;
    label: string;
}

export type AuditTab =
    | 'dashboard'
    | 'overview'
    | 'issues'
    | 'opportunities'
    | 'geo'
    | 'tasks'
    | 'ai'
    | 'monitor'
    | 'migration'
    | 'history'
    | 'logs'
    | 'robots'
    | 'sitemap'
    | 'visual'
    | 'wqa_quality'
    | 'wqa_actions'
    | 'wqa_search'
    | 'wqa_content'
    | 'wqa_history';

type RobotsTxtState = {
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
    activeViewType: string;
    activeSidebarSections: string[];

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
    activeAuditTab:
        | 'overview'
        | 'issues'
        | 'opportunities'
        | 'geo'
        | 'tasks'
        | 'ai'
        | 'monitor'
        | 'migration'
        | 'history'
        | 'logs'
        | 'robots'
        | 'sitemap'
        | 'visual'
        | 'wqa_quality'
        | 'wqa_actions'
        | 'wqa_search'
        | 'wqa_content'
        | 'wqa_history'
        | 'comp_overview'
        | 'comp_gaps'
        | 'comp_threats'
        | 'comp_brief'
        | 'comp_trends';
    setActiveAuditTab: (t: any) => void;
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
    viewMode: 'grid' | 'map' | 'charts';
    setViewMode: (v: 'grid' | 'map' | 'charts') => void;
    showAiInsights: boolean;
    setShowAiInsights: (s: boolean) => void;
    showAiChat: boolean;
    setShowAiChat: (s: boolean) => void;
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
    analysisRuntime: AnalysisRuntime;
    elapsedTime: string;
    // R1: setElapsedTime removed — fully derived internal state, no consumer should set it
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
    showComparisonView: boolean;
    setShowComparisonView: React.Dispatch<React.SetStateAction<boolean>>;
    showExportDialog: boolean;
    setShowExportDialog: React.Dispatch<React.SetStateAction<boolean>>;
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
    robotsTxt: RobotsTxtState;
    sitemapData: { totalUrls: number; sources: string[]; coverageParsed?: boolean } | null;
    siteType: SiteTypeResult | null;
    isWqaMode: boolean;
    wqaState: WebsiteQualityState;
    setWqaState: React.Dispatch<React.SetStateAction<WebsiteQualityState>>;
    activateWqaMode: () => void;
    deactivateWqaMode: () => void;
    setWqaViewMode: (mode: WqaViewMode) => void;
    setWqaIndustryOverride: (industry: DetectedIndustry | null) => void;
    setWqaLanguageOverride: (language: string | null) => void;
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
    runCompleteAnalysis: () => Promise<void>;
    analysisPages: any[];

    // AI Layer
    aiResults: Map<string, PageAIResult>;
    aiProgress: { done: number; total: number; url: string } | null;
    aiNarrative: string;
    isAnalyzingAI: boolean;
    runAIAnalysis: (pagesToAnalyze?: any[]) => Promise<void>;

    // Collaboration & Tasks (P5)
    tasks: CrawlTask[];
    setTasks: React.Dispatch<React.SetStateAction<CrawlTask[]>>;
    teamMembers: ProjectMember[];
    showCollabOverlay: boolean;
    setShowCollabOverlay: (s: boolean) => void;
    collabOverlayTarget: { type: CommentTargetType, id: string, title: string } | null;
    setCollabOverlayTarget: (t: { type: CommentTargetType, id: string, title: string } | null) => void;
    activeCommentTarget: { type: CommentTargetType, id: string } | null;
    setActiveCommentTarget: (t: { type: CommentTargetType, id: string } | null) => void;
    exportSubset: (category: { group: string; sub: string; condition?: (p: any) => boolean }) => void;
    createTaskForCategory: (category: { group: string; sub: string; condition?: (p: any) => boolean }) => Promise<void>;
    bulkAIAnalyzeCategory: (category: { group: string; sub: string; condition?: (p: any) => boolean }) => Promise<void>;
    tier4Results: Map<string, any[]>;
    runTier4Checks: (pages: any[]) => Map<string, any[]>;
    showAddCompetitorInput: boolean;
    setShowAddCompetitorInput: React.Dispatch<React.SetStateAction<boolean>>;
    crawlingCompetitorDomain: string | null;
    setCrawlingCompetitorDomain: React.Dispatch<React.SetStateAction<string | null>>;
    refreshAllCompetitors: () => Promise<void>;

    // ─── Competitive Mode View ───
    competitiveViewMode: CompetitiveViewMode;
    setCompetitiveViewMode: (mode: CompetitiveViewMode) => void;

    // Competitive mode
    competitiveState: CompetitiveModeState;
    toggleCompetitiveMode: (active: boolean) => void;
    setActiveCompetitors: (domains: string[]) => void;
    buildOwnProfile: () => void;
    addCompetitorAndCrawl: (competitorUrl: string) => Promise<void>;
    removeCompetitor: (domain: string) => void;
    recrawlCompetitor: (domain: string) => Promise<void>;
    recrawlAllCompetitors: () => Promise<void>;
    refreshCompetitorScores: (targetDomain?: string) => void;
    generateCompetitiveBrief: () => Promise<void>;
    getTimelineData: (domain: string) => Promise<Array<{ snapshotAt: number; profile: CompetitorProfile }>>;

    // WQA Intelligence
    wqaFilter: WqaFilterState;
    setWqaFilter: React.Dispatch<React.SetStateAction<WqaFilterState>>;
    wqaFacets: WqaFacets;
    filteredWqaPagesExport: any[]; // Avoid conflict with filteredPages
    wqaForecast: any;
}


export const SeoCrawlerContext = createContext<CrawlerContextType | undefined>(undefined);
const MAX_IN_MEMORY_PAGES = 50000;
const CRAWLER_LAYOUT_STORAGE_KEY = 'headlight:seo-crawler-layout';
const CRAWLER_LAST_SESSION_STORAGE_KEY = 'headlight:seo-crawler-last-session';
const CRAWLER_DRAFT_STORAGE_KEY = 'headlight:seo-crawler-draft';

const getScopedCrawlerSessionStorageKey = (projectId: string | null | undefined) =>
    projectId ? `${CRAWLER_LAST_SESSION_STORAGE_KEY}:${projectId}` : CRAWLER_LAST_SESSION_STORAGE_KEY;

const getScopedCrawlerDraftStorageKey = (projectId: string | null | undefined) =>
    projectId ? `${CRAWLER_DRAFT_STORAGE_KEY}:${projectId}` : CRAWLER_DRAFT_STORAGE_KEY;

const getNormalizedHostname = (value: string | null | undefined) => {
    if (!value) return '';
    try {
        const url = value.startsWith('http') ? value : `https://${value}`;
        return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
        return String(value).replace(/^www\./i, '').toLowerCase();
    }
};
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

const DEFAULT_CONFIG: CrawlerConfig = {
    startUrls: [],
    mode: 'spider',
    industry: 'all',
    limit: '20000',
    maxDepth: '10',
    threads: 5,
    crawlSpeed: 'normal',
    userAgent: 'Headlight Scanner 1.0',
    respectRobots: true,
    followRedirects: true,
    maxRedirectHops: 5,
    cookieConsent: 'auto-accept',
    useGhostEngine: false,
    fallbackToServer: true,
    concurrent: 6,
    requestTimeout: 30,
    retryOnFail: true,
    retryCount: 2,
    rateLimit: false,
    rateLimitDelay: 500,
    useProxy: false,
    proxyUrl: '',
    proxyPort: '',
    proxyUser: '',
    proxyPass: '',
    viewportWidth: 1920,
    viewportHeight: 1080,
    jsRenderingComparison: false,
    captureScreenshots: false,
    screenshotStorage: 'local',
    screenshotViewportWidth: 1280,
    screenshotViewportHeight: 720,
    aiEnabled: true,
    aiAutoRotation: true,
    aiBatchSize: 20,
    aiTasks: {
        summarize: true,
        keywords: true,
        intent: true,
        quality: true,
        priority: true,
        fixSuggestions: true,
        competitiveGap: false,
        eeat: true,
        schemaGenerate: false,
        metaRewrite: false,
        altTextGenerate: false,
        sentiment: true,
        originality: true,
        aiDetection: true,
        contentGaps: true,
    },
    aiProviderOrder: ['cloudflare', 'github', 'huggingface', 'gemini', 'groq'],
    aiCustomKeys: { openai: '', anthropic: '', gemini: '', cohere: '' },
    includeRules: '',
    excludeRules: '',
    ignoreQueryParams: false,
    allowedDomains: '',
    customHeaders: '',
    customCookies: '',
    authUser: '',
    authPass: '',
    authType: 'none',
    authBearerToken: '',
    customExtractionRules: [],
    jsRendering: false,
    fetchWebVitals: false,
    crawlResources: false,
    extractCss: '',
    extractRegex: '',
    customFieldExtractors: [],
    scheduleEnabled: false,
    scheduleFrequency: 'weekly',
    scheduleDay: 'monday',
    scheduleTime: '02:00',
    scheduleCron: '0 0 * * *',
    changeDetection: true,
    alertOnScoreDrop: true,
    alertOnNew404s: true,
    alertOnNewIssues: true,
    alertChannels: { email: true, inApp: true, slack: false, webhook: false },
    webhookUrl: '',
    slackWebhookUrl: '',
    changeMonitorEnabled: false,
    changeMonitorInterval: 'daily',
    psiApiKey: '',
    cloudSync: 'metadata',
    gscSiteUrl: '',
    ga4PropertyId: '',
    gscApiKey: '',
    bingAccessToken: '',
    indexNowApiKey: '',
    indexNowAutoSubmit: false,
    externalEnrichment: false,
    rawHtmlBackup: 'local',
    exportOnCrawl: 'none',
    retentionSessions: 10,
    autoBackupDestination: 'none',
    githubBackupRepo: '',

    // URL LIST SETTINGS
    urlListSource: 'manual',
    manualUrls: '',
    sitemapSource: 'auto',
    importSitemapUrl: '',
    uploadedFileName: '',
};

export const getHashRouteSearchParams = () => {

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

// D2+D3+D4 fix: normalizeComparableText, clampScore, mergePagesByUrl, normalizeCrawlerPage,
// buildSitemapState, and hasOwn are now imported from ../services/CrawlerDataUtils.ts

/**
 * Derives strategic intelligence signals for a page using canonical scoring
 * from StrategicIntelligence.ts. This ensures score consistency across grid
 * display, enrichment, and persistence paths.
 */
const derivePageIntelligence = (page: any) => {
    const impressions = Number(page.gscImpressions || 0);
    const clicks = Number(page.gscClicks || 0);
    const sessions = Number(page.ga4Sessions || 0);
    const users = Number(page.ga4Users || 0);
    const bounceRate = Number(page.ga4BounceRate || 0);
    const avgSessionDuration = Number(page.ga4EngagementTimePerPage || page.ga4AvgSessionDuration || 0);
    const referringDomains = Number(page.referringDomains || 0);
    const urlRating = Number(page.urlRating || 0);

    // Use canonical scoring functions from StrategicIntelligence.ts
    const authorityScore = Number(page.authorityScore ?? calculateAuthorityScore(page));
    const businessValueScore = Number(page.businessValueScore ?? calculateBusinessValueScore(page));
    const opportunityScore = Number(page.opportunityScore ?? calculateOpportunityScore(page));

    // Engagement/quality metrics (lightweight, no duplicate in services)
    const engagementRisk = clampScore((bounceRate * 100) - Math.min(40, avgSessionDuration / 5));
    const trafficQuality = clampScore((businessValueScore * 0.65) + (Math.max(0, 1 - bounceRate) * 35));

    // Data coverage & confidence
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
    const { projectId: routeProjectParam } = useParams<{ projectId: string }>();
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
    const [wqaFilter, setWqaFilter] = useState<WqaFilterState>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('headlight:wqa-filter');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return DEFAULT_WQA_FILTER;
                }
            }
        }
        return DEFAULT_WQA_FILTER;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('headlight:wqa-filter', JSON.stringify(wqaFilter));
        }
    }, [wqaFilter]);
    const setActiveCategory = useCallback((category: { group: string; sub: string }) => {
        setActiveCategories([category]);
    }, []);
    const [auditFilter, setAuditFilter] = useState<AuditFilterState>(DEFAULT_FILTER_STATE);
    const [customPresets, setCustomPresets] = useState<CustomAuditPreset[]>(() => getLocalPresets());
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPage, setSelectedPage] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<InspectorTab>('general');
    const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
    const [showAuditSidebar, setShowAuditSidebar] = useState(false);
    const [activeAuditTab, setActiveAuditTab] = useState<AuditTab>('overview');
    const [showSettings, setShowSettings] = useState(false);
    const [activeMacro, setActiveMacro] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [showColumnPicker, setShowColumnPicker] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
    const [viewMode, setViewMode] = useState<'grid' | 'map' | 'charts'>('grid');
    const [showAiInsights, setShowAiInsights] = useState(false);
    const [showAiChat, setShowAiChat] = useState(false);
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
    const [showComparisonView, setShowComparisonView] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [detectedGscSite, setDetectedGscSite] = useState<string | null>(null);
    const [detectedGa4Property, setDetectedGa4Property] = useState<string | null>(null);
    const [tier4Results, setTier4Results] = useState<Map<string, any[]>>(new Map());

    const activeViewType = useMemo(() => {
        // Handle explicit sidebar tab overrides first
        if (activeAuditTab === 'geo') return 'geo_view';
        if (activeAuditTab === 'visual') return 'visual_heat_map';
        if (activeAuditTab === 'opportunities') return 'opportunity_view';
        if (activeAuditTab === 'ai') return 'ai_view';
        if (['comp_overview', 'comp_gaps', 'comp_threats', 'comp_brief', 'comp_trends'].includes(activeAuditTab)) return 'competitor_matrix';

        // Otherwise, use the first active mode to determine the view type
        const primaryMode = auditFilter.modes[0] || 'full';
        return AUDIT_MODES[primaryMode]?.viewType || 'grid';
    }, [auditFilter.modes, activeAuditTab]);

    const activeSidebarSections = useMemo(() => {
        const primaryMode = auditFilter.modes[0] || 'full';
        return AUDIT_MODES[primaryMode]?.sidebarSections || ['overview', 'issues', 'details'];
    }, [auditFilter.modes]);

    const isWqaMode = useMemo(() => {
        const primaryMode = auditFilter.modes[0] || 'full';
        return AUDIT_MODES[primaryMode]?.isWqaMode === true;
    }, [auditFilter.modes]);

    useEffect(() => {
        if (isWqaMode) {
            setWqaState((prev) => ({
                ...prev,
                isActive: true,
                viewMode: prev.viewMode || 'grid',
            }));
            return;
        }

        setWqaState(DEFAULT_WQA_STATE);
    }, [isWqaMode]);

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

    // R2 fix: Replace manual 1.2s debounce with React 18 useDeferredValue.
    // This lets React naturally defer expensive downstream computations (stats, graph, health)
    // without maintaining a separate copy of the pages array.
    const analysisPages = useDeferredValue(pages);

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
    const [robotsTxt, setRobotsTxt] = useState<RobotsTxtState>(null);
    const [sitemapData, setSitemapData] = useState<{ totalUrls: number; sources: string[]; coverageParsed?: boolean } | null>(null);
    const [siteType, setSiteType] = useState<SiteTypeResult | null>(null);
    const [wqaState, setWqaState] = useState<WebsiteQualityState>(DEFAULT_WQA_STATE);

    const activateWqaMode = useCallback(() => {
        const detected = siteType ?? detectSiteType(pages as any[]);
        const industry = wqaState.industryOverride ?? detected.industry;
        const stats = computeWqaSiteStats(pages as any[], industry);
        const actions = computeWqaActionGroups(pages as any[]);
        const { score, grade } = deriveWqaScore(stats);

        const prevSession = crawlHistory
            .filter((s) => s.completedAt && s.id !== currentSessionId)
            .sort((a, b) => Number(b.completedAt || 0) - Number(a.completedAt || 0))[0];
        const prevScore = Number(prevSession?.healthScore || 0);
        const scoreDelta = prevSession ? score - prevScore : 0;

        setWqaState((prev) => ({
            ...prev,
            isActive: true,
            detectedIndustry: detected.industry,
            industryConfidence: detected.confidence,
            detectedLanguage: detected.detectedLanguage,
            detectedLanguages: detected.detectedLanguages,
            detectedCms: detected.detectedCms,
            isMultiLanguage: detected.isMultiLanguage,
            siteStats: stats,
            actionGroups: actions,
            siteScore: score,
            siteGrade: grade,
            scoreDelta,
        }));
    }, [siteType, pages, wqaState.industryOverride, crawlHistory, currentSessionId]);

    const deactivateWqaMode = useCallback(() => {
        setWqaState(DEFAULT_WQA_STATE);
    }, []);

    const setWqaViewMode = useCallback((mode: WqaViewMode) => {
        setWqaState((prev) => ({ ...prev, viewMode: mode }));
    }, []);

    const setWqaIndustryOverride = useCallback((industry: DetectedIndustry | null) => {
        setWqaState((prev) => {
            const effectiveIndustry = industry ?? prev.detectedIndustry;
            const stats = computeWqaSiteStats(pages as any[], effectiveIndustry);
            const actions = computeWqaActionGroups(pages as any[]);
            const { score, grade } = deriveWqaScore(stats);
            return {
                ...prev,
                industryOverride: industry,
                siteStats: stats,
                actionGroups: actions,
                siteScore: score,
                siteGrade: grade,
            };
        });
    }, [pages]);

    const setWqaLanguageOverride = useCallback((language: string | null) => {
        setWqaState((prev) => ({ ...prev, languageOverride: language }));
    }, []);

    // --- Column Width Overrides (Already declared above) ---

    const columns = useMemo(() => ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)), [visibleColumns]);

    // Config & Settings
    const [config, setConfig] = useState<CrawlerConfig>(DEFAULT_CONFIG);
    const [settingsTab, setSettingsTab] = useState<SettingsTabId>('general');

    const CONFIG_STORAGE_KEY = 'headlight:crawler-config';

    // Load config on mount
    useEffect(() => {
        const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                
                // Deep merge helper to ensure nested structures (aiTasks, alertChannels) are fully populated
                setConfig(prev => {
                    const next = { ...prev, ...parsed };
                    if (parsed.aiTasks) next.aiTasks = { ...prev.aiTasks, ...parsed.aiTasks };
                    if (parsed.alertChannels) next.alertChannels = { ...prev.alertChannels, ...parsed.alertChannels };
                    if (parsed.aiCustomKeys) next.aiCustomKeys = { ...prev.aiCustomKeys, ...parsed.aiCustomKeys };
                    return next;
                });
            } catch (e) {
                console.error('Failed to parse saved config', e);
            }
        }
    }, []);

    // Save config on change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
        }, 1000);
        return () => clearTimeout(timer);
    }, [config]);


    // Sync from active project (especially during setup)
    const lastActiveProjectId = useRef<string | null>(null);
    useEffect(() => {
        if (!activeProject) return;
        
        const params = getHashRouteSearchParams();
        const isSetup = params.get('setup') === 'true';
        const projectSwitched = lastActiveProjectId.current !== activeProject.id;
        lastActiveProjectId.current = activeProject.id;

        // Auto-populate URL if explicitly in setup mode or if we just switched projects
        // On project switch, we FORCE sync to the new project URL to avoid clobbering with old project context
        if ((isSetup || projectSwitched) && activeProject.url) {
            setUrlInput(activeProject.url);
        }

        // Sync Industry
        if (activeProject.industry && config.industry !== activeProject.industry) {
            setConfig(prev => ({
                ...prev,
                industry: activeProject.industry
            }));
        }
    }, [activeProject, config.industry]);



    const [theme, setTheme] = useState<'dark'|'light'|'system'|'high-contrast'>('dark');
    const [workerFilteredPages, setWorkerFilteredPages] = useState<any[] | null>(null);
    const [integrationConnections, setIntegrationConnections] = useState<Partial<Record<CrawlerIntegrationProvider, CrawlerIntegrationConnection>>>({});
    const [integrationsLoading, setIntegrationsLoading] = useState(false);
    const [analysisRuntime, setAnalysisRuntime] = useState<AnalysisRuntime>({
        isAnalyzing: false,
        stage: 'idle',
        progress: 0,
        label: 'Run Analysis'
    });
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
    const wsReconnectAttemptsRef = useRef(0);
    const wsReconnectTimerRef = useRef<number | null>(null);
    const wsIntentionalCloseRef = useRef(false);
    const isCrawlActiveRef = useRef(false);
    const pagesRef = useRef<any[]>([]);
    const pendingPageUpdatesRef = useRef<Map<string, any>>(new Map());
    const pendingPagesFlushRef = useRef<number | null>(null);
    const sessionCheckpointTimeoutRef = useRef<number | null>(null);
    const lastFetchLogAtRef = useRef(0);
    const sessionEntrySignatureRef = useRef<string | null>(null);
    const [hasHydrated, setHasHydrated] = useState(false);
    const initialUrlStateHydratedRef = useRef(false);
    const analysisRuntimeRef = useRef<AnalysisRuntime>(analysisRuntime);
    useEffect(() => {
        analysisRuntimeRef.current = analysisRuntime;
    }, [analysisRuntime]);
    const autoRestoreAttemptedRef = useRef(false);
    const restoredDraftScopeRef = useRef<string | null>(null);
    const inMemoryPageLimitAlertedRef = useRef(false);
    const currentSessionIdRef = useRef<string | null>(null);
    const integrationsHydratedRef = useRef(false);
    const ghostCrawlerRef = useRef<GhostCrawler | null>(null);
    const routeSearchParams = getHashRouteSearchParams();
    const routeProjectId = routeProjectParam || routeSearchParams.get('projectId') || routeSearchParams.get('project') || null;
    const scopedProjectId = routeProjectId || activeProject?.id || null;
    const scopedLastSessionStorageKey = getScopedCrawlerSessionStorageKey(scopedProjectId);
    const scopedDraftStorageKey = getScopedCrawlerDraftStorageKey(scopedProjectId);
    const integrationProjectId = scopedProjectId;
    const integrationSecretScope = getCrawlerSecretScope(integrationProjectId);

    const activeProjectHostname = useMemo(() => {
        return getNormalizedHostname(activeProject?.domain || activeProject?.url || null);
    }, [activeProject?.domain, activeProject?.url]);

    const sessionMatchesProjectScope = useCallback((session: CrawlSession) => {
        if (!scopedProjectId) return true;
        if (session.projectId) return session.projectId === scopedProjectId;

        if (!activeProjectHostname) return true;

        return getNormalizedHostname(session.url) === activeProjectHostname;
    }, [scopedProjectId, activeProjectHostname]);

    // Reset restoration flags when project scope changes to allow re-hydration for new project
    useEffect(() => {
        if (scopedProjectId) {
            autoRestoreAttemptedRef.current = false;
            setHasHydrated(false);
        }
    }, [scopedProjectId]);

    const projectScopedHistory = useMemo(() => {
        if (!scopedProjectId) return crawlHistory;
        return crawlHistory.filter(sessionMatchesProjectScope);
    }, [crawlHistory, scopedProjectId, sessionMatchesProjectScope]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = window.localStorage.getItem('headlight:theme');
            if (stored === 'dark' || stored === 'light' || stored === 'system' || stored === 'high-contrast') {
                setTheme(stored);
            }
        } catch {
            // Ignore storage read failures.
        }
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.setAttribute('data-theme', theme);
        try {
            window.localStorage.setItem('headlight:theme', theme);
        } catch {
            // Ignore storage write failures.
        }
    }, [theme]);

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
        // S3 fix: Only sync pagesRef from useLiveQuery when NOT crawling.
        // During active crawls, flushPendingPageUpdates manages pagesRef directly
        // to avoid stale useLiveQuery data overwriting fresh flush results.
        if (!isCrawlActiveRef.current) {
            pagesRef.current = pages;
        }
    }, [pages]);

    useEffect(() => {
        isCrawlActiveRef.current = isCrawling;
    }, [isCrawling]);

    useEffect(() => {
        currentSessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    useEffect(() => {
        if (!siteType) return;
        setWqaState((prev) => ({
            ...prev,
            detectedIndustry: siteType.industry,
            industryConfidence: siteType.confidence,
            secondaryIndustry: siteType.secondaryIndustry,
            secondaryConfidence: siteType.secondaryConfidence,
            detectedIndustries: siteType.detectedIndustries,
            isLowIndustryConfidence: siteType.isLowConfidence,
            detectedLanguage: siteType.detectedLanguage,
            detectedLanguages: siteType.detectedLanguages,
            detectedCms: siteType.detectedCms,
            isMultiLanguage: siteType.isMultiLanguage,
        }));
    }, [siteType]);

    useEffect(() => {
        if (!isWqaMode || !hasHydrated) return;
        
        // Synchronize auditFilter.industry with WQA industry override.
        // Map 'all' to null (use auto-detected) otherwise use the explicit filter.
        const industryToSync = auditFilter.industry === 'all' ? null : auditFilter.industry as DetectedIndustry;
        
        if (wqaState.industryOverride !== industryToSync) {
            setWqaIndustryOverride(industryToSync);
        }
    }, [isWqaMode, auditFilter.industry, wqaState.industryOverride, hasHydrated, setWqaIndustryOverride]);

    useEffect(() => {
        if (!isWqaMode || pages.length === 0) return;
        activateWqaMode();
    }, [isWqaMode, pages.length === 0, siteType, activateWqaMode]);

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
    // R3: This block migrates legacy 'googleSearchConsole' and 'googleAnalytics' integration
    // keys to the unified 'google' key. Safe to remove once all users have migrated.
    useEffect(() => {
        if (!integrationsHydratedRef.current) return;
        
        const legacyGsc = (integrationConnections as any)['googleSearchConsole'];
        const legacyGa4 = (integrationConnections as any)['googleAnalytics'];

        // R3 gate: Skip entirely if no legacy keys exist (most users)
        if (!legacyGsc && !legacyGa4) return;

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
        if (!hasHydrated || isLoadingHistory) return;
        // Persistence Update: ONLY set the item if we have a valid session.
        // DO NOT remove the item when currentSessionId is null, as null is a transient state 
        // during project switches and workspace clearances. We want to 'remember' the last
        // session even if it's not currently active in the UI.
        try {
            if (currentSessionId) {
                window.localStorage.setItem(scopedLastSessionStorageKey, currentSessionId);
            }
        } catch (error) {
            console.error('Failed to persist last crawler session:', error);
        }
    }, [currentSessionId, hasHydrated, scopedLastSessionStorageKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!hasHydrated) return;
        if (!currentSessionId) {
            window.localStorage.removeItem(scopedDraftStorageKey);
            return;
        }

        try {
            window.localStorage.setItem(scopedDraftStorageKey, JSON.stringify({
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
    }, [currentSessionId, urlInput, listUrls, crawlingMode, config, hasHydrated, scopedDraftStorageKey]);

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

    // R2 fix: analysisPages debounce removed — now using useDeferredValue(pages) above

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
        meta?: { source?: 'crawler' | 'session' | 'history' | 'analysis' | 'system' | 'enrichment' | 'collaboration'; url?: string; detail?: string }
    ) => {
        setLogs(prev => [...prev.slice(-499), {
            msg,
            type,
            time: Date.now(),
            sessionId: currentSessionIdRef.current ?? undefined,
            source: meta?.source ?? 'crawler',
            url: meta?.url,
            detail: meta?.detail,
        }] as any);
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
    // L3 fix: Use refs for handlers that aren't wrapped in useCallback to avoid stale closures
    const handleExportRef = useRef<() => void>(() => {});
    const handleStartPauseRef = useRef<(force?: boolean | React.MouseEvent | React.KeyboardEvent) => void>(() => {});
    const saveCrawlSessionRef = useRef<(status?: 'completed' | 'paused' | 'failed') => Promise<void>>(async () => {});

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
                handleExportRef.current();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                saveCrawlSessionRef.current('completed');
            }
            // Cmd/Ctrl+Enter → start/pause crawl
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleStartPauseRef.current();
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
                // S2 fix: Use health score for healthScore, opportunity for opportunityScore
                healthScore: calculatePredictiveScore({ ...existingPage, ...payload }),
                opportunityScore: hasOwn(payload, 'opportunityScore') ? payload.opportunityScore : existingPage.opportunityScore ?? null,
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
        wsIntentionalCloseRef.current = true;
        if (wsReconnectTimerRef.current !== null) {
            window.clearTimeout(wsReconnectTimerRef.current);
            wsReconnectTimerRef.current = null;
        }
        if (!wsRef.current) return;

        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
    }, []);

    const runTier4Checks = useCallback((pages: any[]) => {
        if (!pages.length) return new Map<string, any[]>();
        
        const rootHostname = pages[0]?.url ? new URL(pages[0].url).hostname : '';
        const siteContext: SiteContext = {
            allPages: pages,
            rootHostname,
            industry: auditFilter.industry || 'all',
            sitemapUrls: new Set(Object.keys(sitemapData || {})),
        };

        const results = new Map<string, any[]>();

        for (const page of pages) {
            const pageResults = checkRunner.runChecks(page, siteContext, {
                auditModes: auditFilter.modes,
                industry: auditFilter.industry,
            });
            if (pageResults.length > 0) {
                results.set(page.url, pageResults);
            }
        }

        return results;
    }, [auditFilter.modes, auditFilter.industry, sitemapData]);

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
        // R2 fix: analysisPages is now derived via useDeferredValue — no manual reset needed
        setLogs([]);
        setSelectedPage(null);
        setSelectedRows(new Set());
        setSiteType(null);
        setWqaState(DEFAULT_WQA_STATE);
        setCurrentSessionId(null);
        currentSessionIdRef.current = null;
        setCompareSessionId(null);
        setDiffResult(null);
        setShowComparisonView(false);
        setShowExportDialog(false);
        setActiveMacro('all');
        setSearchQuery('');
        setRobotsTxt(null);
        setSitemapData(null);
        setCrawlStartTime(null);
        setUrlInput('');
        setListUrls('');
        replaceHashRouteSearchParams((params) => {
            params.delete('url');
            params.delete('session');
            params.delete('setup');
            params.delete('tab');
            params.delete('activeTab');
            params.delete('projectId');
            params.delete('page');
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
                // We no longer remove scopedLastSessionStorageKey here to ensure
                // that project-switching preserves the last used session pointer.
                window.localStorage.removeItem(scopedDraftStorageKey);
            }
        } catch (error) {
            console.error('Failed to clear last crawler session pointer:', error);
        }
    }, [isCrawling, closeCrawlerSocket, config.threads, scopedDraftStorageKey, scopedLastSessionStorageKey]);

    const toggleCategory = (id: string) => {
        setOpenCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    // ─── Scheduler ───────────────────────────────────────────
    useEffect(() => {
        if (!config.scheduleEnabled) return;

        const cleanup = startScheduler(
            () => config,
            (reason) => {
                addLog(`⏰ ${reason} triggered`, 'info', { source: 'crawler' });
                // We'll call handleStartPause directly
                handleStartPause();
            }
        );
        return cleanup;
    }, [
        config.scheduleEnabled, 
        config.scheduleFrequency, 
        config.scheduleDay, 
        config.scheduleTime,
        config.scheduleCron
    ]);

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

        const validation = validateCrawlConfig({ ...config, startUrls: urlsToScan });
        if (!validation.valid) {
            validation.errors.forEach((message) => addLog(message, 'error', { source: 'system' }));
            return;
        }
        validation.warnings.forEach((message) => addLog(message, 'warn', { source: 'system' }));

        try {
            CrawlerConfigValidator.validate({ ...config, startUrls: urlsToScan });
        } catch (err: any) {
            addLog(`Config error: ${err.message}`, 'error', { source: 'system' });
            return;
        }

        const targetProjectId = scopedProjectId || undefined;

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
                maxConcurrent: config.concurrent || parseInt(String(config.threads), 10) || 5,
                maxDepth: parseInt(config.maxDepth) || 10,
                limit: parseInt(config.limit) || 0,
                userAgent: config.userAgent,
                crawlResources: config.crawlResources,
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
                
                // S4 fix: Shared post-crawl scoring pipeline
                const completedPages = pagesRef.current;
                if (completedPages.length > 0) {
                    addLog('Calculating Strategic PageRank & Health Scores...', 'info', { source: 'analysis' });
                    const { pages: updated, siteType: detectedSiteType } = runPostCrawlScoring(completedPages);
                    setSiteType(detectedSiteType);
                    
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
                                syncFromCrawl(activeProject!.id, pagesRef.current, activeProject!.name).then(async (sync) => {
                                    if (sync.keywordsImported > 0 || sync.competitorsFound > 0) {
                                        addLog(`Auto-discovered: ${sync.keywordsImported} keywords, ${sync.competitorsFound} competitors.`, 'info', { source: 'analysis' });
                                    }

                                    // ─── Auto-Assignment (P5) ───
                                    const autoTasks = await executeRules(
                                        activeProject.id,
                                        currentSessionIdRef.current || sessionId || '',
                                        result.issues
                                    );
                                    if (autoTasks.length > 0) {
                                        addLog(`Auto-created ${autoTasks.length} tasks from crawler issues.`, 'info', { source: 'system' });
                                        const updatedTasks = await getTasks(activeProject.id);
                                        setTasks(updatedTasks);
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
            wsIntentionalCloseRef.current = false;
            wsReconnectAttemptsRef.current = 0;
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

                // Only warn if we have a connection record but absolutely no way to use it (no token and no email to refresh)
                if (googleConnection && !googleAccessToken && !googleEmail) {
                    addLog('Google connection is inactive (no valid session/email). Please reconnect in the Integrations tab.', 'warn', { source: 'system' });
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
                wsReconnectAttemptsRef.current = 0;
                setCrawlRuntime(prev => ({ ...prev, stage: 'crawling' }));
                ws.send(JSON.stringify({ 
                    type: 'START_CRAWL', 
                    sessionId: isResume ? currentSessionId : sessionId,
                    config: {
                        startUrls: urlsToScan,
                        mode: crawlingMode,
                        limit: parseInt(config.limit) || 0,
                        maxDepth: parseInt(config.maxDepth) || null,
                        threads: config.concurrent || parseInt(String(config.threads), 10) || 5,
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
                        generateEmbeddings: (config as any).generateEmbeddings,
                        crawlResources: config.crawlResources,

                        // New fields
                        requestTimeout: (config.requestTimeout || 30) * 1000,
                        retryOnFail: config.retryOnFail ?? true,
                        retryCount: config.retryCount ?? 2,
                        rateLimit: config.rateLimit,
                        rateLimitDelay: config.rateLimitDelay || 500,
                        followRedirects: config.followRedirects ?? true,
                        maxRedirectHops: config.maxRedirectHops || 5,
                        allowedDomains: config.allowedDomains,
                        authType: config.authType,
                        authBearerToken: config.authBearerToken,
                        cookieConsent: config.cookieConsent,
                        aiTasks: config.aiTasks,
                        customExtractionRules: config.customExtractionRules,
                        customFieldExtractors: config.customFieldExtractors,

                        // Unified Google & Other Integrations
                        google: {
                            email: googleEmail,
                            accountLabel: googleEmail,
                            accessToken: googleAccessToken || (config as any).gscApiKey,
                            refreshToken: googleRefreshToken || (config as any).gscRefreshToken,
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

            ws.onmessage = (e) => {
                let data: any;
                try {
                    data = JSON.parse(e.data);
                } catch (err) {
                    console.error('WS Parse Error:', err);
                    return;
                }

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
                            lastEventType: 'CRAWL_PROGRESS'
                        });
                    }
                }
                else if (data.type === 'ROBOTS_TXT') {
                    setRobotsTxt({
                        raw: data.payload.raw,
                        sitemaps: data.payload.sitemaps,
                        crawlDelay: data.payload.crawlDelay,
                        hasLlmsTxt: data.payload.hasLlmsTxt,
                        aiBotRules: data.payload.aiBotRules,
                        aiBotAccess: data.payload.aiBotAccess,
                        llmsTxt: data.payload.llmsTxt
                    });
                    setSitemapData((prev) => prev ?? buildSitemapState(0, data.payload.sitemaps, false));
                }
                else if (data.type === 'LOG') {
                    addLog(data.payload?.message || data.msg, data.payload?.type || data.logType || 'info', { source: 'crawler' });
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
                        flushPendingPageUpdates();
                        addLog(`Trial limit reached (${trialPagesLimit} pages). Sign in for unlimited scanning.`, 'info', { source: 'system' });
                        setShowTrialLimitAlert(true);
                        setIsCrawling(false);
                        closeCrawlerSocket();
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
                    closeCrawlerSocket();
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
                }
                else if (data.type === 'ERROR') {
                    const errMsg = data.payload.message || 'Error encountered';
                    if (errMsg === 'Crawler stopped' || errMsg.includes('aborted')) return;

                    addLog(errMsg, 'error', { source: 'crawler', detail: errMsg });
                    flushPendingPageUpdates();
                    setIsCrawling(false);
                    setCrawlStartTime(null);
                    setCrawlRuntime(prev => ({ ...prev, stage: 'error', activeWorkers: 0, workerUtilization: 0 }));
                    closeCrawlerSocket();
                }
                else if (data.type === 'CRAWL_FINISHED') {
                    flushPendingPageUpdates();
                    const successCount = Number(data.payload?.successfulPages ?? data.payload?.payloadPages ?? pagesRef.current.length);
                    const foundCount = Number(data.payload?.totalPages ?? successCount);
                    addLog(`Scan complete. Found ${foundCount} URLs; captured ${successCount}.`, 'success', { source: 'crawler' });

                    setIsCrawling(false);
                    setCrawlStartTime(null);
                    setCrawlRuntime(prev => ({ ...prev, stage: 'completed', queued: 0, activeWorkers: 0, workerUtilization: 0 }));
                    closeCrawlerSocket();

                    const runPostCrawlFlow = async () => {
                        if (currentSessionIdRef.current) {
                            // S4 fix: Shared post-crawl scoring pipeline
                            const completedPages = [...pagesRef.current];
                            addLog('Calculating Strategic PageRank & Health Scores...', 'info', { source: 'analysis' });
                            const { pages: updated, siteType: detectedSiteType } = runPostCrawlScoring(completedPages);
                            setSiteType(detectedSiteType);

                            await crawlDb.pages.bulkPut(updated);
                            
                            // Run Tier 4 checks
                            addLog('Running Tier 4 deep evaluation...', 'info', { source: 'analysis' });
                            const t4Results = runTier4Checks(updated);
                            setTier4Results(t4Results);
                            
                            addLog('Strategic analysis complete.', 'success', { source: 'analysis' });

            if (activeProject?.id && updated.length > 0) {
                                const crawlDuration = crawlStartTime ? Date.now() - crawlStartTime : 0;
                                const result = await persistCrawlResults({
                                    projectId: activeProject.id,
                                    sessionId: currentSessionIdRef.current || '',
                                    urlCrawled: updated[0]?.url || urlInput,
                                    pages: updated,
                                    crawlMode: crawlingMode,
                                    crawlDuration,
                                    crawlRate: Number(crawlRate) || 0,
                                    maxDepthSeen: Number(crawlRuntime.maxDepthSeen || 0),
                                    sitemapCoverage: sitemapData,
                                    robotsTxt: robotsTxt?.raw || ''
                                });

                                if (result) {
                                    addLog(`Dashboard synced — Health Score: ${result.score}/100`, 'success', { source: 'system' });
                                    if (updateProject) {
                                        updateProject(activeProject.id, {
                                            last_crawl_at: new Date().toISOString(),
                                            last_crawl_score: result.score,
                                            crawl_count: (activeProject.crawl_count || 0) + 1
                                        });
                                    }
                                    await syncFromCrawl(activeProject.id, updated, activeProject.name);
                                    await checkAndDispatchAlerts(result.score, updated);

                                    // --- GAP Step 1 & 6: Auto-Assignment & Reconciliation ---
                                    try {
                                        addLog('Reconciling tasks with latest issues...', 'info', { source: 'system' });
                                        const { resolved, reopened } = await reconcileTasksWithIssues(
                                            activeProject.id, 
                                            result.auditId // the run ID from persistCrawlResults
                                        );
                                        if (resolved > 0) addLog(`${resolved} tasks auto-resolved (issues fixed)`, 'success', { source: 'system' });
                                        if (reopened > 0) addLog(`${reopened} tasks reopened (issues returned)`, 'warn', { source: 'system' });

                                        addLog('Executing auto-assignment rules...', 'info', { source: 'system' });
                                        const issues = await getAuditIssues(activeProject.id, result.auditId);
                                        const createdTasks = await executeRules(activeProject.id, currentSessionIdRef.current || '', issues);
                                        if (createdTasks.length > 0) {
                                            addLog(`Auto-created ${createdTasks.length} tasks from detected issues`, 'success', { source: 'system' });
                                            
                                            // Notify for each task (if owner or current user available)
                                            const members = await getMembers(activeProject.id);
                                            const owner = members.find(m => m.role === 'owner') || members[0];
                                            const notifyUserId = owner?.user_id || user?.id;

                                            if (notifyUserId) {
                                                for (const task of createdTasks) {
                                                    await createNotification(activeProject.id, notifyUserId, {
                                                        type: 'task_assigned',
                                                        title: `New task: ${task.title}`,
                                                        body: `Auto-created from crawler issue (${task.priority} priority)`,
                                                        entityType: 'task',
                                                        entityId: task.id
                                                    });
                                                }
                                            }
                                        }
                                    } catch (assignErr) {
                                        console.error('[SeoCrawlerContext] Auto-assignment failed:', assignErr);
                                        addLog('Auto-assignment pipeline failed, but crawl was saved.', 'warn', { source: 'system' });
                                    }
                                }
                            }
                            saveCrawlSession('completed');
                        }
                    };
                    runPostCrawlFlow();
                }
            };

            ws.onclose = () => {
                if (wsRef.current === ws) {
                    wsRef.current = null;
                }
                if (!wsIntentionalCloseRef.current && isCrawlActiveRef.current) {
                    setCrawlRuntime(prev => ({ ...prev, stage: 'connecting' }));
                    addLog('Crawler connection dropped. Attempting to reconnect may require resume.', 'warn', { source: 'system' });
                }
            };
            ws.onerror = (event) => {
                console.error('Crawler websocket error:', event);
            };
        } catch (error: any) {
            console.error('Failed to connect to crawler websocket:', error);
            addLog(`Failed to start crawl: ${error.message || 'Unknown connection error'}`, 'error', { source: 'system' });
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
        return getIssuesForMode(auditFilter.modes, auditFilter.industry);
    }, [auditFilter.modes, auditFilter.industry]);




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

        const modeConfig = AUDIT_MODES[primaryMode];
        if (!modeConfig) return;

        const validColumns = new Set(ALL_COLUMNS.map((column) => column.key));
        const sourceColumns = modeConfig.isWqaMode
            ? getWqaDefaultVisibleColumns(
                getEffectiveIndustry(wqaState),
                getEffectiveLanguage(wqaState),
                wqaState.detectedCms
            )
            : modeConfig.defaultColumns;
        const nextColumns = sourceColumns.filter((column) => validColumns.has(column));
        if (nextColumns.length > 0) {
            setVisibleColumns(nextColumns);
        }
    }, [auditFilter.modes, wqaState]);

    useEffect(() => {
        if (!activeMacro || activeMacro === 'all') return;
        const exists = filteredIssuePages.some((group) => group.issues.some((issue: any) => issue.id === activeMacro));
        if (!exists) {
            setActiveMacro(null);
        }
    }, [activeMacro, filteredIssuePages]);

    // P1 fix: Single-pass duplicate detection instead of 4 separate array scans
    const { duplicateTitleSet, duplicateMetaDescSet, duplicateH1Set, duplicateHashSet } = useMemo(() => {
        const titleMap = new Map<string, number>();
        const metaDescMap = new Map<string, number>();
        const h1Map = new Map<string, number>();
        const hashMap = new Map<string, number>();

        analysisPages.forEach(p => {
            if (p.title) {
                const t = normalizeComparableText(p.title);
                titleMap.set(t, (titleMap.get(t) || 0) + 1);
            }
            if (p.metaDesc) {
                const d = normalizeComparableText(p.metaDesc);
                metaDescMap.set(d, (metaDescMap.get(d) || 0) + 1);
            }
            const h1 = normalizeComparableText(p.h1_1);
            if (h1) {
                h1Map.set(h1, (h1Map.get(h1) || 0) + 1);
            }
            if (p.hash) {
                hashMap.set(p.hash, (hashMap.get(p.hash) || 0) + 1);
            }
        });

        const toSet = (map: Map<string, number>) =>
            new Set([...map.entries()].filter(([, count]) => count > 1).map(([key]) => key));

        return {
            duplicateTitleSet: toSet(titleMap),
            duplicateMetaDescSet: toSet(metaDescMap),
            duplicateH1Set: toSet(h1Map),
            duplicateHashSet: toSet(hashMap)
        };
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
            } else if (e.data.type === 'FILTER_RESULT') {
                setWorkerFilteredPages(e.data.payload || []);
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

    // P3 fix: Single-pass categoryCounts using page bucketing instead of N×M filters.
    // Each page is tested once per category/sub combo and bucketed accordingly.
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

        // Initialize all counters
        for (const category of allCats) {
            counts[category.id] = {};
            for (const sub of category.sub) {
                counts[category.id][sub] = 0;
            }
        }

        // Single pass over pages — bucket each page into matching categories
        for (const page of pagesWithDerivedSignals) {
            for (const category of allCats) {
                if (category.id === 'ai-clusters') {
                    if (page?.topicCluster) {
                        counts[category.id]['All']++;
                        if (counts[category.id][page.topicCluster] !== undefined) {
                            counts[category.id][page.topicCluster]++;
                        }
                    }
                    continue;
                }

                for (const sub of category.sub) {
                    if (matchesCategoryFilter(category.id, sub, page, { rootHostname })) {
                        counts[category.id][sub]++;
                    }
                }
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

    const locallyFilteredPages = useMemo(() => {
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

        if (!isWqaMode && hasEffectiveSelection) {
            list = list.filter((page) =>
                sanitizedSelections.some((selection) =>
                    matchesCategoryFilter(selection.group, selection.sub, page, { rootHostname })
                )
            );
        }

        if (isWqaMode) {
            list = filterWqaPages(list, wqaFilter);
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
    }, [pagesWithDerivedSignals, activeCategories, deferredSearchQuery, activeMacro, sortConfig, MACRO_FILTERS, ignoredUrls, rootHostname, filteredIssuePages, isWqaMode, wqaFilter]);

    const filteredWqaPagesExport = useMemo(() => {
        if (!isWqaMode) return [];
        return filterWqaPages(pagesWithDerivedSignals, wqaFilter);
    }, [pagesWithDerivedSignals, wqaFilter, isWqaMode]);

    const wqaFacets = useMemo<WqaFacets>(() => {
        if (!isWqaMode || pagesWithDerivedSignals.length === 0) return EMPTY_FACETS;
        return computeWqaFacets(pagesWithDerivedSignals);
    }, [isWqaMode, pagesWithDerivedSignals]);

    const wqaForecast = useMemo(() => {
        if (!isWqaMode || pagesWithDerivedSignals.length === 0) return null;
        return ForecastService.computeForecast(pagesWithDerivedSignals, wqaState.industryOverride || wqaState.detectedIndustry);
    }, [pagesWithDerivedSignals, isWqaMode, wqaState.industryOverride, wqaState.detectedIndustry]);

    const hasOnlyDefaultCategory = activeCategories.length === 0 || activeCategories.every((entry) => entry.group === 'internal' && entry.sub === 'All');
    const canUseWorkerFiltering = pagesWithDerivedSignals.length > 5000
        && hasOnlyDefaultCategory
        && activeMacro === 'all'
        && ignoredUrls.size === 0
        && !isWqaMode;

    useEffect(() => {
        if (!statsWorkerRef.current || !canUseWorkerFiltering) {
            setWorkerFilteredPages(null);
            return;
        }

        statsWorkerRef.current.postMessage({
            type: 'FILTER_PAGES',
            payload: {
                pages: pagesWithDerivedSignals,
                searchQuery: deferredSearchQuery,
                sortConfig
            }
        });
    }, [canUseWorkerFiltering, pagesWithDerivedSignals, deferredSearchQuery, sortConfig]);

    const filteredPages = useMemo(() => {
        if (canUseWorkerFiltering && workerFilteredPages) {
            return workerFilteredPages;
        }
        return locallyFilteredPages;
    }, [canUseWorkerFiltering, workerFilteredPages, locallyFilteredPages]);

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

    // P2 fix: graphData computation offloaded to Web Worker (see workers/graphData.worker.ts)
    const graphData = useGraphDataWorker(analysisPages);

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
        const existingSessionProjectId = crawlHistory.find((session) => session.id === sessionId)?.projectId;

        const resolvedEntryUrls = crawlingMode === 'list'
            ? listUrls.split('\n').map(u => u.trim()).filter(Boolean)
            : [urlInput.trim()].filter(Boolean);
        const resolvedStatus = statusOverride || (isCrawling ? 'running' : (crawlRuntime.stage === 'completed' ? 'completed' : crawlRuntime.stage === 'error' ? 'failed' : 'paused'));

        const session: CrawlSession = {
            id: sessionId,
            projectId: scopedProjectId || existingSessionProjectId,
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
    }, [crawlingMode, listUrls, urlInput, crawlStartTime, stats.totalIssues, healthScore.score, healthScore.grade, config, isCrawling, crawlRuntime, ignoredUrls, urlTags, columnWidths, robotsTxt, sitemapData, auditFilter.industry, auditFilter.modes, crawlHistory, scopedProjectId]);

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

    // Collaboration & Tasks (P5)
    const [tasks, setTasks] = useState<CrawlTask[]>([]);
    const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
    const [showCollabOverlay, setShowCollabOverlay] = useState(false);
    const [collabOverlayTarget, setCollabOverlayTarget] = useState<{ type: CommentTargetType, id: string, title: string } | null>(null);
    const [activeCommentTarget, setActiveCommentTarget] = useState<{ type: CommentTargetType, id: string } | null>(null);

    // Sync Tasks & Team Members (P5)
    useEffect(() => {
        if (!activeProject?.id) return;
        let cancelled = false;

        const loadCollabData = async () => {
            try {
                const [taskList, memberList] = await Promise.all([
                    getTasks(activeProject.id),
                    getMembers(activeProject.id)
                ]);
                if (cancelled) return;
                setTasks(taskList);
                setTeamMembers(memberList);
            } catch (err) {
                console.error('[SeoCrawlerContext] Failed to load collaboration data:', err);
            }
        };

        loadCollabData();
        return () => { cancelled = true; };
    }, [activeProject?.id]);

    // ─── Trigger AI analysis after crawl completes ─────
    const statsRef = useRef(stats);
    useEffect(() => { statsRef.current = stats; }, [stats]);

    const healthScoreRef = useRef(healthScore);
    useEffect(() => { healthScoreRef.current = healthScore; }, [healthScore]);

    const auditInsightsRef = useRef(auditInsights);
    useEffect(() => { auditInsightsRef.current = auditInsights; }, [auditInsights]);


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
                    grammarErrors: Number(p.grammarErrors || 0),
                    previousData: {
                        gscClicks: Number((p as any).prevGscClicks || 0),
                        gscImpressions: Number((p as any).prevGscImpressions || 0),
                        ga4Sessions: Number((p as any).prevGa4Sessions || 0)
                    },
                    issues: getPageIssues(p).map(i => ({ id: i.id, label: i.label })),
                    gscKeywords: p.extractedKeywords?.map((k: any) => k.phrase) || [],
                })),
                (done, total, url) => {
                    setAiProgress({ done, total, url });
                    if (analysisRuntimeRef.current.isAnalyzing && analysisRuntimeRef.current.stage === 'ai-analysis') {
                        const subProgress = 40 + (done / total) * 50; // Map AI progress to 40-90%
                        setAnalysisRuntime(prev => ({
                            ...prev,
                            progress: subProgress,
                            label: `AI: ${done}/${total}`
                        }));
                    }
                }
            );

            // 2. Originality Analysis (t3-content-originality)
            await engine.computeOriginalityScores(results);

            // 3. Merge AI results into page data
            const resultMap = new Map<string, PageAIResult>();
            for (const r of results) {
                resultMap.set(r.url, r);
            }
            setAiResults(resultMap);

            // 4. Update page objects with AI data for the grid columns
            const updatedPages = targetPages.map(p => {
                const ai = resultMap.get(p.url);
                if (!ai) return p;

                const decayRisk = engine.detectContentDecay(p, {
                    gscClicks: Number((p as any).prevGscClicks || 0),
                    gscImpressions: Number((p as any).prevGscImpressions || 0),
                    ga4Sessions: Number((p as any).prevGa4Sessions || 0)
                });
                const kwOpportunity = engine.calculateKeywordOpportunity(p);

                return {
                    ...p,
                    topicCluster: ai.topicCluster || p.topicCluster,
                    primaryTopic: ai.primaryTopic || p.primaryTopic,
                    searchIntent: ai.searchIntent || p.searchIntent,
                    funnelStage: ai.searchIntent === 'transactional' ? 'Transactional'
                        : ai.searchIntent === 'commercial' ? 'Commercial'
                        : ai.searchIntent === 'navigational' ? 'Navigational'
                        : 'Informational',
                    contentQualityScore: ai.contentQualityScore ?? p.contentQualityScore,
                    eeatScore: ai.eeatScore ?? p.eeatScore,
                    sentiment: ai.sentiment || p.sentiment,
                    aiLikelihood: ai.aiLikelihood || p.aiLikelihood,
                    originalityScore: ai.originalityScore ?? p.originalityScore,
                    contentDecay: decayRisk.decay,
                    contentDecayVelocity: decayRisk.velocity,
                    grammarErrors: ai.grammarSource === 'ai' ? (ai.grammarAIErrors ?? p.grammarErrors) : p.grammarErrors,
                    grammarSource: ai.grammarSource || p.grammarSource || 'heuristic',
                    grammarAIDetails: ai.grammarAIDetails || p.grammarAIDetails,
                    opportunityScore: Math.max(p.opportunityScore || 0, kwOpportunity),
                    strategicPriority: ai.contentQualityScore != null
                        ? (ai.contentQualityScore < 40 ? 'High' : ai.contentQualityScore < 70 ? 'Medium' : 'Low')
                        : p.strategicPriority,
                    recommendedAction: ai.fixSuggestions?.[0]?.fix || p.recommendedAction,
                    recommendedActionReason: ai.contentWeaknesses?.[0] || p.recommendedActionReason,
                    summary: ai.summary || p.summary,
                    suggestedMeta: ai.suggestedMeta || p.suggestedMeta,
                    entities: ai.entities || p.entities,
                    gaps: ai.gaps || p.gaps,
                };
            });

            // Persist updated pages to Dexie
            if (currentSessionIdRef.current) {
                await crawlDb.pages.bulkPut(updatedPages);
                // The useLiveQuery will automatically pick this up and update 'pages'
            }

            // 4. Generate crawl narrative
            const narrative = await engine.generateCrawlNarrative({
                domain: targetPages[0]?.url ? new URL(targetPages[0].url).hostname : '',
                total: statsRef.current?.total || 0,
                healthy: (statsRef.current?.total || 0) - (statsRef.current?.broken || 0) - (statsRef.current?.redirects || 0),
                errors: statsRef.current?.broken || 0,
                healthScore: healthScoreRef.current.score,
                grade: healthScoreRef.current.grade,
                topIssues: auditInsightsRef.current.slice(0, 5).map((i: any) => i.label),
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
    }, [pages, addLog]);
    const crawlRate = useMemo(() => {
        if (crawlRuntime.rate > 0) return crawlRuntime.rate.toFixed(1);
        if (!crawlStartTime || pages.length === 0) return 0;
        const elapsed = (Date.now() - crawlStartTime) / 1000;
        return elapsed > 0 ? (pages.length / elapsed).toFixed(1) : '0';
    }, [pages.length, crawlStartTime, crawlRuntime.rate]);

    const [elapsedTime, setElapsedTime] = useState('0s');

    // D1 fix: formatBytes is now imported from constants.tsx (single source of truth)

    // R4 fix: Export logic extracted to CrawlerDataUtils.ts
    const handleExport = () => exportPagesAsCSV(pages);

    const handleExportRawDB = async () => {
        if (!currentSessionIdRef.current) return;
        const result = await exportRawSessionData(currentSessionIdRef.current);
        addLog(result.message, result.success ? 'success' : 'error', { source: 'system' });
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

    const checkAndDispatchAlerts = useCallback(async (currentScore: number, freshPages: any[]) => {
        if (!activeProject || !config.changeDetection) return;

        const alerts: AlertPayload[] = [];
        const previousSession = crawlHistory.find(s => s.projectId === activeProject.id && s.id !== currentSessionIdRef.current);
        const previousScore = previousSession?.healthScore || 0;

        // 1. Score drop alert
        if (config.alertOnScoreDrop && previousScore > 0 && currentScore < previousScore - 5) {
            alerts.push({
                type: 'score_drop',
                title: `Health score dropped: ${previousScore} → ${currentScore}`,
                body: `Site health declined by ${previousScore - currentScore} points. Review the latest crawl for new issues.`,
                severity: currentScore < 50 ? 'critical' : 'warning',
                projectId: activeProject.id,
                projectName: activeProject.name,
                projectUrl: activeProject.url
            });
        }

        // 2. New 404s alert
        if (config.alertOnNew404s) {
            const new404s = freshPages.filter(p => p.statusCode === 404);
            // In a real implementation, we'd compare against previous session's pages
            // For now, if we found any 404s in this crawl, we alert if it's a significant amount
            if (new404s.length > 0) {
                alerts.push({
                    type: 'new_404s',
                    title: `${new404s.length} broken pages found`,
                    body: `Detected ${new404s.length} pages returning 404 status.`,
                    severity: new404s.length > 10 ? 'critical' : 'warning',
                    projectId: activeProject.id,
                    projectName: activeProject.name,
                    projectUrl: activeProject.url,
                    data: { count: new404s.length }
                });
            }
        }

        // 3. New issues alert
        if (config.alertOnNewIssues) {
            const totalIssues = freshPages.reduce((sum, p) => sum + (getPageIssues(p).length), 0);
            if (totalIssues > 50) {
                alerts.push({
                    type: 'new_issues',
                    title: `High issue volume detected`,
                    body: `The latest crawl identified ${totalIssues} potential SEO issues across the site.`,
                    severity: 'warning',
                    projectId: activeProject.id,
                    projectName: activeProject.name,
                    projectUrl: activeProject.url
                });
            }
        }

        // Dispatch all alerts
        for (const alert of alerts) {
            await dispatchAlert(alert, config.alertChannels, {
                webhookUrl: config.webhookUrl,
                slackWebhookUrl: config.slackWebhookUrl,
                notificationEmail: activeProject.notification_email
            });
        }
    }, [activeProject, config, crawlHistory, urlInput]);

    const triggerGoogleDriveBackup = useCallback(async () => {
        const googleConnection = integrationConnections.google;
        const googleEmail = googleConnection?.accountLabel || null;
        if (!googleEmail) {
            // Only add log if manually triggered
            addLog('Connect Google account in Integrations to enable Drive backups.', 'warn');
            return;
        }

        try {
            addLog('Preparing Google Drive backup...', 'info');
            const accessToken = await refreshWithLock(googleEmail, refreshGoogleToken);
            if (!accessToken) {
                addLog('Failed to authorize Google Drive access. Please reconnect your account.', 'error');
                return;
            }

            const activeProject = projectContext?.activeProject;
            const projectName = activeProject?.name || 'Untitled Project';
            const sessionId = currentSessionIdRef.current || 'unknown';
            
            // Get all pages for this session from DB
            const sessionPages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();
            const sessionData = await getSession(sessionId);

            const content = JSON.stringify({
                sessionId,
                projectName,
                timestamp: Date.now(),
                url: urlInput,
                config,
                stats,
                healthScore,
                pages: sessionPages,
                metadata: sessionData?.metadata || {}
            }, null, 2);

            await exportToGoogleDrive(accessToken, {
                sessionId,
                projectName: projectName,
                content
            });

            addLog(`Snapshot synced to Google Drive (Headlight Backups).`, 'success', { source: 'session' });
        } catch (err: any) {
            console.error('[Google Drive Backup Error]', err);
            addLog(`Backup failed: ${err.message}`, 'error');
        }
    }, [integrationConnections.google, projectContext?.activeProject, urlInput, stats, healthScore, config]);

    // ─── Session Management Hooks ───
    const saveCrawlSession = useCallback(async (status: 'completed' | 'paused' | 'failed' = 'completed') => {
        if (!currentSessionIdRef.current) return;
        try {
            // Always include pages when explicitly saving — this is what the History tab reads
            await persistSessionCheckpoint(status, { includePages: true });
            await loadCrawlHistory();
            addLog(`Session saved locally (${pagesRef.current.length} pages).`, 'success', { source: 'session' });

            // If manual save triggered and Google Drive is the backup destination, sync it
            if (config.autoBackupDestination === 'google-drive') {
                triggerGoogleDriveBackup();
            }
        } catch (err) {
            console.error('Failed to save session:', err);
        }
    }, [loadCrawlHistory, persistSessionCheckpoint]);

    // L3 fix: Keep keyboard shortcut refs in sync with latest function instances
    handleExportRef.current = handleExport;
    handleStartPauseRef.current = handleStartPause;
    saveCrawlSessionRef.current = saveCrawlSession;

    const loadSession = useCallback(async (sessionId: string) => {
        setIsLoadingHistory(true);
        try {
            const savedPages = await getPages(sessionId);
            const sess = await getSession(sessionId);
            if (sess) {
                if (scopedProjectId && !sessionMatchesProjectScope(sess)) {
                    addLog('Skipped loading a session from a different project scope.', 'warn', { source: 'history' });
                    return;
                }

                const effectiveSession = !sess.projectId && scopedProjectId
                    ? { ...sess, projectId: scopedProjectId }
                    : sess;

                if (effectiveSession !== sess) {
                    await saveSession(effectiveSession);
                    loadCrawlHistory().catch(() => {});
                }

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

                setCrawlingMode(effectiveSession.crawlingMode || effectiveSession.config?.crawlingMode || 'spider');
                const entryUrls = effectiveSession.entryUrls || [];
                if ((effectiveSession.crawlingMode || effectiveSession.config?.crawlingMode) === 'list') {
                    setListUrls(entryUrls.join('\n'));
                } else {
                    setUrlInput(entryUrls[0] || effectiveSession.url || '');
                }
                if ((effectiveSession.crawlingMode || effectiveSession.config?.crawlingMode) !== 'list') {
                    setListUrls('');
                }
                sessionEntrySignatureRef.current = buildSessionSignature(
                    effectiveSession.crawlingMode || effectiveSession.config?.crawlingMode || 'spider',
                    entryUrls
                );
                setConfig(effectiveSession.config || config);
                setAuditFilter({
                    modes: Array.isArray(effectiveSession.auditModes) && effectiveSession.auditModes.length > 0
                        ? (effectiveSession.auditModes as AuditMode[])
                        : ['full'],
                    industry: (effectiveSession.industryFilter as IndustryFilter) || 'all'
                });
                setIgnoredUrls(new Set(effectiveSession.ignoredUrls || []));
                setUrlTags(effectiveSession.urlTags || {});
                setColumnWidths(effectiveSession.columnWidths || {});
                setRobotsTxt(effectiveSession.robotsTxt || null);
                setSitemapData(
                    buildSitemapState(
                        effectiveSession.sitemapData?.totalUrls ?? normalizedSavedPages.filter((page: any) => page.inSitemap).length,
                        effectiveSession.sitemapData?.sources ?? effectiveSession.robotsTxt?.sitemaps,
                        !!effectiveSession.sitemapData
                    )
                );
                setCrawlStartTime(effectiveSession.startedAt || null);
                setCrawlRuntime(effectiveSession.runtime || {
                    stage: effectiveSession.status === 'completed' ? 'completed' : effectiveSession.status === 'failed' ? 'error' : 'paused',
                    queued: 0,
                    activeWorkers: 0,
                    discovered: normalizedSavedPages.length,
                    crawled: normalizedSavedPages.length,
                    maxDepthSeen: Math.max(0, ...normalizedSavedPages.map((page: any) => page.crawlDepth || 0)),
                    concurrency: parseInt(String(effectiveSession.config?.threads), 10) || 5,
                    mode: effectiveSession.crawlingMode || effectiveSession.config?.crawlingMode || 'spider',
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
    }, [buildSessionSignature, config, setSelectedPage, setSelectedRows, setCurrentSessionId, setIgnoredUrls, setUrlTags, setColumnWidths, scopedProjectId, addLog, sessionMatchesProjectScope, loadCrawlHistory]);

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
        const preferredSessionId = sessionIdFromUrl || window.localStorage.getItem(scopedLastSessionStorageKey);
        const draftRaw = window.localStorage.getItem(scopedDraftStorageKey);

        // Restore draft form state only once per project scope.
        if (draftRaw && restoredDraftScopeRef.current !== scopedDraftStorageKey) {
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
                restoredDraftScopeRef.current = scopedDraftStorageKey;
            } catch (error) {
                console.error('Failed to restore crawler draft state:', error);
                restoredDraftScopeRef.current = scopedDraftStorageKey;
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
        if (projectScopedHistory.length === 0 && preferredSessionId) {
            // If there's a preferredSessionId but history is empty, we might just be
            // waiting on the async DB read. Don't mark as attempted yet.
            return;
        }

        const restoreTarget = projectScopedHistory.find((s) => s.id === preferredSessionId)?.id
            ?? (projectScopedHistory.length > 0 ? projectScopedHistory[0].id : null);

        autoRestoreAttemptedRef.current = true;

        if (restoreTarget) {
            loadSession(restoreTarget)
                .catch((error) => console.error('Failed to auto-restore crawler session:', error))
                .finally(() => setHasHydrated(true));
        } else {
            setHasHydrated(true);
        }
    }, [projectScopedHistory, isLoadingHistory, currentSessionId, loadSession, urlInput, listUrls, scopedLastSessionStorageKey, scopedDraftStorageKey]);

    useEffect(() => {
        if (!scopedProjectId) return;
        if (isCrawling) return;

        const activeSession = currentSessionId
            ? crawlHistory.find((session) => session.id === currentSessionId)
            : null;

        if (activeSession && sessionMatchesProjectScope(activeSession)) {
            return;
        }

        if (!currentSessionId && !hasHydrated) {
            return;
        }

        setSelectedPage(null);
        setSelectedRows(new Set());
        setCurrentSessionId(null);
        currentSessionIdRef.current = null;
        pagesRef.current = [];
        setDiffResult(null);
        setCompareSessionId(null);
        setLogs([]);
        setRobotsTxt(null);
        setSitemapData(null);
        setSiteType(null);
        setWqaState(DEFAULT_WQA_STATE);
        setCrawlStartTime(null);
        setCrawlRuntime((prev) => ({
            ...prev,
            stage: 'idle',
            queued: 0,
            activeWorkers: 0,
            discovered: 0,
            crawled: 0,
            maxDepthSeen: 0,
            rate: 0,
            workerUtilization: 0
        }));
        autoRestoreAttemptedRef.current = false;
        restoredDraftScopeRef.current = null;
        setHasHydrated(false);
    }, [scopedProjectId, currentSessionId, crawlHistory, isCrawling, hasHydrated, setSelectedRows, sessionMatchesProjectScope]);

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
            const [oldSession, newSession] = await Promise.all([
                getSession(oldSessionId),
                getSession(newSessionId)
            ]);
            const diff = diffSessions(oldPages, newPages, oldSession, newSession);
            setDiffResult(diff);
            setCompareSessionId(oldSessionId);
            setShowComparisonView(true);
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
        const bingSecrets = getCrawlerIntegrationSecret(integrationSecretScope, 'bingWebmaster' as any);
        const ahrefsToken = ahrefsSecrets?.api_key || null;
        const semrushApiKey = semrushSecrets?.api_key || null;
        const bingAccessToken = bingSecrets?.accessToken || config.bingAccessToken || null;

        // Auto-detect targets / manual overrides
        let gscSiteUrl = config.gscSiteUrl || googleConnection?.selection?.siteUrl || urlInput;
        let ga4PropertyId = config.ga4PropertyId 
            || googleConnection?.sync?.propertyId 
            || googleConnection?.selection?.propertyId;
        const bingSiteUrl = config.bingSiteUrl; // Manual override if set

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
                bingAccessToken: bingAccessToken || undefined,
                bingSiteUrl: bingSiteUrl || undefined,
                ahrefsToken,
                semrushApiKey,
                keywordCsvData: integrationConnections.keywordUpload?.uploadData,
                backlinkCsvData: integrationConnections.backlinkUpload?.uploadData,
                psiApiKey: config.psiApiKey,
                indexNowApiKey: config.indexNowApiKey,
                indexNowAutoSubmit: config.indexNowAutoSubmit,
                externalEnrichment: config.externalEnrichment,
                industry: config.industry
            }, (msg) => {
                addLog(msg, 'info', { source: 'enrichment' });
                // Update progress if in complete analysis mode
                if (analysisRuntimeRef.current.isAnalyzing && analysisRuntimeRef.current.stage === 'strategic-audit') {
                    // map enrichment messages to 0-40% range
                    setAnalysisRuntime(prev => ({
                        ...prev,
                        progress: Math.min(38, prev.progress + 2), 
                        label: msg.length > 20 ? msg.slice(0, 17) + '...' : msg
                    }));
                }
            });

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

    const exportSubset = useCallback((category: any) => {
        const filtered = pagesWithDerivedSignals.filter(page => matchesCategoryFilter(category.group, category.sub, page, { rootHostname }));
        const headers = visibleColumns.map(key => ALL_COLUMNS.find(c => c.key === key)?.label || key).join(',');
        const rows = filtered.map(page => 
            visibleColumns.map(key => {
                const val = page[key] ?? '';
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')
        );
        const blob = new Blob([headers + '\n', ...rows.map(r => r + '\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `headlight_${category.sub.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [pagesWithDerivedSignals, visibleColumns, rootHostname]);

    const createTaskForCategory = useCallback(async (category: any) => {
        if (!activeProject?.id) {
            addLog('No active project found to create tasks.', 'warn');
            return;
        }
        const filtered = pagesWithDerivedSignals.filter(page => matchesCategoryFilter(category.group, category.sub, page, { rootHostname }));
        if (filtered.length === 0) return;

        try {
            await createTaskService(activeProject.id, {
                title: `Fix: ${category.sub} (${filtered.length} pages)`,
                description: `Auto-generated from category filter.\nAffected URLs:\n${filtered.slice(0, 20).map(p => p.url).join('\n')}${filtered.length > 20 ? `\n...and ${filtered.length - 20} more` : ''}`,
                priority: filtered.length > 50 ? 'high' : 'medium',
                category: category.group,
                source: 'crawler',
                affectedUrls: filtered.map(p => p.url),
                createdBy: user?.id || 'user'
            } as any);
            addLog(`Created task for "${category.sub}" (${filtered.length} pages)`, 'success', { source: 'collaboration' });
        } catch (err: any) {
            addLog(`Failed to create task: ${err.message}`, 'error');
        }
    }, [pagesWithDerivedSignals, activeProject, user, addLog, rootHostname]);

    const bulkAIAnalyzeCategory = useCallback(async (category: any) => {
        const filtered = pagesWithDerivedSignals.filter(p => p.isHtmlPage && p.statusCode === 200 && matchesCategoryFilter(category.group, category.sub, p, { rootHostname }));
        if (filtered.length === 0) {
            addLog('No suitable pages found for AI analysis in this category.', 'info');
            return;
        }
        addLog(`Starting AI analysis for "${category.sub}" (${filtered.length} pages)...`, 'info', { source: 'analysis' });
        await runAIAnalysis(filtered);
    }, [pagesWithDerivedSignals, runAIAnalysis, addLog, rootHostname]);

    const runCompleteAnalysis = useCallback(async () => {
        if (analysisRuntime.isAnalyzing || pagesWithDerivedSignals.length === 0) return;

        setAnalysisRuntime({
            isAnalyzing: true,
            stage: 'strategic-audit',
            progress: 0,
            label: 'Starting Audit...'
        });

        try {
            // 1. Strategic Audit (GSC, GA4, Enrichment) - Run first for foundational data
            await runFullEnrichment();
            
            setAnalysisRuntime(prev => ({
                ...prev,
                stage: 'ai-analysis',
                progress: 40,
                label: 'Analyzing AI...'
            }));

            // 2. AI Analysis - Interprets data on top of enriched signals
            await runAIAnalysis(pagesWithDerivedSignals);

            setAnalysisRuntime(prev => ({
                ...prev,
                stage: 'incremental-audit',
                progress: 90,
                label: 'Finalizing Enrichment...'
            }));

            // 3. Automatic Incremental Enrichment (Auto-Continuation for Massive Sites)
            // Fetch fresh counts from DB to avoid stale closure state
            const htmlPages = await crawlDb.pages.where('crawlId').equals(currentSessionIdRef.current || '').toArray();
            const totalHtml = htmlPages.filter(p => p.isHtmlPage).length;
            const enrichedCount = htmlPages.filter(p => p.gscEnrichedAt || p.ga4EnrichedAt || p.backlinkEnrichedAt).length;
            
            // Only auto-continue if there's a significant gap (e.g., > 500 pages or large % missing)
            if (totalHtml > 500 && enrichedCount < totalHtml) {
                addLog(`Auto-continuing enrichment for remaining ${totalHtml - enrichedCount} pages...`, 'info', { source: 'analysis' });
                await runIncrementalEnrichment();
            }

            setAnalysisRuntime({
                isAnalyzing: false,
                stage: 'completed',
                progress: 100,
                label: 'Analysis Complete'
            });

            addLog('Complete Analysis finished successfully.', 'success', { source: 'analysis' });
            
            setTimeout(() => {
                setAnalysisRuntime(prev => ({
                    ...prev,
                    stage: 'idle',
                    progress: 0,
                    label: 'Run Analysis'
                }));
            }, 3000);

        } catch (err: any) {
            console.error('Complete Analysis failed:', err);
            setAnalysisRuntime({
                isAnalyzing: false,
                stage: 'error',
                progress: 0,
                label: 'Analysis Failed'
            });
            addLog(`Complete Analysis failed: ${err.message}`, 'error', { source: 'analysis' });
        }
    }, [pagesWithDerivedSignals, runAIAnalysis, runFullEnrichment, runIncrementalEnrichment, addLog, analysisRuntime.isAnalyzing]);

    // ─── Automatic Google Drive Backups ───
    useEffect(() => {
        if (crawlRuntime.stage === 'completed' && config.autoBackupDestination === 'google-drive' && pages.length > 0) {
            // We use a ref to prevent double-uploading if the stage flickers
            const lastBackupRefKey = `last_backup_${currentSessionId}`;
            const alreadyBackedUp = sessionStorage.getItem(lastBackupRefKey);
            
            if (!alreadyBackedUp) {
                sessionStorage.setItem(lastBackupRefKey, 'true');
                triggerGoogleDriveBackup();
            }
        }
    }, [crawlRuntime.stage, config.autoBackupDestination, currentSessionId, pages.length, triggerGoogleDriveBackup]);

    // L1 fix: Memoize value to prevent all consumers from re-rendering on every state change.
    // useState setters, useCallback functions, and refs are stable — only reactive values listed.

    // ─── Competitive Mode State ───
    const [showAddCompetitorInput, setShowAddCompetitorInput] = useState(false);
    const [crawlingCompetitorDomain, setCrawlingCompetitorDomain] = useState<string | null>(null);
    
    // ─── Competitive Mode View ───
    const [competitiveViewMode, setCompetitiveViewMode] = useState<CompetitiveViewMode>('matrix');

    const [competitiveState, setCompetitiveState] = useState<CompetitiveModeState>(DEFAULT_COMPETITIVE_STATE);

    const refreshAllCompetitors = useCallback(async () => {
        const domains = [...competitiveState.competitorProfiles.keys()];
        if (!activeProject?.id || domains.length === 0) return;
        
        for (const domain of domains) {
          setCrawlingCompetitorDomain(domain);
          try {
            const ai = getAIEngine();
            const profile = await runCompetitorMicroCrawl(domain, activeProject.id, {
              maxPages: 30,
              aiEnrich: true,
              aiComplete: async (opts: any) => {
                const res = await ai.router.complete(opts);
                return { text: res.text };
              }
            });
            setCompetitiveState(prev => {
              const next = new Map(prev.competitorProfiles);
              next.set(domain, profile);
              return { ...prev, competitorProfiles: next };
            });
          } catch (err) {
            console.error(`Failed to refresh ${domain}`, err);
          }
        }
        setCrawlingCompetitorDomain(null);
    }, [activeProject?.id, competitiveState.competitorProfiles]);

    // ─── Competitive Mode Actions ───

    const toggleCompetitiveMode = useCallback((active: boolean) => {
      setCompetitiveState(prev => ({ ...prev, isActive: active }));
    }, []);

    const setActiveCompetitors = useCallback((domains: string[]) => {
      setCompetitiveState(prev => ({ ...prev, activeCompetitorDomains: domains }));
    }, []);

    const buildOwnProfile = useCallback(() => {
      if (!pages || pages.length === 0) return;
      let ownDomain = '';

      // Find the first valid crawled URL instead of assuming pages[0] is valid.
      for (const page of pages) {
        const rawUrl = page?.finalUrl || page?.url;
        if (!rawUrl) continue;
        try {
          ownDomain = new URL(String(rawUrl)).hostname.replace(/^www\./, '').toLowerCase();
          if (ownDomain) break;
        } catch {
          // Skip malformed URLs and keep scanning.
        }
      }

      // Fallback to active project metadata if crawl rows are malformed/incomplete.
      if (!ownDomain) {
        try {
          if (activeProject?.domain) {
            ownDomain = String(activeProject.domain).replace(/^www\./, '').toLowerCase();
          } else if (activeProject?.url) {
            ownDomain = new URL(String(activeProject.url)).hostname.replace(/^www\./, '').toLowerCase();
          }
        } catch {
          // Leave empty and bail below.
        }
      }

      if (!ownDomain) return;

      const profile = CompetitorProfileBuilder.fromCrawlPages(ownDomain, pages);
      setCompetitiveState(prev => ({ ...prev, ownProfile: profile }));
    }, [pages, activeProject?.domain, activeProject?.url]);

    const refreshCompetitorScores = useCallback((targetDomain?: string) => {
      setCompetitiveState(prev => {
        if (!prev.ownProfile) return prev;

        const newSov = new Map(prev.sovResults);
        const newProfiles = new Map(prev.competitorProfiles);
        const domainsToRefresh = targetDomain ? [targetDomain] : [...prev.competitorProfiles.keys()];

        for (const domain of domainsToRefresh) {
          const compProfile = newProfiles.get(domain);
          if (!compProfile) continue;

          // Share of Voice
          const sovResult = computeShareOfVoice(pages || [], []);
          // NOTE: For SoV we'd need competitor's crawled pages, not just profile.
          // For now use profile-level keyword data. Full SoV requires storing comp pages.
          newSov.set(domain, {
            domain,
            shareOfVoice: sovResult.shareOfVoice,
            sharedKeywordCount: sovResult.sharedKeywordCount,
            winsCount: sovResult.winsCount,
          });

          // Threat scores
          const threats = computeThreatScores(prev.ownProfile!, compProfile);
          const updatedProfile: CompetitorProfile = {
            ...compProfile,
            shareOfVoice: sovResult.shareOfVoice,
            threatLevel: threats.threatLevel,
            contentThreatScore: threats.contentThreatScore,
            authorityThreatScore: threats.authorityThreatScore,
            innovationThreatScore: threats.innovationThreatScore,
            opportunityAgainstThem: threats.opportunityAgainstThem,
          };
          newProfiles.set(domain, updatedProfile);
        }

        return { ...prev, competitorProfiles: newProfiles, sovResults: newSov };
      });
    }, [pages]);

    const addCompetitorAndCrawl = useCallback(async (competitorUrl: string) => {
      let domain: string;
      try {
        const url = competitorUrl.startsWith('http') ? competitorUrl : `https://${competitorUrl}`;
        domain = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
      } catch {
        addLog(`Invalid competitor URL: ${competitorUrl}`, 'error');
        return;
      }

      setCompetitiveState(prev => ({ ...prev, isCrawlingCompetitor: domain }));
      addLog(`Starting micro-crawl for competitor: ${domain}...`, 'info', { source: 'competitive' } as any);

      try {
        const aiEngine = getAIEngine();
        const profile = await runCompetitorMicroCrawl(competitorUrl, activeProject?.id || 'anonymous', {
          maxPages: 30,
          aiEnrich: true,
          aiComplete: aiEngine ? (opts) => aiEngine.router.complete(opts) : undefined,
          onProgress: (progress) => {
            addLog(progress.message, 'info', { source: 'competitive' } as any);
          },
        });

        setCompetitiveState(prev => {
          const newProfiles = new Map(prev.competitorProfiles || new Map());
          newProfiles.set(domain, profile);
          const newActive = prev.activeCompetitorDomains.includes(domain)
            ? prev.activeCompetitorDomains
            : [...prev.activeCompetitorDomains, domain];
          return {
            ...prev,
            competitorProfiles: newProfiles,
            activeCompetitorDomains: newActive,
            isCrawlingCompetitor: null,
          };
        });

        addLog(`Competitor profile complete: ${domain}`, 'success', { source: 'competitive' } as any);

        // Auto-compute SoV and threat scores if own profile exists
        refreshCompetitorScores(domain);

        // Best-effort browser enrichment after the initial profile is available.
        const browserFetch = async (url: string) => {
          const resp = await fetch(url, { credentials: 'omit' });
          return resp.text();
        };
        const enrichedProfile: CompetitorProfile = JSON.parse(JSON.stringify(profile));
        const enrichmentCtx: EnrichmentContext = {
          domain,
          profile: enrichedProfile,
          fetchFn: browserFetch,
          onProgress: (_phase, _pct, msg) => {
            addLog(`[Enrichment] ${msg}`, 'info', { source: 'competitive' } as any);
          },
        };
        void (async () => {
          try {
            await runPhaseB(enrichmentCtx);
            await runPhaseC(enrichmentCtx);
            runPhaseF(enrichmentCtx);
            const merged = CompetitorProfileBuilder.mergeEnrichment(profile, enrichedProfile);

            setCompetitiveState(prev => {
              const newProfiles = new Map(prev.competitorProfiles || new Map());
              newProfiles.set(domain, merged);
              return { ...prev, competitorProfiles: newProfiles };
            });

            if (activeProject?.id) {
              await saveCompetitorProfile(activeProject.id, merged);
            }
          } catch (enrichmentErr: any) {
            console.warn('[SeoCrawlerContext] Browser enrichment failed:', enrichmentErr);
          }
        })();
      } catch (err: any) {
        addLog(`Competitor crawl failed for ${domain}: ${err.message}`, 'error', { source: 'competitive' } as any);
        setCompetitiveState(prev => ({ ...prev, isCrawlingCompetitor: null }));
      }
    }, [activeProject, addLog, refreshCompetitorScores]);

    const removeCompetitor = useCallback((domain: string) => {
      setCompetitiveState(prev => {
        const newProfiles = new Map(prev.competitorProfiles);
        newProfiles.delete(domain);
        const newSov = new Map(prev.sovResults);
        newSov.delete(domain);
        const newActive = prev.activeCompetitorDomains.filter(d => d !== domain);
        return {
          ...prev,
          competitorProfiles: newProfiles,
          sovResults: newSov,
          activeCompetitorDomains: newActive,
        };
      });
      // Also remove from IndexedDB
      crawlDb.competitorProfiles.where('_key').startsWith(`${activeProject?.id}::${domain}`).delete();
      // Remove from dashboard competitors list
      if (activeProject?.id) {
        listCompetitors(activeProject.id).then(comps => {
          const match = comps.find(c => {
            try { return new URL(c.url).hostname.replace(/^www\./, '') === domain; } catch { return false; }
          });
          if (match) removeCompetitorRecord(activeProject.id, match.id);
        });
        // Remove from Turso
        deleteCompetitorProfile(activeProject.id, domain).catch(console.warn);
      }
    }, [activeProject?.id]);

    const recrawlCompetitor = useCallback(async (domain: string) => {
      await addCompetitorAndCrawl(domain);
    }, [addCompetitorAndCrawl]);

    const recrawlAllCompetitors = useCallback(async () => {
      const domains = [...competitiveState.competitorProfiles.keys()];
      for (const domain of domains) {
        await addCompetitorAndCrawl(domain);
      }
    }, [competitiveState.competitorProfiles, addCompetitorAndCrawl]);

    const generateCompetitiveBrief = useCallback(async () => {
      const { ownProfile, competitorProfiles } = competitiveState;
      if (!ownProfile || competitorProfiles.size === 0) {
        addLog('Need your own crawl + at least 1 competitor to generate a brief.', 'warn');
        return;
      }

      setCompetitiveState(prev => ({ ...prev, isGeneratingBrief: true }));

      try {
        const aiEngine = getAIEngine();
        if (!aiEngine) {
          addLog('AI engine not available. Enable AI in settings.', 'error');
          return;
        }

        const compProfiles = [...competitorProfiles.values()];
        const brief = await CompetitorProfileBuilder.generateCompetitiveBrief(
          ownProfile,
          compProfiles,
          (opts) => aiEngine.router.complete(opts)
        );

        setCompetitiveState(prev => ({
          ...prev,
          brief: { ...brief, generatedAt: Date.now() },
          isGeneratingBrief: false,
        }));

        addLog('Competitive brief generated successfully.', 'success', { source: 'competitive' } as any);
      } catch (err: any) {
        addLog(`Brief generation failed: ${err.message}`, 'error');
        setCompetitiveState(prev => ({ ...prev, isGeneratingBrief: false }));
      }
    }, [competitiveState, addLog]);

    // ─── Load competitor profiles when project/session changes ───
    useEffect(() => {
      if (!activeProject?.id) return;
      (async () => {
        // 1. Try IndexedDB first
        const localProfiles = await crawlDb.competitorProfiles
          .where('_key')
          .startsWith(`${activeProject.id}::`)
          .toArray();

        if (localProfiles.length > 0) {
          // Hydrate from local
          const map = new Map<string, CompetitorProfile>();
          const domains: string[] = [];
          localProfiles.forEach(p => {
            map.set(p.domain, p);
            domains.push(p.domain);
          });
          setCompetitiveState(prev => ({ 
            ...prev, 
            competitorProfiles: map,
            activeCompetitorDomains: domains 
          }));
        } else {
          // Fallback: try cloud
          const cloudProfiles = await loadCompetitorProfilesCloud(activeProject.id);
          if (cloudProfiles.length > 0) {
            const map = new Map<string, CompetitorProfile>();
            const domains: string[] = [];
            cloudProfiles.forEach(p => {
              map.set(p.domain, p);
              domains.push(p.domain);
            });
            setCompetitiveState(prev => ({ 
              ...prev, 
              competitorProfiles: map,
              activeCompetitorDomains: domains 
            }));
            // Backfill IndexedDB
            for (const p of cloudProfiles) {
              await saveCompetitorProfile(activeProject.id, p);
            }
          }
        }
      })();
    }, [activeProject?.id]);

    // ─── Auto-build own profile when pages change (crawl completes) ───
    useEffect(() => {
      if (pages && pages.length > 0 && !competitiveState.ownProfile) {
        buildOwnProfile();
      }
    }, [pages, competitiveState.ownProfile, buildOwnProfile]);

    const getTimelineData = useCallback(async (domain: string) => {
      if (!activeProject?.id) return [];
      return getCompetitorSnapshots(activeProject.id, domain, 30);
    }, [activeProject?.id]);

    const value = useMemo(() => ({
        crawlingMode, setCrawlingMode, urlInput, setUrlInput, listUrls, setListUrls, showListModal, setShowListModal,
        isCrawling, setIsCrawling, pages: pagesWithDerivedSignals, analysisPages, logs, setLogs, crawlStartTime, setCrawlStartTime,
        crawlDb,
        activeCategories, setActiveCategories,
        activeCategory, setActiveCategory,
        auditFilter, activeCheckIds, activeCheckCategories, filteredIssuePages,
        activeViewType, activeSidebarSections,

        customPresets, applyAuditMode, saveCustomPreset, loadCustomPreset,
        openCategories, setOpenCategories, searchQuery, setSearchQuery,
        selectedPage, setSelectedPage, activeTab, setActiveTab, inspectorCollapsed, setInspectorCollapsed, showAuditSidebar, setShowAuditSidebar,
        activeAuditTab, setActiveAuditTab, showSettings, setShowSettings, activeMacro, setActiveMacro,
        sortConfig, setSortConfig, showColumnPicker, setShowColumnPicker, visibleColumns, setVisibleColumns,
        viewMode, setViewMode, showAiInsights, setShowAiInsights, showAiChat, setShowAiChat, graphDimensions, setGraphDimensions,
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
        dynamicClusters, categoryCounts, healthScore, auditInsights, strategicOpportunities, 
        crawlRate, crawlRuntime, analysisRuntime, elapsedTime,
        formatBytes, handleExport, handleExportRawDB, handleImport, filteredPages, handleSort, graphData, handleNodeClick,
        crawlHistory: projectScopedHistory, currentSessionId, compareSessionId, diffResult, showComparisonView, setShowComparisonView, showExportDialog, setShowExportDialog, isLoadingHistory,
        saveCrawlSession, loadSession, resumeCrawlSession, compareSessions, deleteCrawlSession, loadCrawlHistory,
        detectedGscSite, setDetectedGscSite, detectedGa4Property, setDetectedGa4Property,
        runFullEnrichment, runIncrementalEnrichment, runSelectedEnrichment, runCompleteAnalysis,
        isAuthenticated, user, profile, signOut, trialPagesLimit,
        prioritizedCategories, prioritizeByIssues, setPrioritizeByIssues,
        sidebarCollapsed, setSidebarCollapsed,
        showScheduleModal, setShowScheduleModal,
        ignoredUrls, setIgnoredUrls, urlTags, setUrlTags,
        robotsTxt, sitemapData, siteType, isWqaMode, wqaState, setWqaState,
        activateWqaMode, deactivateWqaMode, setWqaViewMode, setWqaIndustryOverride, setWqaLanguageOverride,
        columnWidths, setColumnWidths,
        aiResults, aiProgress, aiNarrative, isAnalyzingAI, runAIAnalysis,
        // Collaboration & Tasks (P5)
        tasks, setTasks, teamMembers, showCollabOverlay, setShowCollabOverlay,
        collabOverlayTarget, setCollabOverlayTarget, activeCommentTarget, setActiveCommentTarget,
        exportSubset, createTaskForCategory, bulkAIAnalyzeCategory,
        tier4Results, runTier4Checks,
        showAddCompetitorInput, setShowAddCompetitorInput,
        crawlingCompetitorDomain, setCrawlingCompetitorDomain, refreshAllCompetitors,

        // Competitive mode
        competitiveViewMode,
        setCompetitiveViewMode,
        competitiveState,
        toggleCompetitiveMode,
        setActiveCompetitors,
        buildOwnProfile,
        addCompetitorAndCrawl,
        removeCompetitor,
        recrawlCompetitor,
        recrawlAllCompetitors,
        refreshCompetitorScores,
        generateCompetitiveBrief,
        getTimelineData,
        // WQA Intelligence
        wqaFilter, setWqaFilter, wqaFacets, filteredWqaPagesExport, wqaForecast,
    }), [
        getTimelineData,
        // Reactive state values only (setters are stable React identity)
        crawlingMode, urlInput, listUrls, showListModal,
        isCrawling, pagesWithDerivedSignals, analysisPages, logs, crawlStartTime,
        activeCategories, activeCategory,
        auditFilter, activeCheckIds, activeCheckCategories, filteredIssuePages,
        activeViewType, activeSidebarSections,

        customPresets,
        openCategories, searchQuery,
        selectedPage, activeTab, inspectorCollapsed, showAuditSidebar,
        activeAuditTab, showSettings, activeMacro,
        sortConfig, showColumnPicker, visibleColumns,
        viewMode, showAiInsights, showAiChat, graphDimensions,
        categorySearch, leftSidebarPreset,
        logSearch, logTypeFilter, selectedRows,
        gridScrollTop, leftSidebarWidth,
        auditSidebarWidth, detailsHeight,
        gridScrollOffset, isDraggingLeftSidebar, isDraggingSidebar,
        isDraggingDetails,
        showAutoFixModal, autoFixItems,
        isFixing, autoFixProgress, stats, columns, config, settingsTab,
        theme, integrationConnections, integrationsLoading, integrationsSource,
        showTrialLimitAlert,
        dynamicClusters, categoryCounts, healthScore, auditInsights, strategicOpportunities, crawlRate, crawlRuntime, elapsedTime,
        filteredPages, graphData,
        projectScopedHistory, currentSessionId, compareSessionId, diffResult, showComparisonView, showExportDialog, isLoadingHistory,
        detectedGscSite, detectedGa4Property,
        isAuthenticated, user, profile, trialPagesLimit,
        prioritizedCategories, prioritizeByIssues,
        sidebarCollapsed,
        showScheduleModal,
        ignoredUrls, urlTags,
        robotsTxt, sitemapData, siteType, isWqaMode, wqaState,
        columnWidths,
        aiResults, aiProgress, aiNarrative, isAnalyzingAI,
        tasks, teamMembers, showCollabOverlay,
        collabOverlayTarget, activeCommentTarget,
        tier4Results,
        runTier4Checks,
        applyAuditMode, saveCustomPreset, loadCustomPreset,
        addLog, toggleCategory, handleStartPause, clearCrawlerWorkspace,
        handleExportRawDB, handleSort, handleNodeClick,
        saveCrawlSession, loadSession, resumeCrawlSession, compareSessions, deleteCrawlSession, loadCrawlHistory,
        runFullEnrichment, runIncrementalEnrichment, runSelectedEnrichment,
        saveIntegrationConnection, removeIntegrationConnection, signOut,
        runAIAnalysis, exportSubset, createTaskForCategory, bulkAIAnalyzeCategory,
        activateWqaMode, deactivateWqaMode, setWqaViewMode, setWqaIndustryOverride, setWqaLanguageOverride,
        showAddCompetitorInput, crawlingCompetitorDomain, setCrawlingCompetitorDomain, refreshAllCompetitors,
        competitiveViewMode,
        competitiveState, toggleCompetitiveMode, setActiveCompetitors,
        buildOwnProfile, addCompetitorAndCrawl, removeCompetitor, recrawlCompetitor,
        recrawlAllCompetitors, refreshCompetitorScores, generateCompetitiveBrief,
        activeProject?.id,
        // WQA Intelligence
        wqaFilter, wqaFacets, filteredWqaPagesExport, wqaForecast,
    ]);


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

export function useOptionalSeoCrawler() {
    return useContext(SeoCrawlerContext);
}
