/**
 * WqaColumnAdapter.ts
 *
 * Resolves WQA columns by industry and language.
 */

import type { DetectedIndustry } from './SiteTypeDetector';
import { getHiddenColumnsForLanguage } from './LanguageAdaptation';
import { getDefaultVisibleColumns } from './MetricRoles';

const WQA_UNIVERSAL_COLUMNS = [
  'pageCategory',
  'pageCategoryConfidence', // NEW
  'url',
  'statusCode',
  'indexabilityStatus',
  'funnelStage',
  'crawlDepth',
  // Actions
  'primaryAction',         // NEW: derived "best" action
  'primaryActionCategory', // NEW
  'secondaryAction',       // NEW: next-best action
  'secondaryActionCategory', // NEW
  'technicalAction',
  'contentAction',
  'industryAction',       // NEW: primary industry-specific action (from getIndustryActions)
  'estimatedImpact',
  'actionPriority',
  // Search performance
  'mainKeyword',
  'mainKwPosition',
  'gscImpressions',
  'gscClicks',
  'gscCtr',
  'expectedCtr',          // NEW: benchmark CTR at current position
  'ctrGap',               // NEW: actual minus expected CTR (negative = underperforming)
  'searchIntent',
  'intentMatch',          // NEW: 'aligned' | 'misaligned' | 'unknown'
  // Traffic
  'ga4Sessions',
  'sessionsDeltaPct',
  'isLosingTraffic',
  'ga4BounceRate',
  'ga4EngagementTimePerPage',
  // Authority
  'backlinks',
  'referringDomains',
  'inlinks',
  'internalPageRank',     // NEW: internal page rank score 0–100
  // Content
  'title',
  'wordCount',
  'contentQualityScore',
  'eeatScore',
  'contentAge',
  'isCannibalized',
  'pageValueTier',
  'pageValue',
  'healthScore',
  'issueCount',
  'speedScore',
] as const;

const INDUSTRY_ADDED_COLUMNS: Partial<Record<DetectedIndustry, string[]>> = {
  ecommerce: ['ga4EcommerceRevenue', 'ga4Transactions', 'ga4ConversionRate'],
  // contentAge removed from news/blog — now in universal
  news: ['ga4Views', 'visibleDate'],
  blog: ['ga4Views', 'ga4Subscribers'],
  local: ['ga4GoalCompletions'],
  saas: ['ga4Conversions', 'ga4ConversionRate'],
  healthcare: ['hasMedicalAuthor'],
  finance: ['hasFinancialDisclaimer'],
  // NEW
  real_estate: ['ga4Conversions', 'ga4ConversionRate'],
  restaurant: ['ga4GoalCompletions', 'visibleDate'],
};

const INDUSTRY_REMOVED_COLUMNS: Partial<Record<DetectedIndustry, string[]>> = {
  news: ['ga4EcommerceRevenue', 'ga4ConversionRate'],
  blog: ['ga4EcommerceRevenue', 'ga4ConversionRate'],
  local: ['ga4EcommerceRevenue'],
  education: ['ga4EcommerceRevenue'],
  healthcare: ['ga4EcommerceRevenue'],
  real_estate: [],
  restaurant: ['ga4EcommerceRevenue'],
};

export function getWqaColumns(industry: DetectedIndustry, language: string, cms: string | null): string[] {
  let columns = [...WQA_UNIVERSAL_COLUMNS];

  const added = INDUSTRY_ADDED_COLUMNS[industry] || [];
  columns = [...columns, ...added];

  const removed = new Set(INDUSTRY_REMOVED_COLUMNS[industry] || []);
  columns = columns.filter((col) => !removed.has(col));

  const langHidden = new Set(getHiddenColumnsForLanguage(language));
  columns = columns.filter((col) => !langHidden.has(col));

  return [...new Set(columns)];
}

export function getWqaDefaultVisibleColumns(industry: DetectedIndustry, language: string, cms: string | null): string[] {
  const all = getWqaColumns(industry, language, cms);
  const rolesDefault = getDefaultVisibleColumns(industry, cms);

  const defaults = new Set([
    ...rolesDefault,
    'sessionsDeltaPct',
    'isLosingTraffic',
    'intentMatch',
    'contentAge',
    'isCannibalized',
    'wwwInconsistency',
    'url',
    'pageCategory',
  ]);


  // Always show the first industry-specific column as default too
  const added = INDUSTRY_ADDED_COLUMNS[industry] || [];
  if (added[0]) defaults.add(added[0]);

  return all.filter((column) => defaults.has(column));
}
