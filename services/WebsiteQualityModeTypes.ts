import type { DetectedIndustry } from './SiteTypeDetector';

// Changed: was 'grid' | 'dashboard' | 'priorities'
// 'dashboard' → 'overview', 'priorities' → 'actions', added 'structure'
export type WqaViewMode = 'grid' | 'overview' | 'actions' | 'structure';

export interface WqaSiteStats {
  totalPages: number;
  indexedPages: number;
  sitemapPages: number;
  htmlPages: number;

  totalImpressions: number;
  totalClicks: number;
  totalSessions: number;
  avgPosition: number;
  avgCtr: number; // NEW: site-wide average CTR

  totalRevenue: number;
  totalTransactions: number;
  totalGoalCompletions: number;
  totalPageviews: number;
  totalSubscribers: number;

  duplicateRate: number;
  orphanRate: number;
  thinContentRate: number;
  brokenRate: number;
  schemaCoverage: number;
  sitemapCoverage: number;

  avgHealthScore: number;
  avgContentQuality: number;
  avgSpeedScore: number;
  avgEeat: number;

  radarContent: number;
  radarSeo: number;
  radarAuthority: number;
  radarUx: number;
  radarSearchPerf: number;
  radarTrust: number;

  highValuePages: number;
  mediumValuePages: number;
  lowValuePages: number;
  zeroValuePages: number;

  pagesWithTechAction: number;
  pagesWithContentAction: number;
  pagesNoAction: number;
  totalEstimatedImpact: number;

  // NEW stats
  pagesLosingTraffic: number;       // pages with isLosingTraffic === true
  pagesWithZeroImpressions: number; // indexable HTML pages with 0 GSC impressions
  orphanPagesWithValue: number;     // inlinks=0 pages that have impressions>50 or sessions>20
  cannibalizationCount: number;     // pages flagged as isCannibalized
  pagesInStrikingDistance: number;  // position 4–20 with impressions > 100
  pagesGoodSpeed: number;           // pages with speedScore === 'Good'
  pagesByCategory: Record<string, number>; // count per pageCategory string

  newsSitemapCoverage: number;      // NEW
  decayRiskCount: number;           // NEW

  industryStats: WqaIndustryStats | null;
}

export interface WqaIndustryStats {
  // E-commerce
  productSchemaCoverage?: number;
  reviewSchemaCoverage?: number;
  breadcrumbCoverage?: number;
  outOfStockIndexed?: number;
  avgCheckoutDepth?: number;

  // News / Blog
  articleSchemaCoverage?: number;
  authorAttributionRate?: number;
  publishDateRate?: number;
  publishingFrequency?: number;
  hasNewsSitemap?: boolean;
  newsSitemapCoverage?: number;
  hasRssFeed?: boolean;

  // Local
  hasLocalSchema?: boolean;
  napConsistent?: boolean;
  hasGmbLink?: boolean;
  serviceAreaPageCount?: number;
  hasEmbeddedMap?: boolean;

  // SaaS
  hasPricingPage?: boolean;
  hasDocsSection?: boolean;
  hasChangelog?: boolean;
  hasStatusPage?: boolean;
  hasComparisonPages?: boolean;

  // Healthcare
  medicalAuthorRate?: number;
  medicalReviewRate?: number;
  medicalDisclaimerRate?: number;

  // Finance
  financialDisclaimerRate?: number;
  authorCredentialsRate?: number;

  // Real estate (NEW)
  listingCount?: number;
  priceMarkupCoverage?: number;

  // Restaurant (NEW)
  hasMenuSchema?: boolean;
  hasReservationLink?: boolean;
}

export interface WqaActionGroup {
  action: string;
  category: 'technical' | 'content' | 'industry';
  pageCount: number;
  totalEstimatedImpact: number;
  avgPriority: number;
  reason: string;
  effort: 'low' | 'medium' | 'high';
  pages: Array<{
    url: string;
    pagePath: string;
    pageCategory: string;
    impressions: number;
    clicks: number;
    sessions: number;
    position: number;
    ctr: number;
    estimatedImpact: number;
    currentTitle?: string;
    currentMeta?: string;
    previousSessions?: number;
    sessionsDelta?: number;
    lastModified?: string;
    backlinks?: number;
    suggestedRedirect?: string;
  }>;
}

export interface WebsiteQualityState {
  isActive: boolean;
  viewMode: WqaViewMode;

  detectedIndustry: DetectedIndustry;
  industryConfidence: number;
  detectedIndustries: Array<{ industry: DetectedIndustry; confidence: number }>;   // NEW
  secondaryIndustry: DetectedIndustry | null;                                      // NEW
  isLowIndustryConfidence: boolean;                                                // NEW
  detectedLanguage: string;
  detectedLanguages: Array<{ code: string; percentage: number }>;
  detectedCms: string | null;
  isMultiLanguage: boolean;

  industryOverride: DetectedIndustry | null;
  languageOverride: string | null;

  siteStats: WqaSiteStats | null;
  actionGroups: WqaActionGroup[];

  siteGrade: string;
  siteScore: number;
  scoreDelta: number;
}

export const DEFAULT_WQA_STATE: WebsiteQualityState = {
  isActive: false,
  viewMode: 'grid',
  detectedIndustry: 'general',
  industryConfidence: 0,
  detectedIndustries: [],
  secondaryIndustry: null,
  isLowIndustryConfidence: false,
  detectedLanguage: 'unknown',
  detectedLanguages: [],
  detectedCms: null,
  isMultiLanguage: false,
  industryOverride: null,
  languageOverride: null,
  siteStats: null,
  actionGroups: [],
  siteGrade: 'N/A',
  siteScore: 0,
  scoreDelta: 0,
};

export function getEffectiveIndustry(state: WebsiteQualityState): DetectedIndustry {
  return state.industryOverride ?? state.detectedIndustry;
}

export function getEffectiveLanguage(state: WebsiteQualityState): string {
  return state.languageOverride ?? state.detectedLanguage;
}

export function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  if (score >= 45) return 'D';
  if (score >= 40) return 'D-';
  return 'F';
}

export function getConversionLabel(industry: DetectedIndustry): string {
  switch (industry) {
    case 'ecommerce': return 'Revenue';
    case 'news':
    case 'blog': return 'Pageviews';
    case 'local': return 'Leads';
    case 'saas': return 'Signups';
    case 'education': return 'Enrollments';
    default: return 'Conversions';
  }
}

export function getConversionValue(page: any, industry: DetectedIndustry): number {
  switch (industry) {
    case 'ecommerce': return Number(page.ga4Revenue || page.ga4EcommerceRevenue || 0);
    case 'news':
    case 'blog': return Number(page.ga4Views || 0);
    case 'local': return Number(page.ga4GoalCompletions || page.ga4Conversions || 0);
    case 'saas': return Number(page.ga4Conversions || 0);
    default: return Number(page.ga4Conversions || 0);
  }
}
