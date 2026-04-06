import Dexie, { type Table } from 'dexie';

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
  // GSC data (enriched post-crawl)
  gscClicks: number | null;
  gscImpressions: number | null;
  gscCtr: number | null;
  gscPosition: number | null;
  // GSC query-level (NEW)
  mainKeyword: string | null;
  mainKwVolume: number | null;
  mainKwPosition: number | null;
  bestKeyword: string | null;
  bestKwVolume: number | null;
  bestKwPosition: number | null;
  // GA4 data (enriched post-crawl)
  ga4Views: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4BounceRate: number | null;
  ga4AvgSessionDuration: number | null;
  // GA4 NEW metrics
  ga4Conversions: number | null;
  ga4ConversionRate: number | null;
  ga4Revenue: number | null;
  // Period comparison (NEW)
  sessionsDelta: number | null;       // % change vs previous period
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
  searchIntent: string | null;
  // Metadata
  timestamp: number;
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

  constructor() {
    super('HeadlightCrawlDB');
    this.version(1).stores({
      pages: 'url, crawlId, statusCode, [crawlId+statusCode]',
      sessions: 'id, projectId, startedAt',
      queries: '++id, [crawlId+pageUrl], [crawlId+query]'
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
    .filter(p => p.contentType?.includes('html'))
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
