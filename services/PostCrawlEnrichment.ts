import { crawlDb, getHtmlPages, type CrawledPage } from './CrawlDatabase';
import { GscClientService } from './GscClientService';
import { Ga4ClientService } from './Ga4ClientService';
import { BacklinkClientService } from './BacklinkClientService';
import { KeywordUploadMerger } from './KeywordUploadMerger';
import { BacklinkUploadMerger } from './BacklinkUploadMerger';
import {
    calculateAuthorityScore, 
    calculateBusinessValueScore, 
    calculateOpportunityScore
} from './StrategicIntelligence';
import { UrlNormalization } from './UrlNormalization';

export interface EnrichmentConfig {
    sessionId: string;
    gscSiteUrl?: string;
    ga4PropertyId?: string;
    ahrefsToken?: string;
    semrushApiKey?: string;
    googleAccessToken?: string;
    keywordCsvData?: any[]; // Reusable for CSV manual uploads
    backlinkCsvData?: any[];
}

export class PostCrawlEnrichment {
    private static readonly ENRICHMENT_BATCH_SIZE = 5000;

    private static async selectPriorityHtmlPages(
        sessionId: string,
        keywordCsvData?: Array<{ url: string }>,
        backlinkCsvData?: Array<{ url: string }>
    ): Promise<{ totalHtmlPages: number; targetPages: CrawledPage[] }> {
        const htmlPages = await getHtmlPages(sessionId);
        const uploadPrioritySet = new Set(
            [...(keywordCsvData || []), ...(backlinkCsvData || [])]
                .map((row) => UrlNormalization.toCanonical(row.url))
                .filter(Boolean)
        );

        const scoredPages = [...htmlPages].sort((left, right) => {
            const score = (page: CrawledPage) => {
                const canonical = UrlNormalization.toCanonical(page.url);
                let value = 0;
                if (uploadPrioritySet.has(canonical)) value += 5000;
                if (!page.gscEnrichedAt) value += 1200;
                if (!page.ga4EnrichedAt) value += 900;
                value += Number((page as any).internalPageRank || 0) * 25;
                value += Number((page as any).linkEquity || 0) * 50;
                value += Number(page.inlinks || 0) * 2;
                if (page.statusCode === 200) value += 50;
                if (page.indexable !== false) value += 25;
                value -= Number(page.crawlDepth || 0) * 3;
                return value;
            };

            return score(right) - score(left);
        });

        return {
            totalHtmlPages: htmlPages.length,
            targetPages: scoredPages.slice(0, this.ENRICHMENT_BATCH_SIZE)
        };
    }

    /**
     * Unified Post-Crawl Enrichment Pipeline
     * 
     * Orchestrates GSC, GA4, Backlink Providers, and CSV Uploads
     * into a single, high-performance background process.
     */
    static async runUnifiedEnrichment(
        config: EnrichmentConfig,
        onProgress?: (msg: string) => void
    ): Promise<void> {
        const { sessionId, googleAccessToken } = config;
        const { totalHtmlPages, targetPages } = await this.selectPriorityHtmlPages(
            sessionId,
            config.keywordCsvData,
            config.backlinkCsvData
        );
        const targetUrls = targetPages.map((page) => page.url);

        if (targetUrls.length === 0) {
            onProgress?.('No HTML pages available for enrichment.');
            return;
        }

        if (totalHtmlPages > targetUrls.length) {
            onProgress?.(
                `Prioritizing ${targetUrls.length.toLocaleString()} of ${totalHtmlPages.toLocaleString()} HTML pages for this enrichment run.`
            );
        }

        // 1. CSV Keyword Overrides (Pri 1 — highest authority)
        if (config.keywordCsvData && config.keywordCsvData.length > 0) {
            onProgress?.('Merging Manual Keyword Uploads...');
            await KeywordUploadMerger.mergeFromCsv(sessionId, config.keywordCsvData);
        }

        // 2. CSV Backlink Overrides
        if (config.backlinkCsvData && config.backlinkCsvData.length > 0) {
            onProgress?.('Merging Manual Backlink Uploads...');
            await BacklinkUploadMerger.mergeFromCsv(sessionId, config.backlinkCsvData);
        }

        // 3. Google Search Console
        if (googleAccessToken && config.gscSiteUrl) {
            try {
                onProgress?.('Enriching from Search Console...');
                await GscClientService.enrichSession(sessionId, config.gscSiteUrl, googleAccessToken, onProgress, {
                    targetUrls
                });
            } catch (err) {
                console.error('[Enrichment] GSC Failed:', err);
                onProgress?.('GSC Enrichment failed, moving on...');
            }
        }

        // 4. GA4 Analytics
        if (googleAccessToken && config.ga4PropertyId) {
            try {
                onProgress?.('Enriching from Analytics (GA4)...');
                await Ga4ClientService.enrichSession(sessionId, config.ga4PropertyId, googleAccessToken, onProgress, {
                    targetUrls
                });
            } catch (err) {
                console.error('[Enrichment] GA4 Failed:', err);
                onProgress?.('GA4 Enrichment failed, moving on...');
            }
        }

        // 5. Backlink API Providers
        if (config.ahrefsToken || config.semrushApiKey) {
            try {
                onProgress?.('Enriching from Authority Providers...');
                await BacklinkClientService.enrichSession(
                    sessionId, 
                    { ahrefsToken: config.ahrefsToken, semrushApiKey: config.semrushApiKey },
                    onProgress,
                    { targetUrls }
                );
            } catch (err) {
                console.error('[Enrichment] Backlink API Failed:', err);
                onProgress?.('Backlink enrichment failed, moving on...');
            }
        }

        // 6. Final Strategic Score Pass
        onProgress?.('Calculating Strategic Opportunities...');
        await this.runStrategicPass(sessionId);

        onProgress?.('Full Enrichment Pipeline Complete.');
    }

    /**
     * Final calculation pass for opportunity and business value scores
     */
    private static async runStrategicPass(sessionId: string) {
        const pages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();
        
        const updates: Array<{ url: string } & Partial<CrawledPage>> = pages.map(page => {
            return {
                url: page.url,
                authorityScore: calculateAuthorityScore(page),
                businessValueScore: calculateBusinessValueScore(page),
                opportunityScore: calculateOpportunityScore(page),
                timestamp: Date.now()
            };
        });

        if (updates.length > 0) {
            await crawlDb.transaction('rw', crawlDb.pages, async () => {
                for (const update of updates) {
                    await crawlDb.pages.update(update.url, update);
                }
            });
        }
    }
}
