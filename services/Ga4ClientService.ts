import { crawlDb, type CrawledPage } from './CrawlDatabase';

export interface Ga4MetricRow {
    dimensionValues: { value: string }[];
    metricValues: { value: string }[];
}

export interface Ga4Response {
    rows?: Ga4MetricRow[];
    rowCount?: number;
}

export class Ga4ClientService {
    private static API_BASE = 'https://analyticsdata.googleapis.com/v1beta/properties';
    private static METRICS = [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'conversions' },
        { name: 'sessionConversionRate' },
        { name: 'totalRevenue' }
    ];

    private static async runReport(
        propertyId: string,
        accessToken: string,
        dateRange: { startDate: string; endDate: string }
    ): Promise<Ga4Response> {
        const response = await fetch(
            `${this.API_BASE}/${propertyId}:runReport`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(60000),
                body: JSON.stringify({
                    dateRanges: [dateRange],
                    dimensions: [
                        { name: 'pagePathPlusQueryString' }
                    ],
                    metrics: this.METRICS,
                    limit: 100000
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('[GA4] API Error:', error);
            throw new Error(`GA4 Fetch Failed: ${error.error?.message || response.statusText}`);
        }

        return response.json();
    }

    /**
     * Fetch GA4 report with comparison period
     * @param propertyId GA4 Property ID
     * @param accessToken Valid Google OAuth token
     * @param days Range in days (default 30)
     */
    static async fetchComparisonReport(
        propertyId: string,
        accessToken: string,
        days: number = 30
    ): Promise<Record<string, any>> {
        const metricsMap: Record<string, any> = {};
        const [currentData, previousData] = await Promise.all([
            this.runReport(propertyId, accessToken, { startDate: `${days}daysAgo`, endDate: 'today' }),
            this.runReport(propertyId, accessToken, { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` })
        ]);

        const assignRows = (rows: Ga4MetricRow[] | undefined, range: 'current' | 'previous') => {
            rows?.forEach(row => {
                const path = row.dimensionValues[0]?.value;
                if (!path) return;

                if (!metricsMap[path]) {
                    metricsMap[path] = { current: {}, previous: {} };
                }

                const target = metricsMap[path][range];
                
                target.views = Number(row.metricValues[0].value || 0);
                target.sessions = Number(row.metricValues[1].value || 0);
                target.users = Number(row.metricValues[2].value || 0);
                target.bounceRate = Number(row.metricValues[3].value || 0);
                target.avgDuration = Number(row.metricValues[4].value || 0);
                target.conversions = Number(row.metricValues[5].value || 0);
                target.convRate = Number(row.metricValues[6].value || 0);
                target.revenue = Number(row.metricValues[7].value || 0);
            });
        };

        assignRows(currentData.rows, 'current');
        assignRows(previousData.rows, 'previous');

        return metricsMap;
    }

    /**
     * Map GA4 metrics back to IndexedDB with delta calculations
     */
    static async enrichSession(
        sessionId: string,
        propertyId: string,
        accessToken: string,
        onProgress?: (msg: string) => void
    ): Promise<{ enriched: number; total: number }> {
        onProgress?.('Fetching GA4 Analytics & Comparison data...');
        const metricsMap = await this.fetchComparisonReport(propertyId, accessToken);
        
        onProgress?.('Syncing Behavioral Analytics...');
        const pages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();
        let enrichedCount = 0;

        const updates = pages.map(page => {
            // Normalize Crawler URL
            let crawlerPath = '';
            let crawlerHost = '';
            try {
                const parsed = new URL(page.url);
                crawlerPath = `${parsed.pathname || '/'}${parsed.search || ''}`;
                crawlerHost = parsed.hostname.replace(/^www\./, '').toLowerCase();
            } catch {
                crawlerPath = page.url;
            }

            // Normalization Helper
            const clean = (p: string) => p.replace(/\/$/, '') || '/';
            const crawlerClean = clean(crawlerPath);

            // Multistage Matching
            let match = metricsMap[crawlerPath] 
                || metricsMap[crawlerClean] 
                || metricsMap[crawlerPath + '/']
                || metricsMap[crawlerClean + '/'];

            // Domain-Aware Fallback (if GA4 includes hostnames)
            if (!match && crawlerHost) {
                const hostPlusPath = crawlerHost + crawlerPath;
                const hostPlusClean = crawlerHost + crawlerClean;
                match = metricsMap[hostPlusPath] 
                    || metricsMap[hostPlusClean] 
                    || metricsMap[hostPlusPath + '/'];
            }
            
            if (match) {
                const cur = match.current || {};
                const prev = match.previous || {};
                
                const sessionsDelta = (cur.sessions || 0) - (prev.sessions || 0);
                // Traffic Alert: >10% drop vs previous period, only for pages with >10 sessions
                const isLosingTraffic = sessionsDelta < 0 && Math.abs(sessionsDelta) > (prev.sessions * 0.1) && prev.sessions > 10;

                enrichedCount++;
                return {
                    ...page,
                    ga4Views: cur.views ?? page.ga4Views,
                    ga4Sessions: cur.sessions ?? page.ga4Sessions,
                    ga4Users: cur.users ?? page.ga4Users,
                    ga4BounceRate: cur.bounceRate ?? page.ga4BounceRate,
                    ga4AvgSessionDuration: cur.avgDuration ?? page.ga4AvgSessionDuration,
                    ga4Conversions: cur.conversions ?? page.ga4Conversions,
                    ga4ConversionRate: cur.convRate ?? page.ga4ConversionRate,
                    ga4Revenue: cur.revenue ?? page.ga4Revenue,
                    sessionsDelta,
                    isLosingTraffic,
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
}
