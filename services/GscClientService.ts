import { crawlDb, type CrawledPage } from './CrawlDatabase';
import { UrlNormalization } from './UrlNormalization';
import { VolumeEstimation } from './VolumeEstimation';

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
        const end = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
        
        return {
            endDate: end.toISOString().split('T')[0],
            startDate: start.toISOString().split('T')[0]
        };
    }

    /**
     * Paginated fetcher for GSC Search Analytics
     */
    private static async fetchPaginated(
        siteUrl: string,
        accessToken: string,
        dimensions: string[],
        days: number = 30,
        maxRows: number = 1000000
    ): Promise<GscMetricRow[]> {
        const { startDate, endDate } = this.getDates(days);
        const allRows: GscMetricRow[] = [];
        let startRow = 0;
        const rowLimit = 25000;

        while (startRow < maxRows) {
            const body: any = {
                startDate,
                endDate,
                dimensions,
                rowLimit,
                startRow
            };

            const response = await fetch(
                `${this.API_BASE}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`GSC Fetch Failed: ${error.error?.message || response.statusText}`);
            }

            const data: GscResponse = await response.json();
            if (!data.rows || data.rows.length === 0) break;

            allRows.push(...data.rows);
            if (data.rows.length < rowLimit) break;
            startRow += rowLimit;
        }

        return allRows;
    }

    /**
     * Strategic Keyword Scoring
     * 1. Keywords with Clicks
     * 2. Highest Impressions
     * 3. Best Average Position
     */
    private static scoreKeyword(row: GscMetricRow): number {
        return (row.clicks * 1000) + (row.impressions / 10) + (100 - row.position);
    }

    /**
     * Unified GSC Enrichment
     */
    static async enrichSession(
        sessionId: string,
        siteUrl: string,
        accessToken: string,
        onProgress?: (msg: string) => void
    ): Promise<{ enriched: number; total: number; rowsCollected: number }> {
        onProgress?.('Fetching GSC Page-level data...');
        const pageRows = await this.fetchPaginated(siteUrl, accessToken, ['page']);
        
        onProgress?.(`Processing ${pageRows.length} landing pages...`);
        const queryRows = await this.fetchPaginated(siteUrl, accessToken, ['page', 'query']);

        // 1. Map pages to metrics
        const pageMetricsMap = new Map<string, GscMetricRow>();
        pageRows.forEach(row => {
            pageMetricsMap.set(UrlNormalization.toCanonical(row.keys[0]), row);
        });

        // 2. Strategic Keyword Mapping
        // Map: URL -> { mainKeyword, bestKeyword, estimatedVolume }
        const urlIntelligence = new Map<string, any>();

        queryRows.forEach(row => {
            const url = row.keys[0];
            const query = row.keys[1];
            const canonical = UrlNormalization.toCanonical(url);
            const score = this.scoreKeyword(row);

            const existing = urlIntelligence.get(canonical) || { 
                main: null, 
                best: null, 
                mainScore: -1, 
                bestScore: -1 
            };

            // Main Keyword logic (Usually highest clicks/impressions)
            if (score > existing.mainScore) {
                existing.main = { query, row };
                existing.mainScore = score;
            }

            urlIntelligence.set(canonical, existing);
        });

        // 3. Sync to IndexedDB
        const pages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();
        let enrichedCount = 0;
        const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

        for (const page of pages) {
            const canonical = UrlNormalization.toCanonical(page.url);
            const metrics = pageMetricsMap.get(canonical);
            const intel = urlIntelligence.get(canonical);

            if (metrics || intel) {
                enrichedCount++;
                const update: Partial<CrawledPage> = {
                    gscClicks: metrics?.clicks ?? 0,
                    gscImpressions: metrics?.impressions ?? 0,
                    gscCtr: metrics?.ctr ?? 0,
                    gscPosition: metrics?.position ?? 0,
                    gscEnrichedAt: Date.now()
                };

                if (intel?.main) {
                    update.mainKeyword = intel.main.query;
                    update.mainKwPosition = intel.main.row.position;
                    update.mainKeywordSource = 'gsc';
                    // Estimate volume from GSC impressions (Tier 2)
                    update.mainKwEstimatedVolume = VolumeEstimation.fromImpressions(
                        intel.main.row.impressions, 
                        intel.main.row.position
                    );
                    update.volumeEstimationMethod = 'impression_share';
                }

                updates.push({ url: page.url, ...update });
            }
        }

        if (updates.length > 0) {
            await crawlDb.transaction('rw', crawlDb.pages, async () => {
                for (const update of updates) {
                    await crawlDb.pages.update(update.url, update);
                }
            });
        }

        return { 
            enriched: enrichedCount, 
            total: pages.length, 
            rowsCollected: pageRows.length + queryRows.length 
        };
    }
}
