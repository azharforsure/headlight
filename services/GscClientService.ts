import {
    crawlDb,
    getHtmlPages,
    storePageQueries,
    type CrawledPage,
    type PageQuery
} from './CrawlDatabase';
import { refreshGoogleToken } from './GoogleOAuthHelper';
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
    googleEmail?: string;
    days?: number;
}

export class GscClientService {
    private static API_BASE = 'https://www.googleapis.com/webmasters/v3/sites';

    /**
     * Exponential Backoff Wrapper for fetch
     */
    private static async backoffFetch(fn: () => Promise<Response>, retries = 3): Promise<Response> {
        let delay = 1000;
        for (let i = 0; i <= retries; i++) {
            try {
                const response = await fn();
                if (response.status === 429 || (response.status >= 500 && i < retries)) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                    continue;
                }
                return response;
            } catch (err) {
                if (i === retries) throw err;
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
        throw new Error('Retries exceeded');
    }

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
        maxRows: number = 1000000,
        googleEmail?: string
    ): Promise<GscMetricRow[]> {
        const { startDate, endDate } = this.getDates(days);
        const allRows: GscMetricRow[] = [];
        let startRow = 0;
        const rowLimit = 25000;
        let currentAccessToken = accessToken;

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

            const response = await this.backoffFetch(() => fetch(
                `${this.API_BASE}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${currentAccessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }
            ));

            if (response.status === 401 && googleEmail) {
                const refreshedAccessToken = await refreshGoogleToken(googleEmail);
                if (refreshedAccessToken && refreshedAccessToken !== currentAccessToken) {
                    currentAccessToken = refreshedAccessToken;
                    continue;
                }
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(`GSC API Error: ${error.error?.message || response.statusText}`);
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
     * Deep GSC Enrichment with Two-Tier Fetch Strategy
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

        if (targetPages.length === 0 && !options.maxPageRows) {
            return { enriched: 0, total: 0, rowsCollected: 0, queryRowsStored: 0 };
        }

        // TIER 1: Page-level Summary (All traffic-carrying pages)
        // We fetch a larger set than targetPages to identify "Discovered but not crawled" or "Losing traffic"
        const maxPageRows = options.maxPageRows || 100000;
        onProgress?.(`Fetching GSC Page Summary (up to ${maxPageRows.toLocaleString()} rows)...`);
        const pageRows = await this.fetchPaginated(siteUrl, accessToken, ['page'], options.days || 30, maxPageRows, options.googleEmail);
        
        // TIER 2: Page + Query Details (Strategic priority pages only)
        // We only fetch query details for pages we actually found in the crawl or were explicitly targeted
        const maxQueryRows = options.maxQueryRows || 250000;
        onProgress?.(`Fetching GSC Page+Query Details (up to ${maxQueryRows.toLocaleString()} rows)...`);
        const queryRows = await this.fetchPaginated(siteUrl, accessToken, ['page', 'query'], options.days || 30, maxQueryRows, options.googleEmail);

        // 1. Map all GSC rows by canonical URL for O(1) lookup
        const gscCanonicalMap = new Map<string, GscMetricRow>();
        const gscPathMap = new Map<string, GscMetricRow>();

        pageRows.forEach(row => {
            const url = row.keys[0];
            const canonical = UrlNormalization.toCanonical(url);
            gscCanonicalMap.set(canonical, row);

            // Path-level map for fallback (low confidence)
            const path = url.split('?')[0].split('#')[0].replace(/^https?:\/\/[^\/]+/, '').replace(/\/$/, '') || '/';
            if (path !== '/' && !gscPathMap.has(path)) {
                gscPathMap.set(path, row);
            }
        });

        // 2. Query Intelligence (Main/Best Keyword assignment)
        const targetPageUrlByCanonical = new Map<string, string>(
            targetPages.map((page) => [UrlNormalization.toCanonical(page.url), page.url])
        );
        const urlIntelligence = new Map<string, any>();
        const storedQueries: PageQuery[] = [];

        queryRows.forEach(row => {
            const url = row.keys[0];
            const query = row.keys[1];
            const canonical = UrlNormalization.toCanonical(url);
            
            if (!gscCanonicalMap.has(canonical) || !query) return;

            const score = this.scoreKeyword(row);
            const existing = urlIntelligence.get(canonical) || { 
                main: null, 
                best: null, 
                mainScore: -1, 
                bestRow: null
            };

            if (score > existing.mainScore) {
                existing.main = { query, row };
                existing.mainScore = score;
            }

            if (this.isBetterBestKeyword(row, existing.bestRow)) {
                existing.best = { query, row };
                existing.bestRow = row;
            }

            urlIntelligence.set(canonical, existing);

            // Store in Query DB if it's part of our crawl
            if (targetCanonicalSet.has(canonical)) {
                storedQueries.push({
                    crawlId: sessionId,
                    pageUrl: targetPageUrlByCanonical.get(canonical) || canonical,
                    query,
                    clicks: row.clicks,
                    impressions: row.impressions,
                    ctr: row.ctr,
                    position: row.position
                });
            }
        });

        // 3. Persist Query Data
        if (storedQueries.length > 0) {
            await crawlDb.transaction('rw', crawlDb.queries, async () => {
                for (const page of targetPages) {
                    await crawlDb.queries
                        .where('[crawlId+pageUrl]')
                        .equals([sessionId, page.url])
                        .delete();
                }
            });
            await storePageQueries(storedQueries);
        }

        // 4. Update CrawledPage records with Layered Joining
        let enrichedCount = 0;
        const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

        for (const page of targetPages) {
            let bestMatch: GscMetricRow | null = null;
            let bestResult: any = { joinType: null, confidence: 0 };

            // LAYERED JOIN: find the best GSC row for this page
            const canonical = UrlNormalization.toCanonical(page.url);
            
            // Try exact/canonical/redirect joins via map
            const candidates = [page.url, canonical, page.finalUrl].filter(Boolean) as string[];
            for (const candidate of candidates) {
                const row = gscCanonicalMap.get(UrlNormalization.toCanonical(candidate));
                if (row) {
                    const result = UrlNormalization.getMatchResult(page.url, row.keys[0], page.finalUrl || undefined);
                    if (result.confidence > bestResult.confidence) {
                        bestResult = result;
                        bestMatch = row;
                    }
                }
            }

            // Fallback: Path match (lower confidence)
            if (!bestMatch) {
                const path = page.url.split('?')[0].split('#')[0].replace(/^https?:\/\/[^\/]+/, '').replace(/\/$/, '') || '/';
                const pathRow = gscPathMap.get(path);
                if (pathRow) {
                    bestMatch = pathRow;
                    bestResult = { joinType: 'path', confidence: 85 };
                }
            }

            const intel = urlIntelligence.get(canonical);
            
            if (bestMatch || intel) {
                enrichedCount++;
                const update: Partial<CrawledPage> = {
                    gscClicks: bestMatch?.clicks ?? 0,
                    gscImpressions: bestMatch?.impressions ?? 0,
                    gscCtr: bestMatch?.ctr ?? 0,
                    gscPosition: bestMatch?.position ?? 0,
                    gscEnrichedAt: Date.now(),
                    gscMatchConfidence: bestResult.confidence,
                    gscJoinType: bestResult.joinType
                };

                if (intel?.main) {
                    update.mainKeyword = intel.main.query;
                    update.mainKwPosition = intel.main.row.position;
                    update.mainKeywordSource = 'gsc';
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
