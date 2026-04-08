import type { AuditMode, IndustryFilter } from './CheckRegistry';

export interface AuditModeConfig {
    id: AuditMode;
    label: string;
    description: string;
    icon: string;
    totalChecks: string;
    defaultColumns: string[];
}

export interface IndustryConfig {
    id: IndustryFilter;
    label: string;
    description: string;
    icon: string;
    extraChecksLabel: string;
}

export const AUDIT_MODES: AuditModeConfig[] = [
    {
        id: 'full',
        label: 'Full Audit',
        description: 'All checks and all categories',
        icon: '🔍',
        totalChecks: '~250',
        defaultColumns: []
    },
    {
        id: 'website_quality',
        label: 'Website Quality Audit',
        description: 'Errors, UX, and core quality signals',
        icon: '🌐',
        totalChecks: '~80',
        defaultColumns: [
            'url', 'statusCode', 'title', 'metaDesc', 'wordCount', 'loadTime',
            'lcp', 'cls', 'missingAltImages', 'spellingErrors', 'grammarErrors',
            'techHealthScore', 'contentQualityScore', 'recommendedAction'
        ]
    },
    {
        id: 'technical_seo',
        label: 'Technical SEO Audit',
        description: 'Crawlability, indexing, speed, and protocol checks',
        icon: '⚙️',
        totalChecks: '~75',
        defaultColumns: [
            'url', 'statusCode', 'canonical', 'metaRobots1', 'redirectUrl',
            'redirectChainLength', 'inSitemap', 'crawlDepth', 'loadTime',
            'lcp', 'cls', 'inp', 'sizeBytes', 'httpVersion', 'language',
            'indexable', 'indexabilityStatus'
        ]
    },
    {
        id: 'content',
        label: 'Content Audit',
        description: 'Quality, duplication, decay, and topic coverage',
        icon: '📝',
        totalChecks: '~60',
        defaultColumns: [
            'url', 'title', 'wordCount', 'readability', 'fleschScore',
            'textRatio', 'hash', 'nearDuplicateMatch', 'spellingErrors',
            'grammarErrors', 'contentQualityScore', 'contentDecay',
            'topicCluster', 'searchIntent', 'funnelStage'
        ]
    },
    {
        id: 'on_page_seo',
        label: 'On-Page SEO Audit',
        description: 'Titles, metadata, headings, and schema basics',
        icon: '📊',
        totalChecks: '~55',
        defaultColumns: [
            'url', 'title', 'titleLength', 'titlePixelWidth', 'metaDesc',
            'metaDescLength', 'h1_1', 'h1_1Length', 'h2_1', 'canonical',
            'ogTitle', 'ogDescription', 'ogImage', 'twitterCard',
            'missingAltImages', 'totalImages'
        ]
    },
    {
        id: 'off_page',
        label: 'Off-Page Audit',
        description: 'Authority, backlinks, and outbound footprint',
        icon: '🔗',
        totalChecks: '~40',
        defaultColumns: [
            'url', 'authorityScore', 'urlRating', 'referringDomains',
            'backlinks', 'externalOutlinks', 'uniqueExternalOutlinks',
            'inlinks', 'uniqueInlinks', 'linkScore', 'internalPageRank'
        ]
    },
    {
        id: 'local_seo',
        label: 'Local SEO Audit',
        description: 'Local relevance and location-first checks',
        icon: '📍',
        totalChecks: '~50',
        defaultColumns: [
            'url', 'title', 'statusCode', 'canonical', 'language',
            'wordCount', 'totalImages', 'missingAltImages'
        ]
    },
    {
        id: 'ecommerce',
        label: 'E-commerce Audit',
        description: 'Catalog, product, and conversion-critical checks',
        icon: '🛒',
        totalChecks: '~65',
        defaultColumns: [
            'url', 'title', 'statusCode', 'lcp', 'crawlDepth',
            'canonical', 'wordCount', 'totalImages', 'sizeBytes'
        ]
    },
    {
        id: 'news_editorial',
        label: 'News / Editorial Audit',
        description: 'Freshness, article quality, and publishing signals',
        icon: '📰',
        totalChecks: '~50',
        defaultColumns: [
            'url', 'title', 'statusCode', 'wordCount', 'lastModified',
            'contentDecay', 'readability', 'loadTime'
        ]
    },
    {
        id: 'ai_discoverability',
        label: 'AI Discoverability',
        description: 'AI crawler readiness and answer-engine signals',
        icon: '🤖',
        totalChecks: '~25',
        defaultColumns: [
            'url', 'title', 'wordCount', 'readability', 'h1_1',
            'topicCluster', 'searchIntent'
        ]
    },
    {
        id: 'competitor_gap',
        label: 'Competitor Gap Analysis',
        description: 'Keyword and content opportunities against competitors',
        icon: '🎯',
        totalChecks: '~45',
        defaultColumns: [
            'url', 'title', 'gscClicks', 'gscImpressions', 'gscPosition',
            'mainKeyword', 'opportunityScore', 'businessValueScore'
        ]
    },
    {
        id: 'business',
        label: 'Business Audit',
        description: 'Commercial intent and conversion readiness',
        icon: '💼',
        totalChecks: '~40',
        defaultColumns: [
            'url', 'title', 'statusCode', 'wordCount', 'businessValueScore',
            'opportunityScore', 'recommendedAction'
        ]
    },
    {
        id: 'accessibility',
        label: 'Accessibility Audit',
        description: 'A11y and usability for all users',
        icon: '♿',
        totalChecks: '~30',
        defaultColumns: [
            'url', 'title', 'statusCode', 'missingAltImages',
            'language', 'wordCount', 'formsWithoutLabels',
            'smallTapTargets', 'smallFontCount'
        ]
    },
    {
        id: 'security',
        label: 'Security Audit',
        description: 'HTTPS, headers, cookies, and exposed secrets',
        icon: '🔒',
        totalChecks: '~25',
        defaultColumns: [
            'url', 'statusCode', 'hasHsts', 'hasCsp', 'sslValid', 'sslProtocol',
            'insecureCookies', 'cookiesMissingSameSite', 'exposedApiKeys'
        ]
    }
];

export const INDUSTRY_FILTERS: IndustryConfig[] = [
    { id: 'all', label: 'All Industries', description: 'Universal checks', icon: '🌐', extraChecksLabel: '' },
    { id: 'local_business', label: 'Local Business', description: 'Local service and store sites', icon: '📍', extraChecksLabel: '+ NAP, map pack, GMB checks' },
    { id: 'ecommerce', label: 'E-commerce', description: 'Product and catalog websites', icon: '🛒', extraChecksLabel: '+ product, catalog, pricing checks' },
    { id: 'saas', label: 'SaaS', description: 'Software products and platforms', icon: '💻', extraChecksLabel: '+ docs, pricing, onboarding checks' },
    { id: 'blog_content', label: 'Blog / Content', description: 'Editorial and knowledge content', icon: '📝', extraChecksLabel: '+ freshness, author, topic checks' },
    { id: 'news_media', label: 'News / Media', description: 'Publishing-heavy news sites', icon: '📰', extraChecksLabel: '+ article schema, recency checks' },
    { id: 'agency', label: 'Agency', description: 'Agency and consultancy sites', icon: '🏢', extraChecksLabel: '+ portfolio and trust checks' },
    { id: 'education', label: 'Education', description: 'Schools, LMS, and course sites', icon: '🎓', extraChecksLabel: '+ course and structure checks' },
    { id: 'healthcare', label: 'Healthcare', description: 'Medical and wellness properties', icon: '🏥', extraChecksLabel: '+ author trust and medical checks' },
    { id: 'real_estate', label: 'Real Estate', description: 'Listings and brokerage platforms', icon: '🏠', extraChecksLabel: '+ listing and local intent checks' },
    { id: 'restaurant_food', label: 'Restaurant / Food', description: 'Menu and reservation websites', icon: '🍽️', extraChecksLabel: '+ menu and local entity checks' },
    { id: 'global_multiregion', label: 'Global / Multi-region', description: 'Internationalized websites', icon: '🌍', extraChecksLabel: '+ hreflang and geo checks' }
];
