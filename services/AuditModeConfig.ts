import type { AuditMode, DetectedIndustry, IndustryFilter } from '@headlight/types';
import { INDUSTRY_FILTER_LABELS } from '@headlight/types';


export interface AuditModeConfig {
    id: AuditMode;
    label: string;
    description: string;
    icon: string;
    totalChecks: string;
    viewType: 'grid' | 'competitor_matrix' | 'ai_view' | 'geo_view' | 'opportunity_view' | 'visual_heat_map';
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
        id: 'fullAudit',
        label: 'Full Audit',
        description: 'All checks and all categories',
        icon: '🔍',
        totalChecks: '~250',
        viewType: 'grid',
        defaultColumns: []
    },
    website_quality: {
        id: 'wqa',
        label: 'Website Quality',
        description: 'Overall site quality, search performance, and actions',
        icon: '🌐',
        totalChecks: '~80',
        viewType: 'grid', // Driven by WQA mode router
        defaultColumns: [],
        isWqaMode: true,
    },
    technical_seo: {
        id: 'technical',
        label: 'Technical SEO Audit',
        description: 'Crawlability, indexing, speed, and protocol checks',
        icon: '⚙️',
        totalChecks: '~75',
        viewType: 'grid',
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
        defaultColumns: [
            'url', 'title', 'wordCount', 'readability', 'fleschScore',
            'textRatio', 'hash', 'nearDuplicateMatch', 'spellingErrors',
            'grammarErrors', 'contentQualityScore', 'contentDecay',
            'topicCluster', 'searchIntent', 'funnelStage'
        ]
    },
    on_page_seo: {
        id: 'wqa',
        label: 'On-Page SEO Audit',
        description: 'Titles, metadata, headings, and schema basics',
        icon: '📊',
        totalChecks: '~55',
        viewType: 'grid',
        defaultColumns: [
            'url', 'title', 'titleLength', 'titlePixelWidth', 'metaDesc',
            'metaDescLength', 'h1_1', 'h1_1Length', 'h2_1', 'canonical',
            'ogTitle', 'ogDescription', 'ogImage', 'twitterCard',
            'missingAltImages', 'totalImages'
        ]
    },
    off_page: {
        id: 'linksAuthority',
        label: 'Off-Page Audit',
        description: 'Authority, backlinks, and outbound footprint',
        icon: '🔗',
        totalChecks: '~40',
        viewType: 'grid',
        defaultColumns: [
            'url', 'authorityScore', 'urlRating', 'referringDomains',
            'backlinks', 'externalOutlinks', 'uniqueExternalOutlinks',
            'inlinks', 'uniqueInlinks', 'linkScore', 'internalPageRank'
        ]
    },
    local_seo: {
        id: 'local',
        label: 'Local SEO Audit',
        description: 'Local relevance and location-first checks',
        icon: '📍',
        totalChecks: '~50',
        viewType: 'grid',
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
        defaultColumns: [
            'url', 'title', 'statusCode', 'lcp', 'crawlDepth',
            'canonical', 'wordCount', 'totalImages', 'sizeBytes'
        ]
    },
    news_editorial: {
        id: 'content',
        label: 'News / Editorial Audit',
        description: 'Freshness, article quality, and publishing signals',
        icon: '📰',
        totalChecks: '~50',
        viewType: 'grid',
        defaultColumns: [
            'url', 'title', 'statusCode', 'wordCount', 'lastModified',
            'contentDecay', 'readability', 'loadTime'
        ]
    },
    ai_discoverability: {
        id: 'ai',
        label: 'AI Discoverability',
        description: 'AI crawler readiness and answer-engine signals',
        icon: '🤖',
        totalChecks: '~25',
        viewType: 'ai_view',
        defaultColumns: [
            'url', 'title', 'wordCount', 'readability', 'h1_1',
            'topicCluster', 'searchIntent'
        ]
    },
    competitor_gap: {
        id: 'competitors',
        label: 'Competitor Gap Analysis',
        description: 'Keyword and content opportunities against competitors',
        icon: '🎯',
        totalChecks: '~45',
        viewType: 'competitor_matrix',
        defaultColumns: [
            'url', 'title', 'gscClicks', 'gscImpressions', 'gscPosition',
            'mainKeyword', 'opportunityScore', 'businessValueScore'
        ],
        isCompetitiveMode: true
    },
    business: {
        id: 'wqa',
        label: 'Business Audit',
        description: 'Commercial intent and conversion readiness',
        icon: '💼',
        totalChecks: '~40',
        viewType: 'grid',
        defaultColumns: [
            'url', 'title', 'statusCode', 'wordCount', 'businessValueScore',
            'opportunityScore', 'recommendedAction'
        ]
    },
    accessibility: {
        id: 'technical',
        label: 'Accessibility Audit',
        description: 'A11y and usability for all users',
        icon: '♿',
        totalChecks: '~30',
        viewType: 'grid',
        defaultColumns: [
            'url', 'title', 'statusCode', 'missingAltImages',
            'language', 'wordCount', 'formsWithoutLabels',
            'smallTapTargets', 'smallFontCount'
        ]
  },
    security: {
        id: 'technical',
        label: 'Security Audit',
        description: 'HTTPS, headers, cookies, and exposed secrets',
        icon: '🔒',
        totalChecks: '~25',
        viewType: 'grid',
        defaultColumns: [
            'url', 'statusCode', 'hasHsts', 'hasCsp', 'sslValid', 'sslProtocol',
            'insecureCookies', 'cookiesMissingSameSite', 'exposedApiKeys'
        ]
    },
    uxConversion: {
        id: 'uxConversion',
        label: 'UX & Conversion',
        description: 'User experience, friction, and conversion signals',
        icon: '✨',
        totalChecks: '~45',
        viewType: 'grid',
        defaultColumns: []
    },
    paid: {
        id: 'paid',
        label: 'Paid Audit',
        description: 'PPC, ads, and landing page quality',
        icon: '💰',
        totalChecks: '~30',
        viewType: 'grid',
        defaultColumns: []
    },
    socialBrand: {
        id: 'socialBrand',
        label: 'Social & Brand',
        description: 'Social signals, brand mentions, and sentiment',
        icon: '📱',
        totalChecks: '~35',
        viewType: 'grid',
        defaultColumns: []
    }
};

import {
  getWqaColumns as getWqaColumnsFromAdapter,
  getWqaDefaultVisibleColumns as getWqaDefaultVisibleColumnsFromAdapter,
  type WqaColumnContext,
} from './adapters/WqaColumnAdapter';

/**
 * Returns WQA columns adjusted for detected industry.
 */
export function getWqaColumns(ctxOrIndustry: WqaColumnContext | DetectedIndustry, language = 'en', cms: string | null = null): string[] {
  return getWqaColumnsFromAdapter(ctxOrIndustry, language, cms);
}

export function getWqaDefaultVisibleColumns(ctxOrIndustry: WqaColumnContext | DetectedIndustry, language = 'en', cms: string | null = null): string[] {
  return getWqaDefaultVisibleColumnsFromAdapter(ctxOrIndustry, language, cms);
}

export const AUDIT_MODES_LIST = Object.values(AUDIT_MODES);


export const INDUSTRY_FILTERS: IndustryConfig[] = [
    { id: 'all', label: INDUSTRY_FILTER_LABELS.all, description: 'Universal checks', icon: '🌐', extraChecksLabel: '' },
    { id: 'local', label: INDUSTRY_FILTER_LABELS.local, description: 'Local service and store sites', icon: '📍', extraChecksLabel: '+ NAP, map pack, GMB checks' },
    { id: 'ecommerce', label: INDUSTRY_FILTER_LABELS.ecommerce, description: 'Product and catalog websites', icon: '🛒', extraChecksLabel: '+ product, catalog, pricing checks' },
    { id: 'saas', label: INDUSTRY_FILTER_LABELS.saas, description: 'Software products and platforms', icon: '💻', extraChecksLabel: '+ docs, pricing, onboarding checks' },
    { id: 'blog', label: INDUSTRY_FILTER_LABELS.blog, description: 'Editorial and knowledge content', icon: '📝', extraChecksLabel: '+ freshness, author, topic checks' },
    { id: 'news', label: INDUSTRY_FILTER_LABELS.news, description: 'Publishing-heavy news sites', icon: '📰', extraChecksLabel: '+ article schema, recency checks' },
    { id: 'finance', label: INDUSTRY_FILTER_LABELS.finance, description: 'Financial advice and fintech sites', icon: '💰', extraChecksLabel: '+ compliance and freshness checks' },
    { id: 'education', label: INDUSTRY_FILTER_LABELS.education, description: 'Schools, LMS, and course sites', icon: '🎓', extraChecksLabel: '+ course and structure checks' },
    { id: 'healthcare', label: INDUSTRY_FILTER_LABELS.healthcare, description: 'Medical and wellness properties', icon: '🏥', extraChecksLabel: '+ author trust and medical checks' },
    { id: 'realEstate', label: INDUSTRY_FILTER_LABELS.real_estate, description: 'Listings and brokerage platforms', icon: '🏠', extraChecksLabel: '+ listing and local intent checks' },
    { id: 'restaurant', label: INDUSTRY_FILTER_LABELS.restaurant, description: 'Menu and reservation websites', icon: '🍽️', extraChecksLabel: '+ menu and local entity checks' }
];
