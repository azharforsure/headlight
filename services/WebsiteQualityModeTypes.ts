import type { DetectedIndustry } from './SiteTypeDetector';

export type WqaViewMode = 'grid' | 'dashboard' | 'priorities';

export interface WqaSiteStats {
  totalPages: number;
  indexedPages: number;
  sitemapPages: number;
  htmlPages: number;

  totalImpressions: number;
  totalClicks: number;
  totalSessions: number;
  avgPosition: number;

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

  industryStats: WqaIndustryStats | null;
}

export interface WqaIndustryStats {
  productSchemaCoverage?: number;
  reviewSchemaCoverage?: number;
  breadcrumbCoverage?: number;
  outOfStockIndexed?: number;
  avgCheckoutDepth?: number;

  articleSchemaCoverage?: number;
  authorAttributionRate?: number;
  publishDateRate?: number;
  publishingFrequency?: number;
  hasNewsSitemap?: boolean;
  hasRssFeed?: boolean;

  hasLocalSchema?: boolean;
  napConsistent?: boolean;
  hasGmbLink?: boolean;
  serviceAreaPageCount?: number;
  hasEmbeddedMap?: boolean;

  hasPricingPage?: boolean;
  hasDocsSection?: boolean;
  hasChangelog?: boolean;
  hasStatusPage?: boolean;
  hasComparisonPages?: boolean;

  medicalAuthorRate?: number;
  medicalReviewRate?: number;
  medicalDisclaimerRate?: number;

  financialDisclaimerRate?: number;
  authorCredentialsRate?: number;
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
