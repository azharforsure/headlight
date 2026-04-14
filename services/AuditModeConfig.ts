import type { AuditMode, IndustryFilter } from './CheckRegistry';
import type { DetectedIndustry } from './SiteTypeDetector';

export interface AuditModeConfig {
    id: AuditMode;
    label: string;
    description: string;
    icon: string;
    totalChecks: string;
    viewType: 'grid' | 'competitor_matrix' | 'ai_view' | 'geo_view' | 'opportunity_view' | 'visual_heat_map';
    sidebarSections: string[];
    defaultColumns: string[];
    isCompetitiveMode?: boolean;
    isWqaMode?: boolean;
}

export interface IndustryConfig {
    id: IndustryFilter;
    label: string;
    description: string;
    icon: string;
    extraChecksLabel: string;
}

export const AUDIT_MODES: Record<AuditMode, AuditModeConfig> = {
    full: {
        id: 'full',
        label: 'Full Audit',
        description: 'All checks and all categories',
        icon: '🔍',
        totalChecks: '~250',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'opportunities', 'geo', 'tasks', 'ai', 'monitor', 'migration', 'history', 'logs', 'robots', 'sitemap', 'visual'],
        defaultColumns: []
    },
    website_quality: {
        id: 'website_quality',
        label: 'Website Quality Audit',
        description: 'Page quality, search performance, and strategic actions',
        icon: '🌐',
        totalChecks: '~80',
        viewType: 'grid',
        sidebarSections: ['wqa_quality', 'wqa_actions', 'wqa_search', 'wqa_content', 'wqa_history'],
        defaultColumns: [
            'pageCategory', 'url', 'statusCode', 'indexabilityStatus',
            'technicalAction', 'contentAction',
            'mainKeyword', 'mainKwPosition', 'gscImpressions', 'gscClicks', 'gscCtr', 'searchIntent',
            'ga4Sessions', 'sessionsDeltaPct', 'isLosingTraffic', 'ga4BounceRate', 'ga4EngagementTimePerPage',
            'backlinks', 'referringDomains', 'inlinks',
            'title', 'h1_1', 'wordCount', 'contentQualityScore', 'eeatScore',
            'pageValueTier', 'healthScore', 'speedScore',
        ],
        isWqaMode: true,
    },
    technical_seo: {
        id: 'technical_seo',
        label: 'Technical SEO Audit',
        description: 'Crawlability, indexing, speed, and protocol checks',
        icon: '⚙️',
        totalChecks: '~75',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'details'],
        defaultColumns: [
            'url', 'statusCode', 'canonical', 'metaRobots1', 'redirectUrl',
            'redirectChainLength', 'inSitemap', 'crawlDepth', 'loadTime',
            'lcp', 'cls', 'inp', 'sizeBytes', 'httpVersion', 'language',
            'indexable', 'indexabilityStatus'
        ]
    },
    content: {
        id: 'content',
        label: 'Content Audit',
        description: 'Quality, duplication, decay, and topic coverage',
        icon: '📝',
        totalChecks: '~60',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'ai'],
        defaultColumns: [
            'url', 'title', 'wordCount', 'readability', 'fleschScore',
            'textRatio', 'hash', 'nearDuplicateMatch', 'spellingErrors',
            'grammarErrors', 'contentQualityScore', 'contentDecay',
            'topicCluster', 'searchIntent', 'funnelStage'
        ]
    },
    on_page_seo: {
        id: 'on_page_seo',
        label: 'On-Page SEO Audit',
        description: 'Titles, metadata, headings, and schema basics',
        icon: '📊',
        totalChecks: '~55',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'details'],
        defaultColumns: [
            'url', 'title', 'titleLength', 'titlePixelWidth', 'metaDesc',
            'metaDescLength', 'h1_1', 'h1_1Length', 'h2_1', 'canonical',
            'ogTitle', 'ogDescription', 'ogImage', 'twitterCard',
            'missingAltImages', 'totalImages'
        ]
    },
    off_page: {
        id: 'off_page',
        label: 'Off-Page Audit',
        description: 'Authority, backlinks, and outbound footprint',
        icon: '🔗',
        totalChecks: '~40',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'geo'],
        defaultColumns: [
            'url', 'authorityScore', 'urlRating', 'referringDomains',
            'backlinks', 'externalOutlinks', 'uniqueExternalOutlinks',
            'inlinks', 'uniqueInlinks', 'linkScore', 'internalPageRank'
        ]
    },
    local_seo: {
        id: 'local_seo',
        label: 'Local SEO Audit',
        description: 'Local relevance and location-first checks',
        icon: '📍',
        totalChecks: '~50',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'geo'],
        defaultColumns: [
            'url', 'title', 'statusCode', 'canonical', 'language',
            'wordCount', 'totalImages', 'missingAltImages'
        ]
    },
    ecommerce: {
        id: 'ecommerce',
        label: 'E-commerce Audit',
        description: 'Catalog, product, and conversion-critical checks',
        icon: '🛒',
        totalChecks: '~65',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'details'],
        defaultColumns: [
            'url', 'title', 'statusCode', 'lcp', 'crawlDepth',
            'canonical', 'wordCount', 'totalImages', 'sizeBytes'
        ]
    },
    news_editorial: {
        id: 'news_editorial',
        label: 'News / Editorial Audit',
        description: 'Freshness, article quality, and publishing signals',
        icon: '📰',
        totalChecks: '~50',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'details'],
        defaultColumns: [
            'url', 'title', 'statusCode', 'wordCount', 'lastModified',
            'contentDecay', 'readability', 'loadTime'
        ]
    },
    ai_discoverability: {
        id: 'ai_discoverability',
        label: 'AI Discoverability',
        description: 'AI crawler readiness and answer-engine signals',
        icon: '🤖',
        totalChecks: '~25',
        viewType: 'ai_view',
        sidebarSections: ['ai', 'issues'],
        defaultColumns: [
            'url', 'title', 'wordCount', 'readability', 'h1_1',
            'topicCluster', 'searchIntent'
        ]
    },
    competitor_gap: {
        id: 'competitor_gap',
        label: 'Competitor Gap Analysis',
        description: 'Keyword and content opportunities against competitors',
        icon: '🎯',
        totalChecks: '~45',
        viewType: 'competitor_matrix',
        sidebarSections: ['comp_overview', 'comp_gaps', 'comp_threats', 'comp_brief', 'comp_trends'],
        defaultColumns: [
            'url', 'title', 'gscClicks', 'gscImpressions', 'gscPosition',
            'mainKeyword', 'opportunityScore', 'businessValueScore'
        ],
        isCompetitiveMode: true
    },
    business: {
        id: 'business',
        label: 'Business Audit',
        description: 'Commercial intent and conversion readiness',
        icon: '💼',
        totalChecks: '~40',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'details'],
        defaultColumns: [
            'url', 'title', 'statusCode', 'wordCount', 'businessValueScore',
            'opportunityScore', 'recommendedAction'
        ]
    },
    accessibility: {
        id: 'accessibility',
        label: 'Accessibility Audit',
        description: 'A11y and usability for all users',
        icon: '♿',
        totalChecks: '~30',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'details'],
        defaultColumns: [
            'url', 'title', 'statusCode', 'missingAltImages',
            'language', 'wordCount', 'formsWithoutLabels',
            'smallTapTargets', 'smallFontCount'
        ]
  },
    security: {
        id: 'security',
        label: 'Security Audit',
        description: 'HTTPS, headers, cookies, and exposed secrets',
        icon: '🔒',
        totalChecks: '~25',
        viewType: 'grid',
        sidebarSections: ['overview', 'issues', 'details'],
        defaultColumns: [
            'url', 'statusCode', 'hasHsts', 'hasCsp', 'sslValid', 'sslProtocol',
            'insecureCookies', 'cookiesMissingSameSite', 'exposedApiKeys'
        ]
    }
};

/**
 * Returns WQA columns adjusted for detected industry.
 */
export function getWqaColumns(industry: DetectedIndustry): string[] {
    const base = AUDIT_MODES.website_quality.defaultColumns;

    const additions: Partial<Record<DetectedIndustry, string[]>> = {
        ecommerce: ['ga4EcommerceRevenue', 'ga4Transactions', 'ga4ConversionRate'],
        news: ['ga4Views', 'ga4EngagementTimePerPage', 'visibleDate', 'contentAge'],
        blog: ['ga4Views', 'ga4EngagementTimePerPage', 'contentAge'],
        local: ['ga4GoalCompletions'],
        saas: ['ga4Conversions', 'ga4ConversionRate'],
        healthcare: ['eeatScore'],
        finance: ['eeatScore'],
    };

    const removals: Partial<Record<DetectedIndustry, string[]>> = {
        news: ['ga4BounceRate'],
        blog: ['ga4BounceRate'],
    };

    const add = additions[industry] || [];
    const remove = new Set(removals[industry] || []);
    const baseSet = new Set(base);
    const extra = add.filter((col) => !baseSet.has(col));

    return [...base.filter((col) => !remove.has(col)), ...extra];
}

export const AUDIT_MODES_LIST = Object.values(AUDIT_MODES);


export const INDUSTRY_FILTERS: IndustryConfig[] = [
    { id: 'all', label: 'All Industries', description: 'Universal checks', icon: '🌐', extraChecksLabel: '' },
    { id: 'local', label: 'Local Business', description: 'Local service and store sites', icon: '📍', extraChecksLabel: '+ NAP, map pack, GMB checks' },
    { id: 'ecommerce', label: 'E-commerce', description: 'Product and catalog websites', icon: '🛒', extraChecksLabel: '+ product, catalog, pricing checks' },
    { id: 'saas', label: 'SaaS', description: 'Software products and platforms', icon: '💻', extraChecksLabel: '+ docs, pricing, onboarding checks' },
    { id: 'blog', label: 'Blog / Content', description: 'Editorial and knowledge content', icon: '📝', extraChecksLabel: '+ freshness, author, topic checks' },
    { id: 'news', label: 'News / Media', description: 'Publishing-heavy news sites', icon: '📰', extraChecksLabel: '+ article schema, recency checks' },
    { id: 'finance', label: 'Finance', description: 'Financial advice and fintech sites', icon: '💰', extraChecksLabel: '+ compliance and freshness checks' },
    { id: 'education', label: 'Education', description: 'Schools, LMS, and course sites', icon: '🎓', extraChecksLabel: '+ course and structure checks' },
    { id: 'healthcare', label: 'Healthcare', description: 'Medical and wellness properties', icon: '🏥', extraChecksLabel: '+ author trust and medical checks' },
    { id: 'real_estate', label: 'Real Estate', description: 'Listings and brokerage platforms', icon: '🏠', extraChecksLabel: '+ listing and local intent checks' },
    { id: 'restaurant', label: 'Restaurant / Food', description: 'Menu and reservation websites', icon: '🍽️', extraChecksLabel: '+ menu and local entity checks' }
];
