import { crawlDb, getHtmlPages, type CrawledPage } from './CrawlDatabase';
import { refreshGoogleToken } from './GoogleOAuthHelper';
import { UrlNormalization } from './UrlNormalization';

export interface Ga4MetricRow {
    dimensionValues: { value: string }[];
    metricValues: { value: string }[];
}

export interface Ga4Response {
    rows?: Ga4MetricRow[];
    rowCount?: number;
    propertyQuota?: Record<string, unknown>;
}

export interface Ga4EnrichmentOptions {
    targetUrls?: string[];
    maxRows?: number;
    googleEmail?: string;
    days?: number;
}

export class Ga4ClientService {
    private static API_BASE = 'https://analyticsdata.googleapis.com/v1beta/properties';
    
    private static METRICS = [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'userEngagementDuration' }, // Total seconds
        { name: 'engagementRate' },
        { name: 'conversions' },
        { name: 'totalRevenue' }
    ];

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
     * Paginated GA4 Report Fetcher
     */
    private static async fetchPaginatedGa4(
        propertyId: string,
        accessToken: string,
        startDate: string,
        endDate: string,
        maxRows: number = 200000,
        googleEmail?: string
    ): Promise<{ rows: Ga4MetricRow[]; propertyQuota: Record<string, unknown> | null }> {
        const allRows: Ga4MetricRow[] = [];
        let offset = 0;
        const limit = 25000;
        let propertyQuota: Record<string, unknown> | null = null;
        let currentAccessToken = accessToken;

        while (offset < maxRows) {
            const nextLimit = Math.min(limit, maxRows - offset);
            if (nextLimit <= 0) break;

            const response = await this.backoffFetch(() => fetch(
                `${this.API_BASE}/${propertyId}:runReport`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${currentAccessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dateRanges: [{ startDate, endDate }],
                        dimensions: [{ name: 'pagePath' }],
                        metrics: this.METRICS,
                        returnPropertyQuota: true,
                        offset: offset.toString(),
                        limit: nextLimit.toString()
                    })
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
                throw new Error(`GA4 API Error: ${error.error?.message || response.statusText}`);
            }

            const data: Ga4Response = await response.json();
            propertyQuota = data.propertyQuota || propertyQuota;
            if (!data.rows || data.rows.length === 0) break;

            allRows.push(...data.rows);
            if (data.rows.length < nextLimit) break;
            offset += nextLimit;
        }

        return { rows: allRows, propertyQuota };
    }

    /**
     * Full Enrichment Pipeline for GA4
     */
    static async enrichSession(
        sessionId: string,
        propertyId: string,
        accessToken: string,
        onProgress?: (msg: string) => void,
        options: Ga4EnrichmentOptions = {}
    ): Promise<{ enriched: number; total: number }> {
        const htmlPages = await getHtmlPages(sessionId);
        const targetCanonicalSet = new Set(
            (options.targetUrls || htmlPages.map((page) => page.url)).map((url) => UrlNormalization.toCanonical(url))
        );
        const targetPages = htmlPages.filter((page) => targetCanonicalSet.has(UrlNormalization.toCanonical(page.url)));

        if (targetPages.length === 0) return { enriched: 0, total: 0 };
        const maxRows = options.maxRows || 100000;

        onProgress?.(`Fetching GA4 Current Period (up to ${maxRows.toLocaleString()} rows)...`);
        const currentReport = await this.fetchPaginatedGa4(
            propertyId,
            accessToken,
            '30daysAgo',
            'today',
            maxRows,
            options.googleEmail
        );
        
        onProgress?.(`Fetching GA4 Previous Period (up to ${maxRows.toLocaleString()} rows)...`);
        const previousReport = await this.fetchPaginatedGa4(
            propertyId,
            accessToken,
            '60daysAgo',
            '31daysAgo',
            maxRows,
            options.googleEmail
        );

        // 1. Resolve a base domain for normalization (from first page)
        const samplePage = targetPages[0];
        let baseDomain = '';
        if (samplePage?.url) {
            try {
                baseDomain = new URL(samplePage.url).hostname;
            } catch (e) {
                baseDomain = '';
            }
        }

        // 2. Map paths to metrics
        const curReportMap = new Map<string, any>();
        const prevReportMap = new Map<string, any>();
        const curPathMap = new Map<string, any>();
        const prevPathMap = new Map<string, any>();

        const parseGa4Row = (row: Ga4MetricRow) => ({
            views: Number(row.metricValues[0]?.value || 0),
            sessions: Number(row.metricValues[1]?.value || 0),
            users: Number(row.metricValues[2]?.value || 0),
            bounceRate: Number(row.metricValues[3]?.value || 0),
            engagementTime: Number(row.metricValues[4]?.value || 0),
            engagementRate: Number(row.metricValues[5]?.value || 0),
            conversions: Number(row.metricValues[6]?.value || 0),
            revenue: Number(row.metricValues[7]?.value || 0),
            rawPath: row.dimensionValues[0].value
        });

        const normalizePath = (p: string) => {
            if (p.startsWith('http')) return UrlNormalization.toCanonical(p);
            return UrlNormalization.toCanonical(`${baseDomain}${p.startsWith('/') ? '' : '/'}${p}`);
        };

        const getShortPath = (p: string) => p.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';

        currentReport.rows.forEach(row => {
            const path = row.dimensionValues[0].value;
            const canonical = normalizePath(path);
            const data = parseGa4Row(row);
            curReportMap.set(canonical, data);
            curPathMap.set(getShortPath(path), data);
        });
        
        previousReport.rows.forEach(row => {
            const path = row.dimensionValues[0].value;
            const canonical = normalizePath(path);
            const data = parseGa4Row(row);
            prevReportMap.set(canonical, data);
            prevPathMap.set(getShortPath(path), data);
        });

        // 3. Sync to IndexedDB with Layered Joining
        let enrichedCount = 0;
        const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

        for (const page of targetPages) {
            const pageCanonical = UrlNormalization.toCanonical(page.url);
            let bestCur: any = null;
            let bestPrev: any = null;
            let bestResult: any = { joinType: null, confidence: 0 };

            // LAYERED JOIN: find the best GA4 row
            const candidates = [page.url, pageCanonical, page.finalUrl].filter(Boolean) as string[];
            for (const candidate of candidates) {
                const canonCandidate = UrlNormalization.toCanonical(candidate);
                const cur = curReportMap.get(canonCandidate);
                if (cur) {
                    const result = UrlNormalization.getMatchResult(page.url, cur.rawPath.startsWith('http') ? cur.rawPath : `${baseDomain}${cur.rawPath}`, page.finalUrl || undefined);
                    if (result.confidence > bestResult.confidence) {
                        bestResult = result;
                        bestCur = cur;
                        bestPrev = prevReportMap.get(canonCandidate);
                    }
                }
            }

            // Fallback: Path match
            if (!bestCur) {
                const pagePath = getShortPath(page.url);
                const cur = curPathMap.get(pagePath);
                if (cur) {
                    bestCur = cur;
                    bestPrev = prevPathMap.get(pagePath);
                    bestResult = { joinType: 'path', confidence: 85 };
                }
            }

            if (bestCur) {
                enrichedCount++;
                const sessionsDeltaAbsolute = bestCur.sessions - (bestPrev?.sessions || 0);
                const sessionsDeltaPct = bestPrev?.sessions ? (sessionsDeltaAbsolute / bestPrev.sessions) : null;
                const engagementTimePerPage = bestCur.sessions > 0 ? (bestCur.engagementTime / bestCur.sessions) : 0;
                const conversionRate = bestCur.sessions > 0 ? (bestCur.conversions / bestCur.sessions) : 0;
                
                updates.push({
                    url: page.url,
                    ga4Views: bestCur.views,
                    ga4Sessions: bestCur.sessions,
                    ga4Users: bestCur.users,
                    ga4BounceRate: bestCur.bounceRate,
                    ga4EngagementTimePerPage: engagementTimePerPage,
                    ga4AvgSessionDuration: engagementTimePerPage,
                    ga4EngagementRate: bestCur.engagementRate,
                    ga4Conversions: bestCur.conversions,
                    ga4ConversionRate: conversionRate,
                    ga4Revenue: bestCur.revenue,
                    sessionsDelta: sessionsDeltaAbsolute,
                    sessionsDeltaAbsolute,
                    sessionsDeltaPct,
                    isLosingTraffic: sessionsDeltaAbsolute < 0,
                    ga4EnrichedAt: Date.now(),
                    ga4MatchConfidence: bestResult.confidence,
                    ga4JoinType: bestResult.joinType
                });
            }
        }

        if (updates.length > 0) {
            await crawlDb.transaction('rw', crawlDb.pages, async () => {
                for (const update of updates) {
                    await crawlDb.pages.update(update.url, update);
                }
            });
        }

        return { enriched: enrichedCount, total: targetPages.length };
    }
}
