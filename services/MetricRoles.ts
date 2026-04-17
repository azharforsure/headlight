/**
 * MetricRoles.ts
 *
 * Defines visibility and behavior roles for WQA columns.
 * Helps the UI decide which columns to show by default and how to group them.
 */

export type MetricRole =
  | 'technical'   // Core SEO hygiene (status, indexability, titles)
  | 'performance' // Speed, CWV, DOM metrics
  | 'content'     // Word count, language, intent, clusters
  | 'metrics'     // GSC/GA4 traffic and value data
  | 'business'    // Lead forms, trust signals, ad platforms
  | 'industry';   // Industry-specific (Ecommerce, SaaS, etc.)

export interface ColumnRoleConfig {
  key: string;
  role: MetricRole;
  isPriority?: boolean;    // Shown by default in "Basic" view
  cmsSpecific?: string[];  // Only show if website is built on this CMS
  industrySpecific?: string[];
}

export const METRIC_ROLES: ColumnRoleConfig[] = [
  // ─── Technical / Core ────────────────────────────────
  { key: 'url', role: 'technical', isPriority: true },
  { key: 'statusCode', role: 'technical', isPriority: true },
  { key: 'indexabilityStatus', role: 'technical', isPriority: true },
  { key: 'title', role: 'technical', isPriority: true },
  { key: 'metaDesc', role: 'technical', isPriority: true },
  { key: 'crawlDepth', role: 'technical' },
  { key: 'inlinks', role: 'technical' },
  { key: 'outlinks', role: 'technical' },
  { key: 'canonical', role: 'technical' },
  { key: 'healthScore', role: 'technical', isPriority: true },
  { key: 'isCannibalized', role: 'technical' },
  { key: 'wwwInconsistency', role: 'technical' },
  { key: 'hreflangNoReturn', role: 'technical' },

  // ─── Performance ────────────────────────────────────
  { key: 'speedScore', role: 'performance', isPriority: true },
  { key: 'loadTime', role: 'performance' },
  { key: 'domNodeCount', role: 'performance' },
  { key: 'renderBlockingJs', role: 'performance' },
  { key: 'imagesWithoutLazy', role: 'performance' },

  // ─── Content ────────────────────────────────────────
  { key: 'pageCategory', role: 'content', isPriority: true },
  { key: 'wordCount', role: 'content', isPriority: true },
  { key: 'contentAge', role: 'content' },
  { key: 'topicCluster', role: 'content' },
  { key: 'searchIntent', role: 'content' },
  { key: 'intentMatch', role: 'content' },
  { key: 'readability', role: 'content' },
  { key: 'language', role: 'content' },

  // ─── Search Performance & Value ─────────────────────
  { key: 'gscClicks', role: 'metrics', isPriority: true },
  { key: 'gscImpressions', role: 'metrics', isPriority: true },
  { key: 'gscPosition', role: 'metrics', isPriority: true },
  { key: 'ctrGap', role: 'metrics' },
  { key: 'ga4Sessions', role: 'metrics' },
  { key: 'ga4Conversions', role: 'metrics' },
  { key: 'pageValue', role: 'metrics', isPriority: true },
  { key: 'pageValueTier', role: 'metrics' },
  { key: 'opportunityScore', role: 'metrics', isPriority: true },

  // ─── Industry Specific ──────────────────────────────
  { key: 'priceVisible', role: 'industry', industrySpecific: ['ecommerce'] },
  { key: 'hasAddToCartButton', role: 'industry', industrySpecific: ['ecommerce'] },
  { key: 'inNewsSitemap', role: 'industry', industrySpecific: ['news'] },
  { key: 'hasAuthorByline', role: 'industry', industrySpecific: ['news', 'blog'] },
  { key: 'hasMedicalReviewer', role: 'industry', industrySpecific: ['healthcare'] },
  { key: 'hasPricingPage', role: 'industry', industrySpecific: ['saas'] },
];

export function getDefaultVisibleColumns(industry: string, cms: string | null): string[] {
  const defaults = METRIC_ROLES.filter(r => r.isPriority).map(r => r.key);
  
  // Add CMS specific ones
  if (cms) {
    const cmsCols = METRIC_ROLES.filter(r => r.cmsSpecific?.includes(cms)).map(r => r.key);
    defaults.push(...cmsCols);
  }

  // Add industry specific ones if defined
  const indCols = METRIC_ROLES.filter(r => r.industrySpecific?.includes(industry)).map(r => r.key);
  defaults.push(...indCols);

  return Array.from(new Set(defaults));
}
