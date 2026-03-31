type KeywordRecord = {
    id: string;
    project_id: string;
    keyword: string;
    intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' | null;
    volume: number | null;
    kd: number | null;
    position: number | null;
    change: number | null;
    created_at: string;
};

type RankHistoryRecord = {
    keyword_id: string;
    position: number;
    date: string;
};

type CompetitorRecord = {
    id: string;
    project_id: string;
    name: string;
    url: string;
    score: number;
    keywords_count: number;
    domain_authority: number;
    created_at: string;
};

type AutomationRuleRecord = {
    id: string;
    project_id: string;
    name: string;
    trigger_condition: string;
    action: string;
    is_active: boolean;
    created_at: string;
};

type BrandMentionRecord = {
    id: string;
    project_id: string;
    type: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    text: string;
    source: string;
    detected_at: string;
    is_linkable: boolean;
};

type CollectionName = 'keywords' | 'rank_history' | 'competitors' | 'automation_rules' | 'brand_mentions';

const storageKey = (collection: CollectionName, projectId: string) => `headlight:data:${collection}:${projectId}`;

const readCollection = <T>(collection: CollectionName, projectId: string): T[] => {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(window.localStorage.getItem(storageKey(collection, projectId)) || '[]');
    } catch {
        return [];
    }
};

const writeCollection = <T>(collection: CollectionName, projectId: string, items: T[]) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey(collection, projectId), JSON.stringify(items));
};

const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const isoNow = () => new Date().toISOString();
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const listKeywords = async (projectId: string): Promise<KeywordRecord[]> => {
    return readCollection<KeywordRecord>('keywords', projectId).sort((a, b) => b.created_at.localeCompare(a.created_at));
};

export const addKeyword = async (
    projectId: string,
    keyword: string,
    overrides?: Partial<KeywordRecord>
): Promise<KeywordRecord> => {
    const item: KeywordRecord = {
        id: makeId('kw'),
        project_id: projectId,
        keyword,
        intent: overrides?.intent || 'Informational',
        volume: overrides?.volume ?? rand(200, 6000),
        kd: overrides?.kd ?? rand(20, 75),
        position: overrides?.position ?? rand(3, 55),
        change: overrides?.change ?? rand(-6, 6),
        created_at: isoNow()
    };
    const items = readCollection<KeywordRecord>('keywords', projectId);
    writeCollection('keywords', projectId, [item, ...items]);
    return item;
};

export const addKeywords = async (projectId: string, keywords: string[]) => {
    const created: KeywordRecord[] = [];
    for (const keyword of keywords) {
        created.push(await addKeyword(projectId, keyword));
    }
    return created;
};

export const refreshKeywordRanks = async (projectId: string) => {
    const keywords = readCollection<KeywordRecord>('keywords', projectId).map((kw) => {
        const nextPosition = Math.max(1, (kw.position || rand(5, 40)) + rand(-4, 4));
        const nextChange = (kw.position || nextPosition) - nextPosition;
        return {
            ...kw,
            position: nextPosition,
            change: nextChange
        };
    });
    writeCollection('keywords', projectId, keywords);

    const histories = readCollection<RankHistoryRecord>('rank_history', projectId);
    const today = new Date().toISOString().split('T')[0];
    const nextHistories = [
        ...histories,
        ...keywords.map((kw) => ({
            keyword_id: kw.id,
            position: kw.position || 0,
            date: today
        }))
    ];
    writeCollection('rank_history', projectId, nextHistories.slice(-500));
    return keywords;
};

export const listRankHistory = async (projectId: string, keywordId: string) => {
    return readCollection<RankHistoryRecord>('rank_history', projectId)
        .filter((item) => item.keyword_id === keywordId)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14);
};

export const listCompetitors = async (projectId: string): Promise<CompetitorRecord[]> => {
    return readCollection<CompetitorRecord>('competitors', projectId).sort((a, b) => b.created_at.localeCompare(a.created_at));
};

export const addCompetitor = async (projectId: string, name: string, url: string): Promise<CompetitorRecord> => {
    const item: CompetitorRecord = {
        id: makeId('comp'),
        project_id: projectId,
        name,
        url: url.startsWith('http') ? url : `https://${url}`,
        score: rand(40, 82),
        keywords_count: rand(500, 5500),
        domain_authority: rand(20, 70),
        created_at: isoNow()
    };
    const items = readCollection<CompetitorRecord>('competitors', projectId);
    writeCollection('competitors', projectId, [item, ...items]);
    return item;
};

export const deleteCompetitor = async (projectId: string, id: string) => {
    const items = readCollection<CompetitorRecord>('competitors', projectId).filter((item) => item.id !== id);
    writeCollection('competitors', projectId, items);
};

export const listAutomationRules = async (projectId: string): Promise<AutomationRuleRecord[]> => {
    return readCollection<AutomationRuleRecord>('automation_rules', projectId).sort((a, b) => b.created_at.localeCompare(a.created_at));
};

export const addAutomationRule = async (
    projectId: string,
    payload: Pick<AutomationRuleRecord, 'name' | 'trigger_condition' | 'action'>
): Promise<AutomationRuleRecord> => {
    const item: AutomationRuleRecord = {
        id: makeId('rule'),
        project_id: projectId,
        name: payload.name,
        trigger_condition: payload.trigger_condition,
        action: payload.action,
        is_active: true,
        created_at: isoNow()
    };
    const items = readCollection<AutomationRuleRecord>('automation_rules', projectId);
    writeCollection('automation_rules', projectId, [item, ...items]);
    return item;
};

export const updateAutomationRule = async (projectId: string, id: string, updates: Partial<AutomationRuleRecord>) => {
    const items = readCollection<AutomationRuleRecord>('automation_rules', projectId).map((item) => item.id === id ? { ...item, ...updates } : item);
    writeCollection('automation_rules', projectId, items);
};

export const deleteAutomationRule = async (projectId: string, id: string) => {
    const items = readCollection<AutomationRuleRecord>('automation_rules', projectId).filter((item) => item.id !== id);
    writeCollection('automation_rules', projectId, items);
};

export const listBrandMentions = async (projectId: string): Promise<BrandMentionRecord[]> => {
    return readCollection<BrandMentionRecord>('brand_mentions', projectId).sort((a, b) => b.detected_at.localeCompare(a.detected_at));
};

export const seedBrandMentions = async (projectId: string, brandName: string) => {
    const existing = readCollection<BrandMentionRecord>('brand_mentions', projectId);
    if (existing.length > 0) return existing;
    const seeded: BrandMentionRecord[] = [
        {
            id: makeId('mention'),
            project_id: projectId,
            type: 'Blog',
            sentiment: 'positive',
            text: `${brandName} was referenced as an emerging option in a comparison article.`,
            source: 'Growth Daily',
            detected_at: isoNow(),
            is_linkable: true
        },
        {
            id: makeId('mention'),
            project_id: projectId,
            type: 'Forum',
            sentiment: 'neutral',
            text: `${brandName} came up in a discussion about SEO workflows for small teams.`,
            source: 'Indie Makers',
            detected_at: new Date(Date.now() - 86400000).toISOString(),
            is_linkable: false
        }
    ];
    writeCollection('brand_mentions', projectId, seeded);
    return seeded;
};

export const getProjectMetrics = async (projectId: string) => {
    const keywords = await listKeywords(projectId);
    const mentions = await listBrandMentions(projectId);
    const avgPosition = keywords.length > 0
        ? keywords.filter((kw) => kw.position !== null).reduce((sum, kw) => sum + Number(kw.position || 0), 0) / Math.max(1, keywords.filter((kw) => kw.position !== null).length)
        : null;
    return {
        keywords,
        mentions,
        avgPosition,
        mentionCount: mentions.length
    };
};

// ─── Crawl → Dashboard Sync ─────────────────────────────────
// Automatically populates dashboard features from crawl results

/**
 * After a crawl finishes, call this to auto-populate keywords, competitors,
 * and brand mentions from the crawl data. All free, all local.
 */
export const syncFromCrawl = async (
    projectId: string,
    crawlPages: any[],
    projectName?: string
): Promise<{ keywordsImported: number; competitorsFound: number; mentionsFound: number }> => {
    let keywordsImported = 0;
    let competitorsFound = 0;
    let mentionsFound = 0;

    const existingKeywords = await listKeywords(projectId);
    const existingKeywordSet = new Set(existingKeywords.map(kw => kw.keyword.toLowerCase().trim()));

    // 1. Auto-import keywords from GSC data
    const gscPages = crawlPages.filter(p => p.gscClicks > 0 || p.gscImpressions > 100);
    for (const page of gscPages) {
        // Use the page title as a keyword proxy (GSC doesn't return individual queries per page in this flow)
        const keyword = extractKeywordFromTitle(page.title);
        if (keyword && !existingKeywordSet.has(keyword.toLowerCase())) {
            await addKeyword(projectId, keyword, {
                intent: page.searchIntent || 'Informational',
                volume: page.gscImpressions || null,
                position: page.gscPosition ? Math.round(page.gscPosition) : null,
                change: 0
            });
            existingKeywordSet.add(keyword.toLowerCase());
            keywordsImported++;
        }
    }

    // 2. Extract keywords from H1 tags of pages without GSC data
    const nonGscPages = crawlPages.filter(p => !p.gscClicks && p.h1_1 && p.contentType?.includes('html'));
    for (const page of nonGscPages.slice(0, 30)) {
        const keyword = extractKeywordFromTitle(page.h1_1);
        if (keyword && keyword.length > 3 && keyword.split(' ').length <= 6 && !existingKeywordSet.has(keyword.toLowerCase())) {
            await addKeyword(projectId, keyword, {
                intent: page.searchIntent || null,
                volume: null,
                position: null,
                change: null
            });
            existingKeywordSet.add(keyword.toLowerCase());
            keywordsImported++;
        }
    }

    // 3. Auto-discover competitors from external link neighborhoods
    const existingCompetitors = await listCompetitors(projectId);
    const existingCompetitorDomains = new Set(existingCompetitors.map(c => {
        try { return new URL(c.url).hostname.replace(/^www\./, ''); } catch { return ''; }
    }));

    const externalDomainCounts = new Map<string, number>();
    let rootHostname = '';
    try {
        rootHostname = new URL(crawlPages[0]?.url || '').hostname.replace(/^www\./, '');
    } catch { /* ignore */ }

    for (const page of crawlPages) {
        const links = page.externalLinks || [];
        for (const link of links) {
            try {
                const domain = new URL(link).hostname.replace(/^www\./, '');
                // Skip common non-competitor domains
                if (isCommonDomain(domain) || domain === rootHostname) continue;
                externalDomainCounts.set(domain, (externalDomainCounts.get(domain) || 0) + 1);
            } catch { /* ignore bad URLs */ }
        }
    }

    // Sort by frequency and add top competitors
    const topDomains = [...externalDomainCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    for (const [domain, linkCount] of topDomains) {
        if (!existingCompetitorDomains.has(domain)) {
            await addCompetitor(projectId, domain, `https://${domain}`);
            competitorsFound++;
        }
    }

    // 4. Generate brand mentions from crawl content (if brand name is found on other pages)
    if (projectName) {
        const brandLower = projectName.toLowerCase();
        const existingMentions = await listBrandMentions(projectId);
        const existingMentionSources = new Set(existingMentions.map(m => m.source));

        for (const page of crawlPages) {
            if (!page.url?.includes(rootHostname)) {
                // External page mentioning our brand
                const pageText = (page.title || '') + ' ' + (page.h1_1 || '') + ' ' + (page.metaDesc || '');
                if (pageText.toLowerCase().includes(brandLower) && !existingMentionSources.has(page.url)) {
                    const mentions = readCollection<BrandMentionRecord>('brand_mentions', projectId);
                    const mention: BrandMentionRecord = {
                        id: makeId('mention'),
                        project_id: projectId,
                        type: 'Web',
                        sentiment: 'neutral',
                        text: `"${projectName}" mentioned on ${page.title || page.url}`,
                        source: page.url,
                        detected_at: isoNow(),
                        is_linkable: page.statusCode >= 200 && page.statusCode < 300
                    };
                    writeCollection('brand_mentions', projectId, [mention, ...mentions]);
                    mentionsFound++;
                }
            }
        }
    }

    return { keywordsImported, competitorsFound, mentionsFound };
};

// ─── Helpers ─────────────────────────────────────────────────

function extractKeywordFromTitle(title?: string): string {
    if (!title) return '';
    // Remove common suffixes like " | Brand" or " - Site Name"
    let clean = title.split(/\s*[|\-–—]\s*/).slice(0, -1).join(' ').trim();
    if (!clean || clean.length < 3) clean = title.trim();
    // Remove HTML entities and extra whitespace
    clean = clean.replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    return clean.length > 80 ? clean.slice(0, 80) : clean;
}

const COMMON_DOMAINS = new Set([
    'google.com', 'facebook.com', 'twitter.com', 'x.com', 'youtube.com',
    'linkedin.com', 'instagram.com', 'pinterest.com', 'reddit.com',
    'github.com', 'wikipedia.org', 'apple.com', 'microsoft.com',
    'amazon.com', 'cloudflare.com', 'googleapis.com', 'gstatic.com',
    'fonts.googleapis.com', 'cdnjs.cloudflare.com', 'unpkg.com',
    'cdn.jsdelivr.net', 'maxcdn.bootstrapcdn.com',
    'w3.org', 'schema.org', 'gravatar.com', 'wp.com',
    'googletagmanager.com', 'google-analytics.com', 'doubleclick.net',
    'facebook.net', 'fbcdn.net', 'tiktok.com'
]);

function isCommonDomain(domain: string): boolean {
    if (COMMON_DOMAINS.has(domain)) return true;
    // Check parent domains (e.g., "cdn.example.com" → "example.com")
    const parts = domain.split('.');
    if (parts.length > 2) {
        const parent = parts.slice(-2).join('.');
        return COMMON_DOMAINS.has(parent);
    }
    return false;
}
