import React from 'react';
import { Database, Globe, Server, Compass, Code, Box, LinkIcon, FastForward, MapIcon, Search } from 'lucide-react';

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
    { key: 'redirectType', label: 'Redirect Type', width: '120px', group: 'Technical' },
    { key: 'cookies', label: 'Cookies', width: '80px', group: 'Technical' },
    { key: 'language', label: 'Language', width: '80px', group: 'Technical' },
    
    // Metrics
    { key: 'sizeBytes', label: 'Size (bytes)', width: '110px', group: 'Metrics' },
    { key: 'transferredBytes', label: 'Transferred (bytes)', width: '140px', group: 'Metrics' },
    { key: 'totalTransferred', label: 'Total Transferred (bytes)', width: '160px', group: 'Metrics' },
    { key: 'co2Mg', label: 'CO2 (mg)', width: '100px', group: 'Metrics' },
    { key: 'carbonRating', label: 'Carbon Rating', width: '110px', group: 'Metrics' },
    { key: 'lcp', label: 'LCP (ms)', width: '100px', group: 'Metrics' },
    { key: 'cls', label: 'CLS', width: '90px', group: 'Metrics' },
    { key: 'inp', label: 'INP (ms)', width: '100px', group: 'Metrics' },
    { key: 'wordCount', label: 'Word Count', width: '110px', group: 'Metrics' },
    { key: 'sentenceCount', label: 'Sentence Count', width: '120px', group: 'Metrics' },
    { key: 'avgWordsPerSentence', label: 'Average Words Per Sentence', width: '180px', group: 'Metrics' },
    { key: 'fleschScore', label: 'Flesch Reading Ease Score', width: '180px', group: 'Metrics' },
    { key: 'readability', label: 'Readability', width: '120px', group: 'Metrics' },
    { key: 'textRatio', label: 'Text Ratio', width: '100px', group: 'Metrics' },
    { key: 'loadTime', label: 'Response Time', width: '120px', group: 'Metrics' },
    { key: 'lastModified', label: 'Last Modified', width: '180px', group: 'Metrics' },
    { key: 'missingAltImages', label: 'Missing Alt Images', width: '140px', group: 'Metrics' },
    { key: 'longAltImages', label: 'Long Alt Images', width: '130px', group: 'Metrics' },
    { key: 'totalImages', label: 'Total Images', width: '110px', group: 'Metrics' },
    
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
    { key: 'internalPageRank', label: 'Internal PageRank', width: '150px', group: 'Advanced' },
    { key: 'linkEquity', label: 'Link Equity (0-10)', width: '150px', group: 'Advanced' },
    { key: 'funnelStage', label: 'Funnel Stage (AI)', width: '150px', group: 'Advanced' },
    { key: 'searchIntent', label: 'Search Intent (AI)', width: '160px', group: 'Advanced' },
    { key: 'strategicPriority', label: 'Strategic Priority', width: '160px', group: 'Advanced' },
    { key: 'contentDecay', label: 'Content Decay', width: '150px', group: 'Advanced' },
    { key: 'multipleH1s', label: 'Multiple H1s', width: '120px', group: 'Advanced' },
    { key: 'incorrectHeadingOrder', label: 'Heading Order Issue', width: '150px', group: 'Advanced' },
    { key: 'schemaErrors', label: 'Schema Errors', width: '120px', group: 'Advanced' },
    { key: 'schemaWarnings', label: 'Schema Warnings', width: '130px', group: 'Advanced' },
    { key: 'crawlTimestamp', label: 'Crawl Timestamp', width: '200px', group: 'Advanced' },
    
    // Search Performance (GSC & Keywords)
    { key: 'gscClicks', label: 'Clicks (30d)', width: '130px', group: 'Search Console' },
    { key: 'gscImpressions', label: 'Impressions (30d)', width: '160px', group: 'Search Console' },
    { key: 'gscCtr', label: 'CTR', width: '100px', group: 'Search Console' },
    { key: 'gscPosition', label: 'Avg Position', width: '140px', group: 'Search Console' },
    { key: 'mainKeyword', label: 'Main Keyword', width: '180px', group: 'Search Console' },
    { key: 'mainKeywordSource', label: 'Keyword Source', width: '140px', group: 'Search Console' },
    { key: 'mainKwPosition', label: 'Main KW Position', width: '140px', group: 'Search Console' },
    { key: 'mainKwSearchVolume', label: 'Search Volume', width: '130px', group: 'Search Console' },
    { key: 'mainKwEstimatedVolume', label: 'Est. Volume (Imp)', width: '150px', group: 'Search Console' },
    { key: 'bestKeyword', label: 'Best Keyword', width: '180px', group: 'Search Console' },
    { key: 'bestKeywordSource', label: 'Best KW Source', width: '140px', group: 'Search Console' },
    { key: 'bestKwPosition', label: 'Best KW Position', width: '140px', group: 'Search Console' },
    { key: 'bestKwSearchVolume', label: 'Best KW Volume', width: '140px', group: 'Search Console' },
    { key: 'bestKwEstimatedVolume', label: 'Best KW Est. Volume', width: '160px', group: 'Search Console' },



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
    { key: 'ga4Revenue', label: 'Revenue', width: '120px', group: 'Analytics' },

    // Backlinks & Authority
    { key: 'authorityScore', label: 'Authority Score', width: '150px', group: 'Authority' },
    { key: 'urlRating', label: 'URL Rating (UR)', width: '150px', group: 'Authority' },
    { key: 'referringDomains', label: 'Ref. Domains', width: '160px', group: 'Authority' },
    { key: 'backlinks', label: 'Backlinks', width: '150px', group: 'Authority' },

    // Strategic Decisions
    { key: 'opportunityScore', label: 'Opportunity Score', width: '150px', group: 'Strategic' },
    { key: 'businessValueScore', label: 'Business Value Score', width: '160px', group: 'Strategic' },
    { key: 'recommendedAction', label: 'Recommended Action', width: '220px', group: 'Strategic' },
    { key: 'isLosingTraffic', label: 'Traffic Alert', width: '130px', group: 'Strategic' },
];

export const SEO_ISSUES_TAXONOMY = [
    {
        category: 'Indexability',
        issues: [
            { id: '404', label: '404 Broken Links (Client Error)', type: 'error', condition: (p: any) => p.statusCode >= 400 && p.statusCode < 500 },
            { id: '500', label: '5xx Server Errors', type: 'error', condition: (p: any) => p.statusCode >= 500 },
            { id: 'noindex', label: 'Noindex Pages', type: 'warning', condition: (p: any) => p.metaRobots1?.toLowerCase().includes('noindex') },
            { id: 'blocked_robots', label: 'Blocked by Robots.txt', type: 'error', condition: (p: any) => p.status === 'Blocked by Robots.txt' },
            { id: 'canonical_mismatch', label: 'Canonical Mismatch', type: 'notice', condition: (p: any) => p.canonical && p.canonical !== p.url },
            { id: 'canonical_missing', label: 'Missing Canonical Tag', type: 'warning', condition: (p: any) => !p.canonical },
            { id: 'multiple_canonical', label: 'Multiple Canonical Tags', type: 'error', condition: (p: any) => p.multipleCanonical === true },
            { id: 'canonical_chain', label: 'Canonical Chain', type: 'error', condition: (p: any) => p.canonicalChain === true },
            { id: 'refresh_redirect', label: 'Meta Refresh Redirect', type: 'warning', condition: (p: any) => p.metaRefresh },
            { id: 'orphan_pages', label: 'Orphan Pages (0 Inlinks)', type: 'warning', condition: (p: any) => p.inlinks === 0 && p.crawlDepth > 0 },
            { id: 'deep_pages', label: 'Pages Deep in Architecture (Depth > 4)', type: 'notice', condition: (p: any) => p.crawlDepth > 4 },
        ]
    },
    {
        category: 'Links & Navigation',
        issues: [
            { id: 'broken_internal_links', label: 'Broken Internal Links', type: 'error', condition: (p: any) => p.brokenInternalLinks > 0 },
            { id: 'too_many_links', label: 'Too Many Links on Page (>3000)', type: 'warning', condition: (p: any) => (p.inlinks + p.outlinks) > 3000 },
            { id: 'internal_redirects', label: 'Internal Links to Redirects (3xx)', type: 'notice', condition: (p: any) => p.redirectsIn > 0 },
            { id: 'only_one_inlink', label: 'Pages with Only 1 Inlink', type: 'notice', condition: (p: any) => p.inlinks === 1 },
            { id: 'insecure_links', label: 'Links to Insecure Pages (HTTP)', type: 'warning', condition: (p: any) => p.insecureLinks > 0 },
        ]
    },
    {
        category: 'Content & Quality',
        issues: [
            { id: 'low_word_count', label: 'Low Word Count (< 200 words)', type: 'warning', condition: (p: any) => p.wordCount > 0 && p.wordCount < 200 },
            { id: 'exact_duplicate', label: 'Exact Duplicate Content', type: 'error', condition: (p: any) => p.exactDuplicate === true },
            { id: 'spelling_errors', label: 'Spelling Errors Found', type: 'notice', condition: (p: any) => p.spellingErrors > 0 },
            { id: 'grammar_errors', label: 'Grammar Errors Found', type: 'notice', condition: (p: any) => p.grammarErrors > 0 },
            { id: 'low_readability', label: 'Low Readability Score', type: 'notice', condition: (p: any) => p.fleschScore > 0 && p.fleschScore < 30 },
            { id: 'lorem_ipsum', label: 'Contains Lorem Ipsum', type: 'warning', condition: (p: any) => p.containsLoremIpsum === true },
        ]
    },
    {
        category: 'Page Titles',
        issues: [
            { id: 'title_missing', label: 'Missing Title Tag', type: 'error', condition: (p: any) => !p.title },
            { id: 'title_empty', label: 'Empty Title Tag', type: 'error', condition: (p: any) => p.title === '' },
            { id: 'title_duplicate', label: 'Duplicate Titles', type: 'warning', condition: (p: any) => p.isDuplicateTitle === true },
            { id: 'title_too_long', label: 'Title Too Long (> 60 chars)', type: 'notice', condition: (p: any) => p.titleLength > 60 },
            { id: 'title_too_short', label: 'Title Too Short (< 30 chars)', type: 'notice', condition: (p: any) => p.titleLength > 0 && p.titleLength < 30 },
            { id: 'title_multiple', label: 'Multiple Title Tags', type: 'error', condition: (p: any) => p.multipleTitles === true },
            { id: 'title_same_as_h1', label: 'Title Same as H1', type: 'notice', condition: (p: any) => p.title && p.h1_1 && p.title === p.h1_1 },
        ]
    },
    {
        category: 'Meta Descriptions',
        issues: [
            { id: 'meta_missing', label: 'Missing Meta Description', type: 'warning', condition: (p: any) => !p.metaDesc },
            { id: 'meta_empty', label: 'Empty Meta Description', type: 'warning', condition: (p: any) => p.metaDesc === '' },
            { id: 'meta_duplicate', label: 'Duplicate Meta Descriptions', type: 'notice', condition: (p: any) => p.isDuplicateMetaDesc === true },
            { id: 'meta_too_long', label: 'Meta Desc Too Long (> 155 chars)', type: 'notice', condition: (p: any) => p.metaDescLength > 155 },
            { id: 'meta_too_short', label: 'Meta Desc Too Short (< 70 chars)', type: 'notice', condition: (p: any) => p.metaDescLength > 0 && p.metaDescLength < 70 },
            { id: 'meta_multiple', label: 'Multiple Meta Descriptions', type: 'error', condition: (p: any) => p.multipleMetaDescs === true },
        ]
    },
    {
        category: 'Headings (H1, H2)',
        issues: [
            { id: 'h1_missing', label: 'Missing H1', type: 'warning', condition: (p: any) => !p.h1_1 },
            { id: 'h1_multiple', label: 'Multiple H1 Tags', type: 'notice', condition: (p: any) => p.multipleH1s === true || !!p.h1_2 },
            { id: 'h1_duplicate', label: 'Duplicate H1 Tags (Across Site)', type: 'warning', condition: (p: any) => p.isDuplicateH1 === true },
            { id: 'h1_too_long', label: 'H1 Too Long (> 70 chars)', type: 'notice', condition: (p: any) => p.h1_1Length > 70 },
            { id: 'h2_missing', label: 'Missing H2 Tags', type: 'notice', condition: (p: any) => !p.h2_1 },
            { id: 'heading_order', label: 'Incorrect Heading Order', type: 'warning', condition: (p: any) => p.incorrectHeadingOrder === true },
        ]
    },
    {
        category: 'Images',
        issues: [
            { id: 'img_missing_alt', label: 'Missing Alt Text', type: 'warning', condition: (p: any) => p.missingAltImages > 0 },
            { id: 'img_long_alt', label: 'Alt Text Too Long (> 100 chars)', type: 'notice', condition: (p: any) => p.longAltImages > 0 },
        ]
    },
    {
        category: 'Performance & UX',
        issues: [
            { id: 'slow_response', label: 'Slow Response Time (> 1.5s)', type: 'warning', condition: (p: any) => p.loadTime > 1500 },
            { id: 'large_page', label: 'Large HTML Size (> 2MB)', type: 'warning', condition: (p: any) => p.sizeBytes > 2000000 },
            { id: 'poor_lcp', label: 'Poor LCP (> 2.5s)', type: 'warning', condition: (p: any) => p.lcp > 2500 },
            { id: 'poor_cls', label: 'Poor CLS (> 0.1)', type: 'warning', condition: (p: any) => p.cls > 0.1 },
            { id: 'poor_inp', label: 'Poor INP (> 200ms)', type: 'warning', condition: (p: any) => p.inp > 200 },
            { id: 'content_decay', label: 'Possible Content Decay', type: 'warning', condition: (p: any) => p.contentDecay === 'Possible Decay' },
        ]
    },
    {
        category: 'Strategic Insights',
        issues: [
            { id: 'low_ctr', label: 'High Impressions, Low CTR', type: 'warning', condition: (p: any) => p.gscImpressions > 1000 && p.gscCtr < 0.01 },
            { id: 'traffic_drop', label: 'Declining Traffic (>10% drop)', type: 'error', condition: (p: any) => p.isLosingTraffic === true },
            { id: 'high_value_low_engagement', label: 'High Value, Low Engagement', type: 'warning', condition: (p: any) => p.businessValueScore > 70 && p.ga4BounceRate > 0.7 },
            { id: 'striking_distance', label: 'Striking Distance Opportunity', type: 'notice', condition: (p: any) => p.opportunityScore > 70 },
            { id: 'thin_content_high_auth', label: 'Thin Content with High Authority', type: 'warning', condition: (p: any) => p.wordCount < 300 && p.authorityScore > 50 },
        ]
    },
    {
        category: 'Security',
        issues: [
            { id: 'http_url', label: 'HTTP URL (Insecure)', type: 'error', condition: (p: any) => p.url?.startsWith('http://') },
            { id: 'mixed_content', label: 'Mixed Content', type: 'error', condition: (p: any) => p.mixedContent === true },
            { id: 'insecure_forms', label: 'Insecure Forms', type: 'error', condition: (p: any) => p.insecureForms === true },
            { id: 'missing_hsts', label: 'Missing HSTS Header', type: 'warning', condition: (p: any) => p.hstsMissing === true },
            { id: 'missing_x_frame', label: 'Missing X-Frame-Options', type: 'notice', condition: (p: any) => p.xFrameMissing === true },
        ]
    },
    {
        category: 'International (Hreflang)',
        issues: [
            { id: 'hreflang_missing', label: 'Missing Hreflang Tags', type: 'notice', condition: (p: any) => !Array.isArray(p.hreflang) || p.hreflang.length === 0 },
            { id: 'hreflang_no_self', label: 'Missing Self-Referencing Hreflang', type: 'warning', condition: (p: any) => p.hreflangNoSelf === true },
            { id: 'hreflang_invalid', label: 'Invalid Language Code', type: 'error', condition: (p: any) => p.hreflangInvalid === true },
            { id: 'hreflang_broken', label: 'Hreflang to Broken Page', type: 'error', condition: (p: any) => p.hreflangBroken === true },
        ]
    },
    {
        category: 'Structured Data',
        issues: [
            { id: 'schema_missing', label: 'Missing Structured Data', type: 'notice', condition: (p: any) => !p.schema || (Array.isArray(p.schema) && p.schema.length === 0) },
            { id: 'schema_errors', label: 'Schema Validation Errors', type: 'error', condition: (p: any) => p.schemaErrors > 0 },
            { id: 'schema_warnings', label: 'Schema Validation Warnings', type: 'warning', condition: (p: any) => p.schemaWarnings > 0 },
        ]
    },
    {
        category: 'Mobile & AMP',
        issues: [
            { id: 'amp_missing', label: 'Missing AMP Alternate Link', type: 'notice', condition: (p: any) => !p.amphtml },
            { id: 'mobile_alt_missing', label: 'Missing Mobile Alternate Link', type: 'notice', condition: (p: any) => !p.mobileAlt },
        ]
    },
    {
        category: 'Pagination',
        issues: [
            { id: 'rel_next_missing', label: 'Missing rel="next"', type: 'notice', condition: (p: any) => !p.relNextTag },
            { id: 'rel_prev_missing', label: 'Missing rel="prev"', type: 'notice', condition: (p: any) => !p.relPrevTag },
            { id: 'pagination_noindex', label: 'Paginated Pages set to Noindex', type: 'warning', condition: (p: any) => (p.relNextTag || p.relPrevTag) && p.metaRobots1?.toLowerCase().includes('noindex') },
        ]
    }
];

export const CATEGORIES = [
    { id: 'internal', label: 'Internal', icon: <Database size={14}/>, sub: ['All', 'HTML', 'JavaScript', 'CSS', 'Images', 'PDF'] },
    { id: 'external', label: 'External', icon: <Globe size={14}/>, sub: ['All', 'HTML', 'Images'] },
    { id: 'security', label: 'Security', icon: <Server size={14}/>, sub: ['Mixed Content', 'Insecure Forms', 'Missing HSTS'] },
    { id: 'codes', label: 'Response Codes', icon: <Server size={14}/>, sub: ['Success (2xx)', 'Redirection (3xx)', 'Client Error (4xx)', 'Server Error (5xx)'] },
    { id: 'indexability', label: 'Indexability', icon: <Compass size={14}/>, sub: ['Indexable', 'Non-Indexable', 'Canonicalized', 'Noindex'] },
    { id: 'titles', label: 'Page Titles', icon: <Code size={14}/>, sub: ['Missing', 'Duplicate', 'Over 60 Characters', 'Below 30 Characters'] },
    { id: 'meta', label: 'Meta Description', icon: <Box size={14}/>, sub: ['Missing', 'Duplicate', 'Over 155 Characters', 'Below 70 Characters'] },
    { id: 'headings', label: 'Headings', icon: <Code size={14}/>, sub: ['Missing H1', 'Multiple H1', 'Missing H2', 'Incorrect Order'] },
    { id: 'links', label: 'Links', icon: <LinkIcon size={14}/>, sub: ['Internal', 'External', 'Broken', 'Redirects'] },
    { id: 'images', label: 'Images', icon: <Box size={14}/>, sub: ['Missing Alt', 'Long Alt', 'Has Images'] },
    { id: 'performance', label: 'Performance', icon: <FastForward size={14}/>, sub: ['Slow Pages', 'Large Pages', 'Poor LCP', 'Poor CLS'] },
    { id: 'international', label: 'International', icon: <Globe size={14}/>, sub: ['Missing Hreflang', 'Hreflang Errors'] },
    { id: 'structured', label: 'Structured Data', icon: <Database size={14}/>, sub: ['Missing Schema', 'Schema Errors', 'Schema Warnings'] },
    { id: 'mobile', label: 'Mobile & AMP', icon: <Globe size={14}/>, sub: ['Missing AMP', 'Missing Mobile Alternate'] },
    { id: 'pagination', label: 'Pagination', icon: <LinkIcon size={14}/>, sub: ['Missing rel=next', 'Missing rel=prev', 'Paginated Noindex'] },
    { id: 'architecture', label: 'Site Architecture', icon: <MapIcon size={14}/>, sub: ['Depth 0-2', 'Depth 3-4', 'Depth 5+', 'Orphan Pages'] },
    { id: 'custom', label: 'Custom Extraction', icon: <Search size={14}/>, sub: ['Has Extraction', 'Missing Extraction'] }
];

export const SMART_PRESETS = [
    { id: 'quick-audit', label: 'Quick Audit', desc: 'Errors, missing titles, broken links', categories: ['codes', 'titles', 'links'], columns: ['url', 'statusCode', 'title', 'titleLength', 'metaDesc', 'inlinks', 'outlinks', 'loadTime'] },
    { id: 'full-technical', label: 'Full Technical', desc: 'All technical SEO signals', categories: ['internal', 'codes', 'indexability', 'security', 'performance'], columns: ['url', 'statusCode', 'indexable', 'canonical', 'metaRobots1', 'httpVersion', 'sizeBytes', 'loadTime', 'lcp', 'cls', 'crawlDepth'] },
    { id: 'content-review', label: 'Content Review', desc: 'Titles, headings, readability', categories: ['titles', 'meta', 'headings', 'internal'], columns: ['url', 'title', 'titleLength', 'metaDesc', 'metaDescLength', 'h1_1', 'h1_2', 'h2_1', 'wordCount', 'fleschScore', 'readability'] },
    { id: 'link-audit', label: 'Link Audit', desc: 'Link architecture and depth', categories: ['links', 'architecture'], columns: ['url', 'statusCode', 'crawlDepth', 'folderDepth', 'inlinks', 'uniqueInlinks', 'outlinks', 'externalOutlinks', 'linkScore'] },
];
