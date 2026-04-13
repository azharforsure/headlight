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

  // ─── Social: Instagram ───
  instagramUrl: string | null;
  instagramFollowers: number | null;
  instagramAvgImageLikes: number | null;
  instagramAvgVideoViews: number | null;

  // ─── CMS & Tech ───
  cmsType: string | null;
  techStackSignals: string[];  // detected frameworks/libs

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
  'Business Intelligence',
  'Content Strategy',
  'Top Content Pages',
  'On-Page SEO',
  'E-commerce',
  'Lead Generation',
  'Local SEO',
  'Paid / Advertising',
  'Authority & Links',
  'Facebook',
  'Twitter / X',
  'YouTube',
  'Instagram',
  'Tech Stack'
] as const;

export const COMPARISON_ROWS: ComparisonRowDef[] = [
  // Business Intelligence
  { id: 'bi-domain', category: 'Business Intelligence', label: 'Domain URL', profileKey: 'domain', format: 'url', source: 'crawl' },
  { id: 'bi-name', category: 'Business Intelligence', label: 'Business Name', profileKey: 'businessName', format: 'text', source: 'ai' },
  { id: 'bi-age', category: 'Business Intelligence', label: 'Domain Age (years)', profileKey: 'domainAge', format: 'number', source: 'manual', tooltip: 'WHOIS data — enter manually or import' },
  { id: 'bi-value-prop', category: 'Business Intelligence', label: 'Value Proposition', profileKey: 'valueProposition', format: 'manual_text', source: 'ai', isManualEntry: true },
  { id: 'bi-employees', category: 'Business Intelligence', label: 'Employee Count Estimate', profileKey: 'employeeCountEstimate', format: 'text', source: 'ai' },

  // Content Strategy
  { id: 'cs-blog-url', category: 'Content Strategy', label: 'Blog URL', profileKey: 'blogUrl', format: 'url', source: 'crawl' },
  { id: 'cs-blog-active', category: 'Content Strategy', label: 'Actively Creating Blog Content?', profileKey: 'isActivelyBlogging', format: 'boolean', source: 'crawl' },
  { id: 'cs-quality', category: 'Content Strategy', label: 'Overall Content Quality', profileKey: 'contentQualityAssessment', format: 'text', source: 'ai' },
  { id: 'cs-posts-month', category: 'Content Strategy', label: 'Blog Posts Per Month (Past Year)', profileKey: 'blogPostsPerMonth', format: 'number', source: 'crawl' },
  { id: 'cs-avg-images', category: 'Content Strategy', label: 'Avg Images Per Article', profileKey: 'avgImagesPerArticle', format: 'number', source: 'crawl' },
  { id: 'cs-embed-video', category: 'Content Strategy', label: 'Embedding Video in Articles?', profileKey: 'embedsVideoInArticles', format: 'boolean', source: 'crawl' },
  { id: 'cs-avg-words', category: 'Content Strategy', label: 'Avg Words Per Article', profileKey: 'avgWordsPerArticle', format: 'number', source: 'crawl' },
  { id: 'cs-top-type', category: 'Content Strategy', label: 'Top Content Type by Shares', profileKey: 'topContentTypeByShares', format: 'text', source: 'manual' },
  { id: 'cs-avg-backlinks', category: 'Content Strategy', label: 'Avg Referring Domains to Content Pages', profileKey: 'avgRefDomainsToContentPages', format: 'number', source: 'backlinks' },

  // Top Content Pages
  { id: 'tp-blog-1', category: 'Top Content Pages', label: 'Top Blog Page #1', profileKey: 'topBlogPages.0.url', format: 'url', source: 'crawl' },
  { id: 'tp-blog-2', category: 'Top Content Pages', label: 'Top Blog Page #2', profileKey: 'topBlogPages.1.url', format: 'url', source: 'crawl' },
  { id: 'tp-blog-3', category: 'Top Content Pages', label: 'Top Blog Page #3', profileKey: 'topBlogPages.2.url', format: 'url', source: 'crawl' },
  { id: 'tp-ecom-1', category: 'Top Content Pages', label: 'Top Ecom Page #1 (excl. homepage)', profileKey: 'topEcomPages.0.url', format: 'url', source: 'crawl' },
  { id: 'tp-ecom-2', category: 'Top Content Pages', label: 'Top Ecom Page #2 (excl. homepage)', profileKey: 'topEcomPages.1.url', format: 'url', source: 'crawl' },
  { id: 'tp-ecom-3', category: 'Top Content Pages', label: 'Top Ecom Page #3 (excl. homepage)', profileKey: 'topEcomPages.2.url', format: 'url', source: 'crawl' },
  { id: 'tp-shares-1', category: 'Top Content Pages', label: 'Shares Top Content #1', profileKey: 'topContentShareCounts.0.shares', format: 'number', source: 'manual' },
  { id: 'tp-shares-2', category: 'Top Content Pages', label: 'Shares Top Content #2', profileKey: 'topContentShareCounts.1.shares', format: 'number', source: 'manual' },
  { id: 'tp-shares-3', category: 'Top Content Pages', label: 'Shares Top Content #3', profileKey: 'topContentShareCounts.2.shares', format: 'number', source: 'manual' },

  // On-Page SEO
  { id: 'seo-avg-words', category: 'On-Page SEO', label: 'Product Page Avg Word Count', profileKey: 'productPageAvgWordCount', format: 'number', source: 'crawl' },
  { id: 'seo-quality', category: 'On-Page SEO', label: 'On-Page SEO Quality (H-tags, links, images)', profileKey: 'onPageSeoQuality', format: 'text', source: 'crawl' },
  { id: 'seo-schema', category: 'On-Page SEO', label: 'Schema on Product Pages?', profileKey: 'hasSchemaOnProducts', format: 'boolean', source: 'crawl' },
  { id: 'seo-lp', category: 'On-Page SEO', label: 'Targeted Landing Pages for Keywords?', profileKey: 'hasTargetedLandingPages', format: 'boolean', source: 'crawl' },

  // E-commerce
  { id: 'ec-same-products', category: 'E-commerce', label: 'Same Products/Services?', profileKey: 'offersSameProducts', format: 'manual_boolean', source: 'manual', isManualEntry: true },
  { id: 'ec-pricing', category: 'E-commerce', label: 'Pricing Comparison', profileKey: 'pricingComparison', format: 'manual_text', source: 'manual', isManualEntry: true },
  { id: 'ec-shipping', category: 'E-commerce', label: 'Shipping Offers', profileKey: 'shippingOffers', format: 'manual_text', source: 'manual', isManualEntry: true },

  // Lead Generation
  { id: 'lg-optin', category: 'Lead Generation', label: 'Email Opt-In on Site?', profileKey: 'hasEmailOptIn', format: 'boolean', source: 'crawl' },
  { id: 'lg-offer', category: 'Lead Generation', label: 'Opt-In Offer', profileKey: 'optInOffer', format: 'text', source: 'ai' },

  // Local SEO
  { id: 'loc-rank', category: 'Local SEO', label: 'Local Keyword Ranking', profileKey: 'localKeywordRanking', format: 'number', source: 'manual' },
  { id: 'loc-reviews', category: 'Local SEO', label: 'Number of Reviews', profileKey: 'reviewCount', format: 'number', source: 'manual' },
  { id: 'loc-images', category: 'Local SEO', label: 'Number of GMB Images', profileKey: 'imageCount', format: 'number', source: 'manual' },
  { id: 'loc-press', category: 'Local SEO', label: 'Local Press Coverage?', profileKey: 'localPressCoverage', format: 'manual_boolean', source: 'manual', isManualEntry: true },
  { id: 'loc-citations', category: 'Local SEO', label: 'Quality Citations Present?', profileKey: 'qualityCitationsPresent', format: 'manual_boolean', source: 'manual', isManualEntry: true },
  { id: 'loc-pages', category: 'Local SEO', label: 'Optimized Local Landing Pages?', profileKey: 'hasOptimizedLocalPages', format: 'boolean', source: 'crawl' },

  // Paid / Advertising
  { id: 'paid-traffic', category: 'Paid / Advertising', label: 'Ads Traffic', profileKey: 'adsTraffic', format: 'number', source: 'manual' },
  { id: 'paid-cost', category: 'Paid / Advertising', label: 'Ads Traffic Cost', profileKey: 'adsTrafficCost', format: 'currency', source: 'manual' },
  { id: 'paid-ads', category: 'Paid / Advertising', label: 'Display Ads Count', profileKey: 'displayAdsCount', format: 'number', source: 'manual' },

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
  { id: 'fb-url', category: 'Facebook', label: 'Facebook URL', profileKey: 'facebookUrl', format: 'url', source: 'social_api' },
  { id: 'fb-fans', category: 'Facebook', label: 'Facebook Fans', profileKey: 'facebookFans', format: 'number', source: 'social_api' },
  { id: 'fb-posts', category: 'Facebook', label: 'Facebook Updates Per Month', profileKey: 'facebookUpdatesPerMonth', format: 'number', source: 'social_api' },
  { id: 'fb-engagement', category: 'Facebook', label: 'Facebook Engagement Level', profileKey: 'facebookEngagementLevel', format: 'text', source: 'social_api' },
  { id: 'fb-video', category: 'Facebook', label: 'Facebook Creates Video?', profileKey: 'facebookCreatesVideo', format: 'boolean', source: 'social_api' },
  { id: 'fb-views', category: 'Facebook', label: 'Facebook Avg Video Views', profileKey: 'facebookAvgVideoViews', format: 'number', source: 'social_api' },

  // Twitter / X
  { id: 'tw-url', category: 'Twitter / X', label: 'Twitter URL', profileKey: 'twitterUrl', format: 'url', source: 'social_api' },
  { id: 'tw-followers', category: 'Twitter / X', label: 'Twitter Followers', profileKey: 'twitterFollowers', format: 'number', source: 'social_api' },
  { id: 'tw-posts', category: 'Twitter / X', label: 'Twitter Updates Per Month', profileKey: 'twitterUpdatesPerMonth', format: 'number', source: 'social_api' },

  // YouTube
  { id: 'yt-url', category: 'YouTube', label: 'YouTube URL', profileKey: 'youtubeUrl', format: 'url', source: 'social_api' },
  { id: 'yt-videos', category: 'YouTube', label: 'YouTube Video Count', profileKey: 'youtubeVideoCount', format: 'number', source: 'social_api' },
  { id: 'yt-subs', category: 'YouTube', label: 'YouTube Subscribers', profileKey: 'youtubeSubscribers', format: 'number', source: 'social_api' },
  { id: 'yt-views-100', category: 'YouTube', label: 'YouTube Videos Over 100 Views', profileKey: 'youtubeVideosOver100Views', format: 'number', source: 'social_api' },
  { id: 'yt-posts', category: 'YouTube', label: 'YouTube Updates Per Month', profileKey: 'youtubeUpdatesPerMonth', format: 'number', source: 'social_api' },

  // Instagram
  { id: 'ig-url', category: 'Instagram', label: 'Instagram URL', profileKey: 'instagramUrl', format: 'url', source: 'social_api' },
  { id: 'ig-followers', category: 'Instagram', label: 'Instagram Followers', profileKey: 'instagramFollowers', format: 'number', source: 'social_api' },
  { id: 'ig-likes', category: 'Instagram', label: 'Instagram Avg Image Likes', profileKey: 'instagramAvgImageLikes', format: 'number', source: 'social_api' },
  { id: 'ig-views', category: 'Instagram', label: 'Instagram Avg Video Views', profileKey: 'instagramAvgVideoViews', format: 'number', source: 'social_api' },

  // Tech Stack
  { id: 'tech-cms', category: 'Tech Stack', label: 'CMS Platform', profileKey: 'cmsType', format: 'text', source: 'crawl' },
  { id: 'tech-stack', category: 'Tech Stack', label: 'Tech Stack Signals', profileKey: 'techStackSignals', format: 'list', source: 'crawl' }
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
    instagramUrl: null,
    instagramFollowers: null,
    instagramAvgImageLikes: null,
    instagramAvgVideoViews: null,
    cmsType: null,
    techStackSignals: [],
    _meta: {
      crawledAt: null,
      aiAnalyzedAt: null,
      manualEditedAt: null,
      pagesCrawled: 0,
      source: 'micro-crawl'
    }
  };
}
