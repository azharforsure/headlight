import { crawlDb, getHtmlPages, type CrawledPage } from './CrawlDatabase';
import { UrlNormalization } from './UrlNormalization';

export interface BacklinkMetrics {
    urlRating?: number;
    domainRating?: number;
    referringDomains?: number;
    backlinks?: number;
    traffic?: number;
    authorityScore?: number;
}

export class BacklinkClientService {
    /**
     * Fetch Ahrefs v3 metrics for a list of URLs
     * Uses chunked batches of 50 to stay within API limits
     */
    static async fetchAhrefsMetrics(
        urls: string[], 
        apiKey: string,
        onProgress?: (msg: string) => void
    ): Promise<Record<string, BacklinkMetrics>> {
        const metricsMap: Record<string, BacklinkMetrics> = {};
        const CHUNK_SIZE = 50;
        
        for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
            const chunk = urls.slice(i, i + CHUNK_SIZE);
            onProgress?.(`Ahrefs: Fetching batch ${Math.floor(i/CHUNK_SIZE) + 1}...`);
            
            try {
                const response = await fetch('https://api.ahrefs.com/v3/statistics/metrics', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        targets: chunk,
                        output: 'json'
                    })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    console.warn(`[Ahrefs] Batch failed: ${err.error || response.statusText}`);
                    continue;
                }
                
                const data = await response.json();
                (data.metrics || []).forEach((item: any) => {
                    const metrics = {
                        urlRating: item.url_rating,
                        domainRating: item.domain_rating,
                        referringDomains: item.referring_domains,
                        backlinks: item.backlinks
                    };
                    metricsMap[item.target] = metrics;
                    metricsMap[UrlNormalization.toCanonical(item.target)] = metrics;
                });
            } catch (error) {
                console.error('[Ahrefs] Chunk fetch failed:', error);
            }
            
            // Small throttle to avoid hitting Ahrefs rate limits too hard
            if (i + CHUNK_SIZE < urls.length) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        return metricsMap;
    }

    /**
     * Fetch SEMrush metrics (Domain-level focus)
     */
    static async fetchSemrushMetrics(
        domain: string,
        apiKey: string
    ): Promise<BacklinkMetrics> {
        try {
            const url = `https://api.semrush.com/?type=domain_ranks&key=${apiKey}&export_columns=Or,Ot,Oc,Ad,At,Ac,As&domain=${encodeURIComponent(domain)}&database=us`;
            const response = await fetch(url);
            if (!response.ok) return {};
            
            const text = await response.text();
            const lines = text.split('\n');
            if (lines.length < 2) return {};

            const values = lines[1].split(';');
            return {
                authorityScore: Number(values[6] || 0),
                traffic: Number(values[1] || 0),
                referringDomains: Number(values[3] || 0)
            };
        } catch (error) {
            console.error('[SEMrush] Fetch failed:', error);
            return {};
        }
    }

    /**
     * Map backlink metrics to pages in IndexedDB
     */
    static async enrichSession(
        sessionId: string,
        integrations: { ahrefsToken?: string; semrushApiKey?: string },
        onProgress?: (msg: string) => void,
        options: { targetUrls?: string[] } = {}
    ): Promise<{ enriched: number; total: number }> {
        const htmlPages = await getHtmlPages(sessionId);
        const targetCanonicalSet = new Set(
            (options.targetUrls || htmlPages.map((page) => page.url)).map((url) => UrlNormalization.toCanonical(url))
        );
        const pages = htmlPages.filter((page) => targetCanonicalSet.has(UrlNormalization.toCanonical(page.url)));
        const urls = pages.map(p => p.url);
        if (urls.length === 0) {
            return { enriched: 0, total: 0 };
        }
        let metricsMap: Record<string, BacklinkMetrics> = {};

        if (integrations.ahrefsToken) {
            onProgress?.('Fetching Authority data from Ahrefs...');
            const ahrefsData = await this.fetchAhrefsMetrics(urls, integrations.ahrefsToken, onProgress);
            metricsMap = { ...metricsMap, ...ahrefsData };
        }

        if (integrations.semrushApiKey) {
            onProgress?.('Fetching Market Intelligence from SEMrush...');
            const rootDomain = new URL(urls[0]).hostname.replace(/^www\./, '');
            const semrushData = await this.fetchSemrushMetrics(rootDomain, integrations.semrushApiKey);
            
            const homepage = urls.find(u => new URL(u).pathname === '/');
            if (homepage) {
            metricsMap[homepage] = { ...metricsMap[homepage], ...semrushData };
            metricsMap[UrlNormalization.toCanonical(homepage)] = {
                ...metricsMap[UrlNormalization.toCanonical(homepage)],
                ...semrushData
            };
        }
        }

        onProgress?.('Syncing Backlink Data...');
        let enrichedCount = 0;
        const updates: Array<{ url: string } & Partial<CrawledPage>> = [];

        for (const page of pages) {
            // Skip if user manually overrode via CSV
            if (page.backlinkUploadOverride) continue;

            const match =
                metricsMap[page.url] ||
                metricsMap[page.url + '/'] ||
                metricsMap[UrlNormalization.toCanonical(page.url)] ||
                metricsMap[`${UrlNormalization.toCanonical(page.url)}/`];
            if (match) {
                enrichedCount++;
                updates.push({
                    url: page.url,
                    urlRating: match.urlRating ?? page.urlRating,
                    referringDomains: match.referringDomains ?? page.referringDomains,
                    backlinks: match.backlinks ?? page.backlinks,
                    authorityScore: match.authorityScore ?? page.authorityScore,
                    backlinkSource: integrations.ahrefsToken ? 'ahrefs' : 'semrush',
                    backlinkEnrichedAt: Date.now()
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

        return { enriched: enrichedCount, total: pages.length };
    }
}
