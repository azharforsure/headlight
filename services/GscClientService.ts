import {
    crawlDb,
    getHtmlPages,
    storePageQueries,
    type CrawledPage,
    type PageQuery
} from './CrawlDatabase';
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

export interface GscEnrichmentOptions {
    targetUrls?: string[];
    maxPageRows?: number;
    maxQueryRows?: number;
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
            const nextLimit = Math.min(rowLimit, maxRows - startRow);
            if (nextLimit <= 0) break;
            const body: any = {
                startDate,
                endDate,
                dimensions,
                rowLimit: nextLimit,
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
            if (data.rows.length < nextLimit) break;
            startRow += nextLimit;
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
        return (
            (row.clicks * 1000) +
            (row.impressions * 0.1) +
            (Math.max(0, 101 - row.position) * 5) +
            (row.ctr * 1000)
        );
    }

    private static isBetterBestKeyword(candidate: GscMetricRow, current: GscMetricRow | null): boolean {
        if (!current) return true;
        if (candidate.position !== current.position) {
            return candidate.position < current.position;
        }
        if (candidate.clicks !== current.clicks) {
            return candidate.clicks > current.clicks;
        }
        return candidate.impressions > current.impressions;
    }

    /**
     * Unified GSC Enrichment
     */
    static async enrichSession(
        sessionId: string,
        siteUrl: string,
        accessToken: string,
        onProgress?: (msg: string) => void,
        options: GscEnrichmentOptions = {}
    ): Promise<{ enriched: number; total: number; rowsCollected: number; queryRowsStored: number }> {
        const htmlPages = await getHtmlPages(sessionId);
        const targetCanonicalSet = new Set(
            (options.targetUrls || htmlPages.map((page) => page.url)).map((url) => UrlNormalization.toCanonical(url))
        );
        const targetPages = htmlPages.filter((page) => targetCanonicalSet.has(UrlNormalization.toCanonical(page.url)));

        if (targetPages.length === 0) {
            return { enriched: 0, total: 0, rowsCollected: 0, queryRowsStored: 0 };
        }

        const maxPageRows = options.maxPageRows || Math.min(50000, Math.max(25000, targetPages.length * 2));
        const maxQueryRows = options.maxQueryRows || Math.min(50000, Math.max(25000, targetPages.length * 8));

        onProgress?.('Fetching GSC Page-level data...');
        const pageRows = await this.fetchPaginated(siteUrl, accessToken, ['page'], 30, maxPageRows);
        
        onProgress?.(`Processing ${pageRows.length} landing pages...`);
        const queryRows = await this.fetchPaginated(siteUrl, accessToken, ['page', 'query'], 30, maxQueryRows);

        // 1. Map pages to metrics
        const targetPageUrlByCanonical = new Map<string, string>(
            targetPages.map((page) => [UrlNormalization.toCanonical(page.url), page.url])
        );
        const pageMetricsMap = new Map<string, GscMetricRow>();
        pageRows.forEach(row => {
            const canonical = UrlNormalization.toCanonical(row.keys[0]);
            if (targetCanonicalSet.has(canonical)) {
                pageMetricsMap.set(canonical, row);
            }
        });

        // 2. Strategic Keyword Mapping
        // Map: URL -> { mainKeyword, bestKeyword, estimatedVolume }
        const urlIntelligence = new Map<string, any>();
        const storedQueries: PageQuery[] = [];

        queryRows.forEach(row => {
            const url = row.keys[0];
            const query = row.keys[1];
            const canonical = UrlNormalization.toCanonical(url);
            if (!targetCanonicalSet.has(canonical) || !query) return;

            const score = this.scoreKeyword(row);

            const existing = urlIntelligence.get(canonical) || { 
                main: null, 
                best: null, 
                mainScore: -1, 
                bestRow: null
            };

            // Main Keyword logic: strategic opportunity on the page.
            if (score > existing.mainScore) {
                existing.main = { query, row };
                existing.mainScore = score;
            }

            // Best Keyword logic: strongest currently ranking query.
            if (this.isBetterBestKeyword(row, existing.bestRow)) {
                existing.best = { query, row };
                existing.bestRow = row;
            }

            urlIntelligence.set(canonical, existing);

            storedQueries.push({
                crawlId: sessionId,
                pageUrl: targetPageUrlByCanonical.get(canonical) || canonical,
                query,
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: row.ctr,
                position: row.position
            });
        });

        // 3. Replace persisted query rows for the target set.
        await crawlDb.transaction('rw', crawlDb.queries, async () => {
            for (const page of targetPages) {
                await crawlDb.queries
                    .where('[crawlId+pageUrl]')
                    .equals([sessionId, page.url])
                    .delete();
            }
        });
        if (storedQueries.length > 0) {
            await storePageQueries(storedQueries);
        }

        // 4. Sync page metrics to IndexedDB
        let enrichedCount = 0;
        const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

        for (const page of targetPages) {
            const canonical = UrlNormalization.toCanonical(page.url);
            const metrics = pageMetricsMap.get(canonical);
            const intel = urlIntelligence.get(canonical);
            const preservePrimaryKeyword = Boolean(
                page.mainKeyword &&
                page.mainKeywordSource &&
                page.mainKeywordSource !== 'gsc'
            );

            if (metrics || intel) {
                enrichedCount++;
                const update: Partial<CrawledPage> = {
                    gscClicks: metrics?.clicks ?? 0,
                    gscImpressions: metrics?.impressions ?? 0,
                    gscCtr: metrics?.ctr ?? 0,
                    gscPosition: metrics?.position ?? 0,
                    gscEnrichedAt: Date.now()
                };

                if (!preservePrimaryKeyword && intel?.main) {
                    update.mainKeyword = intel.main.query;
                    update.mainKwPosition = intel.main.row.position;
                    update.mainKeywordSource = 'gsc';
                    update.mainKwSearchVolume = null;
                    // Estimate volume from GSC impressions (Tier 2)
                    update.mainKwEstimatedVolume = VolumeEstimation.fromImpressions(
                        intel.main.row.impressions, 
                        intel.main.row.position
                    );
                    update.volumeEstimationMethod = 'impression_share';
                }

                if (intel?.best) {
                    update.bestKeyword = intel.best.query;
                    update.bestKwPosition = intel.best.row.position;
                    update.bestKeywordSource = 'gsc';
                    update.bestKwSearchVolume = null;
                    update.bestKwEstimatedVolume = VolumeEstimation.fromImpressions(
                        intel.best.row.impressions,
                        intel.best.row.position
                    );
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
            total: targetPages.length,
            rowsCollected: pageRows.length + queryRows.length,
            queryRowsStored: storedQueries.length
        };
    }
}
