/**
 * services/CompetitorMatrixConfig.ts
 *
 * Configuration and type definitions for the Competitor Matrix.
 * This file defines the aggregate CompetitorProfile type and the rows
 * that appear in the comparison matrix.
 */

export interface CompetitorProfile {
  // ─── Identity ───
  domain: string;                   // always set — primary key
  businessName: string | null;
  domainAge: number | null;         // years
  valueProposition: string | null;
  employeeCountEstimate: string | null; // "1-10", "11-50", "51-200", etc.

  // ─── Content Strategy ───
  blogUrl: string | null;
  isActivelyBlogging: boolean | null;
  contentQualityAssessment: string | null; // 'Excellent' | 'Good' | 'Average' | 'Poor'
  blogPostsPerMonth: number | null;
  avgImagesPerArticle: number | null;
  embedsVideoInArticles: boolean | null;
  avgWordsPerArticle: number | null;
  topContentTypeByShares: string | null;
  avgRefDomainsToContentPages: number | null;

  // ─── Top Content (arrays of top 3) ───
  topBlogPages: Array<{ url: string; title: string; traffic?: number }>;
  topEcomPages: Array<{ url: string; title: string; traffic?: number }>;
  topContentShareCounts: Array<{ url: string; shares: number }>;
  topOrganicPages: Array<{ url: string; title: string; traffic?: number }>;

  // ─── On-Page SEO ───
  productPageAvgWordCount: number | null;
  onPageSeoQuality: string | null;  // 'Good' | 'Average' | 'Poor'
  hasSchemaOnProducts: boolean | null;
  hasTargetedLandingPages: boolean | null;

  // ─── E-commerce ───
  offersSameProducts: boolean | null;  // manual entry
  pricingComparison: string | null;    // manual entry
  shippingOffers: string | null;

  // ─── Lead Gen ───
  hasEmailOptIn: boolean | null;
  optInOffer: string | null;

  // ─── Local ───
  localKeywordRanking: number | null;  // position
  reviewCount: number | null;
  imageCount: number | null;           // GMB images
  localPressCoverage: boolean | null;
  qualityCitationsPresent: boolean | null;
  hasOptimizedLocalPages: boolean | null;

  // ─── Paid / Ads ───
  adsTraffic: number | null;
  adsTrafficCost: number | null;
  displayAdsCount: number | null;

  // ─── Authority & Links ───
  domainAuthority: number | null;
  seTraffic: number | null;
  seTrafficCost: number | null;
  overallSeoScore: number | null;
  referringDomains: number | null;
  linkVelocity60d: number | null;
  urlRating: number | null;
  keywordsInTop8: number | null;
  pagesIndexed: number | null;
  brandedSearchVolume: number | null;

  // ─── Social: Facebook ───
  facebookUrl: string | null;
  facebookFans: number | null;
  facebookUpdatesPerMonth: number | null;
  facebookEngagementLevel: string | null;  // 'High' | 'Medium' | 'Low'
  facebookCreatesVideo: boolean | null;
  facebookAvgVideoViews: number | null;

  // ─── Social: Twitter/X ───
  twitterUrl: string | null;
  twitterFollowers: number | null;
  twitterUpdatesPerMonth: number | null;

  // ─── Social: YouTube ───
  youtubeUrl: string | null;
  youtubeVideoCount: number | null;
  youtubeSubscribers: number | null;
  youtubeVideosOver100Views: number | null;
  youtubeUpdatesPerMonth: number | null;
  socialTotalFollowers: number | null;
  socialGrowthRate: number | null;

  // ─── Social: Instagram ───
  instagramUrl: string | null;
  instagramFollowers: number | null;
  instagramAvgImageLikes: number | null;
  instagramAvgVideoViews: number | null;

  // ─── CMS & Tech ───
  cmsType: string | null;
  techStackSignals: string[];  // detected frameworks/libs

  // ─── Search Visibility (consolidated) ───
  estimatedOrganicTraffic: number | null;
  trafficTrend30d: number | null;            // percentage change, e.g. +12 or -5
  totalRankingKeywords: number | null;
  keywordsInTop3: number | null;
  keywordsInTop10: number | null;
  keywordsInTop20: number | null;
  avgOrganicPosition: number | null;
  brandedTrafficPct: number | null;          // 0-100
  shareOfVoice: number | null;              // 0-100 (% of shared keywords you win)
  keywordOverlapPct: number | null;          // 0-100 (% of their ranking keywords you also rank for)
  serpFeatureCount: number | null;
  topGrowingKeywords: string[] | null;

  // ─── Content Depth & Quality (consolidated) ───
  totalIndexablePages: number | null;
  avgContentLength: number | null;
  contentFreshnessScore: number | null;      // 0-100 (% updated in last 6mo)
  topicCoverageBreadth: number | null;       // # unique topic clusters
  contentEfficiency: number | null;          // traffic per indexable page
  duplicateContentPct: number | null;        // 0-100
  thinContentPct: number | null;            // 0-100 (pages < 300 words)
  schemaCoveragePct: number | null;          // 0-100
  faqHowToCount: number | null;
  recentNewPages: number | null;
  averagePageAge: number | null;             // months
  contentVelocityTrend: number | null;       // +/- % publishing speed delta

  // ─── Technical Health (consolidated) ───
  techHealthScore: number | null;            // 0-100
  cwvPassRate: number | null;                // 0-100 (% pages passing all 3 CWV)
  mobileFriendlinessScore: number | null;    // 0-100
  securityGrade: string | null;              // 'A' | 'B' | 'C' | 'D' | 'F'
  crawlabilityScore: number | null;          // 0-100
  siteSpeedScore: number | null;            // 0-100 (avg lighthouse perf)
  jsRenderDependencyPct: number | null;      // 0-100

  // ─── AI Discoverability (consolidated) ───
  avgGeoScore: number | null;                // 0-100
  avgCitationWorthiness: number | null;      // 0-100
  hasLlmsTxt: boolean | null;
  aiBotAccessPolicy: string | null;          // 'open' | 'partial' | 'blocked'
  passageReadyPct: number | null;            // 0-100
  featuredSnippetReadyPct: number | null;    // 0-100

  // ─── User Experience & Conversion (consolidated) ───
  avgBounceRate: number | null;              // 0-100
  avgSessionDuration: number | null;         // seconds
  conversionPathCount: number | null;
  ctaDensityScore: number | null;            // 0-100
  emailOptInQuality: string | null;          // 'Strong' | 'Basic' | 'None'
  trustSignalScore: number | null;           // 0-100

  // ─── Threat & Opportunity (AI-generated) ───
  threatLevel: string | null;                // 'Critical' | 'High' | 'Moderate' | 'Low'
  contentThreatScore: number | null;         // 0-100
  authorityThreatScore: number | null;       // 0-100
  innovationThreatScore: number | null;      // 0-100
  opportunityAgainstThem: number | null;     // 0-100


  // ─── Meta ───
  _meta: {
    crawledAt: number | null;      // timestamp of last micro-crawl
    aiAnalyzedAt: number | null;   // timestamp of last AI enrichment
    manualEditedAt: number | null; // timestamp of last manual edit
    pagesCrawled: number;
    source: 'micro-crawl' | 'full-crawl' | 'manual' | 'imported';
  };
}

export type CellFormat = 'text' | 'number' | 'boolean' | 'url' | 'score_100' | 'currency' | 'list' | 'manual_text' | 'manual_boolean';
export type DataSource = 'crawl' | 'gsc' | 'ga4' | 'backlinks' | 'social_api' | 'manual' | 'ai';

export interface ComparisonRowDef {
  id: string;                       // unique row key
  category: string;                 // group header
  label: string;                    // display label in first column
  profileKey: keyof CompetitorProfile | string;  // dot-path into CompetitorProfile (e.g. 'topBlogPages.0.url')
  format: CellFormat;
  source: DataSource;               // tells the UI which icon/badge to show
  tooltip?: string;                 // hover explanation
  isManualEntry?: boolean;          // if true, cells are editable inline
}

export const COMPARISON_CATEGORIES = [
  'Business Profile',
  'Search Visibility',
  'Content',
  'Technical Health',
  'Authority & Links',
  'AI Discoverability',
  'User Experience & Conversion',
  'Social Media',
  'Paid & Advertising',
  'E-commerce & Pricing',
  'Local SEO',
  'Threat & Opportunity'
] as const;


export const COMPARISON_ROWS: ComparisonRowDef[] = [
  // Business Intelligence
  { id: 'bi-domain', category: 'Business Profile', label: 'Domain URL', profileKey: 'domain', format: 'url', source: 'crawl' },
  { id: 'bi-name', category: 'Business Profile', label: 'Business Name', profileKey: 'businessName', format: 'text', source: 'ai' },
  { id: 'bi-age', category: 'Business Profile', label: 'Domain Age (years)', profileKey: 'domainAge', format: 'number', source: 'manual', tooltip: 'WHOIS data — enter manually or import' },
  { id: 'bi-value-prop', category: 'Business Profile', label: 'Value Proposition', profileKey: 'valueProposition', format: 'manual_text', source: 'ai', isManualEntry: true },
  { id: 'bi-employees', category: 'Business Profile', label: 'Employee Count Estimate', profileKey: 'employeeCountEstimate', format: 'text', source: 'ai' },

  // ─── Search Visibility ───
  { id: 'sv-organic-traffic', category: 'Search Visibility', label: 'Estimated Organic Traffic', profileKey: 'estimatedOrganicTraffic', format: 'number', source: 'gsc' },
  { id: 'sv-traffic-trend', category: 'Search Visibility', label: 'Traffic Trend (30d %)', profileKey: 'trafficTrend30d', format: 'number', source: 'gsc', tooltip: 'Positive = growing, negative = declining' },
  { id: 'sv-total-kw', category: 'Search Visibility', label: 'Total Ranking Keywords', profileKey: 'totalRankingKeywords', format: 'number', source: 'gsc' },
  { id: 'sv-kw-top3', category: 'Search Visibility', label: 'Keywords in Top 3', profileKey: 'keywordsInTop3', format: 'number', source: 'gsc' },
  { id: 'sv-kw-top10', category: 'Search Visibility', label: 'Keywords in Top 10', profileKey: 'keywordsInTop10', format: 'number', source: 'gsc' },
  { id: 'sv-kw-top20', category: 'Search Visibility', label: 'Keywords in Top 20', profileKey: 'keywordsInTop20', format: 'number', source: 'gsc' },
  { id: 'sv-avg-pos', category: 'Search Visibility', label: 'Avg. Organic Position', profileKey: 'avgOrganicPosition', format: 'number', source: 'gsc' },
  { id: 'sv-branded-pct', category: 'Search Visibility', label: 'Branded Traffic %', profileKey: 'brandedTrafficPct', format: 'number', source: 'gsc', tooltip: 'Percentage of clicks from branded queries' },
  { id: 'sv-sov', category: 'Search Visibility', label: 'Share of Voice (overlap KWs)', profileKey: 'shareOfVoice', format: 'score_100', source: 'gsc', tooltip: '% of shared keywords where you outrank this competitor' },
  { id: 'sv-keyword-overlap', category: 'Search Visibility', label: 'Keyword Overlap %', profileKey: 'keywordOverlapPct', format: 'number', source: 'gsc' },
  { id: 'sv-serp-features', category: 'Search Visibility', label: 'SERP Features Owned', profileKey: 'serpFeatureCount', format: 'number', source: 'gsc' },
  { id: 'sv-top-growing-kws', category: 'Search Visibility', label: 'Top Growing Keywords', profileKey: 'topGrowingKeywords', format: 'list', source: 'gsc' },

  // ─── Content Depth & Quality ───
  { id: 'cd-total-pages', category: 'Content', label: 'Total Indexable Pages', profileKey: 'totalIndexablePages', format: 'number', source: 'crawl' },
  { id: 'cd-avg-length', category: 'Content', label: 'Avg. Content Length (words)', profileKey: 'avgContentLength', format: 'number', source: 'crawl' },
  { id: 'cd-freshness', category: 'Content', label: 'Content Freshness Score', profileKey: 'contentFreshnessScore', format: 'score_100', source: 'crawl', tooltip: '% of pages updated in last 6 months' },
  { id: 'cd-topics', category: 'Content', label: 'Topic Coverage Breadth', profileKey: 'topicCoverageBreadth', format: 'number', source: 'ai', tooltip: 'Number of unique topic clusters' },
  { id: 'cd-efficiency', category: 'Content', label: 'Content Efficiency', profileKey: 'contentEfficiency', format: 'number', source: 'gsc', tooltip: 'Organic traffic ÷ indexable pages' },
  { id: 'cd-duplicate-pct', category: 'Content', label: 'Duplicate Content %', profileKey: 'duplicateContentPct', format: 'number', source: 'crawl' },
  { id: 'cd-thin-pct', category: 'Content', label: 'Thin Content %', profileKey: 'thinContentPct', format: 'number', source: 'crawl', tooltip: 'Pages with < 300 words' },
  { id: 'cd-schema-pct', category: 'Content', label: 'Schema Markup Coverage %', profileKey: 'schemaCoveragePct', format: 'number', source: 'crawl' },
  { id: 'cd-faq-count', category: 'Content', label: 'FAQ / How-To Content Count', profileKey: 'faqHowToCount', format: 'number', source: 'crawl' },
  { id: 'cd-recent-new-pages', category: 'Content', label: 'Recent New Pages (30d)', profileKey: 'recentNewPages', format: 'number', source: 'crawl' },
  { id: 'cd-average-page-age', category: 'Content', label: 'Average Page Age (months)', profileKey: 'averagePageAge', format: 'number', source: 'crawl' },
  { id: 'cd-content-velocity-trend', category: 'Content', label: 'Content Velocity Trend %', profileKey: 'contentVelocityTrend', format: 'number', source: 'crawl' },

  // ─── Technical Health ───
  { id: 'th-score', category: 'Technical Health', label: 'Technical Health Score', profileKey: 'techHealthScore', format: 'score_100', source: 'crawl' },
  { id: 'th-cwv', category: 'Technical Health', label: 'Core Web Vitals Pass Rate %', profileKey: 'cwvPassRate', format: 'number', source: 'crawl' },
  { id: 'th-mobile', category: 'Technical Health', label: 'Mobile Friendliness Score', profileKey: 'mobileFriendlinessScore', format: 'score_100', source: 'crawl' },
  { id: 'th-security', category: 'Technical Health', label: 'Security Grade', profileKey: 'securityGrade', format: 'text', source: 'crawl' },
  { id: 'th-crawlability', category: 'Technical Health', label: 'Crawlability Score', profileKey: 'crawlabilityScore', format: 'score_100', source: 'crawl' },
  { id: 'th-speed', category: 'Technical Health', label: 'Site Speed Score', profileKey: 'siteSpeedScore', format: 'score_100', source: 'crawl' },
  { id: 'th-js-dep', category: 'Technical Health', label: 'JS Render Dependency %', profileKey: 'jsRenderDependencyPct', format: 'number', source: 'crawl', tooltip: '% of pages where critical content requires JS' },

  // ─── AI Discoverability ───
  { id: 'ai-geo', category: 'AI Discoverability', label: 'Avg. GEO Score', profileKey: 'avgGeoScore', format: 'score_100', source: 'ai' },
  { id: 'ai-citation', category: 'AI Discoverability', label: 'Avg. Citation Worthiness', profileKey: 'avgCitationWorthiness', format: 'score_100', source: 'ai' },
  { id: 'ai-llms-txt', category: 'AI Discoverability', label: 'llms.txt Present?', profileKey: 'hasLlmsTxt', format: 'boolean', source: 'crawl' },
  { id: 'ai-bot-policy', category: 'AI Discoverability', label: 'AI Bot Access Policy', profileKey: 'aiBotAccessPolicy', format: 'text', source: 'crawl', tooltip: 'open / partial / blocked' },
  { id: 'ai-passage-pct', category: 'AI Discoverability', label: 'Passage-Ready Content %', profileKey: 'passageReadyPct', format: 'number', source: 'crawl' },
  { id: 'ai-snippet-pct', category: 'AI Discoverability', label: 'Featured Snippet Ready %', profileKey: 'featuredSnippetReadyPct', format: 'number', source: 'crawl' },

  // ─── User Experience & Conversion ───
  { id: 'ux-bounce', category: 'User Experience & Conversion', label: 'Avg. Bounce Rate %', profileKey: 'avgBounceRate', format: 'number', source: 'ga4' },
  { id: 'ux-session', category: 'User Experience & Conversion', label: 'Avg. Session Duration (sec)', profileKey: 'avgSessionDuration', format: 'number', source: 'ga4' },
  { id: 'ux-conv-paths', category: 'User Experience & Conversion', label: 'Conversion Path Count', profileKey: 'conversionPathCount', format: 'number', source: 'crawl' },
  { id: 'ux-cta', category: 'User Experience & Conversion', label: 'CTA Density Score', profileKey: 'ctaDensityScore', format: 'score_100', source: 'crawl' },
  { id: 'ux-optin', category: 'User Experience & Conversion', label: 'Email Opt-In Quality', profileKey: 'emailOptInQuality', format: 'text', source: 'crawl' },
  { id: 'ux-trust', category: 'User Experience & Conversion', label: 'Trust Signal Score', profileKey: 'trustSignalScore', format: 'score_100', source: 'crawl' },

  // Content Strategy
  { id: 'cs-blog-url', category: 'Content', label: 'Blog URL', profileKey: 'blogUrl', format: 'url', source: 'crawl' },
  { id: 'cs-blog-active', category: 'Content', label: 'Actively Creating Blog Content?', profileKey: 'isActivelyBlogging', format: 'boolean', source: 'crawl' },
  { id: 'cs-quality', category: 'Content', label: 'Overall Content Quality', profileKey: 'contentQualityAssessment', format: 'text', source: 'ai' },
  { id: 'cs-posts-month', category: 'Content', label: 'Blog Posts Per Month (Past Year)', profileKey: 'blogPostsPerMonth', format: 'number', source: 'crawl' },
  { id: 'cs-avg-images', category: 'Content', label: 'Avg Images Per Article', profileKey: 'avgImagesPerArticle', format: 'number', source: 'crawl' },
  { id: 'cs-embed-video', category: 'Content', label: 'Embedding Video in Articles?', profileKey: 'embedsVideoInArticles', format: 'boolean', source: 'crawl' },
  { id: 'cs-avg-words', category: 'Content', label: 'Avg Words Per Article', profileKey: 'avgWordsPerArticle', format: 'number', source: 'crawl' },
  { id: 'cs-top-type', category: 'Content', label: 'Top Content Type by Shares', profileKey: 'topContentTypeByShares', format: 'text', source: 'manual' },
  { id: 'cs-avg-backlinks', category: 'Content', label: 'Avg Referring Domains to Content Pages', profileKey: 'avgRefDomainsToContentPages', format: 'number', source: 'backlinks' },

  // Top Content Pages
  { id: 'tp-blog-1', category: 'Authority & Links', label: 'Top Blog Page #1', profileKey: 'topBlogPages.0.url', format: 'url', source: 'crawl' },
  { id: 'tp-blog-2', category: 'Authority & Links', label: 'Top Blog Page #2', profileKey: 'topBlogPages.1.url', format: 'url', source: 'crawl' },
  { id: 'tp-blog-3', category: 'Authority & Links', label: 'Top Blog Page #3', profileKey: 'topBlogPages.2.url', format: 'url', source: 'crawl' },
  { id: 'tp-ecom-1', category: 'Authority & Links', label: 'Top Ecom Page #1 (excl. homepage)', profileKey: 'topEcomPages.0.url', format: 'url', source: 'crawl' },
  { id: 'tp-ecom-2', category: 'Authority & Links', label: 'Top Ecom Page #2 (excl. homepage)', profileKey: 'topEcomPages.1.url', format: 'url', source: 'crawl' },
  { id: 'tp-ecom-3', category: 'Authority & Links', label: 'Top Ecom Page #3 (excl. homepage)', profileKey: 'topEcomPages.2.url', format: 'url', source: 'crawl' },
  { id: 'tp-shares-1', category: 'Authority & Links', label: 'Shares Top Content #1', profileKey: 'topContentShareCounts.0.shares', format: 'number', source: 'manual' },
  { id: 'tp-shares-2', category: 'Authority & Links', label: 'Shares Top Content #2', profileKey: 'topContentShareCounts.1.shares', format: 'number', source: 'manual' },
  { id: 'tp-shares-3', category: 'Authority & Links', label: 'Shares Top Content #3', profileKey: 'topContentShareCounts.2.shares', format: 'number', source: 'manual' },

  // On-Page SEO
  { id: 'seo-avg-words', category: 'Technical Health', label: 'Product Page Avg Word Count', profileKey: 'productPageAvgWordCount', format: 'number', source: 'crawl' },
  { id: 'seo-quality', category: 'Technical Health', label: 'On-Page SEO Quality (H-tags, links, images)', profileKey: 'onPageSeoQuality', format: 'text', source: 'crawl' },
  { id: 'seo-schema', category: 'Technical Health', label: 'Schema on Product Pages?', profileKey: 'hasSchemaOnProducts', format: 'boolean', source: 'crawl' },
  { id: 'seo-lp', category: 'Technical Health', label: 'Targeted Landing Pages for Keywords?', profileKey: 'hasTargetedLandingPages', format: 'boolean', source: 'crawl' },

  // E-commerce
  { id: 'ec-same-products', category: 'E-commerce & Pricing', label: 'Same Products/Services?', profileKey: 'offersSameProducts', format: 'manual_boolean', source: 'manual', isManualEntry: true },
  { id: 'ec-pricing', category: 'E-commerce & Pricing', label: 'Pricing Comparison', profileKey: 'pricingComparison', format: 'manual_text', source: 'manual', isManualEntry: true },
  { id: 'ec-shipping', category: 'E-commerce & Pricing', label: 'Shipping Offers', profileKey: 'shippingOffers', format: 'manual_text', source: 'manual', isManualEntry: true },

  // Lead Generation
  { id: 'lg-optin', category: 'User Experience & Conversion', label: 'Email Opt-In on Site?', profileKey: 'hasEmailOptIn', format: 'boolean', source: 'crawl' },
  { id: 'lg-offer', category: 'User Experience & Conversion', label: 'Opt-In Offer', profileKey: 'optInOffer', format: 'text', source: 'ai' },

  // Local SEO
  { id: 'loc-rank', category: 'Local SEO', label: 'Local Keyword Ranking', profileKey: 'localKeywordRanking', format: 'number', source: 'manual' },
  { id: 'loc-reviews', category: 'Local SEO', label: 'Number of Reviews', profileKey: 'reviewCount', format: 'number', source: 'manual' },
  { id: 'loc-images', category: 'Local SEO', label: 'Number of GMB Images', profileKey: 'imageCount', format: 'number', source: 'manual' },
  { id: 'loc-press', category: 'Local SEO', label: 'Local Press Coverage?', profileKey: 'localPressCoverage', format: 'manual_boolean', source: 'manual', isManualEntry: true },
  { id: 'loc-citations', category: 'Local SEO', label: 'Quality Citations Present?', profileKey: 'qualityCitationsPresent', format: 'manual_boolean', source: 'manual', isManualEntry: true },
  { id: 'loc-pages', category: 'Local SEO', label: 'Optimized Local Landing Pages?', profileKey: 'hasOptimizedLocalPages', format: 'boolean', source: 'crawl' },

  // Paid / Advertising
  { id: 'paid-traffic', category: 'Paid & Advertising', label: 'Ads Traffic', profileKey: 'adsTraffic', format: 'number', source: 'manual' },
  { id: 'paid-cost', category: 'Paid & Advertising', label: 'Ads Traffic Cost', profileKey: 'adsTrafficCost', format: 'currency', source: 'manual' },
  { id: 'paid-ads', category: 'Paid & Advertising', label: 'Display Ads Count', profileKey: 'displayAdsCount', format: 'number', source: 'manual' },

  // Authority & Links
  { id: 'auth-da', category: 'Authority & Links', label: 'Domain Authority', profileKey: 'domainAuthority', format: 'score_100', source: 'backlinks' },
  { id: 'auth-traffic', category: 'Authority & Links', label: 'SE Traffic', profileKey: 'seTraffic', format: 'number', source: 'manual' },
  { id: 'auth-cost', category: 'Authority & Links', label: 'SE Traffic Cost', profileKey: 'seTrafficCost', format: 'currency', source: 'manual' },
  { id: 'auth-page-1', category: 'Authority & Links', label: 'Top Organic Page #1', profileKey: 'topOrganicPages.0.url', format: 'url', source: 'gsc' },
  { id: 'auth-page-2', category: 'Authority & Links', label: 'Top Organic Page #2', profileKey: 'topOrganicPages.1.url', format: 'url', source: 'gsc' },
  { id: 'auth-page-3', category: 'Authority & Links', label: 'Top Organic Page #3', profileKey: 'topOrganicPages.2.url', format: 'url', source: 'gsc' },
  { id: 'auth-score', category: 'Authority & Links', label: 'Overall SEO Score', profileKey: 'overallSeoScore', format: 'score_100', source: 'crawl' },
  { id: 'auth-rd', category: 'Authority & Links', label: 'Referring Domains', profileKey: 'referringDomains', format: 'number', source: 'backlinks' },
  { id: 'auth-velocity', category: 'Authority & Links', label: 'Link Velocity (60d, no sitewide)', profileKey: 'linkVelocity60d', format: 'number', source: 'backlinks' },
  { id: 'auth-ur', category: 'Authority & Links', label: 'URL Rating', profileKey: 'urlRating', format: 'score_100', source: 'backlinks' },
  { id: 'auth-keywords', category: 'Authority & Links', label: 'Keywords in Top 8', profileKey: 'keywordsInTop8', format: 'number', source: 'gsc' },
  { id: 'auth-indexed', category: 'Authority & Links', label: 'Pages Indexed', profileKey: 'pagesIndexed', format: 'number', source: 'crawl' },
  { id: 'auth-branded', category: 'Authority & Links', label: 'Branded Search Volume', profileKey: 'brandedSearchVolume', format: 'number', source: 'manual' },

  // Facebook
  { id: 'fb-url', category: 'Social Media', label: 'Facebook URL', profileKey: 'facebookUrl', format: 'url', source: 'social_api' },
  { id: 'fb-fans', category: 'Social Media', label: 'Facebook Fans', profileKey: 'facebookFans', format: 'number', source: 'social_api' },
  { id: 'fb-posts', category: 'Social Media', label: 'Facebook Updates Per Month', profileKey: 'facebookUpdatesPerMonth', format: 'number', source: 'social_api' },
  { id: 'fb-engagement', category: 'Social Media', label: 'Facebook Engagement Level', profileKey: 'facebookEngagementLevel', format: 'text', source: 'social_api' },
  { id: 'fb-video', category: 'Social Media', label: 'Facebook Creates Video?', profileKey: 'facebookCreatesVideo', format: 'boolean', source: 'social_api' },
  { id: 'fb-views', category: 'Social Media', label: 'Facebook Avg Video Views', profileKey: 'facebookAvgVideoViews', format: 'number', source: 'social_api' },

  // Twitter / X
  { id: 'tw-url', category: 'Social Media', label: 'Twitter URL', profileKey: 'twitterUrl', format: 'url', source: 'social_api' },
  { id: 'tw-followers', category: 'Social Media', label: 'Twitter Followers', profileKey: 'twitterFollowers', format: 'number', source: 'social_api' },
  { id: 'tw-posts', category: 'Social Media', label: 'Twitter Updates Per Month', profileKey: 'twitterUpdatesPerMonth', format: 'number', source: 'social_api' },

  // YouTube
  { id: 'yt-url', category: 'Social Media', label: 'YouTube URL', profileKey: 'youtubeUrl', format: 'url', source: 'social_api' },
  { id: 'yt-videos', category: 'Social Media', label: 'YouTube Video Count', profileKey: 'youtubeVideoCount', format: 'number', source: 'social_api' },
  { id: 'yt-subs', category: 'Social Media', label: 'YouTube Subscribers', profileKey: 'youtubeSubscribers', format: 'number', source: 'social_api' },
  { id: 'yt-views-100', category: 'Social Media', label: 'YouTube Videos Over 100 Views', profileKey: 'youtubeVideosOver100Views', format: 'number', source: 'social_api' },
  { id: 'yt-posts', category: 'Social Media', label: 'YouTube Updates Per Month', profileKey: 'youtubeUpdatesPerMonth', format: 'number', source: 'social_api' },

  // Instagram
  { id: 'ig-url', category: 'Social Media', label: 'Instagram URL', profileKey: 'instagramUrl', format: 'url', source: 'social_api' },
  { id: 'ig-followers', category: 'Social Media', label: 'Instagram Followers', profileKey: 'instagramFollowers', format: 'number', source: 'social_api' },
  { id: 'ig-likes', category: 'Social Media', label: 'Instagram Avg Image Likes', profileKey: 'instagramAvgImageLikes', format: 'number', source: 'social_api' },
  { id: 'ig-views', category: 'Social Media', label: 'Instagram Avg Video Views', profileKey: 'instagramAvgVideoViews', format: 'number', source: 'social_api' },
  { id: 'social-total-followers', category: 'Social Media', label: 'Total Followers (All Platforms)', profileKey: 'socialTotalFollowers', format: 'number', source: 'social_api' },
  { id: 'social-growth-rate', category: 'Social Media', label: 'Social Growth Rate %', profileKey: 'socialGrowthRate', format: 'number', source: 'social_api' },

  // Tech Stack
  { id: 'tech-cms', category: 'Business Profile', label: 'CMS Platform', profileKey: 'cmsType', format: 'text', source: 'crawl' },
  { id: 'tech-stack', category: 'Business Profile', label: 'Tech Stack Signals', profileKey: 'techStackSignals', format: 'list', source: 'crawl' },

  // ─── Threat & Opportunity ───
  { id: 'to-threat-level', category: 'Threat & Opportunity', label: 'Overall Threat Level', profileKey: 'threatLevel', format: 'text', source: 'ai' },
  { id: 'to-content-threat', category: 'Threat & Opportunity', label: 'Content Threat Score', profileKey: 'contentThreatScore', format: 'score_100', source: 'ai' },
  { id: 'to-authority-threat', category: 'Threat & Opportunity', label: 'Authority Threat Score', profileKey: 'authorityThreatScore', format: 'score_100', source: 'ai' },
  { id: 'to-innovation-threat', category: 'Threat & Opportunity', label: 'Innovation Threat Score', profileKey: 'innovationThreatScore', format: 'score_100', source: 'ai' },
  { id: 'to-opportunity', category: 'Threat & Opportunity', label: 'Opportunity Score (for you)', profileKey: 'opportunityAgainstThem', format: 'score_100', source: 'ai' }
];


/**
 * Resolves a dot-path string (e.g., 'topBlogPages.0.url') into a value from a CompetitorProfile object.
 */
export function getProfileValue(profile: CompetitorProfile, dotPath: string): any {
  if (!profile || !dotPath) return null;
  const parts = dotPath.split('.');
  let current: any = profile;
  for (const part of parts) {
    if (current === null || current === undefined) return null;
    current = current[part];
  }
  return current;
}

/**
 * Creates a new CompetitorProfile container with the specified domain and default empty values.
 */
export function createEmptyProfile(domain: string): CompetitorProfile {
  return {
    domain,
    businessName: null,
    domainAge: null,
    valueProposition: null,
    employeeCountEstimate: null,
    blogUrl: null,
    isActivelyBlogging: null,
    contentQualityAssessment: null,
    blogPostsPerMonth: null,
    avgImagesPerArticle: null,
    embedsVideoInArticles: null,
    avgWordsPerArticle: null,
    topContentTypeByShares: null,
    avgRefDomainsToContentPages: null,
    topBlogPages: [],
    topEcomPages: [],
    topContentShareCounts: [],
    topOrganicPages: [],
    productPageAvgWordCount: null,
    onPageSeoQuality: null,
    hasSchemaOnProducts: null,
    hasTargetedLandingPages: null,
    offersSameProducts: null,
    pricingComparison: null,
    shippingOffers: null,
    hasEmailOptIn: null,
    optInOffer: null,
    localKeywordRanking: null,
    reviewCount: null,
    imageCount: null,
    localPressCoverage: null,
    qualityCitationsPresent: null,
    hasOptimizedLocalPages: null,
    adsTraffic: null,
    adsTrafficCost: null,
    displayAdsCount: null,
    domainAuthority: null,
    seTraffic: null,
    seTrafficCost: null,
    overallSeoScore: null,
    referringDomains: null,
    linkVelocity60d: null,
    urlRating: null,
    keywordsInTop8: null,
    pagesIndexed: null,
    brandedSearchVolume: null,
    facebookUrl: null,
    facebookFans: null,
    facebookUpdatesPerMonth: null,
    facebookEngagementLevel: null,
    facebookCreatesVideo: null,
    facebookAvgVideoViews: null,
    twitterUrl: null,
    twitterFollowers: null,
    twitterUpdatesPerMonth: null,
    youtubeUrl: null,
    youtubeVideoCount: null,
    youtubeSubscribers: null,
    youtubeVideosOver100Views: null,
    youtubeUpdatesPerMonth: null,
    socialTotalFollowers: null,
    socialGrowthRate: null,
    instagramUrl: null,
    instagramFollowers: null,
    instagramAvgImageLikes: null,
    instagramAvgVideoViews: null,
    cmsType: null,
    techStackSignals: [],

    // Search Visibility
    estimatedOrganicTraffic: null,
    trafficTrend30d: null,
    totalRankingKeywords: null,
    keywordsInTop3: null,
    keywordsInTop10: null,
    keywordsInTop20: null,
    avgOrganicPosition: null,
    brandedTrafficPct: null,
    shareOfVoice: null,
    keywordOverlapPct: null,
    serpFeatureCount: null,
    topGrowingKeywords: null,

    // Content Depth & Quality
    totalIndexablePages: null,
    avgContentLength: null,
    contentFreshnessScore: null,
    topicCoverageBreadth: null,
    contentEfficiency: null,
    duplicateContentPct: null,
    thinContentPct: null,
    schemaCoveragePct: null,
    faqHowToCount: null,
    recentNewPages: null,
    averagePageAge: null,
    contentVelocityTrend: null,

    // Technical Health
    techHealthScore: null,
    cwvPassRate: null,
    mobileFriendlinessScore: null,
    securityGrade: null,
    crawlabilityScore: null,
    siteSpeedScore: null,
    jsRenderDependencyPct: null,

    // AI Discoverability
    avgGeoScore: null,
    avgCitationWorthiness: null,
    hasLlmsTxt: null,
    aiBotAccessPolicy: null,
    passageReadyPct: null,
    featuredSnippetReadyPct: null,

    // User Experience & Conversion
    avgBounceRate: null,
    avgSessionDuration: null,
    conversionPathCount: null,
    ctaDensityScore: null,
    emailOptInQuality: null,
    trustSignalScore: null,

    // Threat & Opportunity
    threatLevel: null,
    contentThreatScore: null,
    authorityThreatScore: null,
    innovationThreatScore: null,
    opportunityAgainstThem: null,

    _meta: {
      crawledAt: null,
      aiAnalyzedAt: null,
      manualEditedAt: null,
      pagesCrawled: 0,
      source: 'micro-crawl'
    }
  };
}
