import { ISSUE_TO_CHECK_MAP } from '../components/seo-crawler/constants';

export type AuditMode =
    | 'full'
    | 'website_quality'
    | 'technical_seo'
    | 'content'
    | 'on_page_seo'
    | 'off_page'
    | 'local_seo'
    | 'ecommerce'
    | 'news_editorial'
    | 'ai_discoverability'
    | 'competitor_gap'
    | 'business'
    | 'accessibility'
    | 'security';

export type IndustryFilter =
    | 'all'
    | 'local_business'
    | 'ecommerce'
    | 'saas'
    | 'blog_content'
    | 'news_media'
    | 'agency'
    | 'education'
    | 'healthcare'
    | 'real_estate'
    | 'restaurant_food'
    | 'global_multiregion';

export type CheckTier = 1 | 2 | 3 | 4;
export type CheckSeverity = 'critical' | 'warning' | 'info' | 'pass';

export type CheckCategory =
    | 'http'
    | 'dns_ssl'
    | 'crawlability'
    | 'performance'
    | 'links'
    | 'url_structure'
    | 'security_privacy'
    | 'js_rendering'
    | 'resource_optimization'
    | 'title_meta'
    | 'headings_content'
    | 'images'
    | 'structured_data'
    | 'accessibility'
    | 'mobile'
    | 'content_intelligence'
    | 'keyword_intelligence'
    | 'issue_intelligence'
    | 'ai_discoverability'
    | 'business_signals'
    | 'social_audit'
    | 'competitor'
    | 'citations_reviews'
    | 'ads_ppc'
    | 'conversion_ux'
    | 'tech_debt_compliance'
    | 'ecommerce_specific'
    | 'local_specific'
    | 'news_specific'
    | 'saas_specific'
    | 'healthcare_specific'
    | 'education_specific';

export interface CheckDefinition {
    id: string;
    name: string;
    tier: CheckTier;
    category: CheckCategory;
    auditModes: AuditMode[];
    industries: IndustryFilter[];
    defaultSeverity: CheckSeverity;
}

export const ALL_AUDIT_MODES: AuditMode[] = [
    'full',
    'website_quality',
    'technical_seo',
    'content',
    'on_page_seo',
    'off_page',
    'local_seo',
    'ecommerce',
    'news_editorial',
    'ai_discoverability',
    'competitor_gap',
    'business',
    'accessibility',
    'security'
];

const CORE_CHECK_REGISTRY: CheckDefinition[] = [
    { id: 't1-status-code', name: 'HTTP Status Code', tier: 1, category: 'http', auditModes: ['full', 'website_quality', 'technical_seo', 'ecommerce', 'local_seo', 'news_editorial'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't1-redirect-chain', name: 'Redirect Chain Length', tier: 1, category: 'http', auditModes: ['full', 'website_quality', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-redirect-loop', name: 'Redirect Loop Detection', tier: 1, category: 'http', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't1-https', name: 'HTTPS Enforcement', tier: 1, category: 'security_privacy', auditModes: ['full', 'website_quality', 'technical_seo', 'security'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't1-mixed-content', name: 'Mixed Content', tier: 1, category: 'security_privacy', auditModes: ['full', 'website_quality', 'technical_seo', 'security'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-hsts', name: 'HSTS Header', tier: 1, category: 'security_privacy', auditModes: ['full', 'technical_seo', 'security'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-csp', name: 'Content Security Policy', tier: 1, category: 'security_privacy', auditModes: ['full', 'technical_seo', 'security'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-permissions-policy', name: 'Permissions Policy Header', tier: 1, category: 'security_privacy', auditModes: ['full', 'security'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-server-response', name: 'Server Response Time', tier: 1, category: 'performance', auditModes: ['full', 'website_quality', 'technical_seo', 'ecommerce'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-http2', name: 'HTTP/2 or HTTP/3', tier: 1, category: 'http', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-cache-headers', name: 'Cache Headers', tier: 1, category: 'resource_optimization', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-security-headers', name: 'Security Headers', tier: 1, category: 'security_privacy', auditModes: ['full', 'security'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-ssl-valid', name: 'SSL Certificate Validity', tier: 1, category: 'dns_ssl', auditModes: ['full', 'technical_seo', 'security'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't1-ssl-expiry', name: 'SSL Expiry Warning', tier: 1, category: 'dns_ssl', auditModes: ['full', 'technical_seo', 'security'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-canonical', name: 'Canonical URL', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo', 'on_page_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-canonical-chain', name: 'Canonical Chain', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-meta-robots', name: 'Meta Robots', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo', 'on_page_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-sitemap-presence', name: 'Sitemap Presence', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo', 'website_quality'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-orphan', name: 'Orphan Page Detection', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo', 'content'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-crawl-depth', name: 'Crawl Depth Health', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-lcp', name: 'Largest Contentful Paint', tier: 1, category: 'performance', auditModes: ['full', 'website_quality', 'technical_seo', 'ecommerce'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-cls', name: 'Cumulative Layout Shift', tier: 1, category: 'performance', auditModes: ['full', 'website_quality', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-fid', name: 'INP/FID Responsiveness', tier: 1, category: 'performance', auditModes: ['full', 'website_quality', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-dom-size', name: 'DOM Size', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-render-blocking', name: 'Render-Blocking Resources', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-page-size', name: 'Large Page Size', tier: 1, category: 'resource_optimization', auditModes: ['full', 'website_quality', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-broken-links', name: 'Broken Internal Links', tier: 1, category: 'links', auditModes: ['full', 'website_quality', 'technical_seo', 'off_page'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't1-link-text', name: 'Anchor Text Quality', tier: 1, category: 'links', auditModes: ['full', 'on_page_seo', 'accessibility'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-outbound-count', name: 'Excessive Links Count', tier: 1, category: 'links', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-internal-count', name: 'Low Internal Link Coverage', tier: 1, category: 'links', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-title-exists', name: 'Title Tag Presence', tier: 2, category: 'title_meta', auditModes: ['full', 'on_page_seo', 'content', 'website_quality'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't2-title-length', name: 'Title Length', tier: 2, category: 'title_meta', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-title-duplicate', name: 'Duplicate Title', tier: 2, category: 'title_meta', auditModes: ['full', 'on_page_seo', 'content'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-title-keyword', name: 'Title/H1 Overlap', tier: 2, category: 'title_meta', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-meta-desc-exists', name: 'Meta Description Presence', tier: 2, category: 'title_meta', auditModes: ['full', 'on_page_seo', 'content', 'website_quality'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-meta-desc-length', name: 'Meta Description Length', tier: 2, category: 'title_meta', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-meta-desc-duplicate', name: 'Meta Description Duplication', tier: 2, category: 'title_meta', auditModes: ['full', 'on_page_seo', 'content'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-og-tags', name: 'Open Graph Tags', tier: 2, category: 'title_meta', auditModes: ['full', 'on_page_seo', 'off_page'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-h1-exists', name: 'H1 Presence', tier: 2, category: 'headings_content', auditModes: ['full', 'on_page_seo', 'content', 'website_quality'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-h1-multiple', name: 'Multiple H1 Detection', tier: 2, category: 'headings_content', auditModes: ['full', 'on_page_seo', 'content'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-h1-length', name: 'H1 Length', tier: 2, category: 'headings_content', auditModes: ['full', 'content', 'on_page_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-heading-hierarchy', name: 'Heading Hierarchy', tier: 2, category: 'headings_content', auditModes: ['full', 'on_page_seo', 'content'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-thin-content', name: 'Thin Content', tier: 2, category: 'headings_content', auditModes: ['full', 'content'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-duplicate-content', name: 'Duplicate Content', tier: 2, category: 'headings_content', auditModes: ['full', 'content'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't2-reading-level', name: 'Readability Level', tier: 2, category: 'headings_content', auditModes: ['full', 'content'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-keyword-cannibalization', name: 'Keyword Cannibalization', tier: 2, category: 'headings_content', auditModes: ['full', 'content', 'on_page_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-content-freshness', name: 'Content Freshness', tier: 2, category: 'headings_content', auditModes: ['full', 'content', 'news_editorial'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-img-alt', name: 'Image Alt Text', tier: 2, category: 'images', auditModes: ['full', 'on_page_seo', 'website_quality', 'accessibility'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-img-format', name: 'Image Format Optimization', tier: 2, category: 'images', auditModes: ['full', 'on_page_seo', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-img-dimensions', name: 'Image Dimensions', tier: 2, category: 'images', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-img-lazy', name: 'Lazy Loading Images', tier: 2, category: 'images', auditModes: ['full', 'technical_seo', 'website_quality'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-schema-exists', name: 'Schema Presence', tier: 2, category: 'structured_data', auditModes: ['full', 'on_page_seo', 'ecommerce', 'local_seo', 'news_editorial'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-schema-valid', name: 'Schema Validity', tier: 2, category: 'structured_data', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-a11y-lang', name: 'Language Attribute', tier: 2, category: 'accessibility', auditModes: ['full', 'website_quality', 'accessibility'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-a11y-contrast', name: 'Color Contrast', tier: 2, category: 'accessibility', auditModes: ['full', 'accessibility'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-a11y-form', name: 'Form Labels', tier: 2, category: 'accessibility', auditModes: ['full', 'website_quality', 'accessibility'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-mobile-viewport', name: 'Mobile Viewport', tier: 2, category: 'mobile', auditModes: ['full', 'website_quality', 'technical_seo'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't2-mobile-tap-targets', name: 'Tap Target Size', tier: 2, category: 'mobile', auditModes: ['full', 'website_quality', 'accessibility'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't3-content-quality', name: 'Content Quality Score', tier: 3, category: 'content_intelligence', auditModes: ['full', 'content', 'website_quality'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't3-content-intent', name: 'Search Intent Match', tier: 3, category: 'content_intelligence', auditModes: ['full', 'content', 'on_page_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't3-content-eeat', name: 'E-E-A-T Signals', tier: 3, category: 'content_intelligence', auditModes: ['full', 'content', 'website_quality'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't3-content-decay', name: 'Content Decay Risk', tier: 3, category: 'content_intelligence', auditModes: ['full', 'content', 'news_editorial'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't3-keyword-extract', name: 'Keyword Extraction', tier: 3, category: 'keyword_intelligence', auditModes: ['full', 'content', 'on_page_seo', 'competitor_gap'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't3-topic-cluster', name: 'Topic Cluster Assignment', tier: 3, category: 'keyword_intelligence', auditModes: ['full', 'content'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't3-keyword-opportunity', name: 'Keyword Opportunity', tier: 3, category: 'keyword_intelligence', auditModes: ['full', 'content', 'competitor_gap'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't3-issue-priority', name: 'Issue Priority Scoring', tier: 3, category: 'issue_intelligence', auditModes: ['full', 'website_quality', 'technical_seo', 'content'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't3-fix-suggestion', name: 'Automated Fix Suggestions', tier: 3, category: 'issue_intelligence', auditModes: ['full', 'website_quality', 'technical_seo', 'content', 'on_page_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't3-llms-txt', name: 'llms.txt Presence', tier: 3, category: 'ai_discoverability', auditModes: ['full', 'ai_discoverability'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't3-ai-crawler-rules', name: 'AI Crawler Rules', tier: 3, category: 'ai_discoverability', auditModes: ['full', 'ai_discoverability'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't3-featured-snippet', name: 'Featured Snippet Readiness', tier: 3, category: 'ai_discoverability', auditModes: ['full', 'ai_discoverability', 'content'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-pricing-page', name: 'Pricing Page Detection', tier: 4, category: 'business_signals', auditModes: ['full', 'business'], industries: ['saas', 'ecommerce'], defaultSeverity: 'info' },
    { id: 't4-trust-signals', name: 'Trust Signals', tier: 4, category: 'business_signals', auditModes: ['full', 'business', 'website_quality'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-cta-analysis', name: 'CTA Analysis', tier: 4, category: 'conversion_ux', auditModes: ['full', 'business'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-social-profiles', name: 'Social Profile Detection', tier: 4, category: 'social_audit', auditModes: ['full', 'off_page', 'business'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-comp-keyword-gap', name: 'Keyword Gap', tier: 4, category: 'competitor', auditModes: ['full', 'competitor_gap'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-comp-content-gap', name: 'Content Gap', tier: 4, category: 'competitor', auditModes: ['full', 'competitor_gap'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-ecom-product-schema', name: 'Product Schema Markup', tier: 4, category: 'ecommerce_specific', auditModes: ['full', 'ecommerce'], industries: ['ecommerce'], defaultSeverity: 'warning' },
    { id: 't4-ecom-faceted-nav', name: 'Faceted Navigation Handling', tier: 4, category: 'ecommerce_specific', auditModes: ['full', 'ecommerce', 'technical_seo'], industries: ['ecommerce'], defaultSeverity: 'warning' },
    { id: 't4-ecom-breadcrumbs', name: 'Product Category Breadcrumbs', tier: 4, category: 'ecommerce_specific', auditModes: ['full', 'ecommerce'], industries: ['ecommerce'], defaultSeverity: 'info' },
    { id: 't4-local-nap', name: 'NAP Consistency', tier: 4, category: 'local_specific', auditModes: ['full', 'local_seo'], industries: ['local_business'], defaultSeverity: 'warning' },
    { id: 't4-local-schema', name: 'LocalBusiness Schema', tier: 4, category: 'local_specific', auditModes: ['full', 'local_seo'], industries: ['local_business'], defaultSeverity: 'warning' },
    { id: 't4-local-gmb', name: 'Google Business Profile Link', tier: 4, category: 'local_specific', auditModes: ['full', 'local_seo'], industries: ['local_business'], defaultSeverity: 'info' },
    { id: 't4-news-article-schema', name: 'NewsArticle Schema', tier: 4, category: 'news_specific', auditModes: ['full', 'news_editorial'], industries: ['news_media'], defaultSeverity: 'warning' },
    { id: 't4-news-pub-date', name: 'Publication Date Signals', tier: 4, category: 'news_specific', auditModes: ['full', 'news_editorial', 'content'], industries: ['news_media', 'blog_content'], defaultSeverity: 'warning' },
    { id: 't4-saas-pricing', name: 'SaaS Pricing Page Quality', tier: 4, category: 'saas_specific', auditModes: ['full', 'business'], industries: ['saas'], defaultSeverity: 'info' },
    { id: 't4-saas-docs', name: 'Documentation Quality', tier: 4, category: 'saas_specific', auditModes: ['full', 'business'], industries: ['saas'], defaultSeverity: 'info' },
    { id: 't4-health-author', name: 'Medical Author Attribution', tier: 4, category: 'healthcare_specific', auditModes: ['full', 'content'], industries: ['healthcare'], defaultSeverity: 'warning' },
    { id: 't4-cookie-compliance', name: 'Cookie Compliance', tier: 4, category: 'tech_debt_compliance', auditModes: ['full', 'security'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-carbon-footprint', name: 'Carbon Footprint', tier: 4, category: 'tech_debt_compliance', auditModes: ['full', 'website_quality'], industries: ['all'], defaultSeverity: 'info' }
];

const inferTier = (id: string): CheckTier => {
    const match = /^t([1-4])-/i.exec(id);
    if (!match) return 2;
    return Number(match[1]) as CheckTier;
};

const inferCategory = (id: string): CheckCategory => {
    const key = id.toLowerCase();
    if (key.includes('schema')) return 'structured_data';
    if (key.includes('title') || key.includes('meta')) return 'title_meta';
    if (key.includes('h1') || key.includes('h2') || key.includes('heading') || key.includes('content')) return 'headings_content';
    if (key.includes('img') || key.includes('image')) return 'images';
    if (key.includes('lcp') || key.includes('cls') || key.includes('fid') || key.includes('inp') || key.includes('dom') || key.includes('render') || key.includes('speed') || key.includes('page-size')) return 'performance';
    if (key.includes('mobile') || key.includes('viewport') || key.includes('tap')) return 'mobile';
    if (key.includes('ssl') || key.includes('tls') || key.includes('https') || key.includes('csp') || key.includes('cookie') || key.includes('security') || key.includes('api-key') || key.includes('hsts')) return 'security_privacy';
    if (key.includes('keyword') || key.includes('topic')) return 'keyword_intelligence';
    if (key.includes('link') || key.includes('orphan') || key.includes('canonical') || key.includes('sitemap') || key.includes('crawl') || key.includes('robots')) return 'crawlability';
    return 'crawlability';
};

const titleizeCheckId = (id: string) =>
    id
        .replace(/^t[1-4]-/i, '')
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const registryById = new Map(CORE_CHECK_REGISTRY.map((check) => [check.id, check] as const));
const mappedCheckIds = Array.from(new Set(Object.values(ISSUE_TO_CHECK_MAP)));

for (const checkId of mappedCheckIds) {
    if (registryById.has(checkId)) continue;
    registryById.set(checkId, {
        id: checkId,
        name: titleizeCheckId(checkId),
        tier: inferTier(checkId),
        category: inferCategory(checkId),
        auditModes: ALL_AUDIT_MODES,
        industries: ['all'],
        defaultSeverity: 'warning'
    });
}

export const CHECK_REGISTRY: CheckDefinition[] = Array.from(registryById.values());

export const CHECK_REGISTRY_BY_ID: Record<string, CheckDefinition> = CHECK_REGISTRY.reduce<Record<string, CheckDefinition>>((acc, check) => {
    acc[check.id] = check;
    return acc;
}, {});
