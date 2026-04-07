import { crawlDb, getHtmlPages, type CrawledPage } from './CrawlDatabase';
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
     * Paginated GA4 Report Fetcher
     */
    private static async fetchPaginatedGa4(
        propertyId: string,
        accessToken: string,
        startDate: string,
        endDate: string,
        maxRows: number = 200000
    ): Promise<{ rows: Ga4MetricRow[]; propertyQuota: Record<string, unknown> | null }> {
        const allRows: Ga4MetricRow[] = [];
        let offset = 0;
        const limit = 25000;
        let propertyQuota: Record<string, unknown> | null = null;

        while (offset < maxRows) {
            const nextLimit = Math.min(limit, maxRows - offset);
            if (nextLimit <= 0) break;
            const response = await fetch(
                `${this.API_BASE}/${propertyId}:runReport`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
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
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`GA4 Fetch Failed: ${error.error?.message || response.statusText}`);
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
        const maxRows = options.maxRows || Math.min(50000, Math.max(25000, targetPages.length * 2));

        onProgress?.('Fetching GA4 current period data...');
        const currentReport = await this.fetchPaginatedGa4(propertyId, accessToken, '30daysAgo', 'today', maxRows);
        
        onProgress?.('Fetching GA4 comparison period data...');
        const previousReport = await this.fetchPaginatedGa4(propertyId, accessToken, '60daysAgo', '31daysAgo', maxRows);
        if (currentReport.propertyQuota) {
            onProgress?.('GA4 quota checked for this enrichment run.');
        }

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
        const curMap = new Map<string, any>();
        const prevMap = new Map<string, any>();

        const parseGa4Row = (row: Ga4MetricRow) => ({
            views: Number(row.metricValues[0]?.value || 0),
            sessions: Number(row.metricValues[1]?.value || 0),
            users: Number(row.metricValues[2]?.value || 0),
            bounceRate: Number(row.metricValues[3]?.value || 0),
            engagementTime: Number(row.metricValues[4]?.value || 0),
            engagementRate: Number(row.metricValues[5]?.value || 0),
            conversions: Number(row.metricValues[6]?.value || 0),
            revenue: Number(row.metricValues[7]?.value || 0)
        });

        const normalizePath = (p: string) => {
            if (p.startsWith('http')) return UrlNormalization.toCanonical(p);
            // Prefix path with current domain if it looks like a path
            return UrlNormalization.toCanonical(`${baseDomain}${p.startsWith('/') ? '' : '/'}${p}`);
        };

        currentReport.rows.forEach(row => {
            const path = row.dimensionValues[0].value;
            curMap.set(normalizePath(path), parseGa4Row(row));
            // Also map root variations
            if (path === '/' || path === '(index)') {
                curMap.set(normalizePath(''), parseGa4Row(row));
            }
        });
        
        previousReport.rows.forEach(row => {
            const path = row.dimensionValues[0].value;
            prevMap.set(normalizePath(path), parseGa4Row(row));
            if (path === '/' || path === '(index)') {
                prevMap.set(normalizePath(''), parseGa4Row(row));
            }
        });

        // 3. Sync to IndexedDB
        let enrichedCount = 0;
        const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

        for (const page of targetPages) {
            const canonical = UrlNormalization.toCanonical(page.url);
            const cur = curMap.get(canonical);
            const prev = prevMap.get(canonical);

            if (cur) {
                enrichedCount++;
                const sessionsDeltaAbsolute = cur.sessions - (prev?.sessions || 0);
                const sessionsDeltaPct = prev?.sessions ? (sessionsDeltaAbsolute / prev.sessions) : null;
                const engagementTimePerPage = cur.sessions > 0 ? (cur.engagementTime / cur.sessions) : 0;
                const conversionRate = cur.sessions > 0 ? (cur.conversions / cur.sessions) : 0;
                
                updates.push({
                    url: page.url,
                    ga4Views: cur.views,
                    ga4Sessions: cur.sessions,
                    ga4Users: cur.users,
                    ga4BounceRate: cur.bounceRate,
                    ga4EngagementTimePerPage: engagementTimePerPage,
                    ga4AvgSessionDuration: engagementTimePerPage,
                    ga4EngagementRate: cur.engagementRate,
                    ga4Conversions: cur.conversions,
                    ga4ConversionRate: conversionRate,
                    ga4Revenue: cur.revenue,
                    sessionsDelta: sessionsDeltaAbsolute,
                    sessionsDeltaAbsolute,
                    sessionsDeltaPct,
                    isLosingTraffic: sessionsDeltaAbsolute < 0,
                    ga4EnrichedAt: Date.now()
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
