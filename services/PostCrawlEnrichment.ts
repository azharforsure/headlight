import { crawlDb } from './CrawlDatabase';
import { GscClientService } from './GscClientService';
import { Ga4ClientService } from './Ga4ClientService';
import { BacklinkClientService } from './BacklinkClientService';
import { 
    calculateInternalPageRank, 
    calculateAuthorityScore, 
    calculateBusinessValueScore, 
    calculateOpportunityScore,
    getRecommendedAction
} from './StrategicIntelligence';

export interface EnrichmentConfig {
    sessionId: string;
    gscSiteUrl?: string;
    ga4PropertyId?: string;
    ahrefsToken?: string;
    semrushApiKey?: string;
    accessToken?: string; // Google OAuth token
    refreshToken?: string;
}

export class PostCrawlEnrichment {
    /**
     * Run the full enrichment pipeline
     */
    static async run(
        config: EnrichmentConfig,
        onProgress?: (msg: string) => void
    ): Promise<void> {
        const { sessionId, accessToken } = config;

        if (!accessToken && (config.gscSiteUrl || config.ga4PropertyId)) {
            onProgress?.('Google enrichment skipped: no Google access token available.');
        }
        if (accessToken && !config.gscSiteUrl) {
            onProgress?.('GSC enrichment skipped: no Search Console property selected.');
        }
        if (accessToken && !config.ga4PropertyId) {
            onProgress?.('GA4 enrichment skipped: no Analytics property selected.');
        }

        // 1. GSC Enrichment
        if (accessToken && config.gscSiteUrl) {
            try {
                const result = await GscClientService.enrichSession(
                    sessionId, 
                    config.gscSiteUrl, 
                    accessToken, 
                    onProgress
                );
                onProgress?.(`GSC enrichment complete: matched ${result.enriched}/${result.total} pages.`);
            } catch (err) {
                console.error('[Enrichment] GSC Failed:', err);
                onProgress?.('GSC Enrichment failed, skipping...');
            }
        }

        // 2. GA4 Enrichment
        if (accessToken && config.ga4PropertyId) {
            try {
                const result = await Ga4ClientService.enrichSession(
                    sessionId, 
                    config.ga4PropertyId, 
                    accessToken, 
                    onProgress
                );
                onProgress?.(`GA4 enrichment complete: matched ${result.enriched}/${result.total} pages.`);
            } catch (err) {
                console.error('[Enrichment] GA4 Failed:', err);
                onProgress?.('GA4 Enrichment failed, skipping...');
            }
        }

        // 3. Backlink Enrichment
        if (config.ahrefsToken || config.semrushApiKey) {
            try {
                await BacklinkClientService.enrichSession(
                    sessionId,
                    { ahrefsToken: config.ahrefsToken, semrushApiKey: config.semrushApiKey },
                    onProgress
                );
            } catch (err) {
                console.error('[Enrichment] Backlinks Failed:', err);
                onProgress?.('Backlink Enrichment failed, skipping...');
            }
        }

        // 4. Strategic Scoring Final Pass
        onProgress?.('Calculating Strategic Intelligence & Authority Hubs...');
        const pages = await crawlDb.pages.where('crawlId').equals(sessionId).toArray();
        
        // Calculate Link Equity (Internal PageRank)
        const pageRankMap = calculateInternalPageRank(pages);

        const finalUpdates = pages.map(page => {
            const internalPageRank = pageRankMap[page.url] ?? 0;
            const updatedPage = { ...page, internalPageRank };
            
            const { action, reason } = getRecommendedAction(updatedPage);
            
            return {
                ...updatedPage,
                authorityScore: calculateAuthorityScore(updatedPage),
                businessValueScore: calculateBusinessValueScore(updatedPage),
                opportunityScore: calculateOpportunityScore(updatedPage),
                recommendedAction: action,
                recommendedActionReason: reason,
                lastStepEnrichedAt: Date.now()
            };
        });

        if (finalUpdates.length > 0) {
            await crawlDb.pages.bulkPut(finalUpdates);
        }

        onProgress?.('Strategic Intelligence Pipeline Complete.');
    }
}
