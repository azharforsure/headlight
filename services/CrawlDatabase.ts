import Dexie, { type Table } from 'dexie';
import type { 
  ProjectMember, 
  CrawlComment, 
  CrawlTask, 
  CrawlSubtask, 
  ActivityLog, 
  AssignmentRule, 
  NotificationRecord as Notification 
} from './app-types';

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
  backlinkSource: 'ahrefs' | 'semrush' | 'upload' | 'csv' | null;
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
  techHealthScore: number | null;
  contentQualityScore: number | null;
  searchVisibilityScore: number | null;
  engagementScore: number | null;
  authorityComputedScore: number | null;
  businessComputedScore: number | null;
  searchIntent: string | null;
  inSitemap: boolean | null;
  finalUrl: string | null;
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
