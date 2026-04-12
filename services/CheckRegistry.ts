import { ISSUE_TO_CHECK_MAP } from '../components/seo-crawler/IssueTaxonomy';

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
    | 'local'
    | 'ecommerce'
    | 'saas'
    | 'blog'
    | 'news'
    | 'healthcare'
    | 'education'
    | 'real_estate'
    | 'restaurant';

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
    | 'social_media'
    | 'competitor'
    | 'ads_ppc'
    | 'conversion_ux'
    | 'tech_debt'
    | 'ecommerce'
    | 'local'
    | 'news'
    | 'saas'
    | 'healthcare';

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
    { id: 't1-gzip', name: 'Compression Enabled', tier: 1, category: 'http', auditModes: ['full', 'technical_seo', 'website_quality'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-content-type', name: 'Content-Type Validation', tier: 1, category: 'http', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
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
    // DNS
    { id: 't1-dns-resolution', name: 'DNS Resolution Time', tier: 1, category: 'dns_ssl', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    // Links  
    { id: 't1-broken-external', name: 'Broken External Links', tier: 1, category: 'links', auditModes: ['full', 'off_page', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-nofollow-internal', name: 'Internal Nofollow Links', tier: 1, category: 'links', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-link-ratio', name: 'Internal/External Link Ratio', tier: 1, category: 'links', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-link-fragment', name: 'Fragment Link Validity', tier: 1, category: 'links', auditModes: ['full', 'technical_seo', 'accessibility'], industries: ['all'], defaultSeverity: 'info' },
    // URL
    { id: 't1-url-length', name: 'URL Length', tier: 1, category: 'url_structure', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-url-encoding', name: 'URL Encoding Issues', tier: 1, category: 'url_structure', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-url-depth', name: 'URL Depth', tier: 1, category: 'url_structure', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-trailing-slash', name: 'Trailing Slash Consistency', tier: 1, category: 'url_structure', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-www-consistency', name: 'WWW vs Non-WWW', tier: 1, category: 'url_structure', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-duplicate-urls', name: 'Duplicate URL Detection', tier: 1, category: 'url_structure', auditModes: ['full', 'technical_seo', 'content'], industries: ['all'], defaultSeverity: 'warning' },
    // JS Rendering
    { id: 't1-js-required', name: 'JavaScript Dependency', tier: 1, category: 'js_rendering', auditModes: ['full', 'technical_seo', 'ai_discoverability'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-js-errors', name: 'JavaScript Console Errors', tier: 1, category: 'js_rendering', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-noscript', name: 'Noscript Fallback', tier: 1, category: 'js_rendering', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-dynamic-links', name: 'JavaScript-Generated Links', tier: 1, category: 'js_rendering', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    // Performance
    { id: 't1-fcp', name: 'First Contentful Paint', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo', 'website_quality'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-requests', name: 'HTTP Request Count', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo', 'website_quality'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-js-size', name: 'JavaScript Payload Size', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-css-size', name: 'CSS Payload Size', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-ttfb', name: 'Time to First Byte', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-third-party', name: 'Third-Party Impact', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-font-loading', name: 'Font Loading Strategy', tier: 1, category: 'resource_optimization', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-lazy-loading', name: 'Image Lazy Loading', tier: 1, category: 'resource_optimization', auditModes: ['full', 'technical_seo', 'website_quality'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-unused-css', name: 'Unused CSS', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-unused-js', name: 'Unused JavaScript', tier: 1, category: 'performance', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    // Resource Optimization
    { id: 't1-preconnect', name: 'Preconnect Hints', tier: 1, category: 'resource_optimization', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-preload', name: 'Critical Resource Preload', tier: 1, category: 'resource_optimization', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-image-srcset', name: 'Responsive Images', tier: 1, category: 'resource_optimization', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-video-optimization', name: 'Video Optimization', tier: 1, category: 'resource_optimization', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-service-worker', name: 'Service Worker', tier: 1, category: 'resource_optimization', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-web-app-manifest', name: 'Web App Manifest', tier: 1, category: 'resource_optimization', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    // Security
    { id: 't1-exposed-emails', name: 'Exposed Email Addresses', tier: 1, category: 'security_privacy', auditModes: ['full', 'security'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-exposed-keys', name: 'Exposed API Keys', tier: 1, category: 'security_privacy', auditModes: ['full', 'security'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't1-directory-listing', name: 'Directory Listing Enabled', tier: 1, category: 'security_privacy', auditModes: ['full', 'security'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-sensitive-files', name: 'Sensitive Files Exposed', tier: 1, category: 'security_privacy', auditModes: ['full', 'security'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't1-cookie-security', name: 'Cookie Security Flags', tier: 1, category: 'security_privacy', auditModes: ['full', 'security'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-subresource-integrity', name: 'Subresource Integrity', tier: 1, category: 'security_privacy', auditModes: ['full', 'security'], industries: ['all'], defaultSeverity: 'info' },
    // Crawlability
    { id: 't1-robots-txt', name: 'Robots.txt Accessibility', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-robots-blocked', name: 'Robots.txt Block Check', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't1-canonical-self', name: 'Self-Referencing Canonical', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-indexable', name: 'Indexability Status', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo', 'website_quality'], industries: ['all'], defaultSeverity: 'critical' },
    { id: 't1-pagination', name: 'Pagination Handling', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't1-hreflang', name: 'Hreflang Tags', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo', 'local_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't1-hreflang-return', name: 'Hreflang Return Tags', tier: 1, category: 'crawlability', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
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
    // Tier 2 additions
    { id: 't2-meta-charset', name: 'Charset Declaration', tier: 2, category: 'title_meta', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-twitter-cards', name: 'Twitter Card Tags', tier: 2, category: 'title_meta', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-favicon', name: 'Favicon', tier: 2, category: 'title_meta', auditModes: ['full', 'website_quality'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-heading-keyword', name: 'Keywords in Headings', tier: 2, category: 'headings_content', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-word-count', name: 'Word Count', tier: 2, category: 'headings_content', auditModes: ['full', 'content'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-content-ratio', name: 'Text to HTML Ratio', tier: 2, category: 'headings_content', auditModes: ['full', 'content'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-keyword-density', name: 'Keyword Density', tier: 2, category: 'headings_content', auditModes: ['full', 'on_page_seo', 'content'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-keyword-stuffing', name: 'Keyword Stuffing Detection', tier: 2, category: 'headings_content', auditModes: ['full', 'on_page_seo', 'content'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-img-size', name: 'Image File Size', tier: 2, category: 'images', auditModes: ['full', 'website_quality', 'technical_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-img-broken', name: 'Broken Images', tier: 2, category: 'images', auditModes: ['full', 'website_quality'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-img-decorative', name: 'Decorative Image Handling', tier: 2, category: 'images', auditModes: ['full', 'accessibility'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-schema-type', name: 'Schema Type Check', tier: 2, category: 'structured_data', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-schema-required', name: 'Required Schema Properties', tier: 2, category: 'structured_data', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-breadcrumb-schema', name: 'Breadcrumb Schema', tier: 2, category: 'structured_data', auditModes: ['full', 'on_page_seo', 'ecommerce'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-faq-schema', name: 'FAQ Schema', tier: 2, category: 'structured_data', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-article-schema', name: 'Article Schema', tier: 2, category: 'structured_data', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-org-schema', name: 'Organization Schema', tier: 2, category: 'structured_data', auditModes: ['full', 'on_page_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-a11y-aria', name: 'ARIA Labels', tier: 2, category: 'accessibility', auditModes: ['full', 'accessibility'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-a11y-focus', name: 'Focus Indicators', tier: 2, category: 'accessibility', auditModes: ['full', 'accessibility'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-a11y-landmarks', name: 'Landmark Roles', tier: 2, category: 'accessibility', auditModes: ['full', 'accessibility'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-a11y-skip-link', name: 'Skip Navigation Link', tier: 2, category: 'accessibility', auditModes: ['full', 'accessibility'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-a11y-table', name: 'Table Accessibility', tier: 2, category: 'accessibility', auditModes: ['full', 'accessibility'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't2-mobile-font-size', name: 'Font Size', tier: 2, category: 'mobile', auditModes: ['full', 'website_quality', 'accessibility'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-mobile-horizontal-scroll', name: 'Horizontal Scroll', tier: 2, category: 'mobile', auditModes: ['full', 'website_quality'], industries: ['all'], defaultSeverity: 'warning' },
    { id: 't2-mobile-friendly', name: 'Mobile-Friendly Score', tier: 2, category: 'mobile', auditModes: ['full', 'website_quality'], industries: ['all'], defaultSeverity: 'warning' },
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
    { id: 't4-pricing-page', name: 'Pricing Page Detection', tier: 4, category: 'business_signals', auditModes: ['full', 'ecommerce', 'competitor_gap'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-usp-detection', name: 'USP Detection', tier: 4, category: 'business_signals', auditModes: ['full', 'competitor_gap'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-team-page', name: 'Team Page Analysis', tier: 4, category: 'business_signals', auditModes: ['full'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-business-age', name: 'Business Age Estimation', tier: 4, category: 'business_signals', auditModes: ['full', 'competitor_gap'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-contact-info', name: 'Contact Information', tier: 4, category: 'business_signals', auditModes: ['full', 'local_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-trust-signals', name: 'Trust Signals', tier: 4, category: 'business_signals', auditModes: ['full', 'website_quality'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-cta-analysis', name: 'CTA Analysis', tier: 4, category: 'business_signals', auditModes: ['full', 'website_quality', 'ecommerce'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-conversion-paths', name: 'Conversion Path Detection', tier: 4, category: 'business_signals', auditModes: ['full', 'ecommerce'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-social-profiles', name: 'Social Profile Detection', tier: 4, category: 'social_media', auditModes: ['full', 'off_page'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-social-schema', name: 'Social Schema Markup', tier: 4, category: 'social_media', auditModes: ['full', 'off_page'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-comp-tech-stack', name: 'Tech Stack Comparison', tier: 4, category: 'competitor', auditModes: ['full', 'competitor_gap'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-ad-scripts', name: 'Ad Platform Detection', tier: 4, category: 'ads_ppc', auditModes: ['full'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-conversion-tracking', name: 'Conversion Tracking', tier: 4, category: 'ads_ppc', auditModes: ['full', 'ecommerce'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-remarketing', name: 'Remarketing Tags', tier: 4, category: 'ads_ppc', auditModes: ['full'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-form-quality', name: 'Form Quality', tier: 4, category: 'conversion_ux', auditModes: ['full', 'website_quality', 'ecommerce'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-social-proof', name: 'Social Proof Signals', tier: 4, category: 'conversion_ux', auditModes: ['full', 'website_quality'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-exit-intent', name: 'Exit Intent Detection', tier: 4, category: 'conversion_ux', auditModes: ['full'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-tech-stack-age', name: 'Tech Stack Age', tier: 4, category: 'tech_debt', auditModes: ['full', 'technical_seo'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-carbon-footprint', name: 'Carbon Footprint', tier: 4, category: 'tech_debt', auditModes: ['full'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-cookie-compliance', name: 'Cookie Compliance', tier: 4, category: 'tech_debt', auditModes: ['full'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-accessibility-statement', name: 'Accessibility Statement', tier: 4, category: 'tech_debt', auditModes: ['full', 'accessibility'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-privacy-gdpr', name: 'Privacy & GDPR Signals', tier: 4, category: 'tech_debt', auditModes: ['full'], industries: ['all'], defaultSeverity: 'info' },
    { id: 't4-ecom-product-schema', name: 'Product Schema', tier: 4, category: 'ecommerce', auditModes: ['full', 'ecommerce'], industries: ['ecommerce'], defaultSeverity: 'info' },
    { id: 't4-ecom-review-schema', name: 'Review Schema', tier: 4, category: 'ecommerce', auditModes: ['full', 'ecommerce'], industries: ['ecommerce'], defaultSeverity: 'info' },
    { id: 't4-ecom-price', name: 'Price Markup', tier: 4, category: 'ecommerce', auditModes: ['full', 'ecommerce'], industries: ['ecommerce'], defaultSeverity: 'info' },
    { id: 't4-ecom-breadcrumbs', name: 'Breadcrumb Navigation', tier: 4, category: 'ecommerce', auditModes: ['full', 'ecommerce'], industries: ['ecommerce'], defaultSeverity: 'info' },
    { id: 't4-local-nap', name: 'NAP on Page', tier: 4, category: 'local', auditModes: ['full', 'local_seo'], industries: ['local'], defaultSeverity: 'warning' },
    { id: 't4-local-schema', name: 'LocalBusiness Schema', tier: 4, category: 'local', auditModes: ['full', 'local_seo'], industries: ['local'], defaultSeverity: 'info' },
    { id: 't4-local-map', name: 'Embedded Map', tier: 4, category: 'local', auditModes: ['full', 'local_seo'], industries: ['local'], defaultSeverity: 'info' },
    { id: 't4-local-hours', name: 'Business Hours Markup', tier: 4, category: 'local', auditModes: ['full', 'local_seo'], industries: ['local'], defaultSeverity: 'info' },
    { id: 't4-news-article-schema', name: 'NewsArticle Schema', tier: 4, category: 'news', auditModes: ['full', 'news_blog' as any], industries: ['news', 'blog'], defaultSeverity: 'info' },
    { id: 't4-news-pub-date', name: 'Publication Date', tier: 4, category: 'news', auditModes: ['full', 'news_blog' as any], industries: ['news', 'blog'], defaultSeverity: 'info' },
    { id: 't4-news-author', name: 'Author Attribution', tier: 4, category: 'news', auditModes: ['full', 'news_blog' as any], industries: ['news', 'blog'], defaultSeverity: 'info' },
    { id: 't4-saas-pricing', name: 'Pricing Page Quality', tier: 4, category: 'saas', auditModes: ['full'], industries: ['saas'], defaultSeverity: 'info' },
    { id: 't4-saas-docs', name: 'Documentation Quality', tier: 4, category: 'saas', auditModes: ['full'], industries: ['saas'], defaultSeverity: 'info' },
    { id: 't4-saas-status-page', name: 'Status Page', tier: 4, category: 'saas', auditModes: ['full'], industries: ['saas'], defaultSeverity: 'info' },
    { id: 't4-health-author', name: 'Medical Author Attribution', tier: 4, category: 'healthcare', auditModes: ['full'], industries: ['healthcare'], defaultSeverity: 'warning' },
    { id: 't4-health-disclaimer', name: 'Medical Disclaimer', tier: 4, category: 'healthcare', auditModes: ['full'], industries: ['healthcare'], defaultSeverity: 'info' }
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

const registryById = new Map<string, CheckDefinition>(CORE_CHECK_REGISTRY.map((check) => [check.id, check] as const));
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
