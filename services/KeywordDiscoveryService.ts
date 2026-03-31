/**
 * KeywordDiscoveryService.ts
 *
 * Free keyword discovery using:
 * 1. Google Autocomplete API (no API key needed)
 * 2. Crawl data extraction (titles, H1s, meta descriptions)
 * 3. GSC query data (when connected)
 * 4. Competitor page scraping (via Ghost Engine on user's machine)
 *
 * Everything runs on the user's browser — zero server cost.
 */

export interface DiscoveredKeyword {
    keyword: string;
    source: 'autocomplete' | 'crawl' | 'gsc' | 'competitor';
    volume?: number | null;
    position?: number | null;
    intent?: string | null;
    confidence: 'high' | 'medium' | 'low';
}

// ─── Google Autocomplete (Free, No API Key) ─────────────────

/**
 * Hit Google's free autocomplete endpoint.
 * Returns related search queries for a seed keyword.
 * Uses the Ghost Bridge proxy to bypass CORS.
 */
export async function getAutocompleteSuggestions(
    seed: string,
    proxyUrl?: string
): Promise<string[]> {
    if (!seed || seed.trim().length < 2) return [];

    try {
        const encodedQuery = encodeURIComponent(seed.trim());
        const googleUrl = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodedQuery}`;

        // Try proxy first (Ghost Bridge), then direct
        const targetUrl = proxyUrl
            ? `${proxyUrl}?url=${encodeURIComponent(googleUrl)}`
            : googleUrl;

        const response = await fetch(targetUrl, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) return [];

        const data = await response.json();
        // Google autocomplete returns: [query, [suggestions], ...]
        const suggestions = Array.isArray(data) && Array.isArray(data[1])
            ? data[1].filter((s: any) => typeof s === 'string')
            : [];

        return suggestions.slice(0, 10);
    } catch {
        return [];
    }
}

/**
 * Expand a seed keyword into related keywords using multiple methods:
 * - Autocomplete with different prefixes/suffixes
 * - Question-based queries (how, what, why, when)
 */
export async function expandKeyword(
    seed: string,
    proxyUrl?: string
): Promise<DiscoveredKeyword[]> {
    const results: DiscoveredKeyword[] = [];
    const seen = new Set<string>();

    const addResult = (keyword: string) => {
        const normalized = keyword.toLowerCase().trim();
        if (!seen.has(normalized) && normalized !== seed.toLowerCase().trim()) {
            seen.add(normalized);
            results.push({
                keyword: keyword.trim(),
                source: 'autocomplete',
                confidence: 'medium',
                intent: guessIntent(keyword)
            });
        }
    };

    // Run multiple autocomplete queries in parallel
    const queries = [
        seed,
        `${seed} for`,
        `${seed} vs`,
        `best ${seed}`,
        `how to ${seed}`,
        `what is ${seed}`,
        `${seed} tools`,
        `${seed} tips`
    ];

    const allResults = await Promise.allSettled(
        queries.map(q => getAutocompleteSuggestions(q, proxyUrl))
    );

    for (const result of allResults) {
        if (result.status === 'fulfilled') {
            result.value.forEach(addResult);
        }
    }

    return results;
}

// ─── Crawl Data Extraction ──────────────────────────────────

/**
 * Extract keyword ideas from crawled pages.
 * Uses title tags, H1s, and meta descriptions to find keyword patterns.
 */
export function extractKeywordsFromPages(pages: any[]): DiscoveredKeyword[] {
    const keywordFrequency = new Map<string, { count: number; gsc: boolean; position?: number; volume?: number }>();

    for (const page of pages) {
        if (!page.contentType?.includes('html')) continue;

        // Extract from title
        const titleKeyword = cleanAndExtract(page.title);
        if (titleKeyword) {
            const entry = keywordFrequency.get(titleKeyword) || { count: 0, gsc: false };
            entry.count++;
            if (page.gscClicks > 0 || page.gscImpressions > 0) {
                entry.gsc = true;
                entry.position = page.gscPosition;
                entry.volume = page.gscImpressions;
            }
            keywordFrequency.set(titleKeyword, entry);
        }

        // Extract from H1
        const h1Keyword = cleanAndExtract(page.h1_1);
        if (h1Keyword && h1Keyword !== titleKeyword) {
            const entry = keywordFrequency.get(h1Keyword) || { count: 0, gsc: false };
            entry.count++;
            keywordFrequency.set(h1Keyword, entry);
        }
    }

    return [...keywordFrequency.entries()]
        .filter(([keyword, data]) => keyword.length > 3 && keyword.split(' ').length <= 7)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 50)
        .map(([keyword, data]) => ({
            keyword,
            source: data.gsc ? 'gsc' as const : 'crawl' as const,
            volume: data.volume || null,
            position: data.position ? Math.round(data.position) : null,
            intent: null,
            confidence: data.gsc ? 'high' as const : data.count > 1 ? 'medium' as const : 'low' as const,
        }));
}

// ─── GSC Query Import ───────────────────────────────────────

/**
 * Transform GSC page-level data into keyword records.
 * The crawler already enriches pages with GSC data — this just reshapes it.
 */
export function extractKeywordsFromGSC(pages: any[]): DiscoveredKeyword[] {
    return pages
        .filter(p => p.gscClicks > 0 || p.gscImpressions > 100)
        .map(page => ({
            keyword: cleanAndExtract(page.title) || page.url,
            source: 'gsc' as const,
            volume: page.gscImpressions || null,
            position: page.gscPosition ? Math.round(page.gscPosition) : null,
            intent: page.searchIntent || null,
            confidence: 'high' as const,
        }))
        .filter(k => k.keyword.length > 3);
}

// ─── Competitor Keyword Extraction ──────────────────────────

/**
 * Compare your keywords against competitor page data to find gaps.
 * Returns keywords that competitors target but you don't.
 */
export function findKeywordGaps(
    yourPages: any[],
    competitorPages: any[]
): DiscoveredKeyword[] {
    const yourKeywords = new Set(
        yourPages
            .map(p => cleanAndExtract(p.title))
            .filter(Boolean)
            .map(k => k!.toLowerCase())
    );

    const gaps: DiscoveredKeyword[] = [];
    const seen = new Set<string>();

    for (const page of competitorPages) {
        const keyword = cleanAndExtract(page.title);
        if (!keyword) continue;
        const lower = keyword.toLowerCase();
        if (!yourKeywords.has(lower) && !seen.has(lower)) {
            seen.add(lower);
            gaps.push({
                keyword,
                source: 'competitor',
                confidence: 'medium',
                intent: guessIntent(keyword)
            });
        }
    }

    return gaps.slice(0, 30);
}

// ─── Helpers ─────────────────────────────────────────────────

function cleanAndExtract(text?: string): string | null {
    if (!text || typeof text !== 'string') return null;
    // Remove brand suffixes like " | Brand Name" or " - Site"
    let clean = text.split(/\s*[|\-–—]\s*/).slice(0, -1).join(' ').trim();
    if (!clean || clean.length < 3) clean = text.trim();
    clean = clean.replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    return clean.length > 80 ? clean.slice(0, 80) : (clean || null);
}

function guessIntent(keyword: string): string {
    const lower = keyword.toLowerCase();
    if (/\b(buy|price|cheap|discount|deal|order|shop)\b/.test(lower)) return 'Transactional';
    if (/\b(best|top|review|compare|vs|alternative)\b/.test(lower)) return 'Commercial';
    if (/\b(how|what|why|when|where|guide|tutorial|learn)\b/.test(lower)) return 'Informational';
    return 'Informational';
}
