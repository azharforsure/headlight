import { crawlDb, getHtmlPages, type CrawledPage, type CrawlSession } from './CrawlDatabase';
import { GscClientService } from './GscClientService';
import { Ga4ClientService } from './Ga4ClientService';
import { BacklinkClientService } from './BacklinkClientService';
import { KeywordUploadMerger } from './KeywordUploadMerger';
import { BacklinkUploadMerger } from './BacklinkUploadMerger';
import { BingWebmasterService } from './BingWebmasterService';
import { CommonCrawlService } from './CommonCrawlService';
import { CMSService } from './CMSService';
import { GoogleBusinessProfileService } from './GoogleBusinessProfileService';
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
    scoreTechnicalHealth,
    scoreGeoSuitability
} from './StrategicIntelligence';
import { UrlNormalization } from './UrlNormalization';
import { getGoogleTokenStatus, refreshGoogleToken } from './GoogleOAuthHelper';
import { refreshWithLock } from './TokenRefreshLock';
import { fetchPageSpeedInsights } from './PageSpeedService';
import { submitFixedPages } from './IndexNowService';
import { validateHtml, scanSecurityHeaders, getWaybackInfo, getSSLGrade } from './ExternalEnrichmentService';

export interface EnrichmentConfig {
    sessionId: string;
    gscSiteUrl?: string;
    ga4PropertyId?: string;
    bingAccessToken?: string;
    bingSiteUrl?: string;
    ahrefsToken?: string;
    semrushApiKey?: string;
    googleAccessToken?: string;
    googleEmail?: string;
    keywordCsvData?: any[];
    backlinkCsvData?: any[];
    psiApiKey?: string;
    indexNowApiKey?: string;
    indexNowAutoSubmit?: boolean;
    externalEnrichment?: boolean;
    industry?: string;
    enrichGEO?: boolean;
}

export class PostCrawlEnrichment {
    // We prioritize the top 500,000 pages for deep (Page+Query) enrichment to cover large sites
    private static readonly DEEP_ENRICHMENT_LIMIT = 500000;
    // We fetch up to 100,000 summary rows to identify global trends and unlinked pages
    private static readonly SUMMARY_ROW_LIMIT = 100000;
    // Pages enriched more than 7 days ago are considered stale
    private static readonly STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

    /**
     * Selects priority pages for deep enrichment based on PageRank and existing traffic signals
     */
    private static async selectPriorityHtmlPages(
        sessionId: string,
        keywordCsvData?: Array<{ url: string }>,
        backlinkCsvData?: Array<{ url: string }>
    ): Promise<{ totalHtmlPages: number; targetPages: CrawledPage[] }> {
        const htmlPages = await getHtmlPages(sessionId);
        const now = Date.now();
        const uploadPrioritySet = new Set(
            [...(keywordCsvData || []), ...(backlinkCsvData || [])]
                .map((row) => UrlNormalization.toCanonical(row.url))
                .filter(Boolean)
        );
    
        const scoredPages = [...htmlPages].sort((left, right) => {
            const score = (page: CrawledPage) => {
                const canonical = UrlNormalization.toCanonical(page.url);
                let value = 0;
                
                // Manual uploads always highest priority
                if (uploadPrioritySet.has(canonical)) value += 100000;
                
                // Prioritize pages never enriched
                if (!page.gscEnrichedAt) value += 20000;
                if (!page.ga4EnrichedAt) value += 15000;
                
                // Prioritize stale pages (boost based on age)
                const gscAge = page.gscEnrichedAt ? now - page.gscEnrichedAt : Infinity;
                if (gscAge > this.STALE_THRESHOLD_MS) value += 5000;
                
                const ga4Age = page.ga4EnrichedAt ? now - page.ga4EnrichedAt : Infinity;
                if (ga4Age > this.STALE_THRESHOLD_MS) value += 4000;
    
                // Structural and authority signals
                value += Number((page as any).authorityScore || 0) * 100;
                value += Number((page as any).internalPageRank || 0) * 50;
                value += Number(page.inlinks || 0) * 5;
                
                // Content quality and accessibility
                if (page.statusCode === 200) value += 100;
                if (page.indexable !== false) value += 50;
                
                // Depth penalty (crawl depth 0 = home = highest priority)
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

        // 2.5 Bing Webmaster Tools
        if (config.bingAccessToken) {
            try {
                onProgress?.('Connecting to Bing Webmaster Tools...');
                // Auto-detect Bing site URL from the crawl domain if not explicitly configured
                const bingSiteUrl = config.bingSiteUrl || 
                    (targetUrls[0] ? new URL(targetUrls[0]).origin + '/' : '');
                
                if (bingSiteUrl) {
                    await BingWebmasterService.enrichSession(sessionId, bingSiteUrl, config.bingAccessToken, onProgress, { targetUrls });
                }
            } catch (err: any) {
                console.error('[Enrichment] Bing Failed:', err);
                onProgress?.(`Bing Error: ${err.message || 'Unknown error'}`);
            }
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

        // 3.5 Google Business Profile (Local SEO)
        if (googleAccessToken && config.industry === 'local') {
            try {
                onProgress?.('Checking Google Business Profile...');
                const rootDomain = new URL(targetUrls[0] || targetPages[0]?.url || '').hostname.replace(/^www\./, '');
                await GoogleBusinessProfileService.enrichSession(sessionId, googleAccessToken, rootDomain, onProgress);
            } catch (err: any) {
                console.error('[Enrichment] GBP Failed:', err);
                onProgress?.(`Google Business Profile: ${err.message || 'Skipped'}`);
            }
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
    
        // 4.1 Free Backlink Discovery (Common Crawl) — only if no paid API was used
        const hasPaidBacklinks = Boolean(config.ahrefsToken || config.semrushApiKey);
        if (!hasPaidBacklinks) {
            try {
                onProgress?.('Discovering free backlinks via Common Crawl...');
                const sampleUrl = targetUrls[0] || targetPages[0]?.url;
                if (sampleUrl) {
                    const rootDomain = new URL(sampleUrl).hostname.replace(/^www\./, '');
                    await CommonCrawlService.enrichSession(sessionId, rootDomain, onProgress);
                }
            } catch (err: any) {
                console.error('[Enrichment] Common Crawl Failed:', err);
                onProgress?.(`Common Crawl: ${err.message || 'Skipped (service unavailable)'}`);
            }
        }


        // 4.5 GEO AI Suitability Enrichment (Phase E)
        if (config.enrichGEO) {
            try {
                onProgress?.('Performing AI-powered GEO suitability analysis...');
                await this.enrichGEO(sessionId, targetPages.slice(0, 100), onProgress);
            } catch (err) {
                console.error('[Enrichment] GEO AI Failed:', err);
            }
        }

        // 5. Final Strategic scoring pass
        onProgress?.('Recalculating strategic scores & actions...');
        await this.runStrategicPass(sessionId);

        // 6. PageSpeed Insights (Top 50 Pages)
        if (config.psiApiKey) {
            onProgress?.('Fetching PageSpeed Insights for top pages...');
            const topPages = targetPages.slice(0, 50);
            
            // Run PSI in batches of 5 to avoid quota/concurrency issues
            const batchSize = 5;
            for (let i = 0; i < topPages.length; i += batchSize) {
                const batch = topPages.slice(i, i + batchSize);
                onProgress?.(`PSI: Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(topPages.length/batchSize)}...`);
                
                await Promise.all(batch.map(async (page) => {
                    try {
                        const psi = await fetchPageSpeedInsights(page.url, config.psiApiKey);
                        await crawlDb.pages.update(page.url, {
                            fieldLcp: psi.fieldLCP,
                            fieldCls: psi.fieldCLS,
                            fieldInp: psi.fieldINP,
                            fieldFcp: psi.fieldFCP,
                            fieldTtfb: psi.fieldTTFB,
                            lighthousePerformance: psi.performanceScore,
                            lighthouseAccessibility: psi.accessibilityScore,
                            lighthouseBestPractices: psi.bestPracticesScore,
                            lighthouseSeo: psi.seoScore,
                            lcpElement: psi.lcpElement,
                            speedIndex: psi.speedIndex,
                            tbt: psi.tbt,
                            psiEnrichedAt: Date.now()
                        });
                    } catch (err) {
                        console.error(`PSI failed for ${page.url}:`, err);
                    }
                }));
                
                // Small delay between batches
                if (i + batchSize < topPages.length) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        // 7. External Enrichment (W3C, Observatory, Wayback, SSL)
        if (config.externalEnrichment) {
            onProgress?.('Fetching external domain security and health signals...');
            const topPages = targetPages.slice(0, 10);
            
            const hostname = new URL(targetPages[0].url).hostname;
            try {
                // SSL and Observatory can run in parallel
                const [security, ssl] = await Promise.all([
                    scanSecurityHeaders(hostname),
                    getSSLGrade(hostname)
                ]);
                
                await crawlDb.pages.where('crawlId').equals(sessionId).modify({
                    securityGrade: security.grade,
                    securityScore: security.score,
                    sslGrade: ssl.grade
                });
            } catch {}

            // Process top pages for HTML validation and Wayback history
            await Promise.all(topPages.map(async (page) => {
                try {
                    const [w3c, wayback] = await Promise.all([
                        validateHtml(page.url),
                        getWaybackInfo(page.url)
                    ]);
                    await crawlDb.pages.update(page.url, {
                        htmlErrors: w3c.errors,
                        htmlWarnings: w3c.warnings,
                        waybackSnapshots: wayback.snapshotCount,
                        firstArchived: wayback.firstSeen,
                        lastArchived: wayback.lastSeen
                    });
                } catch {}
            }));
        }

        // 7.5 CMS Metadata Enrichment (WordPress/Shopify) - Silent Auto-detect
        try {
            const cmsResult = await CMSService.enrichSession(config.sessionId, session.startUrl, onProgress);
            if (cmsResult.cms) {
                onProgress?.(`Enriched ${cmsResult.enriched} pages with ${cmsResult.cms} metadata.`);
            }
        } catch (err) {
            console.error('[Enrichment] CMS Auto-detect failed:', err);
        }


        // 8. IndexNow (Auto-submit fixed pages)
        if (config.indexNowApiKey && config.indexNowAutoSubmit) {
            onProgress?.('Identifying fixed pages for IndexNow submission...');
            try {
                // Find previous session for this project
                const session = await crawlDb.sessions.get(sessionId);
                if (session) {
                    const prevSessions = await crawlDb.sessions
                        .where('projectId').equals(session.projectId)
                        .filter(s => s.id !== sessionId && s.completedAt !== null)
                        .sortBy('completedAt');
                    
                    const lastSession = prevSessions.reverse()[0];
                    if (lastSession) {
                        await submitFixedPages(
                            { apiKey: config.indexNowApiKey, host: new URL(session.startUrl).hostname },
                            sessionId,
                            lastSession.id,
                            onProgress
                        );
                    }
                }
            } catch (err) {
                console.error('IndexNow failed:', err);
            }
        }

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
                    geoScore: scoreGeoSuitability(page),
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

    /**
     * Enrich specific URLs only (Selective Re-enrichment)
     */
    static async enrichSelectedPages(
        config: EnrichmentConfig,
        urls: string[],
        onProgress?: (msg: string) => void
    ): Promise<void> {
        const { sessionId, googleAccessToken } = config;
        
        onProgress?.(`Starting selective enrichment for ${urls.length} pages...`);
        
        // Manual override: ignore limits and staleness, just do these specific URLs
        const targetUrls = urls;
        
        // We still need the actual page objects for some calculations
        const targetPages = await crawlDb.pages
            .where('url')
            .anyOf(urls)
            .toArray();

        // 1. Proactive Token Check
        let currentToken = googleAccessToken;
        if (config.googleEmail) {
            const status = await getGoogleTokenStatus(config.googleEmail);
            if (status.expired && config.googleEmail) {
                onProgress?.('Access token expired. Attempting background refresh...');
                const refreshed = await refreshWithLock(config.googleEmail, refreshGoogleToken);
                if (refreshed) {
                    currentToken = refreshed;
                    onProgress?.('Token successfully refreshed.');
                } else {
                    onProgress?.('Failed to refresh token. Please re-authenticate.');
                }
            }
        }

        // 2. GSC
        if (currentToken && config.gscSiteUrl) {
            try {
                onProgress?.(`Re-enriching GSC data for selected segment...`);
                await GscClientService.enrichSession(sessionId, config.gscSiteUrl, currentToken, onProgress, {
                    targetUrls,
                    googleEmail: config.googleEmail
                });
            } catch (err: any) {
                onProgress?.(`GSC Error: ${err.message}`);
            }
        }

        // 3. GA4
        if (currentToken && config.ga4PropertyId) {
            try {
                onProgress?.(`Re-enriching GA4 data for selected segment...`);
                await Ga4ClientService.enrichSession(sessionId, config.ga4PropertyId, currentToken, onProgress, {
                    targetUrls,
                    googleEmail: config.googleEmail
                });
            } catch (err: any) {
                onProgress?.(`GA4 Error: ${err.message}`);
            }
        }

        // 4. Final Strategic pass
        onProgress?.('Recalculating strategic scores...');
        await this.runStrategicPass(sessionId);
        
        onProgress?.('Selective enrichment finished.');
    }

    /**
     * Incremental Enrichment (continues from previous checkpoint)
     */
    static async runIncrementalEnrichment(
        config: EnrichmentConfig,
        onProgress?: (msg: string) => void
    ): Promise<void> {
        const { sessionId } = config;
        const session = await crawlDb.sessions.get(sessionId);
        
        if (!session) {
            onProgress?.('Session not found.');
            return;
        }

        onProgress?.('Resuming enrichment from last checkpoint...');
        
        // Update session meta
        await crawlDb.sessions.update(sessionId, {
            lastEnrichmentRun: Date.now()
        });

        return this.runUnifiedEnrichment(config, onProgress);
    }

    /**
     * AI-Powered GEO Suitability Analysis (E1)
     */
    private static async enrichGEO(
        sessionId: string, 
        pages: CrawledPage[], 
        onProgress?: (msg: string) => void
    ) {
        // Implementation note: This would typically call the AI Analysis Engine
        // focusing on passage structure, citatability, and entity density.
        const batchSize = 10;
        for (let i = 0; i < pages.length; i += batchSize) {
            const chunk = pages.slice(i, i + batchSize);
            onProgress?.(`GEO: Analyzing content reachability for batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pages.length/batchSize)}...`);
            
            // Heuristic-based enrichment for now, ideally calls AIRouter
            const updates = chunk.map(page => ({
                url: page.url,
                citationWorthiness: this.calculateHeuristicCitationWorthiness(page),
                extractionReady: this.calculateHeuristicExtractionReady(page),
                geoEnrichedAt: Date.now()
            }));

            await Promise.all(
                updates.map((update) => crawlDb.pages.update(update.url, update as any))
            );
        }
    }

    private static calculateHeuristicCitationWorthiness(page: CrawledPage): number {
        let score = 50;
        if (page.referringDomains && page.referringDomains > 10) score += 20;
        if (page.wordCount && page.wordCount > 1000) score += 10;
        if (page.hasTrustBadges) score += 10;
        return Math.min(100, score);
    }

    private static calculateHeuristicExtractionReady(page: CrawledPage): number {
        let score = 50;
        if (page.hasPassageStructure) score += 30;
        if (page.jsRenderDiff && page.jsRenderDiff.textDiffPercent < 10) score += 20;
        return Math.min(100, score);
    }
}
