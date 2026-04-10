import React from 'react';
import {
    Globe,
    Eye,
    Server,
    FileText,
    Code,
    Zap,
    LinkIcon,
    ImageIcon,
    Smartphone,
    Shield,
    Languages,
    ListOrdered,
    GitFork,
    Search,
    Sparkles
} from 'lucide-react';
import { ISSUE_TO_CHECK_MAP } from './IssueTaxonomy';

export const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const ALL_COLUMNS = [
    // General
    { key: 'url', label: 'Address', width: '350px', group: 'General' },
    { key: 'contentType', label: 'Content Type', width: '120px', group: 'General' },
    { key: 'statusCode', label: 'Status Code', width: '90px', group: 'General' },
    { key: 'status', label: 'Status', width: '100px', group: 'General' },
    { key: 'indexable', label: 'Indexability', width: '100px', group: 'General' },
    { key: 'indexabilityStatus', label: 'Indexability Status', width: '140px', group: 'General' },
    { key: 'title', label: 'Title 1', width: '300px', group: 'General' },
    { key: 'titleLength', label: 'Title 1 Length', width: '100px', group: 'General' },
    { key: 'titlePixelWidth', label: 'Title 1 Pixel Width', width: '130px', group: 'General' },
    { key: 'metaDesc', label: 'Meta Description 1', width: '350px', group: 'General' },
    { key: 'metaDescLength', label: 'Meta Description 1 Length', width: '160px', group: 'General' },
    { key: 'metaDescPixelWidth', label: 'Meta Description 1 Pixel Width', width: '180px', group: 'General' },
    { key: 'metaKeywords', label: 'Meta Keywords 1', width: '200px', group: 'General' },
    { key: 'metaKeywordsLength', label: 'Meta Keywords 1 Length', width: '160px', group: 'General' },
    { key: 'h1_1', label: 'H1-1', width: '250px', group: 'General' },
    { key: 'h1_1Length', label: 'H1-1 Length', width: '100px', group: 'General' },
    { key: 'h1_2', label: 'H1-2', width: '250px', group: 'General' },
    { key: 'h1_2Length', label: 'H1-2 Length', width: '100px', group: 'General' },
    { key: 'h2_1', label: 'H2-1', width: '250px', group: 'General' },
    { key: 'h2_1Length', label: 'H2-1 Length', width: '100px', group: 'General' },
    { key: 'h2_2', label: 'H2-2', width: '250px', group: 'General' },
    { key: 'h2_2Length', label: 'H2-2 Length', width: '100px', group: 'General' },
    
    // Technical
    { key: 'metaRobots1', label: 'Meta Robots 1', width: '120px', group: 'Technical' },
    { key: 'metaRobots2', label: 'Meta Robots 2', width: '120px', group: 'Technical' },
    { key: 'xRobots', label: 'X-Robots-Tag 1', width: '120px', group: 'Technical' },
    { key: 'metaRefresh', label: 'Meta Refresh 1', width: '120px', group: 'Technical' },
    { key: 'canonical', label: 'Canonical Link Element 1', width: '350px', group: 'Technical' },
    { key: 'relNextTag', label: 'rel="next" 1', width: '150px', group: 'Technical' },
    { key: 'relPrevTag', label: 'rel="prev" 1', width: '150px', group: 'Technical' },
    { key: 'httpRelNext', label: 'HTTP rel="next" 1', width: '150px', group: 'Technical' },
    { key: 'httpRelPrev', label: 'HTTP rel="prev" 1', width: '150px', group: 'Technical' },
    { key: 'amphtml', label: 'amphtml Link Element', width: '200px', group: 'Technical' },
    { key: 'httpVersion', label: 'HTTP Version', width: '100px', group: 'Technical' },
    { key: 'mobileAlt', label: 'Mobile Alternate Link', width: '200px', group: 'Technical' },
    { key: 'redirectUrl', label: 'Redirect URL', width: '350px', group: 'Technical' },
    { key: 'finalUrl', label: 'Final URL', width: '350px', group: 'Technical' },
    { key: 'redirectChainLength', label: 'Redirect Hops', width: '120px', group: 'Technical' },
    { key: 'isRedirectLoop', label: 'Redirect Loop', width: '120px', group: 'Technical' },
    { key: 'redirectType', label: 'Redirect Type', width: '120px', group: 'Technical' },
    { key: 'inSitemap', label: 'In Sitemap', width: '110px', group: 'Technical' },
    { key: 'cookies', label: 'Cookies', width: '80px', group: 'Technical' },
    { key: 'language', label: 'Language', width: '80px', group: 'Technical' },
    { key: 'xRobotsNoindex', label: 'X-Robots Noindex', width: '140px', group: 'Technical' },
    { key: 'xRobotsNofollow', label: 'X-Robots Nofollow', width: '140px', group: 'Technical' },
    
    // Metrics
    { key: 'sizeBytes', label: 'Size (bytes)', width: '110px', group: 'Metrics' },
    { key: 'transferredBytes', label: 'Transferred (bytes)', width: '140px', group: 'Metrics' },
    { key: 'totalTransferred', label: 'Total Transferred (bytes)', width: '160px', group: 'Metrics' },
    { key: 'co2Mg', label: 'CO2 (mg)', width: '100px', group: 'Metrics' },
    { key: 'carbonRating', label: 'Carbon Rating', width: '110px', group: 'Metrics' },
    { key: 'lcp', label: 'LCP (ms)', tooltip: 'Largest Contentful Paint: Good < 2500ms, Needs Work 2500-4000ms, Poor > 4000ms.', width: '100px', group: 'Metrics' },
    { key: 'cls', label: 'CLS', width: '90px', group: 'Metrics' },
    { key: 'inp', label: 'INP (ms)', width: '100px', group: 'Metrics' },
    { key: 'wordCount', label: 'Word Count', width: '110px', group: 'Metrics' },
    { key: 'sentenceCount', label: 'Sentence Count', width: '120px', group: 'Metrics' },
    { key: 'avgWordsPerSentence', label: 'Average Words Per Sentence', width: '180px', group: 'Metrics' },
    { key: 'fleschScore', label: 'Flesch Reading Ease Score', width: '180px', group: 'Metrics' },
    { key: 'readability', label: 'Readability', width: '120px', group: 'Metrics' },
    { key: 'textRatio', label: 'Text Ratio', width: '100px', group: 'Metrics' },
    { key: 'loadTime', label: 'Response Time', width: '120px', group: 'Metrics' },
    { key: 'dnsResolutionTime', label: 'DNS Time (ms)', width: '110px', group: 'Metrics' },
    { key: 'lastModified', label: 'Last Modified', width: '180px', group: 'Metrics' },
    { key: 'missingAltImages', label: 'Missing Alt Images', width: '140px', group: 'Metrics' },
    { key: 'longAltImages', label: 'Long Alt Images', width: '130px', group: 'Metrics' },
    { key: 'totalImages', label: 'Total Images', width: '110px', group: 'Metrics' },
    { key: 'domNodeCount', label: 'DOM Nodes', width: '110px', group: 'Metrics' },
    { key: 'renderBlockingCss', label: 'Render-Blocking CSS', width: '150px', group: 'Metrics' },
    { key: 'renderBlockingJs', label: 'Render-Blocking JS', width: '150px', group: 'Metrics' },
    { key: 'thirdPartyScriptCount', label: '3rd-Party Scripts', width: '140px', group: 'Metrics' },
    { key: 'preconnectCount', label: 'Preconnect Hints', width: '130px', group: 'Metrics' },
    { key: 'prefetchCount', label: 'DNS Prefetch Hints', width: '140px', group: 'Metrics' },
    { key: 'preloadCount', label: 'Preload Hints', width: '120px', group: 'Metrics' },
    { key: 'legacyFormatImages', label: 'Legacy Image Formats', width: '150px', group: 'Metrics' },
    { key: 'modernFormatImages', label: 'Modern Image Formats', width: '150px', group: 'Metrics' },
    { key: 'imagesWithoutSrcset', label: 'Images Without Srcset', width: '150px', group: 'Metrics' },
    { key: 'imagesWithoutLazy', label: 'Images Without Lazy', width: '150px', group: 'Metrics' },
    { key: 'imagesWithoutDimensions', label: 'Images Without Dimensions', width: '170px', group: 'Metrics' },
    
    // Links
    { key: 'crawlDepth', label: 'Crawl Depth', width: '100px', group: 'Links' },
    { key: 'folderDepth', label: 'Folder Depth', width: '110px', group: 'Links' },
    { key: 'linkScore', label: 'Link Score', width: '100px', group: 'Links' },
    { key: 'inlinks', label: 'Inlinks', width: '90px', group: 'Links' },
    { key: 'uniqueInlinks', label: 'Unique Inlinks', width: '120px', group: 'Links' },
    { key: 'uniqueJsInlinks', label: 'Unique JS Inlinks', width: '130px', group: 'Links' },
    { key: 'percentOfTotal', label: '% of Total', width: '100px', group: 'Links' },
    { key: 'outlinks', label: 'Outlinks', width: '90px', group: 'Links' },
    { key: 'uniqueOutlinks', label: 'Unique Outlinks', width: '120px', group: 'Links' },
    { key: 'uniqueJsOutlinks', label: 'Unique JS Outlinks', width: '130px', group: 'Links' },
    { key: 'externalOutlinks', label: 'External Outlinks', width: '130px', group: 'Links' },
    { key: 'uniqueExternalOutlinks', label: 'Unique External Outlinks', width: '180px', group: 'Links' },
    { key: 'uniqueExternalJsOutlinks', label: 'Unique External JS Outlinks', width: '200px', group: 'Links' },
    
    // Advanced
    { key: 'nearDuplicateMatch', label: 'Closest Near Duplicate Match', width: '300px', group: 'Advanced' },
    { key: 'noNearDuplicates', label: 'No. Near Duplicates', width: '140px', group: 'Advanced' },
    { key: 'spellingErrors', label: 'Spelling Errors', width: '120px', group: 'Advanced' },
    { key: 'grammarErrors', label: 'Grammar Errors', width: '120px', group: 'Advanced' },
    { key: 'hash', label: 'Hash', width: '300px', group: 'Advanced' },
    { key: 'closestSemanticAddress', label: 'Closest Semantically Similar Address', width: '350px', group: 'Advanced' },
    { key: 'semanticSimilarityScore', label: 'Semantic Similarity Score', width: '180px', group: 'Advanced' },
    { key: 'topicCluster', label: 'AI Topic Cluster', width: '200px', group: 'Advanced' },
    { key: 'internalPageRank', label: 'Internal PageRank', tooltip: 'Iterative internal authority score based on the site link graph.', width: '150px', group: 'Advanced' },
    { key: 'linkEquity', label: 'Link Equity (0-10)', tooltip: 'Composite authority from internal PageRank, backlinks, and content quality.', width: '150px', group: 'Advanced' },
    { key: 'funnelStage', label: 'Funnel Stage (AI)', width: '150px', group: 'Advanced' },
    { key: 'searchIntent', label: 'Search Intent (AI)', width: '160px', group: 'Advanced' },
    { key: 'strategicPriority', label: 'Strategic Priority', width: '160px', group: 'Advanced' },
    { key: 'contentDecay', label: 'Content Decay', width: '150px', group: 'Advanced' },
    { key: 'multipleH1s', label: 'Multiple H1s', width: '120px', group: 'Advanced' },
    { key: 'incorrectHeadingOrder', label: 'Heading Order Issue', width: '150px', group: 'Advanced' },
    { key: 'schemaErrors', label: 'Schema Errors', width: '120px', group: 'Advanced' },
    { key: 'schemaWarnings', label: 'Schema Warnings', width: '130px', group: 'Advanced' },
    { key: 'crawlTimestamp', label: 'Crawl Timestamp', width: '200px', group: 'Advanced' },
    { key: 'visibleDate', label: 'Visible Date', width: '160px', group: 'Advanced' },
    { key: 'anchorTextDiversity', label: 'Anchor Text Diversity', width: '160px', group: 'Advanced' },
    { key: 'isSoft404', label: 'Soft 404', width: '100px', group: 'Advanced' },
    { key: 'hasFavicon', label: 'Favicon', width: '90px', group: 'Advanced' },
    { key: 'hasCharset', label: 'Charset', width: '90px', group: 'Advanced' },
    { key: 'hasRssFeed', label: 'RSS/Atom Feed', width: '120px', group: 'Advanced' },
    { key: 'hasServiceWorker', label: 'Service Worker', width: '120px', group: 'Advanced' },
    { key: 'hasWebManifest', label: 'Web Manifest', width: '120px', group: 'Advanced' },

    // Security
    { key: 'hasHsts', label: 'HSTS', width: '80px', group: 'Security' },
    { key: 'hstsMaxAge', label: 'HSTS Max-Age', width: '120px', group: 'Security' },
    { key: 'hstsPreload', label: 'HSTS Preload', width: '100px', group: 'Security' },
    { key: 'hasCsp', label: 'CSP', width: '80px', group: 'Security' },
    { key: 'cspHasUnsafeInline', label: 'CSP Unsafe-Inline', width: '150px', group: 'Security' },
    { key: 'cspHasUnsafeEval', label: 'CSP Unsafe-Eval', width: '140px', group: 'Security' },
    { key: 'hasXFrameOptions', label: 'X-Frame-Options', width: '130px', group: 'Security' },
    { key: 'hasXContentTypeOptions', label: 'X-Content-Type-Options', width: '170px', group: 'Security' },
    { key: 'hasReferrerPolicy', label: 'Referrer Policy', width: '120px', group: 'Security' },
    { key: 'hasPermissionsPolicy', label: 'Permissions Policy', width: '140px', group: 'Security' },
    { key: 'corsWildcard', label: 'CORS Wildcard Enabled', width: '120px', group: 'Security' },
    { key: 'sslValid', label: 'SSL Valid', width: '90px', group: 'Security' },
    { key: 'sslProtocol', label: 'TLS Version', width: '110px', group: 'Security' },
    { key: 'sslDaysUntilExpiry', label: 'SSL Expiry (days)', width: '140px', group: 'Security' },
    { key: 'sslIsWeakProtocol', label: 'Weak TLS', width: '90px', group: 'Security' },
    { key: 'cookieCount', label: 'Cookie Count', width: '110px', group: 'Security' },
    { key: 'insecureCookies', label: 'Insecure Cookies', width: '130px', group: 'Security' },
    { key: 'cookiesMissingSameSite', label: 'Cookies Missing SameSite', width: '170px', group: 'Security' },
    { key: 'scriptsWithoutSri', label: 'Scripts Without SRI', width: '140px', group: 'Security' },
    { key: 'exposedApiKeys', label: 'Exposed API Keys', width: '130px', group: 'Security' },
    { key: 'privacyPageLinked', label: 'Privacy Policy Link', width: '140px', group: 'Security' },
    { key: 'termsPageLinked', label: 'Terms Link', width: '110px', group: 'Security' },
    { key: 'hasCookieBanner', label: 'Cookie Banner', width: '120px', group: 'Security' },
    { key: 'isDirectoryListing', label: 'Directory Listing', width: '140px', group: 'Security' },
    { key: 'hasInlinedCSS', label: 'Inlined CSS (>500b)', width: '140px', group: 'Technical' },
    { key: 'hasNoscript', label: 'Noscript Tag', width: '120px', group: 'Technical' },
    { key: 'videosWithoutPoster', label: 'Videos No Poster', width: '140px', group: 'Metrics' },
    { key: 'videosWithoutLazy', label: 'Videos No Lazy', width: '140px', group: 'Metrics' },

    // Collaboration (P5)
    { key: 'commentCount', label: 'Comments', width: '90px', group: 'Collaboration' },
    { key: 'taskCount', label: 'Tasks', width: '90px', group: 'Collaboration' },

    // Accessibility
    { key: 'hasMainLandmark', label: 'Main Landmark', width: '120px', group: 'Accessibility' },
    { key: 'hasNavLandmark', label: 'Nav Landmark', width: '120px', group: 'Accessibility' },
    { key: 'hasHeaderLandmark', label: 'Header Landmark', width: '130px', group: 'Accessibility' },
    { key: 'hasFooterLandmark', label: 'Footer Landmark', width: '130px', group: 'Accessibility' },
    { key: 'hasSkipLink', label: 'Skip Link', width: '100px', group: 'Accessibility' },
    { key: 'formsWithoutLabels', label: 'Form Inputs Without Labels', width: '150px', group: 'Accessibility' },
    { key: 'viewportNoScale', label: 'Zoom Disabled', width: '110px', group: 'Accessibility' },
    { key: 'genericLinkTextCount', label: 'Generic Links', width: '120px', group: 'Accessibility' },
    { key: 'invalidAriaCount', label: 'Invalid ARIA', width: '110px', group: 'Accessibility' },
    { key: 'tablesWithoutHeaders', label: 'Tables Without Headers', width: '160px', group: 'Accessibility' },

    // Cache
    { key: 'hasCacheControl', label: 'Cache-Control', width: '120px', group: 'Cache' },
    { key: 'cacheMaxAge', label: 'Cache Max-Age', width: '120px', group: 'Cache' },
    { key: 'cacheNoCache', label: 'No-Cache', width: '100px', group: 'Cache' },
    { key: 'cacheNoStore', label: 'No-Store', width: '100px', group: 'Cache' },
    { key: 'hasEtag', label: 'ETag', width: '80px', group: 'Cache' },
    { key: 'hasLastModified', label: 'Last-Modified Header', width: '150px', group: 'Cache' },
    { key: 'hasExpires', label: 'Expires Header', width: '120px', group: 'Cache' },

    // Mobile
    { key: 'hasViewportMeta', label: 'Viewport Meta', width: '120px', group: 'Mobile' },
    { key: 'viewportWidth', label: 'Device Width Viewport', width: '150px', group: 'Mobile' },
    { key: 'smallTapTargets', label: 'Small Tap Targets', width: '130px', group: 'Mobile' },
    { key: 'smallFontCount', label: 'Small Fonts', width: '110px', group: 'Mobile' },

    // URL Structure
    { key: 'urlLength', label: 'URL Length', width: '100px', group: 'URL Structure' },
    { key: 'hasQueryParams', label: 'Has Query Params', width: '130px', group: 'URL Structure' },
    { key: 'hasUppercase', label: 'Uppercase URL', width: '120px', group: 'URL Structure' },
    { key: 'hasTrailingSlash', label: 'Trailing Slash', width: '110px', group: 'URL Structure' },
    { key: 'hasSessionId', label: 'Session ID in URL', width: '140px', group: 'URL Structure' },
    { key: 'hasSpacesEncoded', label: 'Encoded Spaces', width: '120px', group: 'URL Structure' },
    
    // Search Performance (GSC & Keywords)
    { key: 'gscClicks', label: 'Clicks (30d)', width: '130px', group: 'Search Console' },
    { key: 'gscImpressions', label: 'Impressions (30d)', width: '160px', group: 'Search Console' },
    { key: 'gscCtr', label: 'CTR', width: '100px', group: 'Search Console' },
    { key: 'gscPosition', label: 'Avg Position', width: '140px', group: 'Search Console' },
    { key: 'mainKeyword', label: 'Main Keyword', width: '180px', group: 'Search Console' },
    { key: 'mainKwPosition', label: 'Main KW Position', width: '140px', group: 'Search Console' },
    { key: 'mainKwVolume', label: 'Search Volume', width: '130px', group: 'Search Console' },
    { key: 'bestKeyword', label: 'Best Keyword', width: '180px', group: 'Search Console' },
    { key: 'bestKwPosition', label: 'Best KW Position', width: '140px', group: 'Search Console' },
    { key: 'bestKwVolume', label: 'Best KW Volume', width: '140px', group: 'Search Console' },

    // Analytics (GA4)
    { key: 'ga4Views', label: 'Views (30d)', width: '140px', group: 'Analytics' },
    { key: 'ga4Sessions', label: 'Sessions (30d)', width: '150px', group: 'Analytics' },
    { key: 'sessionsDeltaAbsolute', label: 'Traffic Δ (Abs)', width: '140px', group: 'Analytics' },
    { key: 'sessionsDeltaPct', label: 'Traffic Δ (%)', width: '120px', group: 'Analytics' },
    { key: 'ga4Users', label: 'Users (30d)', width: '140px', group: 'Analytics' },
    { key: 'ga4BounceRate', label: 'Bounce Rate', width: '140px', group: 'Analytics' },
    { key: 'ga4EngagementTimePerPage', label: 'Avg. Time on Page', width: '160px', group: 'Analytics' },
    { key: 'ga4Conversions', label: 'Conversions', width: '130px', group: 'Analytics' },
    { key: 'ga4ConversionRate', label: 'Conversion Rate', width: '150px', group: 'Analytics' },
    { key: 'ga4GoalCompletions', label: 'Goal Completions', width: '150px', group: 'Analytics' },
    { key: 'ga4EcommerceRevenue', label: 'Ecom Revenue', width: '140px', group: 'Analytics' },
    { key: 'ga4Transactions', label: 'Transactions', width: '120px', group: 'Analytics' },
    { key: 'ga4AddtoCart', label: 'Add to Cart', width: '120px', group: 'Analytics' },
    { key: 'ga4Checkouts', label: 'Checkouts', width: '120px', group: 'Analytics' },
    { key: 'ga4Revenue', label: 'Revenue (Total)', width: '120px', group: 'Analytics' },

    // Backlinks & Authority
    { key: 'authorityScore', label: 'Authority Score', width: '150px', group: 'Authority' },
    { key: 'urlRating', label: 'URL Rating (UR)', width: '150px', group: 'Authority' },
    { key: 'referringDomains', label: 'Ref. Domains', width: '160px', group: 'Authority' },
    { key: 'backlinks', label: 'Backlinks', width: '150px', group: 'Authority' },

    // Strategic Decisions
    { key: 'opportunityScore', label: 'Opportunity Score', width: '150px', group: 'Strategic' },
    { key: 'businessValueScore', label: 'Business Value Score', width: '160px', group: 'Strategic' },
    { key: 'techHealthScore', label: 'Technical Health', width: '140px', group: 'Strategic' },
    { key: 'searchVisibilityScore', label: 'Search Visibility', width: '150px', group: 'Strategic' },
    { key: 'engagementScore', label: 'Engagement', width: '130px', group: 'Strategic' },
    { key: 'recommendedAction', label: 'Recommended Action', width: '220px', group: 'Strategic' },
    { key: 'recommendedActionReason', label: 'Action Reason', width: '300px', group: 'Strategic' },
    { key: 'isLosingTraffic', label: 'Traffic Alert', width: '130px', group: 'Strategic' },

    // Phase C: AI & Industry
    { key: 'summary', label: 'AI Summary', width: '300px', group: 'AI Insights' },
    { key: 'contentQualityScore', label: 'AI Quality Score', width: '130px', group: 'AI Insights' },
    { key: 'eeatScore', label: 'AI E-E-A-T', width: '110px', group: 'AI Insights' },
    { key: 'sentiment', label: 'AI Sentiment', width: '120px', group: 'AI Insights' },
    { key: 'aiLikelihood', label: 'AI Generated', width: '130px', group: 'AI Insights' },
    { key: 'originalityScore', label: 'Originality Score', width: '140px', group: 'AI Insights' },
    { key: 'fieldLcp', label: 'CrUX LCP (ms)', width: '120px', group: 'Performance' },
    { key: 'fieldCls', label: 'CrUX CLS', width: '100px', group: 'Performance' },
    { key: 'lighthousePerformance', label: 'LH Performance', width: '130px', group: 'Performance' },
    { key: 'lighthouseSeo', label: 'LH SEO', width: '100px', group: 'Performance' },
    { key: 'htmlErrors', label: 'W3C Errors', width: '110px', group: 'Technical' },
    { key: 'securityGrade', label: 'Security Grade', width: '120px', group: 'Security' },
    { key: 'sslGrade', label: 'SSL Grade', width: '100px', group: 'Security' },
    { key: 'industry', label: 'Detected Industry', width: '140px', group: 'Business' },
    { key: 'hasPricingPage', label: 'Pricing Page', width: '110px', group: 'Business' },
    { key: 'hasTrustBadges', label: 'Trust Badges', width: '120px', group: 'Business' },
    { key: 'hasPassageStructure', label: 'Passage Ready', width: '130px', group: 'AI Discoverability' },
    { key: 'passageReadiness', label: 'Passage Readiness (%)', width: '150px', group: 'AI Discoverability' },
    { key: 'hasFeaturedSnippetPatterns', label: 'Snippet Ready', width: '130px', group: 'AI Discoverability' },
    { key: 'voiceSearchScore', label: 'Voice Search Score', width: '150px', group: 'AI Discoverability' },
    { key: 'geoScore', label: 'GEO Score', width: '120px', group: 'AI Discoverability' },
    { key: 'citationWorthiness', label: 'Citation Worthiness', width: '150px', group: 'AI Discoverability' },
    { key: 'hasLlmsTxt', label: 'llms.txt Present', width: '130px', group: 'AI Discoverability' },
    { key: 'llmsTxtStatus', label: 'llms.txt Status', width: '150px', group: 'AI Discoverability' },
    { key: 'aiBotAccessSummary', label: 'AI Bot Access', width: '180px', group: 'AI Discoverability' },
    { key: 'jsRenderDiff.textDiffPercent', label: 'JS Text Diff (%)', width: '130px', group: 'Technical' },
    { key: 'jsRenderDiff.jsOnlyLinks', label: 'JS Only Links', width: '120px', group: 'Technical' },
    { key: 'jsRenderDiff.jsOnlyImages', label: 'JS Only Images', width: '130px', group: 'Technical' },
    { key: 'jsRenderDiff.criticalContentJsOnly', label: 'JS Required', width: '120px', group: 'Technical' },
    { key: 'googlebotVisits30d', label: 'Googlebot (30d)', width: '130px', group: 'Log Analysis' },
    { key: 'botCrawlBudgetShare', label: 'Crawl Budget %', width: '130px', group: 'Log Analysis' },
];

export const resolveIssueCheckId = (issueId: string, explicitCheckId?: string) => {
    return explicitCheckId || ISSUE_TO_CHECK_MAP[issueId] || issueId;
};

export type CategoryFilterContext = {
    rootHostname?: string;
};

export type CategoryFilterFn = (page: any, context: CategoryFilterContext) => boolean;

import { UrlNormalization } from '../../services/UrlNormalization';

const containsSchemaType = (page: any, expectedTypes: string[]) => {
    const normalizedExpected = expectedTypes.map((type) => type.toLowerCase());
    const schemaTypes: string[] = Array.isArray(page?.schemaTypes) ? page.schemaTypes : [];
    return schemaTypes.some((type) => normalizedExpected.includes(String(type || '').toLowerCase()));
};

export const CATEGORY_FILTERS: Record<string, Record<string, CategoryFilterFn>> = {
    internal: {
        All: () => true,
        HTML: (page) => Boolean(page?.isHtmlPage || page?.contentType?.includes('html') || page?.contentType?.includes('xhtml')),
        JavaScript: (page) => page?.contentType?.includes('javascript') || page?.contentType?.includes('ecmascript'),
        CSS: (page) => page?.contentType?.includes('css'),
        Images: (page) => String(page?.contentType || '').startsWith('image/'),
        PDF: (page) => page?.contentType?.includes('pdf'),
        Other: (page) => {
            const contentType = String(page?.contentType || '').toLowerCase();
            if (!contentType) return false;
            return !(
                contentType.includes('html') ||
                contentType.includes('javascript') ||
                contentType.includes('ecmascript') ||
                contentType.includes('css') ||
                contentType.startsWith('image/') ||
                contentType.includes('pdf')
            );
        }
    },
    indexability: {
        All: () => true,
        Indexable: (page) => page?.indexable !== false && Number(page?.statusCode || 0) === 200,
        'Non-Indexable': (page) => page?.indexable === false,
        Noindex: (page) => String(page?.metaRobots1 || '').toLowerCase().includes('noindex') || page?.xRobotsNoindex === true,
        Canonicalized: (page) => Boolean(page?.canonical) && String(page?.canonical).trim() !== String(page?.url || '').trim(),
        'Blocked by Robots': (page) => page?.status === 'Blocked by Robots.txt',
        'Orphan Pages': (page) => Number(page?.inlinks || 0) === 0 && Number(page?.crawlDepth || 0) > 0
    },
    codes: {
        All: () => true,
        '200 OK': (page) => Number(page?.statusCode || 0) === 200,
        '301 Redirect': (page) => Number(page?.statusCode || 0) === 301,
        '302 Temporary': (page) => Number(page?.statusCode || 0) === 302,
        '404 Not Found': (page) => Number(page?.statusCode || 0) === 404,
        '410 Gone': (page) => Number(page?.statusCode || 0) === 410,
        '500 Server Error': (page) => Number(page?.statusCode || 0) >= 500,
        Timeout: (page) => String(page?.status || '').toLowerCase().includes('timeout'),
        Blocked: (page) => page?.status === 'Blocked by Robots.txt'
    },
    content: {
        All: () => true,
        'Thin < 300w': (page) => Number(page?.wordCount || 0) > 0 && Number(page?.wordCount || 0) < 300,
        Duplicate: (page) => page?.exactDuplicate === true || page?.isDuplicateTitle === true || page?.isDuplicateMetaDesc === true,
        'Near-Duplicate': (page) => Number(page?.noNearDuplicates || 0) > 0 || Boolean(page?.nearDuplicateMatch),
        'Missing Title': (page) => !String(page?.title || '').trim(),
        'Missing Meta': (page) => !String(page?.metaDesc || '').trim(),
        'Missing H1': (page) => !String(page?.h1_1 || '').trim(),
        'Multiple H1': (page) => page?.multipleH1s === true || Boolean(String(page?.h1_2 || '').trim()),
        'Keyword Stuffing': (page) => page?.keywordStuffing === true,
        Decaying: (page) => page?.contentDecay === 'Possible Decay',
        'Lorem Ipsum': (page) => page?.containsLoremIpsum === true
    },
    schema: {
        All: () => true,
        'Has Schema': (page) => (Array.isArray(page?.schema) && page.schema.length > 0) || (Array.isArray(page?.schemaTypes) && page.schemaTypes.length > 0),
        'No Schema': (page) => !((Array.isArray(page?.schema) && page.schema.length > 0) || (Array.isArray(page?.schemaTypes) && page.schemaTypes.length > 0)),
        Product: (page) => containsSchemaType(page, ['Product']),
        Article: (page) => containsSchemaType(page, ['Article', 'BlogPosting', 'NewsArticle']),
        LocalBusiness: (page) => containsSchemaType(page, ['LocalBusiness']),
        FAQ: (page) => containsSchemaType(page, ['FAQPage']),
        HowTo: (page) => containsSchemaType(page, ['HowTo']),
        BreadcrumbList: (page) => containsSchemaType(page, ['BreadcrumbList']),
        VideoObject: (page) => containsSchemaType(page, ['VideoObject']),
        Event: (page) => containsSchemaType(page, ['Event']),
        Errors: (page) => Number(page?.schemaErrors || 0) > 0
    },
    performance: {
        All: () => true,
        'Good LCP': (page) => Number(page?.lcp || 0) > 0 && Number(page?.lcp || 0) <= 2500,
        'Needs Work LCP': (page) => Number(page?.lcp || 0) > 2500 && Number(page?.lcp || 0) <= 4000,
        'Poor LCP': (page) => Number(page?.lcp || 0) > 4000,
        'CLS Issues': (page) => Number(page?.cls || 0) > 0.1,
        'INP Issues': (page) => Number(page?.inp || 0) > 200,
        'TTFB Slow': (page) => Number(page?.loadTime || 0) > 600,
        'Large DOM': (page) => Number(page?.domNodeCount || 0) > 1500,
        'Render Blocking': (page) => Number(page?.renderBlockingCss || 0) + Number(page?.renderBlockingJs || 0) > 0
    },
    links: {
        All: () => true,
        'Broken Internal': (page) => Number(page?.brokenInternalLinks || 0) > 0,
        'Broken External': (page) => Number(page?.brokenExternalLinks || 0) > 0,
        'Orphan Pages': (page) => Number(page?.inlinks || 0) === 0 && Number(page?.crawlDepth || 0) > 0,
        'Redirect Chains': (page) => Number(page?.redirectChainLength || 0) > 1,
        'Nofollow Internal': (page) => Number(page?.nofollowInternalLinks || 0) > 0,
        'Deep Pages > 5': (page) => Number(page?.crawlDepth || 0) > 5
    },
    images: {
        All: () => true,
        'No Alt Text': (page) => Number(page?.missingAltImages || 0) > 0,
        Oversized: (page) => Number(page?.oversizedImages || 0) > 0 || Number(page?.imagesOver200kb || 0) > 0,
        'No Srcset': (page) => Number(page?.imagesWithoutSrcset || 0) > 0,
        'No Lazy Load': (page) => Number(page?.imagesWithoutLazy || 0) > 0,
        'Broken Images': (page) => Number(page?.brokenImages || 0) > 0,
        'No Next-Gen Format': (page) => Number(page?.legacyFormatImages || 0) > 0 && Number(page?.modernFormatImages || 0) === 0
    },
    mobile: {
        All: () => true,
        'Not Responsive': (page) => page?.hasViewportMeta === false,
        'Tap Too Small': (page) => Number(page?.smallTapTargets || 0) > 0,
        'Viewport Issue': (page) => page?.viewportNoScale === true || page?.viewportWidth === false,
        'Small Fonts': (page) => Number(page?.smallFontCount || 0) > 0,
        'AMP Pages': (page) => Boolean(page?.amphtml),
        'AMP Errors': (page) => Number(page?.ampErrors || 0) > 0
    },
    security: {
        All: () => true,
        'HTTP Pages': (page) => String(page?.url || '').startsWith('http://'),
        'Mixed Content': (page) => page?.mixedContent === true,
        'No HSTS': (page) => page?.hasHsts === false || page?.hstsMissing === true,
        'Missing CSP': (page) => page?.hasCsp === false,
        'No Permissions Policy': (page) => page?.hasPermissionsPolicy === false,
        'Insecure Cookies': (page) => Number(page?.insecureCookies || 0) > 0,
        'Exposed Keys': (page) => Number(page?.exposedApiKeys || 0) > 0,
        'No Privacy Page': (page) => page?.privacyPageLinked === false
    },
    international: {
        All: () => true,
        'Hreflang OK': (page) => Array.isArray(page?.hreflang) && page.hreflang.length > 0 && !page?.hreflangErrors && !page?.hreflangNoSelf && !page?.hreflangInvalid && !page?.hreflangBroken,
        'Hreflang Missing': (page) => !Array.isArray(page?.hreflang) || page.hreflang.length === 0,
        'Hreflang Errors': (page) => page?.hreflangErrors === true || page?.hreflangNoSelf === true || page?.hreflangInvalid === true || page?.hreflangBroken === true,
        'Lang Mismatch': (page) => page?.langMismatch === true,
        'Multi-Language': (page) => Array.isArray(page?.hreflang) && page.hreflang.length > 1
    },
    pagination: {
        All: () => true,
        'Rel Next/Prev': (page) => Boolean(page?.relNextTag || page?.relPrevTag || page?.httpRelNext || page?.httpRelPrev),
        'Missing Rel': (page) => page?.isPaginated === true && !(page?.relNextTag || page?.relPrevTag || page?.httpRelNext || page?.httpRelPrev),
        Paginated: (page) => Boolean(page?.relNextTag || page?.relPrevTag || page?.httpRelNext || page?.httpRelPrev || page?.isPaginated === true)
    },
    architecture: {
        All: () => true,
        'Depth 0-1': (page) => Number(page?.crawlDepth || 0) <= 1,
        'Depth 2-3': (page) => Number(page?.crawlDepth || 0) >= 2 && Number(page?.crawlDepth || 0) <= 3,
        'Depth 4-5': (page) => Number(page?.crawlDepth || 0) >= 4 && Number(page?.crawlDepth || 0) <= 5,
        'Depth 6+': (page) => Number(page?.crawlDepth || 0) >= 6
    },
    'custom-extract': {
        All: () => true,
        'Prices Found': (page) => Number(page?.extractedPricesCount || 0) > 0,
        'Emails Found': (page) => Number(page?.extractedEmailsCount || 0) > 0 || (Array.isArray(page?.exposedEmails) && page.exposedEmails.length > 0),
        'Phone Numbers': (page) => Number(page?.extractedPhoneNumbersCount || 0) > 0,
        'Custom Regex': (page) => Number(page?.customRegexMatches || 0) > 0 || (Array.isArray(page?.customExtraction) && page.customExtraction.length > 0)
    },
    'ai-insights': {
        All: () => true,
        'High Priority': (page) => String(page?.strategicPriority || '').toLowerCase() === 'high',
        'Quick Wins': (page) => Number(page?.opportunityScore || 0) >= 70 && Number(page?.techHealthScore || 0) >= 60,
        Cannibalization: (page) => page?.isCannibalized === true,
        'Gap Opportunities': (page) => page?.hasContentGap === true,
        'Decay Risk': (page) => String(page?.contentDecay || '').toLowerCase().includes('decay'),
        Sentiment: (page) => Boolean(page?.sentiment),
        AIGenerated: (page) => page?.aiLikelihood === 'high' || page?.aiLikelihood === 'medium'
    },
    industry: {
        All: () => true,
        Ecommerce: (page) => page?.industry === 'ecommerce',
        SaaS: (page) => page?.industry === 'saas',
        Local: (page) => page?.industry === 'local_business',
        News: (page) => page?.industry === 'news_media',
        Healthcare: (page) => page?.industry === 'healthcare'
    },
    'ai-discoverability': {
        All: () => true,
        'Passage Ready': (page) => page?.hasPassageStructure === true,
        'Snippet Ready': (page) => page?.hasFeaturedSnippetPatterns === true,
        'Speakable Ready': (page) => page?.hasSpeakableSchema === true
    }
};

export const matchesCategoryFilter = (
    group: string,
    sub: string,
    page: any,
    context: CategoryFilterContext = {}
) => {
    if (group === 'ai-clusters') {
        if (sub === 'All') return Boolean(page?.topicCluster);
        return String(page?.topicCluster || '') === sub;
    }

    if (group === 'external') {
        const rootHost = UrlNormalization.extractHostname(context.rootHostname);
        const pageHost = UrlNormalization.extractHostname(page?.url);
        if (!rootHost || !pageHost) return false;
        if (sub === 'All') return pageHost !== rootHost;
        return pageHost !== rootHost;
    }

    const groupFilters = CATEGORY_FILTERS[group];
    if (!groupFilters) return true;
    const filter = groupFilters[sub] || groupFilters.All;
    if (!filter) return true;
    return filter(page, context);
};

export const CATEGORIES = [
    { id: 'internal', label: 'All Pages', icon: <Globe size={14} />, sub: ['All', 'HTML', 'JavaScript', 'CSS', 'Images', 'PDF', 'Other'] },
    { id: 'indexability', label: 'Indexability', icon: <Eye size={14} />, sub: ['All', 'Indexable', 'Non-Indexable', 'Noindex', 'Canonicalized', 'Blocked by Robots', 'Orphan Pages'] },
    { id: 'codes', label: 'Crawlability', icon: <Server size={14} />, sub: ['All', '200 OK', '301 Redirect', '302 Temporary', '404 Not Found', '410 Gone', '500 Server Error', 'Timeout', 'Blocked'] },
    { id: 'content', label: 'Content', icon: <FileText size={14} />, sub: ['All', 'Thin < 300w', 'Duplicate', 'Near-Duplicate', 'Missing Title', 'Missing Meta', 'Missing H1', 'Multiple H1', 'Keyword Stuffing', 'Decaying', 'Lorem Ipsum'] },
    { id: 'schema', label: 'Structured Data', icon: <Code size={14} />, sub: ['All', 'Has Schema', 'No Schema', 'Product', 'Article', 'LocalBusiness', 'FAQ', 'HowTo', 'BreadcrumbList', 'VideoObject', 'Event', 'Errors'] },
    { id: 'performance', label: 'Performance', icon: <Zap size={14} />, sub: ['All', 'Good LCP', 'Needs Work LCP', 'Poor LCP', 'CLS Issues', 'INP Issues', 'TTFB Slow', 'Large DOM', 'Render Blocking'] },
    { id: 'links', label: 'Links', icon: <LinkIcon size={14} />, sub: ['All', 'Broken Internal', 'Broken External', 'Orphan Pages', 'Redirect Chains', 'Nofollow Internal', 'Deep Pages > 5'] },
    { id: 'images', label: 'Images', icon: <ImageIcon size={14} />, sub: ['All', 'No Alt Text', 'Oversized', 'No Srcset', 'No Lazy Load', 'Broken Images', 'No Next-Gen Format'] },
    { id: 'mobile', label: 'Mobile', icon: <Smartphone size={14} />, sub: ['All', 'Not Responsive', 'Tap Too Small', 'Viewport Issue', 'Small Fonts', 'AMP Pages', 'AMP Errors'] },
    { id: 'security', label: 'Security', icon: <Shield size={14} />, sub: ['All', 'HTTP Pages', 'Mixed Content', 'No HSTS', 'Missing CSP', 'No Permissions Policy', 'Insecure Cookies', 'Exposed Keys', 'No Privacy Page'] },
    { id: 'international', label: 'International', icon: <Languages size={14} />, sub: ['All', 'Hreflang OK', 'Hreflang Missing', 'Hreflang Errors', 'Lang Mismatch', 'Multi-Language'] },
    { id: 'pagination', label: 'Pagination', icon: <ListOrdered size={14} />, sub: ['All', 'Rel Next/Prev', 'Missing Rel', 'Paginated'] },
    { id: 'architecture', label: 'Architecture', icon: <GitFork size={14} />, sub: ['All', 'Depth 0-1', 'Depth 2-3', 'Depth 4-5', 'Depth 6+'] },
    { id: 'custom-extract', label: 'Custom Extract', icon: <Search size={14} />, sub: ['All', 'Prices Found', 'Emails Found', 'Phone Numbers', 'Custom Regex'] },
    { id: 'industry', label: 'Industry', icon: <GitFork size={14} />, sub: ['All', 'Ecommerce', 'SaaS', 'Local', 'News', 'Healthcare'] },
    { id: 'ai-discoverability', label: 'AI Discoverability', icon: <Sparkles size={14} />, sub: ['All', 'Passage Ready', 'Snippet Ready', 'Speakable Ready'] }
];

export const SMART_PRESETS = [
    {
        id: 'full',
        label: 'Full Audit',
        desc: 'All checks and categories',
        categories: CATEGORIES.map((category) => category.id),
        columns: ALL_COLUMNS.map((column) => column.key)
    },
    {
        id: 'technical',
        label: 'Technical',
        desc: 'Crawlability, indexing, speed, security',
        categories: ['codes', 'indexability', 'performance', 'security', 'links', 'mobile'],
        columns: ['url', 'statusCode', 'indexabilityStatus', 'canonical', 'metaRobots1', 'httpVersion', 'loadTime', 'lcp', 'cls', 'inp', 'domNodeCount', 'hasHsts', 'hasCsp', 'sslValid']
    },
    {
        id: 'content',
        label: 'Content',
        desc: 'Quality, duplication, and content structure',
        categories: ['content', 'schema', 'images'],
        columns: ['url', 'title', 'titleLength', 'metaDesc', 'metaDescLength', 'h1_1', 'h2_1', 'wordCount', 'fleschScore', 'readability', 'schemaErrors', 'missingAltImages']
    },
    {
        id: 'performance',
        label: 'Performance',
        desc: 'Core web vitals and rendering bottlenecks',
        categories: ['performance', 'images', 'mobile'],
        columns: ['url', 'statusCode', 'loadTime', 'lcp', 'cls', 'inp', 'domNodeCount', 'renderBlockingCss', 'renderBlockingJs', 'imagesWithoutLazy', 'imagesWithoutSrcset', 'smallTapTargets']
    },
    {
        id: 'security',
        label: 'Security',
        desc: 'Headers, TLS, cookies, and exposed keys',
        categories: ['security', 'indexability'],
        columns: ['url', 'statusCode', 'hasHsts', 'hstsMaxAge', 'hasCsp', 'cspHasUnsafeInline', 'hasXFrameOptions', 'hasPermissionsPolicy', 'sslValid', 'sslProtocol', 'insecureCookies', 'exposedApiKeys']
    }
];

export const AI_INSIGHTS_CATEGORY = {
    id: 'ai-insights',
    label: 'AI Insights',
    icon: <Sparkles size={14} />,
    sub: ['All', 'High Priority', 'Quick Wins', 'Cannibalization', 'Gap Opportunities', 'Decay Risk']
};

export const performanceData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 1000 }
];

export const sparklineData1 = [10, 20, 15, 30, 25, 40, 35];
export const sparklineData2 = [50, 40, 45, 30, 35, 20, 25];
export const sparklineData3 = [15, 25, 20, 35, 30, 45, 40];
export const sparklineData4 = [40, 35, 45, 30, 50, 40, 55];
