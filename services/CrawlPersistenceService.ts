/**
 * CrawlPersistenceService.ts
 *
 * Lean crawler persistence built on Turso/libSQL.
 * Keeps the existing public read/write interface stable for the app and dashboard
 * while moving crawler storage away from Supabase-heavy full snapshots.
 */

import { turso, initializeDatabase, isCloudSyncEnabled } from './turso';
import { calculatePredictiveScore, detectContentDecay, detectCannibalization } from './StrategicIntelligence';
import {
    CRAWLER_SCHEMA_VERSION,
    resolveCrawlPolicy,
    resolveExecutionMode,
    resolveRetentionPolicy
} from './CrawlerContracts';

export interface AuditResult {
    id?: string;
    project_id: string;
    url_crawled: string;
    crawl_session_id: string;
    score: number;
    total_pages: number;
    total_issues: number;
    errors_count: number;
    warnings_count: number;
    notices_count: number;
    passed_count: number;
    status: 'running' | 'completed' | 'failed';
    crawl_mode: string;
    crawl_duration_ms: number;
    crawl_rate: number;
    max_depth_seen: number;
    orphaned_pages: number;
    link_hoarders: number;
    top_equity_pages: any[];
    sitemap_coverage: any;
    robots_txt: string;
    strategic_summary: any;
    thematic_scores: any;
    issues: any[];
    completed_at?: string;
    created_at?: string;
}

interface DetectedIssue {
    category: string;
    title: string;
    description: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    issue_type: 'error' | 'warning' | 'notice' | 'passed';
    effort: 'Low' | 'Medium' | 'High';
    score_impact: number;
    ai_fix: string;
    urls: string[];
}

const PAGE_INSIGHT_LIMIT = 150;
const RETAIN_RECENT_RUNS = 5;
let schemaReady: Promise<void> | null = null;

const ensureSchema = async () => {
    if (!schemaReady) {
        schemaReady = initializeDatabase().catch((error) => {
            schemaReady = null;
            throw error;
        });
    }
    await schemaReady;
};

const safeJsonParse = <T>(value: unknown, fallback: T): T => {
    if (!value) return fallback;
    try {
        return JSON.parse(String(value)) as T;
    } catch {
        return fallback;
    }
};

const asNumber = (value: unknown, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const nowIso = () => new Date().toISOString();

const buildRunId = (sessionId: string) => `run_${sessionId}`;
const buildJobId = (sessionId: string) => `job_${sessionId}`;
const buildDbId = (...parts: Array<string | number>) => parts.join(':');

function detectIssuesFromPages(pages: any[]): DetectedIssue[] {
    const issues: DetectedIssue[] = [];
    const missingTitles: string[] = [];
    const duplicateTitles = new Map<string, string[]>();
    const longTitles: string[] = [];
    const shortTitles: string[] = [];
    const missingMetaDescs: string[] = [];
    const duplicateMetaDescs = new Map<string, string[]>();
    const longMetaDescs: string[] = [];
    const shortMetaDescs: string[] = [];
    const missingH1s: string[] = [];
    const multipleH1s: string[] = [];
    const brokenPages: string[] = [];
    const serverErrors: string[] = [];
    const redirectPages: string[] = [];
    const redirectChains: string[] = [];
    const redirectLoops: string[] = [];
    const slowPages: string[] = [];
    const verySlowPages: string[] = [];
    const largePages: string[] = [];
    const thinContent: string[] = [];
    const missingCanonicals: string[] = [];
    const missingAltText: string[] = [];
    const mixedContentPages: string[] = [];
    const noindexPages: string[] = [];
    const orphanedPages: string[] = [];
    const duplicateContent: string[] = [];
    const missingOgTags: string[] = [];
    const missingSchema: string[] = [];
    const loremIpsum: string[] = [];
    const keywordStuffing: string[] = [];
    const insecureForms: string[] = [];
    const lowTextRatio: string[] = [];
    const brokenHreflang: string[] = [];
    const incorrectHeadingOrder: string[] = [];
    const badLcp: string[] = [];
    const badCls: string[] = [];
    const notInSitemap: string[] = [];
    const contentHashes = new Map<string, string[]>();

    for (const page of pages) {
        const url = page.url;
        if (!url) continue;

        if (page.statusCode >= 500) serverErrors.push(url);
        else if (page.statusCode >= 400) brokenPages.push(url);
        else if (page.statusCode >= 300) redirectPages.push(url);

        if (page.redirectChainLength > 1) redirectChains.push(url);
        if (page.isRedirectLoop) redirectLoops.push(url);

        if (!page.title || page.title.trim() === '') missingTitles.push(url);
        else {
            if (page.titleLength > 60) longTitles.push(url);
            if (page.titleLength < 30 && page.titleLength > 0) shortTitles.push(url);
            const titleKey = page.title.toLowerCase().trim();
            if (!duplicateTitles.has(titleKey)) duplicateTitles.set(titleKey, []);
            duplicateTitles.get(titleKey)?.push(url);
        }

        if (!page.metaDesc || page.metaDesc.trim() === '') missingMetaDescs.push(url);
        else {
            if (page.metaDescLength > 160) longMetaDescs.push(url);
            if (page.metaDescLength < 70 && page.metaDescLength > 0) shortMetaDescs.push(url);
            const descKey = page.metaDesc.toLowerCase().trim();
            if (!duplicateMetaDescs.has(descKey)) duplicateMetaDescs.set(descKey, []);
            duplicateMetaDescs.get(descKey)?.push(url);
        }

        if (!page.h1_1 || page.h1_1.trim() === '') missingH1s.push(url);
        if (page.multipleH1s || page.h1_2) multipleH1s.push(url);
        if (page.loadTime > 5000) verySlowPages.push(url);
        else if (page.loadTime > 3000) slowPages.push(url);
        if (page.sizeBytes > 2 * 1024 * 1024) largePages.push(url);
        if (page.isThinContent || (page.wordCount && page.wordCount < 100)) thinContent.push(url);
        if (page.containsLoremIpsum) loremIpsum.push(url);
        if (page.hasKeywordStuffing) keywordStuffing.push(url);
        if (page.textRatio && page.textRatio < 10) lowTextRatio.push(url);
        if (!page.canonical && page.statusCode === 200 && page.contentType?.includes('text/html')) missingCanonicals.push(url);
        if (page.missingAltImages > 0) missingAltText.push(url);
        if (page.mixedContent) mixedContentPages.push(url);
        if (page.insecureForms) insecureForms.push(url);
        if (page.indexable === false) noindexPages.push(url);
        if ((page.inlinks === 0 || page.inlinks === undefined) && page.statusCode === 200 && page.contentType?.includes('text/html')) orphanedPages.push(url);
        if (!page.ogTitle && page.statusCode === 200 && page.contentType?.includes('text/html')) missingOgTags.push(url);
        if ((!page.schemaTypes || page.schemaTypes?.length === 0) && page.statusCode === 200 && page.contentType?.includes('text/html')) missingSchema.push(url);
        if (page.hash && page.statusCode === 200) {
            if (!contentHashes.has(page.hash)) contentHashes.set(page.hash, []);
            contentHashes.get(page.hash)?.push(url);
        }
        if (page.lcp && page.lcp > 2500) badLcp.push(url);
        if (page.cls && page.cls > 0.1) badCls.push(url);
        if (!page.inSitemap && page.statusCode === 200 && page.contentType?.includes('text/html') && page.indexable !== false) notInSitemap.push(url);
        if (page.incorrectHeadingOrder) incorrectHeadingOrder.push(url);
        if (page.hreflangBroken) brokenHreflang.push(url);
    }

    for (const [, urls] of contentHashes) {
        if (urls.length > 1) duplicateContent.push(...urls);
    }

    const dupesTitleUrls = Array.from(duplicateTitles.values()).filter((urls) => urls.length > 1).flat();
    const dupesDescUrls = Array.from(duplicateMetaDescs.values()).filter((urls) => urls.length > 1).flat();

    const addIssue = (
        category: string,
        title: string,
        desc: string,
        urls: string[],
        priority: DetectedIssue['priority'],
        type: DetectedIssue['issue_type'],
        effort: DetectedIssue['effort'],
        scoreImpact: number,
        aiFix: string
    ) => {
        if (urls.length > 0) {
            issues.push({ category, title, description: desc, priority, issue_type: type, effort, score_impact: scoreImpact, ai_fix: aiFix, urls });
        }
    };

    const cannibalizedGroups = detectCannibalization(pages);
    pages.forEach((p) => {
        if (detectContentDecay(p)) {
            addIssue('Strategic', 'Strategic Content Decay Detected', `Page has high impressions (${p.gscImpressions}) but very low clicks (${p.gscClicks}), suggesting content is losing relevance.`, [p.url], 'Critical', 'error', 'Medium', 15, 'Refresh the page against current SERP leaders and update the promise, headers, and core advice.');
        }
        if (cannibalizedGroups[p.url]) {
            addIssue('Strategic', 'Potential Keyword Cannibalization', `This page shares a highly similar title/H1 with: ${cannibalizedGroups[p.url].join(', ')}.`, [p.url], 'High', 'warning', 'Medium', 10, 'Consolidate, canonicalize, or differentiate the intent between overlapping pages.');
        }
        if ((p.link_equity || p.linkEquity || 0) > 50 && (p.outlinksList?.length || 0) < 3) {
            addIssue('Strategic', 'Authority Sink (High PageRank, Low Outlinks)', 'This page receives significant internal authority but does not distribute it to other sections of the site.', [p.url], 'High', 'warning', 'Low', 8, 'Add 2-3 strategic internal links from this page to priority destinations.');
        }
    });

    addIssue('technical', 'Server Errors (5xx)', 'Pages returning server error codes.', serverErrors, 'Critical', 'error', 'High', 15, 'Investigate the application and upstream dependencies causing the 5xx responses.');
    addIssue('technical', 'Broken Pages (4xx)', 'Pages returning client error codes.', brokenPages, 'Critical', 'error', 'Low', 10, 'Restore content or redirect these URLs to the most relevant destination.');
    addIssue('technical', 'Redirect Loops', 'Pages caught in redirect loops.', redirectLoops, 'Critical', 'error', 'Medium', 10, 'Break the loop and point directly to the final destination.');
    addIssue('content', 'Lorem Ipsum Content', 'Pages containing placeholder text.', loremIpsum, 'Critical', 'error', 'Low', 15, 'Replace placeholder content or noindex unfinished pages.');
    addIssue('content', 'Missing Page Titles', 'Pages without a title tag.', missingTitles, 'High', 'warning', 'Low', 8, 'Add unique, descriptive title tags.');
    addIssue('content', 'Missing Meta Descriptions', 'Pages without meta descriptions.', missingMetaDescs, 'High', 'warning', 'Low', 5, 'Add concise, compelling meta descriptions.');
    addIssue('content', 'Missing H1 Tags', 'Pages without H1 headings.', missingH1s, 'High', 'warning', 'Low', 5, 'Add a single descriptive H1 to each page.');
    addIssue('content', 'Thin Content', 'Pages with very little text content.', thinContent, 'High', 'warning', 'Medium', 8, 'Expand, merge, or deindex low-value thin pages.');
    addIssue('performance', 'Very Slow Pages (>5s)', 'Pages taking over 5 seconds to load.', verySlowPages, 'High', 'warning', 'High', 8, 'Reduce server latency and large render-blocking assets.');
    addIssue('content', 'Duplicate Content', 'Multiple pages with identical content.', duplicateContent, 'High', 'warning', 'Medium', 8, 'Use canonicals or consolidate duplicated content.');
    addIssue('links', 'Orphaned Pages', 'Pages with zero internal links pointing to them.', orphanedPages, 'High', 'warning', 'Low', 5, 'Add internal links from relevant hub pages.');
    addIssue('technical', 'Redirect Chains', 'Pages with more than one redirect.', redirectChains, 'Medium', 'warning', 'Low', 3, 'Update internal links to the final destination.');
    addIssue('content', 'Duplicate Titles', 'Multiple pages sharing the same title.', dupesTitleUrls, 'Medium', 'warning', 'Low', 3, 'Write unique titles for each page.');
    addIssue('content', 'Duplicate Meta Descriptions', 'Multiple pages sharing the same meta description.', dupesDescUrls, 'Medium', 'warning', 'Low', 2, 'Write unique meta descriptions per page.');
    addIssue('content', 'Long Titles (>60 chars)', 'Titles exceeding 60 characters.', longTitles, 'Medium', 'notice', 'Low', 1, 'Trim titles to 50-60 characters.');
    addIssue('content', 'Short Titles (<30 chars)', 'Very short titles.', shortTitles, 'Medium', 'notice', 'Low', 1, 'Expand titles to better describe page intent.');
    addIssue('content', 'Long Meta Descriptions (>160 chars)', 'Meta descriptions over 160 characters.', longMetaDescs, 'Medium', 'notice', 'Low', 1, 'Trim descriptions to 120-160 characters.');
    addIssue('content', 'Short Meta Descriptions (<70 chars)', 'Very short meta descriptions.', shortMetaDescs, 'Medium', 'notice', 'Low', 1, 'Expand descriptions with clearer context.');
    addIssue('content', 'Multiple H1 Tags', 'Pages with more than one H1 tag.', multipleH1s, 'Medium', 'notice', 'Low', 2, 'Keep one primary H1 per page.');
    addIssue('performance', 'Slow Pages (3-5s)', 'Pages taking 3-5 seconds to load.', slowPages, 'Medium', 'warning', 'Medium', 3, 'Optimize heavy assets and server response time.');
    addIssue('technical', 'Large Pages (>2MB)', 'Pages larger than 2MB.', largePages, 'Medium', 'warning', 'Medium', 3, 'Reduce payload size and move heavy assets off the critical path.');
    addIssue('technical', 'Missing Canonical Tags', 'Pages without canonical tags.', missingCanonicals, 'Medium', 'warning', 'Low', 3, 'Add self-referencing canonicals for indexable pages.');
    addIssue('content', 'Missing Image Alt Text', 'Pages with images lacking alt text.', missingAltText, 'Medium', 'warning', 'Low', 2, 'Add descriptive alt text to images.');
    addIssue('technical', 'Mixed Content', 'HTTPS pages loading HTTP resources.', mixedContentPages, 'Medium', 'warning', 'Low', 5, 'Update insecure asset URLs to HTTPS.');
    addIssue('content', 'Missing Open Graph Tags', 'Pages without Open Graph tags.', missingOgTags, 'Medium', 'notice', 'Low', 1, 'Add key Open Graph fields.');
    addIssue('content', 'Missing Structured Data', 'Pages without structured data.', missingSchema, 'Medium', 'notice', 'Medium', 2, 'Add relevant JSON-LD schema.');
    addIssue('content', 'Keyword Stuffing Detected', 'Pages overusing keywords unnaturally.', keywordStuffing, 'Medium', 'warning', 'Medium', 5, 'Rewrite the content for clarity and natural phrasing.');
    addIssue('content', 'Low Text-to-HTML Ratio', 'Pages with less than 10% visible text.', lowTextRatio, 'Medium', 'notice', 'Medium', 2, 'Reduce markup bloat or add meaningful content.');
    addIssue('technical', 'Insecure Forms', 'Pages with forms submitting over HTTP.', insecureForms, 'Medium', 'warning', 'Low', 5, 'Update form actions to HTTPS.');
    addIssue('technical', 'Redirected Pages', 'Pages returning 3xx status codes.', redirectPages, 'Low', 'notice', 'Low', 1, 'Update internal links to the final URL.');
    addIssue('technical', 'Noindex Pages', 'Pages with a noindex directive.', noindexPages, 'Low', 'notice', 'Low', 0, 'Confirm whether noindex is intentional.');
    addIssue('content', 'Incorrect Heading Order', 'Pages skipping heading levels.', incorrectHeadingOrder, 'Low', 'notice', 'Low', 1, 'Restructure headings hierarchically.');
    addIssue('performance', 'Poor LCP (>2.5s)', 'Pages with poor Largest Contentful Paint.', badLcp, 'Medium', 'warning', 'High', 5, 'Optimize the largest element and reduce blocking resources.');
    addIssue('performance', 'Poor CLS (>0.1)', 'Pages with poor layout stability.', badCls, 'Medium', 'warning', 'Medium', 3, 'Reserve space for media and async content.');
    addIssue('technical', 'Not in Sitemap', 'Indexable pages not included in the XML sitemap.', notInSitemap, 'Low', 'notice', 'Low', 1, 'Add these indexable pages to the sitemap.');
    addIssue('technical', 'Broken Hreflang References', 'Pages with hreflang tags pointing to broken URLs.', brokenHreflang, 'Medium', 'warning', 'Medium', 3, 'Repair hreflang targets and reciprocity.');

    return issues;
}

function calculateSiteHealthScore(pages: any[], issues: DetectedIssue[]): number {
    if (pages.length === 0) return 0;
    let score = 100;
    const totalHtmlPages = pages.filter((p) => p.contentType?.includes('text/html') && p.statusCode < 400).length;
    if (totalHtmlPages === 0) return 0;

    for (const issue of issues) {
        const affectedRatio = issue.urls.length / totalHtmlPages;
        const impact = issue.score_impact * Math.min(affectedRatio * 2, 1);
        if (issue.issue_type === 'error') score -= impact * 1.5;
        else if (issue.issue_type === 'warning') score -= impact;
        else if (issue.issue_type === 'notice') score -= impact * 0.3;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateThematicScores(pages: any[], issues: DetectedIssue[]) {
    const totalPages = pages.filter((p) => p.statusCode && p.statusCode < 400).length || 1;
    const categoryImpact = (cat: string) => {
        const catIssues = issues.filter((i) => i.category === cat && i.issue_type !== 'passed');
        let totalImpact = 0;
        for (const issue of catIssues) {
            totalImpact += (issue.urls.length / totalPages) * issue.score_impact;
        }
        return Math.max(0, Math.min(100, Math.round(100 - totalImpact * 10)));
    };

    const avgLoadTime = pages.reduce((sum, p) => sum + (p.loadTime || 0), 0) / (pages.length || 1);
    const speedScore = avgLoadTime < 1000 ? 100 : avgLoadTime < 2000 ? 85 : avgLoadTime < 3000 ? 70 : avgLoadTime < 5000 ? 50 : 30;
    const httpsPages = pages.filter((p) => p.url?.startsWith('https://')).length;
    const mixedContentCount = pages.filter((p) => p.mixedContent).length;
    const securityScore = Math.round((httpsPages / totalPages) * 100 - (mixedContentCount / totalPages) * 30);

    return [
        { subject: 'Content', score: categoryImpact('content') },
        { subject: 'Technical', score: categoryImpact('technical') },
        { subject: 'Links', score: categoryImpact('links') },
        { subject: 'Speed', score: Math.max(0, speedScore) },
        { subject: 'Security', score: Math.max(0, Math.min(100, securityScore)) },
        { subject: 'Crawling', score: categoryImpact('technical') }
    ];
}

const getEvidenceSourcesForPage = (page: any) => {
    const sources = ['crawl'];
    if ((page.gscClicks || 0) > 0 || (page.gscImpressions || 0) > 0) sources.push('gsc');
    if ((page.ga4Sessions || 0) > 0 || (page.ga4Users || 0) > 0) sources.push('ga4');
    if ((page.referringDomains || 0) > 0 || (page.urlRating || 0) > 0) sources.push('ahrefs');
    return sources;
};

const buildMetricsSummary = (pages: any[], score: number, issues: DetectedIssue[]) => {
    const totals = pages.reduce((acc, page) => {
        acc.gscClicks += Number(page.gscClicks || 0);
        acc.gscImpressions += Number(page.gscImpressions || 0);
        acc.ga4Sessions += Number(page.ga4Sessions || 0);
        acc.ga4Views += Number(page.ga4Views || 0);
        acc.ga4Users += Number(page.ga4Users || 0);
        acc.indexablePages += page.indexable === false ? 0 : 1;
        acc.lcp += Number(page.lcp || 0);
        acc.cls += Number(page.cls || 0);
        acc.loadTime += Number(page.loadTime || 0);
        acc.wordCount += Number(page.wordCount || 0);
        return acc;
    }, {
        gscClicks: 0,
        gscImpressions: 0,
        ga4Sessions: 0,
        ga4Views: 0,
        ga4Users: 0,
        indexablePages: 0,
        lcp: 0,
        cls: 0,
        loadTime: 0,
        wordCount: 0
    });

    return {
        healthScore: score,
        pages: pages.length,
        issues: issues.length,
        avgLcp: pages.length ? totals.lcp / pages.length : 0,
        avgCls: pages.length ? totals.cls / pages.length : 0,
        avgLoadTime: pages.length ? totals.loadTime / pages.length : 0,
        avgWordCount: pages.length ? totals.wordCount / pages.length : 0,
        indexableRate: pages.length ? totals.indexablePages / pages.length : 0,
        gscClicks: totals.gscClicks,
        gscImpressions: totals.gscImpressions,
        ga4Sessions: totals.ga4Sessions,
        ga4Views: totals.ga4Views,
        ga4Users: totals.ga4Users
    };
};

const buildTopPages = (pages: any[]) => {
    return [...pages]
        .sort((a, b) => {
            const left = Number(b.opportunityScore || b.businessValueScore || b.gscImpressions || 0);
            const right = Number(a.opportunityScore || a.businessValueScore || a.gscImpressions || 0);
            return left - right;
        })
        .slice(0, 15)
        .map((page) => ({
            url: page.url,
            title: page.title || '',
            statusCode: page.statusCode || 0,
            opportunityScore: Number(page.opportunityScore || 0),
            businessValueScore: Number(page.businessValueScore || 0),
            recommendedAction: page.recommendedAction || 'Monitor'
        }));
};

const isSeverePage = (page: any) => {
    return Boolean(
        (page.statusCode || 0) >= 400 ||
        !page.title ||
        !page.metaDesc ||
        Number(page.loadTime || 0) > 3000 ||
        page.indexable === false ||
        Number(page.opportunityScore || 0) >= 70
    );
};

const pagePriorityScore = (page: any) => {
    return (
        Number(page.opportunityScore || 0) * 0.45 +
        Number(page.businessValueScore || 0) * 0.2 +
        Number(page.authorityScore || 0) * 0.15 +
        Number(page.gscImpressions || 0) * 0.01 +
        Number(page.ga4Sessions || 0) * 0.05 -
        ((page.statusCode || 0) >= 400 ? 20 : 0)
    );
};

const buildLeanPageSummary = (page: any) => ({
    url: page.url,
    title: page.title || null,
    meta_description: page.metaDesc || null,
    status_code: page.statusCode || 0,
    status_text: page.status || null,
    content_type: page.contentType || null,
    depth: page.crawlDepth || 0,
    indexable: page.indexable !== false,
    indexability_status: page.indexabilityStatus || null,
    h1: page.h1_1 || null,
    h2: page.h2_1 || null,
    canonical: page.canonical || null,
    load_time: page.loadTime || 0,
    size_bytes: page.sizeBytes || 0,
    links_in: page.inlinks || 0,
    links_out: page.outlinks || 0,
    inlinks: page.inlinks || 0,
    outlinks: page.outlinks || 0,
    external_outlinks: page.externalOutlinks || 0,
    word_count: page.wordCount || 0,
    h1_count: page.multipleH1s ? 2 : (page.h1_1 ? 1 : 0),
    has_schema: (page.schemaTypes?.length || 0) > 0,
    text_ratio: page.textRatio || 0,
    flesch_score: parseFloat(page.fleschScore) || 0,
    readability: page.readability || null,
    link_equity: page.linkEquity || 0,
    predictive_score: calculatePredictiveScore(page),
    search_intent: page.searchIntent || null,
    strategic_priority: page.strategicPriority || null,
    content_decay: page.contentDecay || null,
    is_thin_content: page.isThinContent || false,
    has_keyword_stuffing: page.hasKeywordStuffing || false,
    missing_alt_images: page.missingAltImages || 0,
    total_images: page.totalImages || 0,
    schema_types: page.schemaTypes || null,
    og_title: page.ogTitle || null,
    og_description: page.ogDescription || null,
    lcp: page.lcp || null,
    cls: page.cls || null,
    inp: page.inp || null,
    gsc_clicks: page.gscClicks || null,
    gsc_impressions: page.gscImpressions || null,
    gsc_position: page.gscPosition || null,
    gsc_ctr: page.gscCtr || null,
    main_keyword: page.mainKeyword || null,
    main_kw_position: page.mainKwPosition || null,
    main_kw_estimated_volume: page.mainKwEstimatedVolume || null,
    best_keyword: page.bestKeyword || null,
    best_kw_position: page.bestKwPosition || null,
    best_kw_estimated_volume: page.bestKwEstimatedVolume || null,
    ga4_sessions: page.ga4Sessions || null,
    ga4_views: page.ga4Views || null,
    ga4_bounce_rate: page.ga4BounceRate || null,
    ga4_conversions: page.ga4Conversions || null,
    ga4_revenue: page.ga4Revenue || null,
    sessions_delta: page.sessionsDeltaAbsolute || page.sessionsDelta || null,
    content_hash: page.hash || null,
    in_sitemap: page.inSitemap || false,
    redirect_url: page.redirectUrl || null,
    language: page.language || null,
    crawl_timestamp: page.crawlTimestamp || null,
    recommended_action: page.recommendedAction || null,
    insight_confidence: page.insightConfidence || page.gscMatchConfidence || null,
    data_coverage: page.dataCoverage || page.gscJoinType || null
});

const summarizeIssueCounts = (issues: DetectedIssue[]) => ({
    errors: issues.filter((i) => i.issue_type === 'error').length,
    warnings: issues.filter((i) => i.issue_type === 'warning').length,
    notices: issues.filter((i) => i.issue_type === 'notice').length
});

const pruneHistoricalInsights = async (projectId: string) => {
    if (!isCloudSyncEnabled) return;
    const client = turso();
    const recentRuns = await client.execute({
        sql: `SELECT id FROM crawl_runs WHERE project_id = ? ORDER BY datetime(created_at) DESC LIMIT ?`,
        args: [projectId, RETAIN_RECENT_RUNS]
    });

    const keepRunIds = new Set(recentRuns.rows.map((row) => String(row.id)));
    const allRuns = await client.execute({
        sql: `SELECT id FROM crawl_runs WHERE project_id = ?`,
        args: [projectId]
    });

    const staleRunIds = allRuns.rows
        .map((row) => String(row.id))
        .filter((id) => !keepRunIds.has(id));

    if (staleRunIds.length === 0) return;

    const statements = staleRunIds.flatMap((runId) => ([
        { sql: `DELETE FROM crawl_page_insights WHERE run_id = ?`, args: [runId] },
        { sql: `DELETE FROM crawl_issue_clusters WHERE run_id = ?`, args: [runId] },
        { sql: `DELETE FROM trend_snapshots WHERE run_id = ?`, args: [runId] }
    ]));

    await client.batch(statements);
};

const getPreviousRunSummaries = async (projectId: string) => {
    if (!isCloudSyncEnabled) return new Map();
    const client = turso();
    const result = await client.execute({
        sql: `SELECT url, summary_json FROM crawl_page_insights WHERE project_id = ? ORDER BY datetime(created_at) DESC LIMIT 300`,
        args: [projectId]
    });
    return new Map(
        result.rows.map((row) => [String(row.url), safeJsonParse<any>(row.summary_json, {})])
    );
};

export async function persistCrawlResults(params: {
    projectId: string;
    sessionId: string;
    urlCrawled: string;
    pages: any[];
    crawlMode: string;
    crawlDuration: number;
    crawlRate: number;
    maxDepthSeen: number;
    strategicSummary?: any;
    sitemapCoverage?: any;
    robotsTxt?: string;
}): Promise<any> {
    await ensureSchema();

    try {
        const { projectId, sessionId, urlCrawled, pages, crawlMode, crawlDuration, crawlRate, maxDepthSeen, strategicSummary, sitemapCoverage, robotsTxt } = params;
        const runId = buildRunId(sessionId);
        const jobId = buildJobId(sessionId);
        const previousSummaries = await getPreviousRunSummaries(projectId);
        const detectedIssues = detectIssuesFromPages(pages);
        const healthScore = calculateSiteHealthScore(pages, detectedIssues);
        const thematicScores = calculateThematicScores(pages, detectedIssues);
        const issueCounts = summarizeIssueCounts(detectedIssues);
        const topPages = buildTopPages(pages);
        const metricsSummary = buildMetricsSummary(pages, healthScore, detectedIssues);
        const evidenceSources = Array.from(new Set(pages.flatMap((page) => getEvidenceSourcesForPage(page))));
        const executionMode = resolveExecutionMode({ useGhostEngine: false });
        const retentionPolicy = resolveRetentionPolicy({});
        const policy = resolveCrawlPolicy();
        const createdAt = nowIso();

        const issueMap = new Map<string, DetectedIssue[]>();
        for (const issue of detectedIssues) {
            for (const url of issue.urls) {
                const bucket = issueMap.get(url) || [];
                bucket.push(issue);
                issueMap.set(url, bucket);
            }
        }

        const selectedPages = [...pages]
            .map((page) => {
                const previous = previousSummaries.get(page.url);
                const summary = buildLeanPageSummary(page);
                const changed = Boolean(
                    !previous ||
                    previous.content_hash !== summary.content_hash ||
                    previous.status_code !== summary.status_code ||
                    previous.title !== summary.title ||
                    previous.meta_description !== summary.meta_description ||
                    previous.load_time !== summary.load_time
                );
                const severe = isSeverePage(page);
                const score = pagePriorityScore(page);
                return {
                    page,
                    summary,
                    changed,
                    severe,
                    priorityScore: score,
                    evidenceSources: getEvidenceSourcesForPage(page),
                    topPage: topPages.some((item) => item.url === page.url),
                    issues: issueMap.get(page.url) || []
                };
            })
            .filter((item) => item.changed || item.severe || item.topPage)
            .sort((a, b) => b.priorityScore - a.priorityScore)
            .slice(0, PAGE_INSIGHT_LIMIT);

        const summary = {
            schemaVersion: CRAWLER_SCHEMA_VERSION,
            project_id: projectId,
            url_crawled: urlCrawled,
            crawl_session_id: sessionId,
            score: healthScore,
            total_pages: pages.length,
            total_issues: detectedIssues.length,
            errors_count: issueCounts.errors,
            warnings_count: issueCounts.warnings,
            notices_count: issueCounts.notices,
            passed_count: 0,
            status: 'completed',
            crawl_mode: crawlMode,
            crawl_duration_ms: crawlDuration,
            crawl_rate: crawlRate,
            max_depth_seen: maxDepthSeen,
            orphaned_pages: strategicSummary?.orphanedPages || 0,
            link_hoarders: strategicSummary?.linkHoarders || 0,
            top_equity_pages: strategicSummary?.topEquityPages || [],
            sitemap_coverage: sitemapCoverage,
            robots_txt: robotsTxt || '',
            strategic_summary: strategicSummary || {},
            thematic_scores: thematicScores,
            evidence_sources: evidenceSources,
            metrics_summary: metricsSummary,
            lean_retention: {
                persisted_page_insights: selectedPages.length,
                raw_payload_ttl_hours: 72,
                retained_run_window: RETAIN_RECENT_RUNS
            },
            completed_at: createdAt,
            created_at: createdAt
        };

        if (isCloudSyncEnabled) {
            const client = turso();
            const issueOverview = detectedIssues.map((issue) => ({
                ...issue,
                count: issue.urls.length,
                preview: issue.urls.slice(0, 5)
            }));

            const trendMetrics = {
                score: healthScore,
                totalPages: pages.length,
                totalIssues: detectedIssues.length,
                errors: issueCounts.errors,
                warnings: issueCounts.warnings,
                notices: issueCounts.notices,
                avgLcp: metricsSummary.avgLcp,
                avgCls: metricsSummary.avgCls,
                avgLoadTime: metricsSummary.avgLoadTime,
                gscClicks: metricsSummary.gscClicks,
                gscImpressions: metricsSummary.gscImpressions,
                ga4Sessions: metricsSummary.ga4Sessions,
                linkEquity: pages.reduce((sum, page) => sum + Number(page.linkEquity || 0), 0),
                contentFreshnessRisk: detectedIssues.filter((issue) => issue.title.includes('Decay')).length
            };

            await client.batch([
                {
                    sql: `INSERT OR REPLACE INTO crawl_jobs (id, project_id, session_id, execution_mode, policy, retention_policy, entry_urls_json, limits_json, created_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [jobId, projectId, sessionId, executionMode, policy, retentionPolicy, JSON.stringify([urlCrawled]), JSON.stringify({ maxPages: pages.length, maxDepth: maxDepthSeen }), createdAt]
                },
                {
                    sql: `INSERT OR REPLACE INTO crawl_runs (id, project_id, session_id, job_id, status, crawl_mode, execution_mode, policy, retention_policy, url_crawled, summary_json, thematic_scores_json, evidence_sources_json, runtime_json, top_pages_json, issue_overview_json, created_at, completed_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        runId,
                        projectId,
                        sessionId,
                        jobId,
                        'completed',
                        crawlMode,
                        executionMode,
                        policy,
                        retentionPolicy,
                        urlCrawled,
                        JSON.stringify(summary),
                        JSON.stringify(thematicScores),
                        JSON.stringify(evidenceSources),
                        JSON.stringify({ crawlDuration, crawlRate, maxDepthSeen }),
                        JSON.stringify(topPages),
                        JSON.stringify(issueOverview),
                        createdAt,
                        createdAt
                    ]
                },
                {
                    sql: `INSERT OR REPLACE INTO trend_snapshots (id, project_id, run_id, snapshot_at, metrics_json)
                          VALUES (?, ?, ?, ?, ?)`,
                    args: [buildDbId('trend', runId), projectId, runId, createdAt, JSON.stringify(trendMetrics)]
                }
            ]);

            if (detectedIssues.length > 0) {
                await client.batch(detectedIssues.map((issue, index) => ({
                    sql: `INSERT OR REPLACE INTO crawl_issue_clusters (id, run_id, project_id, category, title, description, priority, issue_type, affected_count, affected_urls_json, effort, score_impact, ai_fix, trend, evidence_json, created_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        buildDbId(runId, 'issue', index),
                        runId,
                        projectId,
                        issue.category,
                        issue.title,
                        issue.description,
                        issue.priority,
                        issue.issue_type,
                        issue.urls.length,
                        JSON.stringify(issue.urls.slice(0, 100)),
                        issue.effort,
                        issue.score_impact,
                        issue.ai_fix,
                        'new',
                        JSON.stringify({ sources: issue.title.startsWith('Strategic') ? ['crawl', 'gsc', 'ga4'] : ['crawl'] }),
                        createdAt
                    ]
                })));
            }

            if (selectedPages.length > 0) {
                await client.batch(selectedPages.map((item, index) => ({
                    sql: `INSERT OR REPLACE INTO crawl_page_insights (id, run_id, project_id, session_id, url, is_changed, is_top_page, has_severe_issues, severity_rank, priority_score, evidence_sources_json, summary_json, full_data_json, created_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        buildDbId(runId, 'page', index),
                        runId,
                        projectId,
                        sessionId,
                        item.page.url,
                        item.changed ? 1 : 0,
                        item.topPage ? 1 : 0,
                        item.severe ? 1 : 0,
                        item.severe ? 100 : Math.round(item.priorityScore),
                        item.priorityScore,
                        JSON.stringify(item.evidenceSources),
                        JSON.stringify(item.summary),
                        JSON.stringify(item.severe ? {
                            url: item.page.url,
                            title: item.page.title || null,
                            hash: item.page.hash || null,
                            issueTitles: item.issues.map((issue) => issue.title),
                            recommendedAction: item.page.recommendedAction || null,
                            crawlTimestamp: item.page.crawlTimestamp || null
                        } : null),
                        createdAt
                    ]
                })));
            }
            await pruneHistoricalInsights(projectId);
        }

        return { auditId: runId, score: healthScore, issues: detectedIssues };
    } catch (err) {
        console.error('[CrawlPersistence] Unexpected error:', err);
        return null;
    }
}

/**
 * Update a crawl run with final enrichment synchronization status.
 * This tracks coverage (how many pages matched GSC/GA4/Backlinks).
 */
export async function persistEnrichmentStatus(params: {
    sessionId: string;
    gsc?: { matched: number; total: number; status: string };
    ga4?: { matched: number; total: number; status: string };
    backlinks?: { matched: number; total: number; status: string };
}): Promise<void> {
    if (!isCloudSyncEnabled) return;
    await ensureSchema();
    const client = turso();
    const runId = buildRunId(params.sessionId);

    try {
        const result = await client.execute({
            sql: 'SELECT summary_json FROM crawl_runs WHERE id = ?',
            args: [runId]
        });

        if (result.rows.length === 0) return;

        const summary = safeJsonParse<any>(result.rows[0].summary_json, {});
        summary.sync_coverage = {
            gsc: params.gsc || null,
            ga4: params.ga4 || null,
            backlinks: params.backlinks || null,
            unified_at: new Date().toISOString()
        };

        await client.execute({
            sql: 'UPDATE crawl_runs SET summary_json = ? WHERE id = ?',
            args: [JSON.stringify(summary), runId]
        });
    } catch (err) {
        console.error('[CrawlPersistence] Failed to persist enrichment status:', err);
    }
}

const mapRunRowToAudit = (row: any): AuditResult => {
    const summary = safeJsonParse<any>(row.summary_json, {});
    return {
        id: String(row.id),
        project_id: String(row.project_id),
        url_crawled: summary.url_crawled || '',
        crawl_session_id: summary.crawl_session_id || String(row.session_id || ''),
        score: asNumber(summary.score),
        total_pages: asNumber(summary.total_pages),
        total_issues: asNumber(summary.total_issues),
        errors_count: asNumber(summary.errors_count),
        warnings_count: asNumber(summary.warnings_count),
        notices_count: asNumber(summary.notices_count),
        passed_count: asNumber(summary.passed_count),
        status: (summary.status || row.status || 'completed') as AuditResult['status'],
        crawl_mode: summary.crawl_mode || row.crawl_mode || 'spider',
        crawl_duration_ms: asNumber(summary.crawl_duration_ms),
        crawl_rate: asNumber(summary.crawl_rate),
        max_depth_seen: asNumber(summary.max_depth_seen),
        orphaned_pages: asNumber(summary.orphaned_pages),
        link_hoarders: asNumber(summary.link_hoarders),
        top_equity_pages: summary.top_equity_pages || [],
        sitemap_coverage: summary.sitemap_coverage || null,
        robots_txt: summary.robots_txt || '',
        strategic_summary: summary.strategic_summary || {},
        thematic_scores: summary.thematic_scores || [],
        issues: summary.issues || [],
        completed_at: summary.completed_at || row.completed_at || row.created_at,
        created_at: summary.created_at || row.created_at
    };
};

export async function getLatestAuditResult(projectId: string) {
    if (!isCloudSyncEnabled) return null;
    await ensureSchema();
    const result = await turso().execute({
        sql: `SELECT * FROM crawl_runs WHERE project_id = ? AND status = 'completed' ORDER BY datetime(created_at) DESC LIMIT 1`,
        args: [projectId]
    });
    const row = result.rows[0];
    return row ? mapRunRowToAudit(row) : null;
}

export async function getAuditIssues(auditId: string) {
    if (!isCloudSyncEnabled) return [];
    await ensureSchema();
    const result = await turso().execute({
        sql: `SELECT * FROM crawl_issue_clusters WHERE run_id = ? ORDER BY affected_count DESC, priority ASC`,
        args: [auditId]
    });
    return result.rows.map((row) => ({
        id: String(row.id),
        audit_id: String(row.run_id),
        category: row.category,
        title: row.title,
        description: row.description,
        priority: row.priority,
        issue_type: row.issue_type,
        affected_count: asNumber(row.affected_count),
        affected_urls: safeJsonParse<string[]>(row.affected_urls_json, []),
        effort: row.effort,
        score_impact: asNumber(row.score_impact),
        ai_fix: row.ai_fix,
        trend: row.trend,
        traffic_impact: safeJsonParse(row.evidence_json, {})
    }));
}

export async function getAuditPages(auditId: string, page = 0, pageSize = 50) {
    if (!isCloudSyncEnabled) return { pages: [], total: 0 };
    await ensureSchema();
    const offset = page * pageSize;
    const client = turso();
    const totalResult = await client.execute({
        sql: `SELECT COUNT(*) as count FROM crawl_page_insights WHERE run_id = ?`,
        args: [auditId]
    });
    const total = asNumber(totalResult.rows[0]?.count);
    const result = await client.execute({
        sql: `SELECT * FROM crawl_page_insights WHERE run_id = ? ORDER BY has_severe_issues DESC, priority_score DESC LIMIT ? OFFSET ?`,
        args: [auditId, pageSize, offset]
    });

    return {
        pages: result.rows.map((row) => {
            const summary = safeJsonParse<any>(row.summary_json, {});
            return {
                audit_id: String(row.run_id),
                ...summary,
                issues: [],
                full_data: safeJsonParse(row.full_data_json, null)
            };
        }),
        total
    };
}

export async function getAuditHistory(projectId: string, limit = 30) {
    if (!isCloudSyncEnabled) return [];
    await ensureSchema();
    const result = await turso().execute({
        sql: `SELECT * FROM crawl_runs WHERE project_id = ? AND status = 'completed' ORDER BY datetime(created_at) ASC LIMIT ?`,
        args: [projectId, limit]
    });
    return result.rows.map((row) => {
        const audit = mapRunRowToAudit(row);
        return {
            id: audit.id,
            score: audit.score,
            total_pages: audit.total_pages,
            total_issues: audit.total_issues,
            errors_count: audit.errors_count,
            warnings_count: audit.warnings_count,
            notices_count: audit.notices_count,
            created_at: audit.created_at,
            crawl_duration_ms: audit.crawl_duration_ms,
            crawl_rate: audit.crawl_rate
        };
    });
}

export async function getAuditAggregatedMetrics(auditId: string) {
    if (!isCloudSyncEnabled) return { gscClicks: 0, gscImpressions: 0, ga4Sessions: 0, ga4Views: 0 };
    await ensureSchema();
    const result = await turso().execute({
        sql: `SELECT summary_json FROM crawl_runs WHERE id = ? LIMIT 1`,
        args: [auditId]
    });
    const summary = safeJsonParse<any>(result.rows[0]?.summary_json, {});
    const metrics = summary.metrics_summary || {};
    return {
        gscClicks: asNumber(metrics.gscClicks),
        gscImpressions: asNumber(metrics.gscImpressions),
        ga4Sessions: asNumber(metrics.ga4Sessions),
        ga4Views: asNumber(metrics.ga4Views)
    };
}

export async function syncCrawlStatus(params: {
    projectId: string;
    status: 'running' | 'paused' | 'completed' | 'failed' | 'idle';
    progress: number;
    currentUrl?: string;
    urlsCrawled?: number;
    sessionId?: string;
    lastEventType?: string;
    lastEventMessage?: string;
}) {
    if (!isCloudSyncEnabled) return { ok: false, error: 'Cloud sync disabled' };
    await ensureSchema();
    await turso().execute({
        sql: `INSERT OR REPLACE INTO crawl_status (project_id, status, progress, current_url, urls_crawled, session_id, event_type, event_message, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            params.projectId,
            params.status,
            params.progress,
            params.currentUrl || '',
            params.urlsCrawled || 0,
            params.sessionId || '',
            params.lastEventType || '',
            params.lastEventMessage || '',
            nowIso()
        ]
    });
    return { ok: true };
}
