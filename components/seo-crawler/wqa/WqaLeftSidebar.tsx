// components/seo-crawler/wqa/WqaLeftSidebar.tsx
import React, { useMemo, useCallback, useState } from 'react';
import { RotateCcw, ChevronDown, ChevronRight, Zap, TrendingDown, AlertCircle, Eye, Shuffle } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { formatCat, formatCompact, num } from './wqaUtils';
import { getEffectiveIndustry } from '../../../services/WebsiteQualityModeTypes';

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterDimension =
  | 'quickFilters'
  | 'categories'
  | 'valueTiers'
  | 'techActions'
  | 'contentActions'
  | 'searchPerf'
  | 'speedScores'
  | 'industrySignals';

interface WqaFilterState {
  quickFilters: Set<string>;
  categories: Set<string>;
  valueTiers: Set<string>;
  techActions: Set<string>;
  contentActions: Set<string>;
  searchPerf: Set<string>;
  speedScores: Set<string>;
  industrySignals: Set<string>;
}

const EMPTY_FILTER: WqaFilterState = {
  quickFilters: new Set(),
  categories: new Set(),
  valueTiers: new Set(),
  techActions: new Set(),
  contentActions: new Set(),
  searchPerf: new Set(),
  speedScores: new Set(),
  industrySignals: new Set(),
};

// ─── Quick filter predicates ──────────────────────────────────────────────────

const QUICK_FILTER_PREDICATES: Record<string, (p: any) => boolean> = {
  losing_traffic: (p) => p.isLosingTraffic === true,
  near_page_one: (p) => num(p.gscPosition) >= 4 && num(p.gscPosition) <= 20 && num(p.gscImpressions) >= 100,
  broken: (p) => num(p.statusCode) >= 400,
  zero_impressions: (p) => p.isHtmlPage && num(p.statusCode) === 200 && num(p.gscImpressions) === 0,
  cannibalized: (p) => p.isCannibalized === true,
  orphan: (p) => num(p.inlinks) === 0 && num(p.crawlDepth) > 0,
};

// ─── Search performance buckets ───────────────────────────────────────────────

const SEARCH_PERF_PREDICATES: Record<string, (p: any) => boolean> = {
  'pos_1_3': (p) => num(p.gscPosition) >= 1 && num(p.gscPosition) <= 3,
  'pos_4_10': (p) => num(p.gscPosition) >= 4 && num(p.gscPosition) <= 10,
  'pos_11_20': (p) => num(p.gscPosition) >= 11 && num(p.gscPosition) <= 20,
  'pos_20plus': (p) => num(p.gscPosition) > 20,
  'zero_impressions': (p) => num(p.gscImpressions) === 0 && p.isHtmlPage && num(p.statusCode) === 200,
  'losing': (p) => p.isLosingTraffic === true,
};

// ─── Industry-specific signal predicates ─────────────────────────────────────

const INDUSTRY_SIGNAL_PREDICATES: Partial<Record<string, Record<string, (p: any) => boolean>>> = {
  ecommerce: {
    missing_product_schema: (p) => p.pageCategory === 'product' && !(p.schemaTypes || []).includes('Product'),
    out_of_stock_indexed: (p) => p.industrySignals?.outOfStock && p.indexable !== false,
    missing_price_markup: (p) => p.pageCategory === 'product' && !p.industrySignals?.priceVisible,
  },
  news: {
    missing_article_schema: (p) => p.pageCategory === 'blog_post' && !p.hasArticleSchema,
    missing_pub_date: (p) => p.pageCategory === 'blog_post' && !p.visibleDate,
    missing_author: (p) => p.pageCategory === 'blog_post' && !p.industrySignals?.hasAuthorByline,
  },
  blog: {
    missing_article_schema: (p) => p.pageCategory === 'blog_post' && !p.hasArticleSchema,
    stale_posts: (p) => {
      if (!p.visibleDate || p.pageCategory !== 'blog_post') return false;
      const age = (Date.now() - new Date(p.visibleDate).getTime()) / (30 * 24 * 60 * 60 * 1000);
      return age > 12;
    },
  },
  local: {
    missing_local_schema: (p) => p.crawlDepth === 0 && !p.industrySignals?.hasLocalBusinessSchema,
    missing_nap: (p) => p.crawlDepth <= 1 && !p.industrySignals?.hasNapOnPage,
    no_map: (p) => p.pageCategory === 'location_page' && !p.hasEmbeddedMap,
  },
  saas: {
    missing_pricing: (p) => p.crawlDepth === 0 && !p.hasPricingPage,
    missing_docs: (p) => !String(p.url || '').toLowerCase().includes('/doc') && p.crawlDepth <= 2,
  },
  healthcare: {
    missing_medical_author: (p) => p.pageCategory === 'blog_post' && !p.industrySignals?.hasMedicalAuthor,
    missing_disclaimer: (p) => p.crawlDepth === 0 && !p.industrySignals?.hasMedicalDisclaimer,
  },
  finance: {
    missing_disclaimer: (p) => p.pageCategory === 'blog_post' && !p.industrySignals?.hasFinancialDisclaimer,
    missing_credentials: (p) => p.pageCategory === 'blog_post' && !p.industrySignals?.hasAuthorCredentials,
  },
};

const INDUSTRY_SIGNAL_LABELS: Partial<Record<string, Record<string, string>>> = {
  ecommerce: {
    missing_product_schema: 'Missing product schema',
    out_of_stock_indexed: 'Out-of-stock indexed',
    missing_price_markup: 'No price markup',
  },
  news: {
    missing_article_schema: 'Missing article schema',
    missing_pub_date: 'No publish date',
    missing_author: 'No author byline',
  },
  blog: {
    missing_article_schema: 'Missing article schema',
    stale_posts: 'Posts stale (>1yr)',
  },
  local: {
    missing_local_schema: 'Missing local schema',
    missing_nap: 'NAP incomplete',
    no_map: 'Location page, no map',
  },
  saas: {
    missing_pricing: 'No pricing page',
    missing_docs: 'No docs section',
  },
  healthcare: {
    missing_medical_author: 'No medical author',
    missing_disclaimer: 'No medical disclaimer',
  },
  finance: {
    missing_disclaimer: 'No financial disclaimer',
    missing_credentials: 'No author credentials',
  },
};

// ─── Build combined filter predicate ─────────────────────────────────────────

function buildPredicate(state: WqaFilterState): ((page: any) => boolean) | null {
  const hasAny = (
    state.quickFilters.size > 0 ||
    state.categories.size > 0 ||
    state.valueTiers.size > 0 ||
    state.techActions.size > 0 ||
    state.contentActions.size > 0 ||
    state.searchPerf.size > 0 ||
    state.speedScores.size > 0 ||
    state.industrySignals.size > 0
  );

  if (!hasAny) return null;

  return (page: any): boolean => {
    // Quick filters: OR within group, AND with other groups
    if (state.quickFilters.size > 0) {
      const passes = [...state.quickFilters].some((k) => QUICK_FILTER_PREDICATES[k]?.(page));
      if (!passes) return false;
    }

    if (state.categories.size > 0) {
      if (!state.categories.has(String(page.pageCategory || 'other'))) return false;
    }

    if (state.valueTiers.size > 0) {
      const tier = page.pageValueTier ?? '☆';
      if (!state.valueTiers.has(tier)) return false;
    }

    if (state.techActions.size > 0) {
      const action = page.technicalAction || 'Monitor';
      if (!state.techActions.has(action)) return false;
    }

    if (state.contentActions.size > 0) {
      const action = page.contentAction || 'No Action';
      if (!state.contentActions.has(action)) return false;
    }

    if (state.searchPerf.size > 0) {
      const passes = [...state.searchPerf].some((k) => SEARCH_PERF_PREDICATES[k]?.(page));
      if (!passes) return false;
    }

    if (state.speedScores.size > 0) {
      if (!state.speedScores.has(String(page.speedScore || 'Good'))) return false;
    }

    if (state.industrySignals.size > 0) {
      const passes = [...state.industrySignals].some((k) => {
        for (const predicates of Object.values(INDUSTRY_SIGNAL_PREDICATES)) {
          if (predicates?.[k]?.(page)) return true;
        }
        return false;
      });
      if (!passes) return false;
    }

    return true;
  };
}

// ─── Helper: count pages matching a predicate ──────────────────────────────

function countPages(pages: any[], predicate: (p: any) => boolean): number {
  return pages.filter(predicate).length;
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  title,
  children,
  activeCount,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  activeCount?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#1a1a1a]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#111] transition-colors"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#555] flex items-center gap-2">
          {title}
          {activeCount ? (
            <span className="bg-blue-500/20 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          ) : null}
        </span>
        {open ? (
          <ChevronDown size={12} className="text-[#444]" />
        ) : (
          <ChevronRight size={12} className="text-[#444]" />
        )}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

// ─── Filter option row ────────────────────────────────────────────────────────

function FilterOption({
  label,
  count,
  active,
  onClick,
  colorDot,
  disabled,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  colorDot?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled && count === 0}
      className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors group
        ${active
          ? 'bg-blue-500/10 text-white'
          : count === 0
            ? 'opacity-30 cursor-default'
            : 'hover:bg-[#161616] text-[#888] hover:text-[#ccc]'
        }`}
    >
      <span className="flex items-center gap-2 text-[11px]">
        {colorDot && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: colorDot }}
          />
        )}
        {active && !colorDot && (
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
        )}
        {!active && !colorDot && (
          <span className="w-2 h-2 rounded-full border border-[#333] flex-shrink-0" />
        )}
        {label}
      </span>
      <span className={`text-[10px] tabular-nums ${active ? 'text-blue-400' : 'text-[#444]'}`}>
        {formatCompact(count)}
      </span>
    </button>
  );
}

// ─── Quick filter chip ────────────────────────────────────────────────────────

interface QuickChip {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const QUICK_CHIPS: QuickChip[] = [
  { id: 'losing_traffic', label: 'Losing traffic', icon: <TrendingDown size={10} />, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { id: 'near_page_one', label: 'Near page 1', icon: <Zap size={10} />, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { id: 'broken', label: 'Broken pages', icon: <AlertCircle size={10} />, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  { id: 'zero_impressions', label: 'Zero impressions', icon: <Eye size={10} />, color: 'text-[#666] bg-[#111] border-[#222]' },
  { id: 'cannibalized', label: 'Cannibalized', icon: <Shuffle size={10} />, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { id: 'orphan', label: 'Orphan pages', icon: <AlertCircle size={10} />, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
];

// ─── Category icons ───────────────────────────────────────────────────────────

const CAT_ICONS: Record<string, string> = {
  homepage: '🏠',
  product: '🛍️',
  blog_post: '📝',
  category: '📂',
  landing_page: '🎯',
  service_page: '⚙️',
  about: '👤',
  contact: '📬',
  legal: '⚖️',
  faq: '❓',
  resource: '📄',
  login: '🔑',
  media: '🖼️',
  pagination: '📃',
  search_results: '🔍',
  location_page: '📍',
  other: '○',
};

// ─── Action chip colors ───────────────────────────────────────────────────────

function getActionDotColor(action: string): string {
  if (['Fix Server Errors', 'Restore Broken Page', 'Fix Server Error'].includes(action)) return '#ef4444';
  if (['Unblock From Index', 'Fix Canonical', 'Fix Redirect Chain', 'Fix Hreflang', 'Fix Security'].includes(action)) return '#f97316';
  if (['Rewrite Title & Meta', 'Recover Declining Content', 'Fix Keyword Mismatch', 'Rebuild for Intent', 'Improve E-E-A-T'].includes(action)) return '#3b82f6';
  if (['Expand Thin Content', 'Update Stale Content', 'Add Schema', 'Optimize for SERP Features', 'Improve Readability'].includes(action)) return '#8b5cf6';
  if (['Add Internal Links', 'Consolidate Duplicates', 'Consolidate Near-Duplicates', 'Remove Dead Page', 'Resolve Cannibalization'].includes(action)) return '#6b7280';
  if (['Improve Speed', 'Add to Sitemap', 'Fix Navigation Structure'].includes(action)) return '#f59e0b';
  if (action === 'Monitor') return '#333';
  return '#555';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WqaLeftSidebar() {
  const { pages, wqaState, setWqaPageFilter } = useSeoCrawler();
  const [filters, setFilters] = useState<WqaFilterState>(EMPTY_FILTER);

  const industry = getEffectiveIndustry(wqaState);

  // Total active filter count
  const activeCount = useMemo(() => (
    filters.quickFilters.size +
    filters.categories.size +
    filters.valueTiers.size +
    filters.techActions.size +
    filters.contentActions.size +
    filters.searchPerf.size +
    filters.speedScores.size +
    filters.industrySignals.size
  ), [filters]);

  // Apply filter to context whenever it changes
  const applyFilters = useCallback((next: WqaFilterState) => {
    setFilters(next);
    const predicate = buildPredicate(next);
    // React setState: to set a function as state value, wrap in another function
    setWqaPageFilter(predicate ? () => predicate : null);
  }, [setWqaPageFilter]);

  // Toggle a single value within a dimension
  const toggle = useCallback((dimension: FilterDimension, value: string) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        [dimension]: new Set(prev[dimension]),
      };
      const set = next[dimension] as Set<string>;
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      const predicate = buildPredicate(next);
      setWqaPageFilter(predicate ? () => predicate : null);
      return next;
    });
  }, [setWqaPageFilter]);

  const resetAll = useCallback(() => {
    setFilters(EMPTY_FILTER);
    setWqaPageFilter(null);
  }, [setWqaPageFilter]);

  // ── Derived counts (computed from full page array, not filtered) ──

  const htmlPages = useMemo(
    () => pages.filter((p: any) => p.isHtmlPage && num(p.statusCode) === 200),
    [pages]
  );

  const quickCounts = useMemo(() =>
    Object.fromEntries(
      QUICK_CHIPS.map((chip) => [chip.id, countPages(pages as any[], QUICK_FILTER_PREDICATES[chip.id])])
    ),
    [pages]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (pages as any[]).forEach((p) => {
      const cat = p.pageCategory || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [pages]);

  // Sorted categories: by count desc
  const sortedCategories = useMemo(() =>
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ cat, count })),
    [categoryCounts]
  );

  const valueTierCounts = useMemo(() => ({
    '★★★': (pages as any[]).filter((p) => p.pageValueTier === '★★★').length,
    '★★': (pages as any[]).filter((p) => p.pageValueTier === '★★').length,
    '★': (pages as any[]).filter((p) => p.pageValueTier === '★').length,
    '☆': (pages as any[]).filter((p) => p.pageValueTier === '☆' || p.pageValueTier == null).length,
  }), [pages]);

  const techActionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (pages as any[]).forEach((p) => {
      const a = p.technicalAction || 'Monitor';
      counts[a] = (counts[a] || 0) + 1;
    });
    return counts;
  }, [pages]);

  const contentActionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (pages as any[]).forEach((p) => {
      const a = p.contentAction || 'No Action';
      if (a === 'No Action') return;
      counts[a] = (counts[a] || 0) + 1;
    });
    // Always include No Action at end
    counts['No Action'] = (pages as any[]).filter((p) => !p.contentAction || p.contentAction === 'No Action').length;
    return counts;
  }, [pages]);

  const techActionsSorted = useMemo(() =>
    Object.entries(techActionCounts)
      .filter(([a]) => a !== 'Monitor' || techActionCounts['Monitor'] > 0)
      .sort((a, b) => {
        if (a[0] === 'Monitor') return 1;
        if (b[0] === 'Monitor') return -1;
        return b[1] - a[1];
      }),
    [techActionCounts]
  );

  const contentActionsSorted = useMemo(() =>
    Object.entries(contentActionCounts)
      .sort((a, b) => {
        if (a[0] === 'No Action') return 1;
        if (b[0] === 'No Action') return -1;
        return b[1] - a[1];
      }),
    [contentActionCounts]
  );

  const searchPerfCounts = useMemo(() => ({
    pos_1_3: countPages(pages as any[], SEARCH_PERF_PREDICATES.pos_1_3),
    pos_4_10: countPages(pages as any[], SEARCH_PERF_PREDICATES.pos_4_10),
    pos_11_20: countPages(pages as any[], SEARCH_PERF_PREDICATES.pos_11_20),
    pos_20plus: countPages(pages as any[], SEARCH_PERF_PREDICATES.pos_20plus),
    zero_impressions: countPages(pages as any[], SEARCH_PERF_PREDICATES.zero_impressions),
    losing: countPages(pages as any[], SEARCH_PERF_PREDICATES.losing),
  }), [pages]);

  const speedCounts = useMemo(() => ({
    Good: (pages as any[]).filter((p) => p.speedScore === 'Good').length,
    'Needs Work': (pages as any[]).filter((p) => p.speedScore === 'Needs Work').length,
    Poor: (pages as any[]).filter((p) => p.speedScore === 'Poor').length,
  }), [pages]);

  // Industry-specific signals
  const industryPredicates = INDUSTRY_SIGNAL_PREDICATES[industry] || {};
  const industryLabels = INDUSTRY_SIGNAL_LABELS[industry] || {};
  const industrySignalCounts = useMemo(() =>
    Object.fromEntries(
      Object.entries(industryPredicates).map(([k, fn]) => [k, countPages(pages as any[], fn)])
    ),
    [pages, industryPredicates]
  );
  const hasIndustrySignals = Object.keys(industryPredicates).length > 0;

  if (pages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-[#1a1a1a] items-center justify-center">
        <span className="text-[11px] text-[#444] text-center px-4">Run a crawl to enable filters.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-[#1a1a1a] overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1a1a1a] flex-shrink-0">
        <span className="text-[11px] font-bold text-[#888] uppercase tracking-widest flex items-center gap-2">
          Filters
          {activeCount > 0 && (
            <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-[10px] text-[#555] hover:text-[#888] transition-colors"
            title="Reset all filters"
          >
            <RotateCcw size={10} />
            Reset
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── Quick Filters ── */}
        <Section title="Quick" activeCount={filters.quickFilters.size} defaultOpen={true}>
          <div className="px-3 pt-1 flex flex-col gap-1">
            {QUICK_CHIPS.map((chip) => {
              const count = quickCounts[chip.id] ?? 0;
              const active = filters.quickFilters.has(chip.id);
              return (
                <button
                  key={chip.id}
                  onClick={() => toggle('quickFilters', chip.id)}
                  disabled={count === 0}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] border transition-all
                    ${active
                      ? `${chip.color} border-opacity-100`
                      : count === 0
                        ? 'opacity-25 cursor-default text-[#555] border-[#1a1a1a]'
                        : `${chip.color} opacity-60 hover:opacity-90 border-opacity-40`
                    }`}
                >
                  <span className="flex items-center gap-1.5">
                    {chip.icon}
                    {chip.label}
                  </span>
                  <span className="font-mono tabular-nums">{formatCompact(count)}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Page Category ── */}
        <Section title="Page Category" activeCount={filters.categories.size} defaultOpen={true}>
          {sortedCategories.map(({ cat, count }) => (
            <FilterOption
              key={cat}
              label={`${CAT_ICONS[cat] ?? '○'} ${formatCat(cat)}`}
              count={count}
              active={filters.categories.has(cat)}
              onClick={() => toggle('categories', cat)}
            />
          ))}
        </Section>

        {/* ── Page Value ── */}
        <Section title="Page Value" activeCount={filters.valueTiers.size} defaultOpen={true}>
          <FilterOption
            label="★★★ High value"
            count={valueTierCounts['★★★']}
            active={filters.valueTiers.has('★★★')}
            onClick={() => toggle('valueTiers', '★★★')}
            colorDot="#f59e0b"
          />
          <FilterOption
            label="★★ Medium value"
            count={valueTierCounts['★★']}
            active={filters.valueTiers.has('★★')}
            onClick={() => toggle('valueTiers', '★★')}
            colorDot="#3b82f6"
          />
          <FilterOption
            label="★ Low value"
            count={valueTierCounts['★']}
            active={filters.valueTiers.has('★')}
            onClick={() => toggle('valueTiers', '★')}
            colorDot="#6b7280"
          />
          <FilterOption
            label="☆ No value"
            count={valueTierCounts['☆']}
            active={filters.valueTiers.has('☆')}
            onClick={() => toggle('valueTiers', '☆')}
            colorDot="#2a2a2a"
          />
        </Section>

        {/* ── Technical Action ── */}
        <Section title="Technical Action" activeCount={filters.techActions.size} defaultOpen={false}>
          {techActionsSorted.map(([action, count]) => (
            <FilterOption
              key={action}
              label={action}
              count={count}
              active={filters.techActions.has(action)}
              onClick={() => toggle('techActions', action)}
              colorDot={getActionDotColor(action)}
            />
          ))}
        </Section>

        {/* ── Content Action ── */}
        <Section title="Content Action" activeCount={filters.contentActions.size} defaultOpen={false}>
          {contentActionsSorted.map(([action, count]) => (
            <FilterOption
              key={action}
              label={action}
              count={count}
              active={filters.contentActions.has(action)}
              onClick={() => toggle('contentActions', action)}
              colorDot={getActionDotColor(action)}
            />
          ))}
        </Section>

        {/* ── Search Performance ── */}
        <Section title="Search Performance" activeCount={filters.searchPerf.size} defaultOpen={false}>
          <FilterOption
            label="Ranking 1–3"
            count={searchPerfCounts.pos_1_3}
            active={filters.searchPerf.has('pos_1_3')}
            onClick={() => toggle('searchPerf', 'pos_1_3')}
            colorDot="#22c55e"
          />
          <FilterOption
            label="Ranking 4–10"
            count={searchPerfCounts.pos_4_10}
            active={filters.searchPerf.has('pos_4_10')}
            onClick={() => toggle('searchPerf', 'pos_4_10')}
            colorDot="#3b82f6"
          />
          <FilterOption
            label="Ranking 11–20"
            count={searchPerfCounts.pos_11_20}
            active={filters.searchPerf.has('pos_11_20')}
            onClick={() => toggle('searchPerf', 'pos_11_20')}
            colorDot="#6b7280"
          />
          <FilterOption
            label="Ranking 20+"
            count={searchPerfCounts.pos_20plus}
            active={filters.searchPerf.has('pos_20plus')}
            onClick={() => toggle('searchPerf', 'pos_20plus')}
            colorDot="#374151"
          />
          <FilterOption
            label="Zero impressions"
            count={searchPerfCounts.zero_impressions}
            active={filters.searchPerf.has('zero_impressions')}
            onClick={() => toggle('searchPerf', 'zero_impressions')}
            colorDot="#444"
          />
          <FilterOption
            label="Losing traffic"
            count={searchPerfCounts.losing}
            active={filters.searchPerf.has('losing')}
            onClick={() => toggle('searchPerf', 'losing')}
            colorDot="#f97316"
          />
        </Section>

        {/* ── Speed Score ── */}
        <Section title="Speed" activeCount={filters.speedScores.size} defaultOpen={false}>
          <FilterOption
            label="Good"
            count={speedCounts.Good}
            active={filters.speedScores.has('Good')}
            onClick={() => toggle('speedScores', 'Good')}
            colorDot="#22c55e"
          />
          <FilterOption
            label="Needs Work"
            count={speedCounts['Needs Work']}
            active={filters.speedScores.has('Needs Work')}
            onClick={() => toggle('speedScores', 'Needs Work')}
            colorDot="#f59e0b"
          />
          <FilterOption
            label="Poor"
            count={speedCounts.Poor}
            active={filters.speedScores.has('Poor')}
            onClick={() => toggle('speedScores', 'Poor')}
            colorDot="#ef4444"
          />
        </Section>

        {/* ── Industry-Specific ── (conditional) */}
        {hasIndustrySignals && (
          <Section
            title={`${formatCat(industry)} Signals`}
            activeCount={filters.industrySignals.size}
            defaultOpen={true}
          >
            {Object.entries(industryLabels).map(([key, label]) => (
              <FilterOption
                key={key}
                label={label}
                count={industrySignalCounts[key] ?? 0}
                active={filters.industrySignals.has(key)}
                onClick={() => toggle('industrySignals', key)}
              />
            ))}
          </Section>
        )}

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}
