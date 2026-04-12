/**
 * CrawlerDataUtils.ts
 * 
 * D2+D3+D4 fix: Pure data transformation functions extracted from SeoCrawlerContext.
 * These have zero React dependencies and are fully testable in isolation.
 */

// ─── Text Normalization ───

export const normalizeComparableText = (value: any): string => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
};

export const clampScore = (value: number): number =>
    Math.max(0, Math.min(100, Math.round(value)));

// ─── Page Merging ───

/**
 * Merges two page arrays by URL key, with `nextPages` overwriting `existingPages`.
 * Used during flush to reconcile in-memory state with incoming updates.
 */
export const mergePagesByUrl = (existingPages: any[], nextPages: any[]): any[] => {
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

// ─── Page Normalization ───

/**
 * Normalizes a raw crawled page object into a consistent shape.
 * Ensures all expected string/boolean/array fields have safe default values.
 * Returns null for invalid pages (missing URL).
 */
export const normalizeCrawlerPage = (page: any): any | null => {
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

// ─── Sitemap State Builder ───

export type SitemapState = {
    totalUrls: number;
    sources: string[];
    coverageParsed?: boolean;
};

/**
 * Normalizes raw sitemap data into a consistent state object.
 * Returns null if no valid sitemap data exists.
 */
export const buildSitemapState = (
    totalUrls: unknown,
    sources: unknown,
    coverageParsed = true
): SitemapState | null => {
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

// ─── Post-Crawl Scoring ───

import { calculateInternalPageRank, calculatePredictiveScore } from './StrategicIntelligence';

/**
 * S4 fix: Shared post-crawl scoring pipeline.
 * Computes Internal PageRank and health scores for all completed pages.
 * Called from both Ghost Engine and WebSocket completion handlers.
 */
export const runPostCrawlScoring = (completedPages: any[]): any[] => {
    if (completedPages.length === 0) return completedPages;

    const ranks = calculateInternalPageRank(completedPages);
    return completedPages.map(p => {
        const internalPageRank = ranks[p.url] || 0;
        const updatedPage = { ...p, internalPageRank };
        return { ...updatedPage, healthScore: calculatePredictiveScore(updatedPage) };
    });
};

// ─── Owner Check Helper ───

export const hasOwn = (value: Record<string, any>, key: string): boolean =>
    Object.prototype.hasOwnProperty.call(value, key);

// ─── Export Utilities ───

import { ALL_COLUMNS } from '../components/seo-crawler/constants';

/**
 * R4 fix: Export pages as CSV file. Pure DOM/Blob operation extracted from context.
 * Triggers a browser download of all pages using ALL_COLUMNS as the schema.
 */
export const exportPagesAsCSV = (pages: any[]): void => {
    if (pages.length === 0) return;
    const headers = ALL_COLUMNS.map(col => col.label).join(',');
    const rows = pages.map(page =>
        ALL_COLUMNS.map(col => {
            const val = (page[col.key] === null || page[col.key] === undefined) ? '' : page[col.key];
            const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${strVal.replace(/"/g, '""')}"`;
        }).join(',')
    );
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

/**
 * R4 fix: Export raw session data as JSON. Pure async DOM/Blob operation extracted from context.
 * Returns a log message tuple for the caller to handle.
 */
export const exportRawSessionData = async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    try {
        const { exportSessionData } = await import('./CrawlHistoryService');
        const blob = await exportSessionData(sessionId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `headlight_raw_dump_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true, message: 'Raw DB export complete.' };
    } catch (error) {
        console.error('Failed to export raw DB:', error);
        return { success: false, message: 'Failed to export raw DB.' };
    }
};
