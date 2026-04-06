import { crawlDb, type CrawledPage } from './CrawlDatabase';

export interface GscMetricRow {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
}

export interface GscResponse {
    rows?: GscMetricRow[];
}

export class GscClientService {
    private static API_BASE = 'https://www.googleapis.com/webmasters/v3/sites';

    /**
     * Get start and end date for GSC API
     */
    private static getDates(days: number = 30) {
        // GSC data usually lags by 2-3 days
        const end = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
        
        return {
            endDate: end.toISOString().split('T')[0],
            startDate: start.toISOString().split('T')[0]
        };
    }

    /**
     * Internal paginated fetcher for GSC Search Analytics
     */
    private static async fetchPaginated(
        siteUrl: string,
        accessToken: string,
        dimensions: string[],
        days: number = 30,
        filters: any[] = []
    ): Promise<GscMetricRow[]> {
        const { startDate, endDate } = this.getDates(days);
        const allRows: GscMetricRow[] = [];
        let startRow = 0;
        const rowLimit = 25000;

        while (true) {
            const body: any = {
                startDate,
                endDate,
                dimensions,
                rowLimit,
                startRow
            };

            if (filters.length > 0) {
                body.dimensionFilterGroups = [{ filters }];
            }

            const response = await fetch(
                `${this.API_BASE}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    signal: AbortSignal.timeout(60000), // 60s timeout for large GSC queries
                    body: JSON.stringify(body)
                }
            );

            if (!response.ok) {
                const error = await response.json();
                console.error('[GSC] Paginated Fetch Error:', error);
                throw new Error(`GSC Fetch Failed at row ${startRow}: ${error.error?.message || response.statusText}`);
            }

            const data: GscResponse = await response.json();
            if (!data.rows || data.rows.length === 0) break;

            allRows.push(...data.rows);
            
            if (data.rows.length < rowLimit) break;
            startRow += rowLimit;
            
            // Safety cap to prevent infinite loops / 1,000,000+ rows (Adjust as needed)
            if (startRow >= 500000) break; 
        }

        return allRows;
    }

    /**
     * Fetch Page-level metrics (Clicks, Impressions, CTR, Position)
     */
    static async fetchPageMetrics(siteUrl: string, accessToken: string, days: number = 30) {
        return this.fetchPaginated(siteUrl, accessToken, ['page'], days);
    }

    /**
     * Fetch Query-level metrics (Top keyword per page)
     */
    static async fetchQueryMetrics(siteUrl: string, accessToken: string, days: number = 30) {
        return this.fetchPaginated(siteUrl, accessToken, ['page', 'query'], days);
    }

    /**
     * Full Enrichment Pipeline for GSC
     */
    static async enrichSession(
        sessionId: string,
        siteUrl: string,
        accessToken: string,
        onProgress?: (msg: string) => void
    ): Promise<{ enriched: number; total: number }> {
        onProgress?.('Fetching GSC Page-level data...');
        const pageRows = await this.fetchPageMetrics(siteUrl, accessToken);
        
        onProgress?.('Fetching GSC Query-level intelligence...');
        const queryRows = await this.fetchQueryMetrics(siteUrl, accessToken);

        onProgress?.('Processing Search Intelligence...');
        
        // 1. Map pages to metrics
        const pageMap = new Map<string, GscMetricRow>();
        pageRows.forEach(row => pageMap.set(row.keys[0], row));

        // 2. Map pages to their best keyword (highest clicks, then highest impressions)
        const bestKeywordMap = new Map<string, { query: string; clicks: number; impressions: number; position: number }>();
        queryRows.forEach(row => {
            const url = row.keys[0];
            const query = row.keys[1];
            const currentBest = bestKeywordMap.get(url);
            
            if (!currentBest || row.clicks > currentBest.clicks || (row.clicks === currentBest.clicks && row.impressions > currentBest.impressions)) {
                bestKeywordMap.set(url, {
                    query,
                    clicks: row.clicks,
                    impressions: row.impressions,
                    position: row.position
                });
            }
        });

        // 3. Update IndexedDB
        const pages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();
        let enrichedCount = 0;

        const updates = pages.map(page => {
            const gscUrl = this.matchUrlToGsc(page.url, Array.from(pageMap.keys()));
            const metrics = gscUrl ? pageMap.get(gscUrl) : null;
            const topKw = gscUrl ? bestKeywordMap.get(gscUrl) : null;

            if (metrics || topKw) {
                enrichedCount++;
                return {
                    ...page,
                    gscClicks: metrics?.clicks ?? page.gscClicks,
                    gscImpressions: metrics?.impressions ?? page.gscImpressions,
                    gscCtr: metrics?.ctr ?? page.gscCtr,
                    gscPosition: metrics?.position ?? page.gscPosition,
                    mainKeyword: topKw?.query ?? page.mainKeyword,
                    mainKwVolume: topKw?.impressions ?? page.mainKwVolume, 
                    mainKwPosition: topKw?.position ?? page.mainKwPosition,
                    lastEnrichedAt: Date.now()
                };
            }
            return page;
        });

        if (enrichedCount > 0) {
            await crawlDb.pages.bulkPut(updates);
        }

        return { enriched: enrichedCount, total: pages.length };
    }

    /**
     * Normalized URL matching between Crawler and GSC
     */
    private static matchUrlToGsc(crawlerUrl: string, gscUrls: string[]): string | null {
        // 1. Direct match
        if (gscUrls.includes(crawlerUrl)) return crawlerUrl;
        
        // 2. Normalization Helper
        const clean = (u: string) => u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
        const crawlerClean = clean(crawlerUrl);
        
        // 3. Exact normalized match (Strip protocol, www, and trailing slash)
        const match = gscUrls.find(u => clean(u) === crawlerClean);
        if (match) return match;

        // 4. Fallback: Check with/without trailing slash directly
        const crawlerNoSlash = crawlerUrl.replace(/\/$/, '');
        if (gscUrls.includes(crawlerNoSlash)) return crawlerNoSlash;
        if (gscUrls.includes(crawlerNoSlash + '/')) return crawlerNoSlash + '/';

        return null;
    }
}
