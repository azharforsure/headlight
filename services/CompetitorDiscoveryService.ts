/**
 * CompetitorDiscoveryService.ts
 *
 * Free competitor discovery and analysis using:
 * 1. External link neighborhoods from crawl data
 * 2. GSC shared-query domains (who ranks for your keywords)
 * 3. Lightweight competitor micro-crawls via Ghost Engine
 *
 * All processing happens on the user's browser — zero server cost.
 */

export interface DiscoveredCompetitor {
    domain: string;
    url: string;
    name: string;
    source: 'link-neighborhood' | 'gsc-overlap' | 'micro-crawl';
    linkCount?: number;
    sharedKeywords?: number;
    estimatedAuthority?: number;
    confidence: 'high' | 'medium' | 'low';
}

export interface CompetitorInsight {
    domain: string;
    commonKeywords: string[];
    uniqueKeywords: string[];
    avgPosition?: number;
    totalPages?: number;
    topPages?: Array<{ url: string; title: string }>;
}

// ─── Link Neighborhood Discovery ────────────────────────────

/**
 * Discover competitors from your crawl's external link pattern.
 * Sites that appear frequently in your outgoing links (and aren't social media / CDNs)
 * are likely in your space.
 */
export function discoverFromLinkNeighborhood(
    crawlPages: any[],
    ownDomain: string
): DiscoveredCompetitor[] {
    const domainStats = new Map<string, { count: number; pages: Set<string> }>();

    for (const page of crawlPages) {
        const links = page.externalLinks || [];
        for (const link of links) {
            try {
                const domain = new URL(link).hostname.replace(/^www\./, '');
                if (isExcludedDomain(domain) || domain === ownDomain) continue;

                const entry = domainStats.get(domain) || { count: 0, pages: new Set() };
                entry.count++;
                entry.pages.add(page.url);
                domainStats.set(domain, entry);
            } catch { /* skip bad URLs */ }
        }
    }

    return [...domainStats.entries()]
        .filter(([, stats]) => stats.count >= 2) // At least 2 links to be considered
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([domain, stats]) => ({
            domain,
            url: `https://${domain}`,
            name: formatDomainName(domain),
            source: 'link-neighborhood' as const,
            linkCount: stats.count,
            estimatedAuthority: Math.min(100, Math.round(stats.count * 3 + stats.pages.size * 5)),
            confidence: stats.count >= 5 ? 'high' as const : stats.count >= 3 ? 'medium' as const : 'low' as const,
        }));
}

// ─── GSC Overlap Discovery ──────────────────────────────────

/**
 * When GSC data is available, find domains that likely rank for your keywords.
 * This uses your own GSC query data + position data to find competing domains.
 * 
 * NOTE: Full SERP competitor discovery requires actual SERP scraping.
 * This is a lighter approach that uses the queries you already have.
 */
export function analyzeCompetitorOverlap(
    yourPages: any[],
    competitorPages: any[]
): CompetitorInsight {
    const yourKeywords = new Set<string>();
    const yourTitles = new Map<string, string>();

    for (const page of yourPages) {
        const keyword = extractCleanKeyword(page.title);
        if (keyword) {
            yourKeywords.add(keyword.toLowerCase());
            yourTitles.set(keyword.toLowerCase(), page.title);
        }
    }

    const competitorKeywords = new Set<string>();
    const commonKeywords: string[] = [];
    const uniqueKeywords: string[] = [];
    const topPages: Array<{ url: string; title: string }> = [];

    for (const page of competitorPages) {
        const keyword = extractCleanKeyword(page.title);
        if (!keyword) continue;
        competitorKeywords.add(keyword.toLowerCase());
        topPages.push({ url: page.url, title: page.title || '' });

        if (yourKeywords.has(keyword.toLowerCase())) {
            commonKeywords.push(keyword);
        } else {
            uniqueKeywords.push(keyword);
        }
    }

    let competitorDomain = '';
    try {
        competitorDomain = new URL(competitorPages[0]?.url || '').hostname.replace(/^www\./, '');
    } catch { /* ignore */ }

    return {
        domain: competitorDomain,
        commonKeywords: commonKeywords.slice(0, 20),
        uniqueKeywords: uniqueKeywords.slice(0, 30),
        totalPages: competitorPages.length,
        topPages: topPages.slice(0, 10),
    };
}

// ─── Competitor Micro-Crawl Plan ────────────────────────────

/**
 * Generate a crawl plan for a competitor.
 * This returns the config needed to run a lightweight Ghost Engine crawl
 * (10-20 pages only) on the user's machine.
 */
export function buildCompetitorCrawlPlan(competitorUrl: string) {
    const normalizedUrl = competitorUrl.startsWith('http')
        ? competitorUrl
        : `https://${competitorUrl}`;

    return {
        url: normalizedUrl,
        maxPages: 20,
        maxDepth: 2,
        respectRobots: true,
        mode: 'spider' as const,
        // Only extract what we need for keyword/content comparison
        extractionFocus: ['title', 'h1', 'h2', 'metaDesc', 'wordCount', 'contentType'],
        // Fast settings — no JS rendering, no images
        jsRendering: false,
        fetchImages: false,
        timeout: 8000,
    };
}

// ─── Full Discovery Pipeline ────────────────────────────────

/**
 * Run the full competitor discovery pipeline from crawl data.
 * Returns ranked competitors with confidence scores.
 */
export function runFullDiscovery(
    crawlPages: any[],
    ownDomain: string
): DiscoveredCompetitor[] {
    const linkCompetitors = discoverFromLinkNeighborhood(crawlPages, ownDomain);

    // Deduplicate and rank
    const seen = new Set<string>();
    const results: DiscoveredCompetitor[] = [];

    for (const comp of linkCompetitors) {
        if (!seen.has(comp.domain)) {
            seen.add(comp.domain);
            results.push(comp);
        }
    }

    return results;
}

// ─── Helpers ─────────────────────────────────────────────────

function extractCleanKeyword(title?: string): string | null {
    if (!title || typeof title !== 'string') return null;
    let clean = title.split(/\s*[|\-–—]\s*/).slice(0, -1).join(' ').trim();
    if (!clean || clean.length < 3) clean = title.trim();
    clean = clean.replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    return clean.length > 80 ? clean.slice(0, 80) : (clean || null);
}

function formatDomainName(domain: string): string {
    // "example-site.com" → "Example Site"
    const name = domain.split('.')[0]
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    return name;
}

const EXCLUDED_DOMAINS = new Set([
    // Social / Media
    'google.com', 'facebook.com', 'twitter.com', 'x.com', 'youtube.com',
    'linkedin.com', 'instagram.com', 'pinterest.com', 'reddit.com',
    'tiktok.com', 'medium.com', 'quora.com',
    // Tech / CDN
    'github.com', 'stackoverflow.com', 'npmjs.com',
    'cloudflare.com', 'googleapis.com', 'gstatic.com', 'cdn.jsdelivr.net',
    'unpkg.com', 'cdnjs.cloudflare.com', 'maxcdn.bootstrapcdn.com',
    // Reference
    'wikipedia.org', 'w3.org', 'schema.org',
    // Big tech
    'apple.com', 'microsoft.com', 'amazon.com',
    // Tracking
    'googletagmanager.com', 'google-analytics.com', 'doubleclick.net',
    'facebook.net', 'fbcdn.net', 'hotjar.com', 'clarity.ms',
    // WordPress / CMS
    'gravatar.com', 'wp.com', 'wordpress.org', 'wordpress.com',
    // Fonts
    'fonts.googleapis.com', 'fonts.gstatic.com', 'use.typekit.net',
]);

function isExcludedDomain(domain: string): boolean {
    if (EXCLUDED_DOMAINS.has(domain)) return true;
    const parts = domain.split('.');
    if (parts.length > 2) {
        const parent = parts.slice(-2).join('.');
        return EXCLUDED_DOMAINS.has(parent);
    }
    return false;
}
