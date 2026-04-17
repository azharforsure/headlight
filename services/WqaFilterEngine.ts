/**
 * WqaFilterEngine.ts
 * Pure filter logic and facet computation for WQA mode.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type TrafficStatus = 'all' | 'growing' | 'declining' | 'stable' | 'none';
export type SearchStatus  = 'all' | 'top3' | 'page1' | 'striking' | 'weak' | 'none';
export type ContentAge    = 'all' | 'fresh' | 'aging' | 'stale' | 'nodate';
export type IndexStatus   = 'all' | 'indexed' | 'blocked' | 'redirect' | 'error';
export type PriorityLevel = 0 | 1 | 2 | 3;
export type ValueTier     = 'all' | '★★★' | '★★' | '★' | '☆';
export type FunnelStage   = 'all' | 'Transactional' | 'Commercial' | 'Consideration' | 'Informational';

export interface WqaFilterState {
  searchTerm:      string;
  pageCategory:    string;
  technicalAction: string;
  contentAction:   string;
  priorityLevel:   PriorityLevel;
  valueTier:       ValueTier;
  trafficStatus:   TrafficStatus;
  searchStatus:    SearchStatus;
  contentAge:      ContentAge;
  indexability:    IndexStatus;
  funnelStage:     FunnelStage;
  industryFilter:  string;
}

export const DEFAULT_WQA_FILTER: WqaFilterState = {
  searchTerm:      '',
  pageCategory:    'all',
  technicalAction: 'all',
  contentAction:   'all',
  priorityLevel:   0,
  valueTier:       'all',
  trafficStatus:   'all',
  searchStatus:    'all',
  contentAge:      'all',
  indexability:    'all',
  funnelStage:     'all',
  industryFilter:  'all',
};

export interface WqaFacets {
  total:            number;
  categories:       Record<string, number>;
  technicalActions: Record<string, number>;
  contentActions:   Record<string, number>;
  priorities:       { '1': number; '2': number; '3': number };
  valueTiers:       Record<string, number>;
  trafficStatuses:  Record<string, number>;
  searchStatuses:   Record<string, number>;
  contentAges:      Record<string, number>;
  indexabilities:   Record<string, number>;
  funnelStages:     Record<string, number>;
}

export const EMPTY_FACETS: WqaFacets = {
  total:            0,
  categories:       {},
  technicalActions: {},
  contentActions:   {},
  priorities:       { '1': 0, '2': 0, '3': 0 },
  valueTiers:       {},
  trafficStatuses:  {},
  searchStatuses:   {},
  contentAges:      {},
  indexabilities:   {},
  funnelStages:     {},
};

// ─── Derived signal helpers (exported for use in sidebar / inspector) ─────────

function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function deriveTrafficStatus(page: any): TrafficStatus {
  if (page.sessionsDeltaPct === null || page.sessionsDeltaPct === undefined) return 'none';
  if (page.isLosingTraffic === true) return 'declining';
  if (toNum(page.sessionsDeltaPct) > 0.05) return 'growing';
  return 'stable';
}

export function deriveSearchStatus(page: any): SearchStatus {
  const pos  = toNum(page.gscPosition);
  const impr = toNum(page.gscImpressions);
  if (impr === 0 && pos === 0) return 'none';
  if (pos > 0  && pos <= 3)  return 'top3';
  if (pos > 3  && pos <= 10) return 'page1';
  if (pos > 10 && pos <= 20 && impr > 100) return 'striking';
  return 'weak';
}

export function deriveContentAge(page: any): ContentAge {
  const dateStr = page.visibleDate || page.wpPublishDate;
  if (!dateStr) return 'nodate';
  const d = new Date(dateStr as string);
  if (isNaN(d.getTime())) return 'nodate';
  const months = (Date.now() - d.getTime()) / (30 * 24 * 60 * 60 * 1000);
  if (months < 6)  return 'fresh';
  if (months < 12) return 'aging';
  return 'stale';
}

export function deriveIndexStatus(page: any): IndexStatus {
  const code = toNum(page.statusCode);
  if (code >= 400) return 'error';
  if (code >= 300) return 'redirect';
  if (page.indexable === false) return 'blocked';
  return 'indexed';
}

export function deriveValueTier(page: any): ValueTier {
  const t = page.pageValueTier;
  if (t === '★★★') return '★★★';
  if (t === '★★')  return '★★';
  if (t === '★')   return '★';
  return '☆';
}

export function derivePriorityBucket(page: any): 1 | 2 | 3 {
  const p = toNum(page.actionPriority) || 99;
  if (p <= 3) return 1;
  if (p <= 7) return 2;
  return 3;
}

// ─── Industry filter matching (exported for facet counts in sidebar) ──────────

export function matchesIndustryFilter(page: any, value: string): boolean {
  switch (value) {
    case 'all':               return true;
    case 'in_stock':          return page.pageCategory === 'product' && !page.industrySignals?.outOfStock;
    case 'out_of_stock':      return page.pageCategory === 'product' && page.industrySignals?.outOfStock === true && page.indexable !== false;
    case 'no_product_schema': return page.pageCategory === 'product' && !(page.schemaTypes || []).includes('Product');
    case 'has_author':        return Boolean(page.industrySignals?.hasAuthorAttribution);
    case 'no_author':         return page.isHtmlPage === true && !page.industrySignals?.hasAuthorAttribution;
    case 'location_pages':    return page.pageCategory === 'location_page';
    case 'no_local_schema':   return page.isHtmlPage === true && !page.industrySignals?.hasLocalBusinessSchema;
    default:                  return true;
  }
}

// ─── Filter ──────────────────────────────────────────────────────────────────

export function filterWqaPages(pages: any[], filter: WqaFilterState): any[] {
  return pages.filter((p) => {
    if (filter.pageCategory    !== 'all' && p.pageCategory    !== filter.pageCategory)    return false;
    if (filter.technicalAction !== 'all' && p.technicalAction !== filter.technicalAction) return false;
    if (filter.contentAction   !== 'all' && p.contentAction   !== filter.contentAction)   return false;
    if (filter.action !== 'all' && p.technicalAction !== filter.action && p.contentAction !== filter.action) return false;

    if (filter.priorityLevel > 0 && derivePriorityBucket(p) !== filter.priorityLevel) return false;
    if (filter.valueTier     !== 'all' && deriveValueTier(p)     !== filter.valueTier)     return false;
    if (filter.trafficStatus !== 'all' && deriveTrafficStatus(p) !== filter.trafficStatus) return false;
    if (filter.searchStatus  !== 'all' && deriveSearchStatus(p)  !== filter.searchStatus)  return false;
    if (filter.contentAge    !== 'all' && deriveContentAge(p)    !== filter.contentAge)    return false;
    if (filter.indexability  !== 'all' && deriveIndexStatus(p)   !== filter.indexability)  return false;

    if (filter.funnelStage   !== 'all' && p.funnelStage         !== filter.funnelStage)   return false;
    if (filter.industryFilter !== 'all' && !matchesIndustryFilter(p, filter.industryFilter)) return false;

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      const hay  = [p.url, p.title, p.technicalAction, p.contentAction, p.industryAction]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(term)) return false;
    }

    return true;
  });
}

// ─── Facets ──────────────────────────────────────────────────────────────────

export function computeWqaFacets(pages: any[]): WqaFacets {
  const f: WqaFacets = {
    total:            pages.length,
    categories:       {},
    technicalActions: {},
    contentActions:   {},
    priorities:       { '1': 0, '2': 0, '3': 0 },
    valueTiers:       { '★★★': 0, '★★': 0, '★': 0, '☆': 0 },
    trafficStatuses:  { growing: 0, declining: 0, stable: 0, none: 0 },
    searchStatuses:   { top3: 0, page1: 0, striking: 0, weak: 0, none: 0 },
    contentAges:      { fresh: 0, aging: 0, stale: 0, nodate: 0 },
    indexabilities:   { indexed: 0, blocked: 0, redirect: 0, error: 0 },
    funnelStages:     {},
  };

  for (const p of pages) {
    const cat = String(p.pageCategory || 'other');
    f.categories[cat] = (f.categories[cat] || 0) + 1;

    const ta = String(p.technicalAction || 'Monitor');
    f.technicalActions[ta] = (f.technicalActions[ta] || 0) + 1;

    const ca = String(p.contentAction || 'No Action');
    f.contentActions[ca] = (f.contentActions[ca] || 0) + 1;

    f.priorities[String(derivePriorityBucket(p)) as '1' | '2' | '3']++;
    f.valueTiers[deriveValueTier(p)]++;
    f.trafficStatuses[deriveTrafficStatus(p)]++;
    f.searchStatuses[deriveSearchStatus(p)]++;
    f.contentAges[deriveContentAge(p)]++;
    f.indexabilities[deriveIndexStatus(p)]++;

    const fs = String(p.funnelStage || 'Informational');
    f.funnelStages[fs] = (f.funnelStages[fs] || 0) + 1;
  }

  return f;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function isWqaFilterActive(filter: WqaFilterState): boolean {
  return (
    filter.searchTerm      !== DEFAULT_WQA_FILTER.searchTerm      ||
    filter.pageCategory    !== DEFAULT_WQA_FILTER.pageCategory    ||
    filter.technicalAction !== DEFAULT_WQA_FILTER.technicalAction ||
    filter.contentAction   !== DEFAULT_WQA_FILTER.contentAction   ||
    filter.action          !== DEFAULT_WQA_FILTER.action          ||
    filter.priorityLevel   !== DEFAULT_WQA_FILTER.priorityLevel   ||
    filter.valueTier       !== DEFAULT_WQA_FILTER.valueTier       ||
    filter.trafficStatus   !== DEFAULT_WQA_FILTER.trafficStatus   ||
    filter.searchStatus    !== DEFAULT_WQA_FILTER.searchStatus    ||
    filter.contentAge      !== DEFAULT_WQA_FILTER.contentAge      ||
    filter.indexability    !== DEFAULT_WQA_FILTER.indexability    ||
    filter.funnelStage     !== DEFAULT_WQA_FILTER.funnelStage     ||
    filter.industryFilter  !== DEFAULT_WQA_FILTER.industryFilter
  );
}
