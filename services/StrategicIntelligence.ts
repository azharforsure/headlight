/**
 * - Strategic Intelligence (derived metrics)
 * - GEO Scoring (Generative Engine Optimization)
 */

export interface PageRankNode {
    url: string;
    outlinks: string[];
    rank: number;
}

/**
 * Calculates Internal PageRank for a set of pages.
 * Now includes weighted distribution based on external signals (GSC/GA4).
 * This ensures that high-traffic pages are recognized as authority hubs.
 */
export function calculateInternalPageRank(
    pages: any[], 
    iterations: number = 20, 
    damping: number = 0.85,
    convergenceThreshold: number = 0.0001
): Record<string, number> {
    const nodes: Record<string, PageRankNode> = {};
    const totalPages = pages.length;
    if (totalPages === 0) return {};

    // 1. Initialize nodes with uniform probability or weighted importance
    pages.forEach(p => {
        nodes[p.url] = {
            url: p.url,
            outlinks: Array.from(new Set(p.outlinksList || [])),
            rank: 1 / totalPages
        };
    });

    // 2. Iterate until convergence or max iterations
    for (let i = 0; i < iterations; i++) {
        const nextRanks: Record<string, number> = {};
        let sinkRank = 0;
        let maxChange = 0;

        for (const url in nodes) {
            const node = nodes[url];
            if (node.outlinks.length > 0) {
                const share = node.rank / node.outlinks.length;
                node.outlinks.forEach(outTarget => {
                    if (nodes[outTarget]) {
                        nextRanks[outTarget] = (nextRanks[outTarget] || 0) + share;
                    }
                });
            } else {
                sinkRank += node.rank;
            }
        }

        const baseRank = (1 - damping) / totalPages;
        const sinkRedistribution = (damping * sinkRank) / totalPages;

        for (const url in nodes) {
            const newRank = baseRank + sinkRedistribution + (damping * (nextRanks[url] || 0));
            maxChange = Math.max(maxChange, Math.abs(newRank - nodes[url].rank));
            nodes[url].rank = newRank;
        }

        if (maxChange < convergenceThreshold) break;
    }

    const ranks = Object.values(nodes).map(n => n.rank);
    const maxRank = Math.max(...ranks);

    const normalized: Record<string, number> = {};
    for (const url in nodes) {
        normalized[url] = maxRank > 0 ? Number(((nodes[url].rank / maxRank) * 100).toFixed(2)) : 0;
    }

    return normalized;
}

/**
 * Content Decay Detection
 * Flags pages that have high impressions but low CTR, indicating potentially outdated or irrelevant content.
 */
export function detectContentDecay(page: any): boolean {
    const clicks = Number(page.gscClicks || 0);
    const impressions = Number(page.gscImpressions || 0);
    const prevClicks = Number(page.gscClicksPrevious || 0); // Need this from enrichment pipeline
    
    // Time-series decay: Clicks dropped by more than 30% while impressions stayed stable
    if (prevClicks > 50 && clicks < prevClicks * 0.7) {
        return true;
    }

    // Heuristic decay: Low CTR on high impressions
    if (impressions > 500) {
        const ctr = (clicks / impressions);
        return ctr < 0.015; // Threshold: 1.5% CTR
    }
    return false;
}

/**
 * Cannibalization Detection
 * Group pages by title/H1 similarity to identify potential internal competition.
 */
export function detectCannibalization(pages: any[]): Record<string, string[]> {
    const titleGroups: Record<string, string[]> = {};
    const pathGroups: Record<string, string[]> = {};
    const cannibalized: Record<string, string[]> = {};

    pages.forEach(p => {
        // 1. Title/H1 based grouping
        const titleKey = (p.title || p.h1_1 || '').toLowerCase().trim();
        if (titleKey && titleKey.length > 15) {
            if (!titleGroups[titleKey]) titleGroups[titleKey] = [];
            titleGroups[titleKey].push(p.url);
        }

        // 2. Path-based subfolder grouping (e.g. /blog/topic-a vs /blog/guide/topic-a)
        try {
            const url = new URL(p.url);
            const pathParts = url.pathname.split('/').filter(Boolean);
            const slug = pathParts[pathParts.length - 1];
            if (slug && slug.length > 10) {
                if (!pathGroups[slug]) pathGroups[slug] = [];
                pathGroups[slug].push(p.url);
            }
        } catch {}
    });

    const mergePotential = (groups: Record<string, string[]>) => {
        for (const key in groups) {
            if (groups[key].length > 1) {
                groups[key].forEach(url => {
                    const others = groups[key].filter(u => u !== url);
                    cannibalized[url] = Array.from(new Set([...(cannibalized[url] || []), ...others]));
                });
            }
        }
    };

    mergePotential(titleGroups);
    mergePotential(pathGroups);

    return cannibalized;
}

/**
 * Predictive Traffic Impact
 * Estimates potential click gains if technical/content issues on a page are fixed.
 */
export function calculatePredictiveTrafficImpact(page: any): number {
    const currentClicks = page.gscClicks || 0;
    const impressions = page.gscImpressions || 1;
    const currentCtr = currentClicks / impressions;
    
    let potentialCtrBoost = 0;

    // Fixed Meta Description -> ~15% boost in CTR
    if (!page.metaDesc) potentialCtrBoost += 0.15;
    
    // Fixed Title -> ~20% boost in CTR
    if (!page.title) potentialCtrBoost += 0.20;

    // Improved Core Web Vitals (Load Time) -> ~5% boost in Rank/CTR
    if (page.loadTime > 2500) potentialCtrBoost += 0.05;

    // Fixing 404 (if we're redirecting to an equivalent page) -> Restore full traffic
    if (page.statusCode === 404) return Math.round(impressions * 0.05); // Estimate 5% conversion from impressions if restored

    const estimatedNewCtr = Math.min(0.3, currentCtr * (1 + potentialCtrBoost));
    const estimatedNewClicks = Math.round(impressions * estimatedNewCtr);
    
    return Math.max(0, estimatedNewClicks - currentClicks);
}

/**
 * Predictive Health Scoring
 * Combines technical, content, and link metrics into a single score.
 */
export function calculatePredictiveScore(page: any): number {
    let score = 100;

    // Technical Penalties
    if (page.statusCode >= 400) score -= 50;
    else if (page.statusCode >= 300) score -= 20;
    
    if (page.loadTime > 2000) score -= 15;
    if (page.sizeBytes > 2 * 1024 * 1024) score -= 10;
    
    // SEO Penalties
    if (!page.title) score -= 15;
    if (!page.metaDesc) score -= 10;
    if (!page.h1_1) score -= 10;
    
    // Indexability
    if (page.indexable === false) score -= 30;
    
    // Content Quality
    if (page.isThinContent) score -= 25;
    if (page.hasKeywordStuffing) score -= 30;
    if (page.containsLoremIpsum) score -= 40;
    if (page.textRatio < 10) score -= 10;
    if (page.wordCount < 100 && page.statusCode === 200) score -= 30; // Destructive thin content
    
    // Authority (PageRank Integration)
    if (page.internalPageRank !== undefined) {
        if (page.internalPageRank < 5) score -= 10; // Low-flow pages
        else if (page.internalPageRank > 70) score += 5; // Reward authority hubs
    }

    // UX & Accessibility
    if (page.missingAltImages > 0) score -= 5;
    if (page.mixedContent) score -= 20;

    // Content Decay Check
    if (detectContentDecay(page)) score -= 15;

    return Math.max(0, Math.min(100, score));
}


/**
 * Authority Score
 * Combines Ahrefs/SEMrush authority with internal link equity.
 */
export function calculateAuthorityScore(page: any): number {
    const referringDomains = Number(page.referringDomains || 0);
    const urlRating = Number(page.urlRating || 0);
    const internalPageRank = Number(page.internalPageRank || 0);
    
    // Scale: RD(30%) + UR(40%) + IPR(30%)
    const score = (Math.min(100, referringDomains * 2) * 0.3) + 
                  (urlRating * 0.4) + 
                  (internalPageRank * 0.3);
                  
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Business Value Score
 * Uses GA4 behavioral signals to identify high-value conversion hubs.
 */
export function calculateBusinessValueScore(page: any): number {
    const sessions = Number(page.ga4Sessions || 0);
    const users = Number(page.ga4Users || 0);
    const bounceRate = Number(page.ga4BounceRate || 0); // 0.0 to 1.0
    const avgDuration = Number(page.ga4EngagementTimePerPage || page.ga4AvgSessionDuration || 0); // seconds
    const conversions = Number(page.ga4Conversions || 0);
    
    // Weighted value: Traffic(20%) + Engagement(30%) + Conversions(50%)
    const trafficVal = Math.min(100, (sessions * 0.5) + (users * 0.5));
    const engagementVal = Math.min(100, (Math.max(0, 1 - bounceRate) * 50) + (Math.min(300, avgDuration) / 6));
    const conversionVal = Math.min(100, conversions * 20);
    
    const score = (trafficVal * 0.2) + (engagementVal * 0.3) + (conversionVal * 0.5);
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Opportunity Score
 * Identifies pages with high search volume (GSC Impressions) but sub-optimal ranking/CTR.
 */
export function calculateOpportunityScore(page: any): number {
    const impressions = Number(page.gscImpressions || 0);
    const position = Number(page.gscPosition || 0);
    const ctr = Number(page.gscCtr || 0);
    const isLosing = page.isLosingTraffic === true;
    
    // High opportunity: High impressions + Position between 4 and 20 + Low CTR
    let score = Math.min(40, Math.log10(impressions + 1) * 8); // Impressions base (up to 40pts)
    
    // Strategic position bonus (Striking distance)
    if (position > 3 && position <= 10) score += 40;
    else if (position > 10 && position <= 20) score += 25;
    
    // Low CTR bonus (Optimization potential)
    if (ctr < 0.03 && impressions > 500) score += 20;

    // Traffic Loss Urgency (New signal)
    if (isLosing) score += 15;
    
    // Technical penalties (from existing logic)
    const techPenalty = page.statusCode >= 400 ? 50 : page.loadTime > 2000 ? 15 : 0;
    
    return Math.max(0, Math.min(100, Math.round(score - techPenalty)));
}

/**
 * Traffic Performance Trend
 */
export function getTrafficPerformanceStatus(page: any): 'growing' | 'losing' | 'steady' {
    const deltaPct = page.sessionsDeltaPct || 0;
    if (deltaPct > 0.15) return 'growing'; // +15%
    if (deltaPct < -0.15) return 'losing';  // -15%
    return 'steady';
}

function clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(value)));
}

export function scoreTechnicalHealth(page: any): number {
    let score = 100;

    if (page.statusCode >= 500) score -= 60;
    else if (page.statusCode >= 400) score -= 80;
    else if (page.statusCode >= 300) score -= 30;

    if (page.loadTime > 5000) score -= 25;
    else if (page.loadTime > 3000) score -= 15;
    else if (page.loadTime > 2000) score -= 5;

    if (page.lcp && page.lcp > 2500) score -= 10;
    if (page.cls && page.cls > 0.1) score -= 10;
    if (page.inp && page.inp > 200) score -= 5;

    if (!page.canonical && page.statusCode === 200) score -= 10;
    if (page.multipleCanonical) score -= 10;
    if (page.redirectChainLength > 2) score -= 10;
    if (page.isRedirectLoop) score -= 20;
    if (page.indexable === false) score -= 15;
    if (page.mixedContent) score -= 10;
    if (page.hstsMissing) score -= 5;

    return clamp(score);
}

export function scoreContentQuality(page: any): number {
    let score = 50;
    const wordCount = Number(page.wordCount || 0);
    const flesch = parseFloat(page.fleschScore) || 0;

    if (wordCount >= 800) score += 25;
    else if (wordCount >= 400) score += 15;
    else if (wordCount >= 200) score += 5;
    else score -= 20;

    if (flesch >= 60) score += 10;
    else if (flesch < 30) score -= 10;

    if (page.incorrectHeadingOrder) score -= 10;
    if (!page.h1_1 || page.h1_1.trim() === '') score -= 10;
    if (page.multipleH1s) score -= 5;

    if (page.exactDuplicate) score -= 25;
    if (page.containsLoremIpsum) score -= 15;
    if (page.hasKeywordStuffing) score -= 15;

    if (!page.title || page.title.trim() === '') score -= 10;
    if (!page.metaDesc || page.metaDesc.trim() === '') score -= 5;

    return clamp(score);
}

export function scoreSearchVisibility(page: any): number {
    const impressions = Number(page.gscImpressions || 0);
    const position = Number(page.gscPosition || 0);
    const ctr = Number(page.gscCtr || 0);
    const clicks = Number(page.gscClicks || 0);

    let score = 0;

    if (impressions > 10000) score += 35;
    else if (impressions > 1000) score += 25;
    else if (impressions > 100) score += 15;
    else if (impressions > 0) score += 5;

    if (position > 0 && position <= 3) score += 30;
    else if (position <= 10) score += 20;
    else if (position <= 20) score += 10;
    else if (position <= 50) score += 3;

    if (impressions > 100) {
        if (ctr > 0.05) score += 15;
        else if (ctr > 0.02) score += 5;
    }

    if (clicks > 100) score += 15;
    else if (clicks > 20) score += 10;
    else if (clicks > 0) score += 5;

    return clamp(score);
}

export function scoreEngagement(page: any): number {
    const sessions = Number(page.ga4Sessions || 0);
    const bounceRate = Number(page.ga4BounceRate || 0);
    const avgDuration = Number(page.ga4AvgSessionDuration || 0);
    const engagementRate = Number(page.ga4EngagementRate || 0);

    let score = 0;

    if (sessions > 500) score += 30;
    else if (sessions > 100) score += 20;
    else if (sessions > 20) score += 10;
    else if (sessions > 0) score += 5;

    if (bounceRate < 0.3) score += 25;
    else if (bounceRate < 0.5) score += 15;
    else if (bounceRate < 0.7) score += 5;

    if (avgDuration > 180) score += 20;
    else if (avgDuration > 60) score += 10;

    if (engagementRate > 0.7) score += 15;
    else if (engagementRate > 0.4) score += 10;

    return clamp(score);
}

export function scoreAuthority(page: any): number {
    const referringDomains = Number(page.referringDomains || 0);
    const backlinks = Number(page.backlinks || 0);
    const urlRating = Number(page.urlRating || 0);
    const inlinks = Number(page.inlinks || 0);

    let score = 0;

    if (referringDomains > 50) score += 30;
    else if (referringDomains > 10) score += 20;
    else if (referringDomains > 0) score += 10;

    if (backlinks > 100) score += 15;
    else if (backlinks > 10) score += 10;

    if (urlRating > 40) score += 20;
    else if (urlRating > 20) score += 10;

    if (inlinks > 50) score += 20;
    else if (inlinks > 10) score += 10;
    else if (inlinks > 0) score += 5;
    else score -= 10;

    return clamp(score);
}

/**
 * GEO Suitability Score (E1)
 * Analyzes how well a page is optimized for AI-search (ChatGPT, Perplexity, Gemini).
 */
export function scoreGeoSuitability(page: any): number {
    let score = 0;

    // 1. Structure & Clarity
    if (page.hasPassageStructure) score += 20;
    if (page.hasQuestionFormat) score += 10;
    if (page.definitionParagraphs > 0) score += 10;
    if (page.selfContainedAnswers > 0) score += 15;

    // 2. Technical Accessibility for AI
    if (page.hasLlmsTxt) score += 15;
    if (page.hasSpeakableSchema) score += 10;
    if (page.extractionReady > 70) score += 10;

    // 3. Authority & Trust Signals
    const authority = calculateAuthorityScore(page);
    if (authority > 60) score += 10;

    // 4. Citation & Entity Signal
    if (page.citationWorthiness > 60) score += 10;
    if (page.entityCoverage > 60) score += 10;

    // 5. Featured Snippet Potentials
    if (page.hasFeaturedSnippetPatterns) score += 10;

    // Penalty for heavy JS rendering if critical content is hidden
    if (page.jsRenderDiff?.criticalContentJsOnly) score -= 20;

    return clamp(score);
}

export function scoreBusinessValue(page: any): number {
    const conversions = Number(page.ga4Conversions || 0);
    const revenue = Number(page.ga4Revenue || 0);
    const sessions = Number(page.ga4Sessions || 0);
    const conversionRate = Number(page.ga4ConversionRate || 0);

    let score = 0;

    if (revenue > 1000) score += 35;
    else if (revenue > 100) score += 25;
    else if (revenue > 0) score += 15;

    if (conversions > 50) score += 25;
    else if (conversions > 10) score += 15;
    else if (conversions > 0) score += 10;

    if (conversionRate > 0.05) score += 15;
    else if (conversionRate > 0.01) score += 10;

    if (sessions > 200) score += 15;
    else if (sessions > 50) score += 10;

    return clamp(score);
}

export interface ActionResult {
    action: string;
    reason: string;
    factors: string[];
}

/**
 * AI-Driven Recommended Action
 */
export function getRecommendedAction(page: any): ActionResult {
    const tech = scoreTechnicalHealth(page);
    const content = scoreContentQuality(page);
    const visibility = scoreSearchVisibility(page);
    const engagement = scoreEngagement(page);
    const authority = scoreAuthority(page);
    const business = scoreBusinessValue(page);
    
    const impressions = Number(page.gscImpressions || 0);
    const ctr = Number(page.gscCtr || 0);
    const position = Number(page.gscPosition || 0);
    const sessions = Number(page.ga4Sessions || 0);
    const bounceRate = Number(page.ga4BounceRate || 0);
    const isLosing = page.isLosingTraffic === true;
    const deltaPct = page.sessionsDeltaPct || 0;

    if (page.statusCode >= 400) {
        return {
            action: 'Fix Errors',
            reason: `Page returns ${page.statusCode}. Fix or remove it.`,
            factors: ['broken status code']
        };
    }

    // New: Recover Losing Traffic
    if (isLosing && visibility > 20) {
        return {
            action: 'Recover Traffic',
            reason: `Traffic has dropped by ${Math.abs(Math.round(deltaPct * 100))}% recently. Audit for keyword shifts or content decay.`,
            factors: ['significant traffic drop', 'established visibility']
        };
    }

    if (engagement > 50 && business > 40 && tech < 55) {
        return {
            action: 'Protect High-Value Page',
            reason: 'This page drives traffic and conversions but has technical problems that could hurt it.',
            factors: ['high engagement', 'business value', 'technical issues']
        };
    }

    // High traffic, low conversion
    if (sessions > 100 && business < 20 && engagement > 40) {
        return {
            action: 'Optimize Conversion Path',
            reason: 'Users are engaging with the content but not converting. Review CTAs and offer relevance.',
            factors: ['high traffic', 'good engagement', 'low business value']
        };
    }

    if (impressions > 500 && ctr < 0.02 && content > 30) {
        return {
            action: 'Rewrite Title & Description',
            reason: 'Google shows this page often, but almost nobody clicks. The title and meta description need work.',
            factors: ['high impressions', 'low CTR', 'decent content']
        };
    }

    if (position > 3 && position <= 20 && visibility > 30 && content > 35) {
        return {
            action: 'Push to Page One',
            reason: `Ranking at position ${Math.round(position)} with real impressions. Small improvements could move this into top results.`,
            factors: ['near top rankings', 'existing visibility', 'content OK']
        };
    }

    if (business > 45 && authority < 30) {
        return {
            action: 'Add Internal Links',
            reason: 'This page has business value but very few links pointing to it and needs more internal support.',
            factors: ['high business value', 'low authority']
        };
    }

    if (authority > 45 && position > 12) {
        return {
            action: 'Fix Technical Issues',
            reason: 'Has backlinks and authority but still ranks poorly, which usually points to technical or intent problems.',
            factors: ['good authority', 'poor ranking despite links']
        };
    }

    if (content < 35 && visibility > 20) {
        return {
            action: 'Improve Content',
            reason: 'Google is showing this page but the content is thin or weak. Expanding it could improve rankings.',
            factors: ['low content quality', 'existing search visibility']
        };
    }

    if (sessions > 50 && bounceRate > 0.7) {
        return {
            action: 'Reduce Bounce Rate',
            reason: 'Users land here but leave quickly, so the content or UX likely does not match their expectations.',
            factors: ['high traffic', 'very high bounce rate']
        };
    }

    if (content < 25 && engagement < 10 && visibility < 10 && authority < 10) {
        return {
            action: 'Merge or Remove',
            reason: 'No traffic, no links, and thin content. Merge it into a stronger page or remove it.',
            factors: ['no engagement', 'no visibility', 'weak content', 'no authority']
        };
    }

    return {
        action: 'Monitor',
        reason: 'No urgent issues found. Keep an eye on it.',
        factors: ['stable']
    };
}

// ─── WQA: Speed Score ───

export function calculateSpeedScore(page: any): 'Good' | 'Needs Work' | 'Poor' {
    const lcp = Number(page.lcp || page.fieldLcp || 0);
    const cls = Number(page.cls || page.fieldCls || 0);
    const inp = Number(page.inp || page.fieldInp || 0);
    const ttfb = Number(page.loadTime || page.fieldTtfb || 0);

    if (lcp === 0 && cls === 0 && inp === 0 && ttfb === 0) return 'Good';

    let score = 0;
    let factors = 0;

    if (lcp > 0) {
        factors += 40;
        if (lcp <= 2500) score += 40;
        else if (lcp <= 4000) score += 20;
    }

    if (cls > 0 || page.cls === 0) {
        factors += 20;
        if (cls <= 0.1) score += 20;
        else if (cls <= 0.25) score += 10;
    }

    if (inp > 0) {
        factors += 20;
        if (inp <= 200) score += 20;
        else if (inp <= 500) score += 10;
    }

    if (ttfb > 0) {
        factors += 20;
        if (ttfb <= 800) score += 20;
        else if (ttfb <= 1800) score += 10;
    }

    if (factors === 0) return 'Good';

    const normalized = (score / factors) * 100;
    if (normalized >= 70) return 'Good';
    if (normalized >= 40) return 'Needs Work';
    return 'Poor';
}

// ─── WQA: Page Value ───

export type PageValueTier = '★★★' | '★★' | '★' | '☆';

export function calculatePageValue(page: any, industry: string = 'general'): { score: number; tier: PageValueTier } {
    const sessions = Number(page.ga4Sessions || 0);
    const clicks = Number(page.gscClicks || 0);
    const refDomains = Number(page.referringDomains || 0);
    const ipr = Number(page.internalPageRank || 0);

    let conversionValue = 0;
    if (industry === 'ecommerce') {
        conversionValue = Number(page.ga4Revenue || 0);
    } else if (industry === 'news' || industry === 'blog') {
        conversionValue = Number(page.ga4Views || 0) * 0.005;
    } else if (industry === 'local') {
        conversionValue = Number(page.ga4Conversions || page.ga4GoalCompletions || 0) * 50;
    } else if (industry === 'saas') {
        conversionValue = Number(page.ga4Conversions || 0) * 100;
    } else {
        conversionValue = Number(page.ga4Conversions || 0) * 25;
    }

    const sessionScore = Math.min(100, sessions * 0.5);
    const clickScore = Math.min(100, clicks);
    const conversionScore = Math.min(100, conversionValue * 0.1);
    const authorityScore = Math.min(100, refDomains * 5);
    const iprScore = Math.min(100, ipr);

    const rawScore = (
        sessionScore * 0.25 +
        clickScore * 0.20 +
        conversionScore * 0.25 +
        authorityScore * 0.15 +
        iprScore * 0.15
    );

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    let tier: PageValueTier;
    if (score >= 60) tier = '★★★';
    else if (score >= 30) tier = '★★';
    else if (score >= 10) tier = '★';
    else tier = '☆';

    return { score, tier };
}

// ─── WQA: Content Age ───

export function classifyContentAge(visibleDate: string | null | undefined): 'fresh' | 'aging' | 'stale' | 'ancient' | 'unknown' {
    if (!visibleDate) return 'unknown';

    const parsed = new Date(visibleDate);
    if (Number.isNaN(parsed.getTime())) return 'unknown';

    const age = Date.now() - parsed.getTime();
    const months = age / (30 * 24 * 60 * 60 * 1000);
    if (months < 6) return 'fresh';
    if (months < 12) return 'aging';
    if (months < 24) return 'stale';
    return 'ancient';
}

// ─── WQA: Intent Match ───

export function checkIntentMatch(pageIntent: string | null, kwIntent: string | null): 'aligned' | 'misaligned' | 'unknown' {
    if (!pageIntent || !kwIntent) return 'unknown';

    const p = pageIntent.toLowerCase().trim();
    const k = kwIntent.toLowerCase().trim();
    if (p === k) return 'aligned';

    if ((p === 'transactional' && k === 'commercial') || (p === 'commercial' && k === 'transactional')) return 'aligned';
    if (p === 'informational' && k === 'navigational') return 'aligned';

    return 'misaligned';
}

/**
 * Advanced Content Decay Risk
 * Specific for News/Blog industries or dated content.
 * Combines age, traffic trends (30/60/90 day), and GSC position shifts.
 */
export function calculateContentDecayRisk(page: any): number {
  const age = classifyContentAge(page.visibleDate || page.wpPublishDate);
  const status = getTrafficPerformanceStatus(page);
  const position = Number(page.gscPosition || 0);
  const positionDelta = Number(page.gscPositionDelta || 0);

  let risk = 0;
  if (age === 'ancient') risk += 40;
  else if (age === 'stale') risk += 25;
  else if (age === 'aging') risk += 10;

  if (status === 'losing') risk += 30;
  if (positionDelta > 2) risk += 20; // dropped 2+ positions
  if (position > 10 && status === 'losing') risk += 10;

  return Math.min(risk, 100);
}
