import Dexie, { type Table } from 'dexie';
import { 
  ProjectMember, 
  CrawlComment, 
  CrawlTask, 
  CrawlSubtask, 
  ActivityLog, 
  AssignmentRule, 
  NotificationRecord as Notification 
} from './app-types';
import { CompetitorProfile } from './CompetitorMatrixConfig';

export interface CrawledPage {
  url: string;             // primary key
  crawlId: string;         // which crawl session this belongs to
  // Core SEO
  title: string;
  metaDesc: string;
  h1_1: string;
  canonical: string;
  metaRobots: string;
  statusCode: number;
  contentType: string;
  loadTime: number;
  wordCount: number;
  crawlDepth: number;
  indexable: boolean;
  // Links
  internalOutlinks: number;
  externalOutlinks: number;
  outlinksList?: string[];
  externalLinks?: string[];
  inlinks: number;
  uniqueJsInlinks?: number;
  uniqueJsOutlinks?: number;
  uniqueExternalJsOutlinks?: number;
  nearDuplicateMatch?: string;
  noNearDuplicates?: number;
  closestSemanticAddress?: string;
  semanticSimilarityScore?: number;
  funnelStage?: string;
  spellingErrors?: number;
  grammarErrors?: number;
  metaKeywordsLength?: number;
  metaRobots1?: string;
  metaRobots2?: string;
  redirectType?: string;
  httpRelNext?: string;
  httpRelPrev?: string;
  transferredBytes?: number;
  totalTransferred?: number;
  co2Mg?: number;
  carbonRating?: string;
  
  // ── NEW: Keyword source attribution ──
  mainKeywordSource: 'gsc' | 'upload' | 'ahrefs' | 'semrush' | 'csv' | null;
  bestKeywordSource: 'gsc' | 'upload' | 'ahrefs' | 'semrush' | 'csv' | null;

  // ── NEW: Search volume (never from GSC) ──
  mainKwSearchVolume: number | null;   // from upload/provider ONLY
  bestKwSearchVolume: number | null;   // from upload/provider ONLY

  // ── NEW: Estimated volume (Tier 2 — impression-based) ──
  mainKwEstimatedVolume: number | null;
  bestKwEstimatedVolume: number | null;
  volumeEstimationMethod: 'impression_share' | 'provider' | 'upload' | null;

  // ── CHANGED: Session delta split ──
  sessionsDeltaAbsolute: number | null;  // replaces old sessionsDelta
  sessionsDeltaPct: number | null;       // NEW: percentage change

  // ── NEW: GA4 page-level engagement ──
  ga4EngagementTimePerPage: number | null;  // seconds
  ga4EngagementRate: number | null;         // ratio 0-1

  // ── NEW: Backlink source attribution ──
  backlinkSource: 'ahrefs' | 'semrush' | 'commoncrawl' | 'upload' | 'csv' | null;
  backlinkUploadOverride: boolean;  // true if CSV upload overrode API data

  // ── NEW: Sync coverage metadata ──
  gscEnrichedAt: number | null;     // timestamp
  ga4EnrichedAt: number | null;     // timestamp
  backlinkEnrichedAt: number | null; // timestamp
  
  // ── NEW: Match confidence & join type ──
  gscMatchConfidence: number | null; // 0-100
  ga4MatchConfidence: number | null; // 0-100
  gscJoinType: 'exact' | 'canonical' | 'redirect' | 'path' | null;
  ga4JoinType: 'exact' | 'canonical' | 'redirect' | 'path' | null;

  // ── NEW: HTML-only flag ──
  isHtmlPage: boolean;

  // GSC data (enriched post-crawl)
  gscClicks: number | null;
  gscImpressions: number | null;
  gscCtr: number | null;
  gscPosition: number | null;
  // GSC query-level
  mainKeyword: string | null;
  mainKwVolume: number | null;      // DEPRECATED — keep for compat
  mainKwPosition: number | null;
  bestKeyword: string | null;
  bestKwVolume: number | null;      // DEPRECATED — keep for compat
  bestKwPosition: number | null;
  // GA4 data (enriched post-crawl)
  ga4Views: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4BounceRate: number | null;
  ga4AvgSessionDuration: number | null;
  // GA4 metrics
  ga4Conversions: number | null;
  ga4ConversionRate: number | null;
  ga4GoalCompletions: number | null;
  ga4GoalConversionRate: number | null;
  ga4EcommerceRevenue: number | null;
  ga4EcommerceConversionRate: number | null;
  ga4Transactions: number | null;
  ga4AddtoCart: number | null;
  ga4Checkouts: number | null;
  ga4Revenue: number | null;
  // Period comparison
  sessionsDelta: number | null;       // DEPRECATED
  isLosingTraffic: boolean | null;
  // Ahrefs / SEMrush (enriched post-crawl)
  urlRating: number | null;
  referringDomains: number | null;
  backlinks: number | null;
  // Strategic scores (derived)
  opportunityScore: number | null;
  businessValueScore: number | null;
  authorityScore: number | null;
  recommendedAction: string | null;
  recommendedActionReason: string | null;
  recommendedActionFactors: string | null;
  technicalAction?: string | null;
  technicalActionReason?: string | null;
  contentAction?: string | null;
  contentActionReason?: string | null;
  actionPriority?: number | null;
  estimatedImpact?: number | null;
  techHealthScore: number | null;
  contentQualityScore: number | null;
  searchVisibilityScore: number | null;
  engagementScore: number | null;
  authorityComputedScore: number | null;
  businessComputedScore: number | null;
  pageCategory?: string | null;
  pageValue?: number | null;
  pageValueTier?: string | null;
  speedScore?: string | null;
  expectedCtr?: number | null;
  ctrGap?: number | null;
  intentMatch?: string | null;
  contentAge?: string | null;
  searchIntent: string | null;
  inSitemap: boolean | null;
  sitemapBrokenUrls?: number;
  sitemapLastmodAccurate?: boolean | null;
  sitemapLastmodMismatchCount?: number;
  sitemapValidationSampleSize?: number;
  sitemapValidationTruncated?: boolean;
  finalUrl: string | null;
  
  // ─── Tier 3: AI Analysis (Phase C) ───
  summary?: string;
  intentConfidence?: number;
  eeatScore?: number;
  eeatBreakdown?: Record<string, number>;
  eeatSuggestions?: string[];
  extractedKeywords?: Array<{ phrase: string; intent: string; relevance: number }>;
  entities?: Array<{ name: string; type: string; count: number }>;
  topicCluster?: string;
  primaryTopic?: string;
  fixSuggestions?: Array<{ fix: string; impact: string; effort: string; code?: string }>;
  sentiment?: string;
  sentimentConfidence?: number;
  sentimentTone?: string;
  aiLikelihood?: 'low' | 'medium' | 'high';
  aiConfidence?: number;
  gaps?: Array<{ topic: string; reason: string; priority: string }>;
  originalityScore?: number;
  suggestedMeta?: string;

  // ─── Tier 4: Industry & PSI (Phase C) ───
  fieldLcp?: number | null;
  fieldCls?: number | null;
  fieldInp?: number | null;
  fieldFcp?: number | null;
  fieldTtfb?: number | null;
  lighthousePerformance?: number;
  lighthouseAccessibility?: number;
  lighthouseBestPractices?: number;
  lighthouseSeo?: number;
  lcpElement?: string | null;
  speedIndex?: number | null;
  tbt?: number | null;
  psiEnrichedAt?: number | null;

  // ─── External Enrichment ───
  htmlErrors?: number;
  htmlWarnings?: number;
  securityGrade?: string;
  securityScore?: number;
  waybackSnapshots?: number;
  firstArchived?: string | null;
  lastArchived?: string | null;
  sslGrade?: string;
  sslChainComplete?: boolean | null;
  contentEncoding?: string;
  contentTypeMime?: string;
  contentTypeCharset?: string;
  contentTypeValid?: boolean;
  redirectLoop?: boolean;
  cnameChainLength?: number;
  fcp?: number | null;
  httpRequestCount?: number;
  totalJsBytes?: number;
  totalCssBytes?: number;
  unusedCssPercent?: number;
  unusedJsPercent?: number;
  minFontSize?: number | null;
  oversizedImages?: number;
  brokenImages?: number;
  jsConsoleErrors?: string[];
  hydrationMismatch?: boolean;
  spaRouteBroken?: boolean;
  hasTwitterCard?: boolean;
  twitterCardType?: string;
  twitterImage?: string;
  hasBreadcrumbSchema?: boolean;
  hasFaqSchema?: boolean;
  hasArticleSchema?: boolean;
  hasOrgSchema?: boolean;
  schemaMissingRequired?: string[];

  // ─── Business & AI Discoverability ───
  hasPassageStructure?: boolean;
  hasFeaturedSnippetPatterns?: boolean;
  hasSpeakableSchema?: boolean;
  hasQuestionFormat?: boolean;
  hasPricingPage?: boolean;
  hasTrustBadges?: boolean;
  hasTestimonials?: boolean;
  hasCaseStudies?: boolean;
  hasCustomerLogos?: boolean;
  ctaTexts?: string[];
  socialLinks?: Record<string, boolean>;
  adPlatforms?: Record<string, boolean>;
  hasFormsWithAutocomplete?: boolean;
  industry?: boolean;
  industrySignals?: Record<string, any>;

  // ─── Tier 5: Phase E (GEO, JS Diff, Visual) ───
  passageReadiness?: number;
  voiceSearchScore?: number;
  geoScore?: number;
  citationWorthiness?: number;
  extractionReady?: number;
  entityCoverage?: number;
  freshnessSignal?: number;
  aiOverviewFit?: number;
  geoReasoning?: string;
  geoSuggestions?: string[];
  hasLlmsTxt?: boolean;
  aiBotRules?: Record<string, boolean>;
  aiBotAccess?: Record<string, string>;
  aiBotAccessSummary?: string;
  llmsTxtStatus?: string;
  llmsTxt?: {
    raw: string;
    sections: Array<{ heading: string; lines: string[] }>;
    allow: string[];
    disallow: string[];
    summary: string;
  } | null;
  answerBoxReady?: boolean;
  definitionParagraphs?: number;
  selfContainedAnswers?: number;
  jsRenderDiff?: {
    textDiffPercent: number;
    jsOnlyLinks: number;
    jsOnlyImages: number;
    jsOnlySchema: boolean;
    criticalContentJsOnly: boolean;
    hydrationMismatch: boolean;
    staticWordCount?: number;
    renderedWordCount?: number;
    addedTextSample?: string;
    removedTextSample?: string;
  };
  screenshotUrl?: string;
  visualChangeDetected?: boolean;
  visualDiffPercent?: number | null;
  visualDiffUrl?: string | null;
  googlebotVisits30d?: number;
  googlebotLastVisit?: string | null;
  googlebotAvgFrequency?: string | null;
  botCrawlBudgetShare?: number;
  botServerErrors?: number;
  aiBotVisits30d?: number;
  botResponseTime: number | null;

  // Bing Webmaster (enriched post-crawl)
  bingClicks: number | null;
  bingImpressions: number | null;
  bingPosition: number | null;
  bingCtr: number | null;
  bingCrawlErrors: number | null;
  bingEnrichedAt: number | null;

  // CMS Metadata (WordPress/Shopify enrichment)
  cmsType: 'wordpress' | 'shopify' | null;
  wpPostType: string | null;
  wpCategories: string[] | null;
  wpTags: string[] | null;
  wpAuthor: string | null;
  wpPublishDate: string | null;
  wpModifiedDate: string | null;
  // Shopify (future)
  shopifyProductType: string | null;
  shopifyVendor: string | null;
  shopifyTags: string[] | null;

  // Google Business Profile (local SEO enrichment)
  gbpName: string | null;
  gbpAddress: string | null;
  gbpPhone: string | null;
  gbpCategories: string[] | null;
  gbpHours: string | null;
  gbpReviewCount: number | null;
  gbpAvgRating: number | null;
  gbpEnrichedAt: number | null;

  // Metadata
  timestamp: number;
  // Allow additive crawl metadata fields without breaking typed enrichment writes.
  [key: string]: any;
}

export interface CrawlSession {
  id: string;              // primary key
  projectId: string;
  startUrl: string;
  startedAt: number;
  completedAt: number | null;
  totalPages: number;
  status: 'running' | 'completed' | 'paused' | 'error';
  summaryJson: string | null;  // aggregated metrics
  lastEnrichmentRun: number | null;
  enrichmentCursor: number | null;
}

export interface PageQuery {
  id?: number;             // auto-increment
  crawlId: string;
  pageUrl: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

class CrawlDB extends Dexie {
  pages!: Table<CrawledPage, string>;
  sessions!: Table<CrawlSession, string>;
  queries!: Table<PageQuery, number>;
  members!: Table<ProjectMember, string>;
  comments!: Table<CrawlComment, string>;
  tasks!: Table<CrawlTask, string>;
  subtasks!: Table<CrawlSubtask, string>;
  activity!: Table<ActivityLog, string>;
  rules!: Table<AssignmentRule, string>;
  notifications!: Table<Notification, string>;
  competitorProfiles!: Table<CompetitorProfile & { _key: string }, string>;
  competitorSnapshots!: Table<{ id?: number; projectDomain: string; snapshotAt: number; profile: CompetitorProfile }, number>;

  constructor() {
    super('HeadlightCrawlDB');
    
    this.version(1).stores({
      pages: 'url, crawlId, statusCode, [crawlId+statusCode]',
      sessions: 'id, projectId, startedAt',
      queries: '++id, [crawlId+pageUrl], [crawlId+query]'
    });

    this.version(2).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            page.isHtmlPage = (page.contentType || '').includes('text/html');
            page.mainKeywordSource = page.mainKeyword ? 'gsc' : null;
            page.bestKeywordSource = null;
            page.mainKwSearchVolume = null;
            page.bestKwSearchVolume = null;
            page.mainKwEstimatedVolume = null;
            page.bestKwEstimatedVolume = null;
            page.volumeEstimationMethod = null;
            page.sessionsDeltaAbsolute = page.sessionsDelta || null;
            page.sessionsDeltaPct = null;
            page.ga4EngagementTimePerPage = null;
            page.ga4EngagementRate = null;
            page.backlinkSource = page.urlRating ? 'ahrefs' : null;
            page.backlinkUploadOverride = false;
            page.gscEnrichedAt = null;
            page.ga4EnrichedAt = null;
            page.backlinkEnrichedAt = null;
        });
    });

    this.version(3).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            page.recommendedActionReason = page.recommendedActionReason || null;
            page.recommendedActionFactors = page.recommendedActionFactors || null;
            page.techHealthScore = page.techHealthScore ?? null;
            page.contentQualityScore = page.contentQualityScore ?? null;
            page.searchVisibilityScore = page.searchVisibilityScore ?? null;
            page.engagementScore = page.engagementScore ?? null;
            page.authorityComputedScore = page.authorityComputedScore ?? null;
            page.businessComputedScore = page.businessComputedScore ?? null;
            page.inSitemap = page.inSitemap ?? null;
            page.finalUrl = page.finalUrl || page.redirectUrl || page.url || null;
        });
    });

    this.version(4).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            page.gscMatchConfidence = null;
            page.ga4MatchConfidence = null;
            page.gscJoinType = null;
            page.ga4JoinType = null;
        });
    });

    this.version(5).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
    }).upgrade(tx => {
        const pagesPromise = tx.table('pages').toCollection().modify(page => {
            page.ga4GoalCompletions = null;
            page.ga4GoalConversionRate = null;
            page.ga4EcommerceRevenue = null;
            page.ga4EcommerceConversionRate = null;
            page.ga4Transactions = null;
            page.ga4AddtoCart = null;
            page.ga4Checkouts = null;
        });
        const sessionsPromise = tx.table('sessions').toCollection().modify(session => {
            session.lastEnrichmentRun = null;
            session.enrichmentCursor = null;
        });
        return Promise.all([pagesPromise, sessionsPromise]);
    });

    this.version(6).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            page.hasHsts = page.hasHsts ?? (page.hstsMissing === false ? true : false);
            page.hasCsp = page.hasCsp ?? (page.cspPresent === true ? true : false);
            page.hasXFrameOptions = page.hasXFrameOptions ?? (page.xFrameMissing === false ? true : false);
            page.hasXContentTypeOptions = page.hasXContentTypeOptions ?? (page.xContentTypeNoSniff === true);
            page.hasCacheControl = page.hasCacheControl ?? false;
            page.hasEtag = page.hasEtag ?? false;
            page.hasLastModified = page.hasLastModified ?? false;
            page.hasExpires = page.hasExpires ?? false;
            page.cookieCount = page.cookieCount ?? 0;
            page.insecureCookies = page.insecureCookies ?? 0;
            page.cookiesMissingSameSite = page.cookiesMissingSameSite ?? 0;
            page.dnsResolutionTime = page.dnsResolutionTime ?? 0;
            page.sslValid = page.sslValid ?? null;
            page.domNodeCount = page.domNodeCount ?? null;
            page.hasMainLandmark = page.hasMainLandmark ?? null;
            page.isSoft404 = page.isSoft404 ?? false;
        });
    });

    this.version(7).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
        members: 'id, projectId, userId',
        comments: 'id, projectId, sessionId, targetType, targetId, createdAt',
        tasks: 'id, projectId, sessionId, status, priority, assigneeId, createdAt',
        subtasks: 'id, taskId, sortOrder',
        activity: 'id, projectId, entityType, entityId, createdAt',
        rules: 'id, projectId, enabled',
        notifications: 'id, userId, projectId, read, createdAt'
    });

    this.version(8).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            page.summary = null;
            page.intentConfidence = null;
            page.eeatScore = null;
            page.originalityScore = null;
            page.sentiment = null;
            page.aiLikelihood = null;
        });
    });

    this.version(9).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            page.geoScore = page.geoScore ?? null;
            page.passageReadiness = page.passageReadiness ?? null;
            page.voiceSearchScore = page.voiceSearchScore ?? null;
            page.citationWorthiness = page.citationWorthiness ?? null;
            page.extractionReady = page.extractionReady ?? null;
            page.aiOverviewFit = page.aiOverviewFit ?? null;
            page.hasLlmsTxt = page.hasLlmsTxt ?? false;
            page.visualChangeDetected = page.visualChangeDetected ?? false;
        });
    });

    this.version(10).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
        members: 'id, projectId, userId',
        comments: 'id, projectId, sessionId, targetType, targetId, createdAt',
        tasks: 'id, projectId, sessionId, status, priority, assigneeId, createdAt',
        subtasks: 'id, taskId, sortOrder',
        activity: 'id, projectId, entityType, entityId, createdAt',
        rules: 'id, projectId, enabled',
        notifications: 'id, userId, projectId, read, createdAt, [userId+projectId+read]'
    });

    this.version(11).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            // Bing
            page.bingClicks = null;
            page.bingImpressions = null;
            page.bingPosition = null;
            page.bingCtr = null;
            page.bingCrawlErrors = null;
            page.bingEnrichedAt = null;
            // CMS
            page.cmsType = null;
            page.wpPostType = null;
            page.wpCategories = null;
            page.wpTags = null;
            page.wpAuthor = null;
            page.wpPublishDate = null;
            page.wpModifiedDate = null;
            page.shopifyProductType = null;
            page.shopifyVendor = null;
            page.shopifyTags = null;
            // GBP
            page.gbpName = null;
            page.gbpAddress = null;
            page.gbpPhone = null;
            page.gbpCategories = null;
            page.gbpHours = null;
            page.gbpReviewCount = null;
            page.gbpAvgRating = null;
            page.gbpEnrichedAt = null;
        });
    });

    this.version(12).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            page.sslGrade = page.sslGrade ?? null;
            page.sslChainComplete = page.sslChainComplete ?? null;
            page.cnameChainLength = page.cnameChainLength ?? 0;
            page.minFontSize = page.minFontSize ?? null;
            page.hydrationMismatch = page.hydrationMismatch ?? false;
            page.spaRouteBroken = page.spaRouteBroken ?? false;
        });
    });

    this.version(13).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            page.spaRouteBroken = page.spaRouteBroken ?? false;
            page.sitemapBrokenUrls = page.sitemapBrokenUrls ?? 0;
            page.sitemapLastmodAccurate = page.sitemapLastmodAccurate ?? null;
            page.sitemapLastmodMismatchCount = page.sitemapLastmodMismatchCount ?? 0;
            page.sitemapValidationSampleSize = page.sitemapValidationSampleSize ?? 0;
            page.sitemapValidationTruncated = page.sitemapValidationTruncated ?? false;
        });
    });

    this.version(14).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
        competitorProfiles: '_key, domain, [domain+_meta.crawledAt]'
    });

    this.version(15).stores({
        competitorSnapshots: '++id, projectDomain, snapshotAt'
    });

    this.version(16).stores({
        pages: 'url, crawlId, isHtmlPage, statusCode, [crawlId+statusCode]',
        sessions: 'id, projectId, startedAt',
    }).upgrade(tx => {
        return tx.table('pages').toCollection().modify(page => {
            page.pageCategory = page.pageCategory ?? null;
            page.pageValue = page.pageValue ?? null;
            page.pageValueTier = page.pageValueTier ?? null;
            page.speedScore = page.speedScore ?? null;
            page.expectedCtr = page.expectedCtr ?? null;
            page.ctrGap = page.ctrGap ?? null;
            page.intentMatch = page.intentMatch ?? null;
            page.contentAge = page.contentAge ?? null;
            page.technicalAction = page.technicalAction ?? null;
            page.technicalActionReason = page.technicalActionReason ?? null;
            page.contentAction = page.contentAction ?? null;
            page.contentActionReason = page.contentActionReason ?? null;
            page.actionPriority = page.actionPriority ?? null;
            page.estimatedImpact = page.estimatedImpact ?? null;
        });
    });
  }
}

export const crawlDb = new CrawlDB();

// Helper: bulk upsert pages
export async function upsertPages(pages: CrawledPage[]) {
  await crawlDb.pages.bulkPut(pages);
}

// Helper: get all pages for a crawl
export async function getCrawlPages(crawlId: string): Promise<CrawledPage[]> {
  return crawlDb.pages.where('crawlId').equals(crawlId).toArray();
}

// Helper: get HTML-only pages for enrichment
export async function getHtmlPages(crawlId: string): Promise<CrawledPage[]> {
  return crawlDb.pages
    .where('crawlId').equals(crawlId)
    .filter(p => p.isHtmlPage === true)
    .toArray();
}

// Helper: update GSC/GA4 data for a batch of URLs
export async function enrichPages(
  updates: Array<{ url: string } & Partial<CrawledPage>>
) {
  await crawlDb.transaction('rw', crawlDb.pages, async () => {
    for (const update of updates) {
      await crawlDb.pages.update(update.url, update);
    }
  });
}

// Helper: store query-level data
export async function storePageQueries(queries: PageQuery[]) {
  await crawlDb.queries.bulkAdd(queries);
}

// Helper: get queries for a page
export async function getPageQueries(
  crawlId: string, 
  pageUrl: string
): Promise<PageQuery[]> {
  return crawlDb.queries
    .where('[crawlId+pageUrl]')
    .equals([crawlId, pageUrl])
    .toArray();
}

// Helper: clear old crawl data (keep last N crawls)
export async function pruneOldCrawls(projectId: string, keepLast = 5) {
  const sessions = await crawlDb.sessions
    .where('projectId').equals(projectId)
    .sortBy('startedAt');
  
  if (sessions.length <= keepLast) return;
  
  const toDelete = sessions.slice(0, sessions.length - keepLast);
  for (const session of toDelete) {
    await crawlDb.pages.where('crawlId').equals(session.id).delete();
    await crawlDb.queries.where('crawlId').equals(session.id).delete();
    await crawlDb.sessions.delete(session.id);
  }
}

// Helper: export crawl to downloadable JSON
export async function exportCrawl(crawlId: string): Promise<Blob> {
  const [session, pages, queries] = await Promise.all([
    crawlDb.sessions.get(crawlId),
    getCrawlPages(crawlId),
    crawlDb.queries.where('crawlId').equals(crawlId).toArray()
  ]);
  const data = JSON.stringify({ session, pages, queries });
  return new Blob([data], { type: 'application/json' });
}

// Helper: import crawl from file
export async function importCrawl(file: File): Promise<string> {
  const text = await file.text();
  const { session, pages, queries } = JSON.parse(text);
  await crawlDb.sessions.put(session);
  await crawlDb.pages.bulkPut(pages);
  await crawlDb.queries.bulkAdd(queries);
  return session.id;
}

// ─── Competitor Profile Helpers ─────────────────────────────────

export async function saveCompetitorProfile(projectId: string, profile: CompetitorProfile): Promise<void> {
  const key = `${projectId}::${profile.domain}`;
  await crawlDb.competitorProfiles.put({ ...profile, _key: key });
}

export async function loadCompetitorProfiles(projectId: string): Promise<CompetitorProfile[]> {
  const all = await crawlDb.competitorProfiles.toArray();
  const prefix = `${projectId}::`;
  return all
    .filter(p => p._key.startsWith(prefix))
    .map(({ _key, ...profile }) => profile as CompetitorProfile);
}

export async function deleteCompetitorProfile(projectId: string, domain: string): Promise<void> {
  await crawlDb.competitorProfiles.delete(`${projectId}::${domain}`);
}

// ─── Competitor Snapshot Helpers ─────────────────────────────────

export async function saveCompetitorSnapshot(
  projectId: string,
  profile: CompetitorProfile
): Promise<void> {
  await crawlDb.competitorSnapshots.add({
    projectDomain: `${projectId}::${profile.domain}`,
    snapshotAt: Date.now(),
    profile: JSON.parse(JSON.stringify(profile)), // deep clone
  });
}

export async function getCompetitorSnapshots(
  projectId: string,
  domain: string,
  limit = 30
): Promise<Array<{ snapshotAt: number; profile: CompetitorProfile }>> {
  return crawlDb.competitorSnapshots
    .where('projectDomain')
    .equals(`${projectId}::${domain}`)
    .reverse()
    .limit(limit)
    .toArray();
}
