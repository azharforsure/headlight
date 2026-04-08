import { crawlDb, getHtmlPages, type CrawledPage } from './CrawlDatabase';
import { GscClientService } from './GscClientService';
import { Ga4ClientService } from './Ga4ClientService';
import { BacklinkClientService } from './BacklinkClientService';
import { KeywordUploadMerger } from './KeywordUploadMerger';
import { BacklinkUploadMerger } from './BacklinkUploadMerger';
import {
    calculateAuthorityScore,
    calculateBusinessValueScore,
    calculateOpportunityScore,
    getRecommendedAction,
    scoreAuthority,
    scoreBusinessValue,
    scoreContentQuality,
    scoreEngagement,
    scoreSearchVisibility,
    scoreTechnicalHealth
} from './StrategicIntelligence';
import { UrlNormalization } from './UrlNormalization';

export interface EnrichmentConfig {
    sessionId: string;
    gscSiteUrl?: string;
    ga4PropertyId?: string;
    ahrefsToken?: string;
    semrushApiKey?: string;
    googleAccessToken?: string;
    googleEmail?: string;
    keywordCsvData?: any[];
    backlinkCsvData?: any[];
}

export class PostCrawlEnrichment {
    // We prioritize the top 5,000 pages for deep (Page+Query) enrichment to stay within quotas/performance limits
    private static readonly DEEP_ENRICHMENT_LIMIT = 5000;
    // We fetch up to 100,000 summary rows to identify global trends and unlinked pages
    private static readonly SUMMARY_ROW_LIMIT = 100000;

    /**
     * Selects priority pages for deep enrichment based on PageRank and existing traffic signals
     */
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
                if (uploadPrioritySet.has(canonical)) value += 10000;
                if (!page.gscEnrichedAt) value += 2000;
                if (!page.ga4EnrichedAt) value += 1500;
                value += Number((page as any).internalPageRank || 0) * 50;
                value += Number(page.inlinks || 0) * 5;
                if (page.statusCode === 200) value += 100;
                if (page.indexable !== false) value += 50;
                value -= Number(page.crawlDepth || 0) * 10;
                return value;
            };

            return score(right) - score(left);
        });

        return {
            totalHtmlPages: htmlPages.length,
            targetPages: scoredPages.slice(0, this.DEEP_ENRICHMENT_LIMIT)
        };
    }

    /**
     * Unified Post-Crawl Enrichment Pipeline
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

        if (totalHtmlPages === 0) {
            onProgress?.('No HTML pages found in database. Check crawl settings or isHtmlPage logic.');
            console.warn('[Enrichment] No HTML pages found for session:', sessionId);
            return;
        }

        onProgress?.(`Starting enrichment: ${totalHtmlPages.toLocaleString()} HTML pages found, targeting top ${targetPages.length.toLocaleString()} for deep data.`);
        console.log(`[Enrichment] Session ${sessionId}: Total HTML=${totalHtmlPages}, Targeted=${targetPages.length}`);

        // 1. CSV Data Merging (Highest Priority Overrides)
        if (config.keywordCsvData?.length) {
            onProgress?.(`Merging ${config.keywordCsvData.length} manual keywords...`);
            await KeywordUploadMerger.mergeFromCsv(sessionId, config.keywordCsvData);
        }
        if (config.backlinkCsvData?.length) {
            onProgress?.(`Merging ${config.backlinkCsvData.length} manual backlinks...`);
            await BacklinkUploadMerger.mergeFromCsv(sessionId, config.backlinkCsvData);
        }

        // 2. Google Search Console (Two-Tier Batch)
        if (googleAccessToken && config.gscSiteUrl) {
            try {
                onProgress?.(`Connecting to GSC: ${config.gscSiteUrl} (using identity: ${config.googleEmail || 'unknown'})...`);
                await GscClientService.enrichSession(sessionId, config.gscSiteUrl, googleAccessToken, onProgress, {
                    targetUrls,
                    maxPageRows: this.SUMMARY_ROW_LIMIT,
                    maxQueryRows: 250000,
                    googleEmail: config.googleEmail
                });
            } catch (err: any) {
                console.error('[Enrichment] GSC Failed:', err);
                const isAuthError = err.message?.includes('401') || err.message?.toLowerCase().includes('authentication') || err.message?.toLowerCase().includes('credentials');
                onProgress?.(`GSC Error: ${err.message || 'Unknown error'}${isAuthError ? ' - Try reconnecting Google in Integrations.' : ''}`);
            }
        } else {
            const reason = !googleAccessToken ? 'No access token provided.' : 'No GSC property selected.';
            onProgress?.(`Skipping GSC enrichment: ${reason}`);
            console.log(`[Enrichment] Skipping GSC: ${reason}`);
        }

        // 3. GA4 Analytics (Robust Pagination)
        if (googleAccessToken && config.ga4PropertyId) {
            try {
                onProgress?.(`Connecting to GA4: ${config.ga4PropertyId} (using identity: ${config.googleEmail || 'unknown'})...`);
                await Ga4ClientService.enrichSession(sessionId, config.ga4PropertyId, googleAccessToken, onProgress, {
                    targetUrls,
                    maxRows: this.SUMMARY_ROW_LIMIT,
                    googleEmail: config.googleEmail
                });
            } catch (err: any) {
                console.error('[Enrichment] GA4 Failed:', err);
                const isAuthError = err.message?.includes('401') || err.message?.toLowerCase().includes('authentication') || err.message?.toLowerCase().includes('credentials');
                onProgress?.(`GA4 Error: ${err.message || 'Unknown error'}${isAuthError ? ' - Try reconnecting Google in Integrations.' : ''}`);
            }
        } else {
            const reason = !googleAccessToken ? 'No access token provided.' : 'No GA4 property ID selected.';
            onProgress?.(`Skipping GA4 enrichment: ${reason}`);
            console.log(`[Enrichment] Skipping GA4: ${reason}`);
        }

        // 4. Backlink API Providers
        if (config.ahrefsToken || config.semrushApiKey) {
            try {
                onProgress?.('Enriching authority metrics...');
                await BacklinkClientService.enrichSession(
                    sessionId, 
                    { ahrefsToken: config.ahrefsToken, semrushApiKey: config.semrushApiKey },
                    onProgress,
                    { targetUrls }
                );
            } catch (err: any) {
                console.error('[Enrichment] Backlink API Failed:', err);
                onProgress?.(`Backlink API Error: ${err.message || 'Unknown error'}`);
            }
        }

        // 5. Final Strategic scoring pass
        onProgress?.('Recalculating strategic scores & actions...');
        await this.runStrategicPass(sessionId);

        onProgress?.('Enrichment pipeline finished.');
    }

    /**
     * Final calculation pass for opportunity and business value scores
     */
    private static async runStrategicPass(sessionId: string) {
        const pages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();

        // Batch updates to avoid transaction overhead in IndexedDB
        const BATCH_SIZE = 1000;
        for (let i = 0; i < pages.length; i += BATCH_SIZE) {
            const chunk = pages.slice(i, i + BATCH_SIZE);
            const updates = chunk.map(page => {
                const actionResult = getRecommendedAction(page);
                return {
                    url: page.url,
                    authorityScore: calculateAuthorityScore(page),
                    businessValueScore: calculateBusinessValueScore(page),
                    opportunityScore: calculateOpportunityScore(page),
                    techHealthScore: scoreTechnicalHealth(page),
                    contentQualityScore: scoreContentQuality(page),
                    searchVisibilityScore: scoreSearchVisibility(page),
                    engagementScore: scoreEngagement(page),
                    authorityComputedScore: scoreAuthority(page),
                    businessComputedScore: scoreBusinessValue(page),
                    recommendedAction: actionResult.action,
                    recommendedActionReason: actionResult.reason,
                    recommendedActionFactors: JSON.stringify(actionResult.factors),
                    timestamp: Date.now()
                };
            });

            await crawlDb.transaction('rw', crawlDb.pages, async () => {
                for (const update of updates) {
                    await crawlDb.pages.update(update.url, update);
                }
            });
        }
    }
}
