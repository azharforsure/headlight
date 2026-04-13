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
  backlinkQualityScore: number | null;     // 0-100 — quality of linking domains
  commonBacklinkDomains: number | null;    // domains linking to multiple competitors

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

  // ─── Social: LinkedIn ───
  linkedinUrl: string | null;
  linkedinFollowers: number | null;

  // ─── Social: TikTok ───
  tiktokUrl: string | null;
  tiktokFollowers: number | null;

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
  featuredSnippetCount: number | null;
  hasKnowledgePanel: boolean | null;

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
  contentTypeBreakdown: string | null;       // e.g. "Blog 45%, Product 30%, Landing 25%"
  avgInternalLinksPerPage: number | null;
  topNavItemCount: number | null;            // number of top-level nav items

  // ─── Technical Health (consolidated) ───
  techHealthScore: number | null;            // 0-100
  cwvPassRate: number | null;                // 0-100 (% pages passing all 3 CWV)
  mobileFriendlinessScore: number | null;    // 0-100
  securityGrade: string | null;              // 'A' | 'B' | 'C' | 'D' | 'F'
  crawlabilityScore: number | null;          // 0-100
  siteSpeedScore: number | null;            // 0-100 (avg lighthouse perf)
  jsRenderDependencyPct: number | null;      // 0-100
  cdnProvider: string | null;                // "Cloudflare", "Fastly", "AWS", etc.

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
  hasLiveChat: boolean | null;
  hasFreeTrial: boolean | null;
  pricingModel: string | null;               // "Free", "Freemium", "Trial", "Paid-only"

  // ─── Brand & Reputation ───
  reviewScoreAvg: number | null;             // average rating across platforms (1-5)
  brandMentionCount: number | null;          // unlinked brand mentions found

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
  'Authority & Links',
  'Technical Health',
  'AI Discoverability',
  'User Experience & Conversion',
  'Social Media',
  'Paid & Advertising',
  'E-commerce & Pricing',
  'Local SEO',
  'Brand & Reputation',
  'Top Pages',
  'Threat & Opportunity',
] as const;


export const COMPARISON_ROWS: ComparisonRowDef[] = [
  // ═══════════════════════════════════════════
  //  BUSINESS PROFILE (7 rows)
  // ═══════════════════════════════════════════
  { id: 'bi-domain', category: 'Business Profile', label: 'Domain', profileKey: 'domain', format: 'url', source: 'crawl' },
  { id: 'bi-name', category: 'Business Profile', label: 'Business Name', profileKey: 'businessName', format: 'text', source: 'ai' },
  { id: 'bi-age', category: 'Business Profile', label: 'Domain Age (years)', profileKey: 'domainAge', format: 'number', source: 'manual', tooltip: 'WHOIS data — enter manually or import' },
  { id: 'bi-value-prop', category: 'Business Profile', label: 'Value Proposition', profileKey: 'valueProposition', format: 'manual_text', source: 'ai', isManualEntry: true },
  { id: 'bi-employees', category: 'Business Profile', label: 'Employee Estimate', profileKey: 'employeeCountEstimate', format: 'text', source: 'ai' },
  { id: 'bi-cms', category: 'Business Profile', label: 'CMS Platform', profileKey: 'cmsType', format: 'text', source: 'crawl' },
  { id: 'bi-pricing', category: 'Business Profile', label: 'Pricing Model', profileKey: 'pricingModel', format: 'text', source: 'crawl' },

  // ═══════════════════════════════════════════
  //  SEARCH VISIBILITY (14 rows)
  // ═══════════════════════════════════════════
  { id: 'sv-organic-traffic', category: 'Search Visibility', label: 'Estimated Organic Traffic', profileKey: 'estimatedOrganicTraffic', format: 'number', source: 'gsc' },
  { id: 'sv-traffic-trend', category: 'Search Visibility', label: 'Traffic Trend (30d %)', profileKey: 'trafficTrend30d', format: 'number', source: 'gsc', tooltip: 'Positive = growing, negative = declining' },
  { id: 'sv-total-kw', category: 'Search Visibility', label: 'Total Ranking Keywords', profileKey: 'totalRankingKeywords', format: 'number', source: 'gsc' },
  { id: 'sv-kw-top3', category: 'Search Visibility', label: 'Keywords in Top 3', profileKey: 'keywordsInTop3', format: 'number', source: 'gsc' },
  { id: 'sv-kw-top10', category: 'Search Visibility', label: 'Keywords in Top 10', profileKey: 'keywordsInTop10', format: 'number', source: 'gsc' },
  { id: 'sv-kw-top20', category: 'Search Visibility', label: 'Keywords in Top 20', profileKey: 'keywordsInTop20', format: 'number', source: 'gsc' },
  { id: 'sv-avg-pos', category: 'Search Visibility', label: 'Avg Organic Position', profileKey: 'avgOrganicPosition', format: 'number', source: 'gsc' },
  { id: 'sv-branded-pct', category: 'Search Visibility', label: 'Branded Traffic %', profileKey: 'brandedTrafficPct', format: 'number', source: 'gsc', tooltip: 'Percentage of clicks from branded queries' },
  { id: 'sv-branded-vol', category: 'Search Visibility', label: 'Branded Search Volume', profileKey: 'brandedSearchVolume', format: 'number', source: 'manual' },
  { id: 'sv-sov', category: 'Search Visibility', label: 'Share of Voice', profileKey: 'shareOfVoice', format: 'score_100', source: 'gsc', tooltip: '% of shared keywords where you outrank this competitor' },
  { id: 'sv-keyword-overlap', category: 'Search Visibility', label: 'Keyword Overlap %', profileKey: 'keywordOverlapPct', format: 'number', source: 'gsc' },
  { id: 'sv-serp-features', category: 'Search Visibility', label: 'SERP Features Owned', profileKey: 'serpFeatureCount', format: 'number', source: 'gsc' },
  { id: 'sv-snippets', category: 'Search Visibility', label: 'Featured Snippets', profileKey: 'featuredSnippetCount', format: 'number', source: 'gsc' },
  { id: 'sv-knowledge-panel', category: 'Search Visibility', label: 'Has Knowledge Panel?', profileKey: 'hasKnowledgePanel', format: 'boolean', source: 'manual' },

  // ═══════════════════════════════════════════
  //  CONTENT (18 rows — merged & cleaned)
  // ═══════════════════════════════════════════
  { id: 'ct-total-pages', category: 'Content', label: 'Total Indexable Pages', profileKey: 'totalIndexablePages', format: 'number', source: 'crawl' },
  { id: 'ct-avg-words', category: 'Content', label: 'Avg Words Per Page', profileKey: 'avgContentLength', format: 'number', source: 'crawl' },
  { id: 'ct-content-types', category: 'Content', label: 'Content Type Breakdown', profileKey: 'contentTypeBreakdown', format: 'text', source: 'crawl', tooltip: 'e.g. Blog 45%, Product 30%, Landing 25%' },
  { id: 'ct-blog-active', category: 'Content', label: 'Actively Blogging?', profileKey: 'isActivelyBlogging', format: 'boolean', source: 'crawl' },
  { id: 'ct-posts-month', category: 'Content', label: 'Blog Posts Per Month', profileKey: 'blogPostsPerMonth', format: 'number', source: 'crawl' },
  { id: 'ct-quality', category: 'Content', label: 'Content Quality', profileKey: 'contentQualityAssessment', format: 'text', source: 'ai' },
  { id: 'ct-freshness', category: 'Content', label: 'Content Freshness Score', profileKey: 'contentFreshnessScore', format: 'score_100', source: 'crawl', tooltip: '% of pages updated in last 6 months' },
  { id: 'ct-velocity-trend', category: 'Content', label: 'Publishing Velocity Trend %', profileKey: 'contentVelocityTrend', format: 'number', source: 'crawl', tooltip: 'Positive = accelerating, negative = slowing' },
  { id: 'ct-topics', category: 'Content', label: 'Topic Clusters', profileKey: 'topicCoverageBreadth', format: 'number', source: 'ai', tooltip: 'Number of unique topic clusters' },
  { id: 'ct-efficiency', category: 'Content', label: 'Content Efficiency', profileKey: 'contentEfficiency', format: 'number', source: 'gsc', tooltip: 'Organic traffic ÷ indexable pages' },
  { id: 'ct-duplicate-pct', category: 'Content', label: 'Duplicate Content %', profileKey: 'duplicateContentPct', format: 'number', source: 'crawl' },
  { id: 'ct-thin-pct', category: 'Content', label: 'Thin Content %', profileKey: 'thinContentPct', format: 'number', source: 'crawl', tooltip: 'Pages with < 300 words' },
  { id: 'ct-schema-pct', category: 'Content', label: 'Schema Coverage %', profileKey: 'schemaCoveragePct', format: 'number', source: 'crawl' },
  { id: 'ct-faq-count', category: 'Content', label: 'FAQ / How-To Pages', profileKey: 'faqHowToCount', format: 'number', source: 'crawl' },
  { id: 'ct-avg-images', category: 'Content', label: 'Avg Images Per Article', profileKey: 'avgImagesPerArticle', format: 'number', source: 'crawl' },
  { id: 'ct-embeds-video', category: 'Content', label: 'Uses Video in Articles?', profileKey: 'embedsVideoInArticles', format: 'boolean', source: 'crawl' },
  { id: 'ct-avg-internal-links', category: 'Content', label: 'Avg Internal Links Per Page', profileKey: 'avgInternalLinksPerPage', format: 'number', source: 'crawl' },
  { id: 'ct-nav-items', category: 'Content', label: 'Top Nav Items', profileKey: 'topNavItemCount', format: 'number', source: 'crawl', tooltip: 'Number of main navigation links' },

  // ═══════════════════════════════════════════
  //  AUTHORITY & LINKS (8 rows — cleaned)
  // ═══════════════════════════════════════════
  { id: 'al-seo-score', category: 'Authority & Links', label: 'Overall SEO Score', profileKey: 'overallSeoScore', format: 'score_100', source: 'crawl' },
  { id: 'al-da', category: 'Authority & Links', label: 'Domain Authority', profileKey: 'domainAuthority', format: 'score_100', source: 'backlinks' },
  { id: 'al-ur', category: 'Authority & Links', label: 'URL Rating', profileKey: 'urlRating', format: 'score_100', source: 'backlinks' },
  { id: 'al-rd', category: 'Authority & Links', label: 'Referring Domains', profileKey: 'referringDomains', format: 'number', source: 'backlinks' },
  { id: 'al-velocity', category: 'Authority & Links', label: 'Link Velocity (60d)', profileKey: 'linkVelocity60d', format: 'number', source: 'backlinks', tooltip: 'New referring domains in last 60 days (excl. sitewide)' },
  { id: 'al-quality', category: 'Authority & Links', label: 'Backlink Quality Score', profileKey: 'backlinkQualityScore', format: 'score_100', source: 'backlinks' },
  { id: 'al-common', category: 'Authority & Links', label: 'Common Linking Domains', profileKey: 'commonBacklinkDomains', format: 'number', source: 'backlinks', tooltip: 'Domains linking to multiple competitors' },
  { id: 'al-avg-rd-content', category: 'Authority & Links', label: 'Avg RD to Content Pages', profileKey: 'avgRefDomainsToContentPages', format: 'number', source: 'backlinks' },

  // ═══════════════════════════════════════════
  //  TECHNICAL HEALTH (9 rows — cleaned)
  // ═══════════════════════════════════════════
  { id: 'th-score', category: 'Technical Health', label: 'Tech Health Score', profileKey: 'techHealthScore', format: 'score_100', source: 'crawl' },
  { id: 'th-speed', category: 'Technical Health', label: 'Site Speed Score', profileKey: 'siteSpeedScore', format: 'score_100', source: 'crawl' },
  { id: 'th-cwv', category: 'Technical Health', label: 'Core Web Vitals Pass %', profileKey: 'cwvPassRate', format: 'number', source: 'crawl' },
  { id: 'th-mobile', category: 'Technical Health', label: 'Mobile Friendliness', profileKey: 'mobileFriendlinessScore', format: 'score_100', source: 'crawl' },
  { id: 'th-crawlability', category: 'Technical Health', label: 'Crawlability Score', profileKey: 'crawlabilityScore', format: 'score_100', source: 'crawl' },
  { id: 'th-security', category: 'Technical Health', label: 'Security Grade', profileKey: 'securityGrade', format: 'text', source: 'crawl' },
  { id: 'th-js-dep', category: 'Technical Health', label: 'JS Render Dependency %', profileKey: 'jsRenderDependencyPct', format: 'number', source: 'crawl', tooltip: '% of pages where critical content requires JS' },
  { id: 'th-cdn', category: 'Technical Health', label: 'CDN Provider', profileKey: 'cdnProvider', format: 'text', source: 'crawl' },
  { id: 'th-tech-stack', category: 'Technical Health', label: 'Tech Stack', profileKey: 'techStackSignals', format: 'list', source: 'crawl' },

  // ═══════════════════════════════════════════
  //  AI DISCOVERABILITY (6 rows — unchanged)
  // ═══════════════════════════════════════════
  { id: 'ai-geo', category: 'AI Discoverability', label: 'Avg GEO Score', profileKey: 'avgGeoScore', format: 'score_100', source: 'ai' },
  { id: 'ai-citation', category: 'AI Discoverability', label: 'Avg Citation Worthiness', profileKey: 'avgCitationWorthiness', format: 'score_100', source: 'ai' },
  { id: 'ai-llms-txt', category: 'AI Discoverability', label: 'llms.txt Present?', profileKey: 'hasLlmsTxt', format: 'boolean', source: 'crawl' },
  { id: 'ai-bot-policy', category: 'AI Discoverability', label: 'AI Bot Access Policy', profileKey: 'aiBotAccessPolicy', format: 'text', source: 'crawl', tooltip: 'open / partial / blocked' },
  { id: 'ai-passage-pct', category: 'AI Discoverability', label: 'Passage-Ready Content %', profileKey: 'passageReadyPct', format: 'number', source: 'crawl' },
  { id: 'ai-snippet-pct', category: 'AI Discoverability', label: 'Featured Snippet Ready %', profileKey: 'featuredSnippetReadyPct', format: 'number', source: 'crawl' },

  // ═══════════════════════════════════════════
  //  USER EXPERIENCE & CONVERSION (10 rows)
  // ═══════════════════════════════════════════
  { id: 'ux-bounce', category: 'User Experience & Conversion', label: 'Avg Bounce Rate %', profileKey: 'avgBounceRate', format: 'number', source: 'ga4' },
  { id: 'ux-session', category: 'User Experience & Conversion', label: 'Avg Session Duration (s)', profileKey: 'avgSessionDuration', format: 'number', source: 'ga4' },
  { id: 'ux-conv-paths', category: 'User Experience & Conversion', label: 'Conversion Paths', profileKey: 'conversionPathCount', format: 'number', source: 'crawl' },
  { id: 'ux-cta', category: 'User Experience & Conversion', label: 'CTA Density Score', profileKey: 'ctaDensityScore', format: 'score_100', source: 'crawl' },
  { id: 'ux-trust', category: 'User Experience & Conversion', label: 'Trust Signal Score', profileKey: 'trustSignalScore', format: 'score_100', source: 'crawl' },
  { id: 'ux-optin', category: 'User Experience & Conversion', label: 'Email Opt-In Quality', profileKey: 'emailOptInQuality', format: 'text', source: 'crawl' },
  { id: 'ux-optin-offer', category: 'User Experience & Conversion', label: 'Opt-In Offer', profileKey: 'optInOffer', format: 'text', source: 'ai' },
  { id: 'ux-live-chat', category: 'User Experience & Conversion', label: 'Live Chat / Chatbot?', profileKey: 'hasLiveChat', format: 'boolean', source: 'crawl' },
  { id: 'ux-free-trial', category: 'User Experience & Conversion', label: 'Free Trial / Freemium?', profileKey: 'hasFreeTrial', format: 'boolean', source: 'crawl' },
  { id: 'ux-seo-quality', category: 'User Experience & Conversion', label: 'On-Page SEO Quality', profileKey: 'onPageSeoQuality', format: 'text', source: 'crawl' },

  // ═══════════════════════════════════════════
  //  SOCIAL MEDIA (22 rows — added LinkedIn + TikTok)
  // ═══════════════════════════════════════════
  { id: 'social-total', category: 'Social Media', label: 'Total Followers', profileKey: 'socialTotalFollowers', format: 'number', source: 'social_api' },
  { id: 'social-growth', category: 'Social Media', label: 'Social Growth Rate %', profileKey: 'socialGrowthRate', format: 'number', source: 'social_api' },
  // Facebook
  { id: 'fb-url', category: 'Social Media', label: 'Facebook URL', profileKey: 'facebookUrl', format: 'url', source: 'social_api' },
  { id: 'fb-fans', category: 'Social Media', label: 'Facebook Fans', profileKey: 'facebookFans', format: 'number', source: 'social_api' },
  { id: 'fb-posts', category: 'Social Media', label: 'Facebook Posts/Mo', profileKey: 'facebookUpdatesPerMonth', format: 'number', source: 'social_api' },
  { id: 'fb-engagement', category: 'Social Media', label: 'Facebook Engagement', profileKey: 'facebookEngagementLevel', format: 'text', source: 'social_api' },
  // X / Twitter
  { id: 'tw-url', category: 'Social Media', label: 'X (Twitter) URL', profileKey: 'twitterUrl', format: 'url', source: 'social_api' },
  { id: 'tw-followers', category: 'Social Media', label: 'X Followers', profileKey: 'twitterFollowers', format: 'number', source: 'social_api' },
  { id: 'tw-posts', category: 'Social Media', label: 'X Posts/Mo', profileKey: 'twitterUpdatesPerMonth', format: 'number', source: 'social_api' },
  // Instagram
  { id: 'ig-url', category: 'Social Media', label: 'Instagram URL', profileKey: 'instagramUrl', format: 'url', source: 'social_api' },
  { id: 'ig-followers', category: 'Social Media', label: 'Instagram Followers', profileKey: 'instagramFollowers', format: 'number', source: 'social_api' },
  { id: 'ig-likes', category: 'Social Media', label: 'Instagram Avg Likes', profileKey: 'instagramAvgImageLikes', format: 'number', source: 'social_api' },
  // YouTube
  { id: 'yt-url', category: 'Social Media', label: 'YouTube URL', profileKey: 'youtubeUrl', format: 'url', source: 'social_api' },
  { id: 'yt-subs', category: 'Social Media', label: 'YouTube Subscribers', profileKey: 'youtubeSubscribers', format: 'number', source: 'social_api' },
  { id: 'yt-videos', category: 'Social Media', label: 'YouTube Videos', profileKey: 'youtubeVideoCount', format: 'number', source: 'social_api' },
  { id: 'yt-posts', category: 'Social Media', label: 'YouTube Uploads/Mo', profileKey: 'youtubeUpdatesPerMonth', format: 'number', source: 'social_api' },
  // LinkedIn (NEW)
  { id: 'li-url', category: 'Social Media', label: 'LinkedIn URL', profileKey: 'linkedinUrl', format: 'url', source: 'social_api' },
  { id: 'li-followers', category: 'Social Media', label: 'LinkedIn Followers', profileKey: 'linkedinFollowers', format: 'number', source: 'social_api' },
  // TikTok (NEW)
  { id: 'tt-url', category: 'Social Media', label: 'TikTok URL', profileKey: 'tiktokUrl', format: 'url', source: 'social_api' },
  { id: 'tt-followers', category: 'Social Media', label: 'TikTok Followers', profileKey: 'tiktokFollowers', format: 'number', source: 'social_api' },

  // ═══════════════════════════════════════════
  //  PAID & ADVERTISING (3 rows — unchanged)
  // ═══════════════════════════════════════════
  { id: 'paid-traffic', category: 'Paid & Advertising', label: 'Ads Traffic', profileKey: 'adsTraffic', format: 'number', source: 'manual' },
  { id: 'paid-cost', category: 'Paid & Advertising', label: 'Ads Traffic Cost', profileKey: 'adsTrafficCost', format: 'currency', source: 'manual' },
  { id: 'paid-ads', category: 'Paid & Advertising', label: 'Display Ads Count', profileKey: 'displayAdsCount', format: 'number', source: 'manual' },

  // ═══════════════════════════════════════════
  //  E-COMMERCE & PRICING (5 rows)
  // ═══════════════════════════════════════════
  { id: 'ec-same-products', category: 'E-commerce & Pricing', label: 'Same Products/Services?', profileKey: 'offersSameProducts', format: 'manual_boolean', source: 'manual', isManualEntry: true },
  { id: 'ec-pricing', category: 'E-commerce & Pricing', label: 'Pricing Comparison', profileKey: 'pricingComparison', format: 'manual_text', source: 'manual', isManualEntry: true },
  { id: 'ec-shipping', category: 'E-commerce & Pricing', label: 'Shipping Offers', profileKey: 'shippingOffers', format: 'manual_text', source: 'manual', isManualEntry: true },
  { id: 'ec-product-words', category: 'E-commerce & Pricing', label: 'Product Page Avg Words', profileKey: 'productPageAvgWordCount', format: 'number', source: 'crawl' },
  { id: 'ec-product-schema', category: 'E-commerce & Pricing', label: 'Schema on Products?', profileKey: 'hasSchemaOnProducts', format: 'boolean', source: 'crawl' },

  // ═══════════════════════════════════════════
  //  LOCAL SEO (6 rows — unchanged)
  // ═══════════════════════════════════════════
  { id: 'loc-rank', category: 'Local SEO', label: 'Local Keyword Ranking', profileKey: 'localKeywordRanking', format: 'number', source: 'manual' },
  { id: 'loc-reviews', category: 'Local SEO', label: 'Number of Reviews', profileKey: 'reviewCount', format: 'number', source: 'manual' },
  { id: 'loc-images', category: 'Local SEO', label: 'GMB Images', profileKey: 'imageCount', format: 'number', source: 'manual' },
  { id: 'loc-press', category: 'Local SEO', label: 'Local Press Coverage?', profileKey: 'localPressCoverage', format: 'manual_boolean', source: 'manual', isManualEntry: true },
  { id: 'loc-citations', category: 'Local SEO', label: 'Quality Citations?', profileKey: 'qualityCitationsPresent', format: 'manual_boolean', source: 'manual', isManualEntry: true },
  { id: 'loc-pages', category: 'Local SEO', label: 'Optimized Local Pages?', profileKey: 'hasOptimizedLocalPages', format: 'boolean', source: 'crawl' },

  // ═══════════════════════════════════════════
  //  BRAND & REPUTATION (3 rows — NEW)
  // ═══════════════════════════════════════════
  { id: 'br-review-score', category: 'Brand & Reputation', label: 'Avg Review Score (1-5)', profileKey: 'reviewScoreAvg', format: 'number', source: 'manual' },
  { id: 'br-brand-mentions', category: 'Brand & Reputation', label: 'Unlinked Brand Mentions', profileKey: 'brandMentionCount', format: 'number', source: 'ai' },
  { id: 'br-landing-pages', category: 'Brand & Reputation', label: 'Targeted Landing Pages?', profileKey: 'hasTargetedLandingPages', format: 'boolean', source: 'crawl' },

  // ═══════════════════════════════════════════
  //  TOP PAGES (9 rows — moved from Authority)
  // ═══════════════════════════════════════════
  { id: 'tp-organic-1', category: 'Top Pages', label: 'Top Organic Page #1', profileKey: 'topOrganicPages.0.url', format: 'url', source: 'gsc' },
  { id: 'tp-organic-2', category: 'Top Pages', label: 'Top Organic Page #2', profileKey: 'topOrganicPages.1.url', format: 'url', source: 'gsc' },
  { id: 'tp-organic-3', category: 'Top Pages', label: 'Top Organic Page #3', profileKey: 'topOrganicPages.2.url', format: 'url', source: 'gsc' },
  { id: 'tp-blog-1', category: 'Top Pages', label: 'Top Blog Page #1', profileKey: 'topBlogPages.0.url', format: 'url', source: 'crawl' },
  { id: 'tp-blog-2', category: 'Top Pages', label: 'Top Blog Page #2', profileKey: 'topBlogPages.1.url', format: 'url', source: 'crawl' },
  { id: 'tp-blog-3', category: 'Top Pages', label: 'Top Blog Page #3', profileKey: 'topBlogPages.2.url', format: 'url', source: 'crawl' },
  { id: 'tp-ecom-1', category: 'Top Pages', label: 'Top Product Page #1', profileKey: 'topEcomPages.0.url', format: 'url', source: 'crawl' },
  { id: 'tp-ecom-2', category: 'Top Pages', label: 'Top Product Page #2', profileKey: 'topEcomPages.1.url', format: 'url', source: 'crawl' },
  { id: 'tp-ecom-3', category: 'Top Pages', label: 'Top Product Page #3', profileKey: 'topEcomPages.2.url', format: 'url', source: 'crawl' },

  // ═══════════════════════════════════════════
  //  THREAT & OPPORTUNITY (5 rows — unchanged)
  // ═══════════════════════════════════════════
  { id: 'to-threat-level', category: 'Threat & Opportunity', label: 'Overall Threat Level', profileKey: 'threatLevel', format: 'text', source: 'ai' },
  { id: 'to-content-threat', category: 'Threat & Opportunity', label: 'Content Threat Score', profileKey: 'contentThreatScore', format: 'score_100', source: 'ai' },
  { id: 'to-authority-threat', category: 'Threat & Opportunity', label: 'Authority Threat Score', profileKey: 'authorityThreatScore', format: 'score_100', source: 'ai' },
  { id: 'to-innovation-threat', category: 'Threat & Opportunity', label: 'Innovation Threat Score', profileKey: 'innovationThreatScore', format: 'score_100', source: 'ai' },
  { id: 'to-opportunity', category: 'Threat & Opportunity', label: 'Opportunity Score', profileKey: 'opportunityAgainstThem', format: 'score_100', source: 'ai' },
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
    backlinkQualityScore: null,
    commonBacklinkDomains: null,
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
    linkedinUrl: null,
    linkedinFollowers: null,
    tiktokUrl: null,
    tiktokFollowers: null,
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
    featuredSnippetCount: null,
    hasKnowledgePanel: null,

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
    contentTypeBreakdown: null,
    avgInternalLinksPerPage: null,
    topNavItemCount: null,

    // Technical Health
    techHealthScore: null,
    cwvPassRate: null,
    mobileFriendlinessScore: null,
    securityGrade: null,
    crawlabilityScore: null,
    siteSpeedScore: null,
    jsRenderDependencyPct: null,
    cdnProvider: null,

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
    hasLiveChat: null,
    hasFreeTrial: null,
    pricingModel: null,

    // Brand & Reputation
    reviewScoreAvg: null,
    brandMentionCount: null,

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
      source: 'micro-crawl',
    },
  };
}
