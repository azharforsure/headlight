import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Layers,
  Zap,
  Settings,
  FileText,
  Star,
  Activity,
  Search as SearchIcon,
  Clock,
  Fingerprint,
  Filter,
  Briefcase
} from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import {
  DEFAULT_WQA_FILTER,
  matchesIndustryFilter,
  type WqaFilterState,
} from '../../../services/WqaFilterEngine';
import { formatCat, formatIndustryLabel } from './wqaUtils';
import type { DetectedIndustry } from '../../../services/SiteTypeDetector';

// ─── Label maps ───────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<string, string> = {
  '1': 'High',
  '2': 'Medium',
  '3': 'Low',
};

const VALUE_LABELS: Record<string, string> = {
  '★★★': '★★★  High value',
  '★★':  '★★   Medium value',
  '★':   '★    Low value',
  '☆':   '☆    No value',
};

const TRAFFIC_LABELS: Record<string, string> = {
  growing:   '▲  Growing',
  declining: '▼  Declining',
  stable:    '→  Stable',
  none:      'No data',
};

const SEARCH_LABELS: Record<string, string> = {
  top3:     'Top 3',
  page1:    'Page 1  (4–10)',
  striking: 'Striking  (11–20)',
  weak:     'Weak  (21+)',
  none:     'Not ranking',
};

const AGE_LABELS: Record<string, string> = {
  fresh:  'Fresh  (< 6 mo)',
  aging:  'Aging  (6–12 mo)',
  stale:  'Stale  (> 12 mo)',
  nodate: 'No date',
};

const INDEX_LABELS: Record<string, string> = {
  indexed:  'Indexed',
  blocked:  'Blocked / Noindex',
  redirect: 'Redirect',
  error:    'Error  (4xx / 5xx)',
};

const FUNNEL_LABELS: Record<string, string> = {
  Transactional: 'Transactional',
  Commercial:    'Commercial',
  Consideration: 'Consideration',
  Informational: 'Informational',
};

// ─── Industry filter options (per industry) ───────────────────────────────────

const INDUSTRY_OPTIONS: Partial<Record<DetectedIndustry, { value: string; label: string }[]>> = {
  ecommerce:   [
    { value: 'in_stock',          label: 'In stock' },
    { value: 'out_of_stock',      label: 'Out of stock (indexed)' },
    { value: 'no_product_schema', label: 'No product schema' },
  ],
  news: [
    { value: 'has_author', label: 'Has author' },
    { value: 'no_author',  label: 'Missing author' },
  ],
  blog: [
    { value: 'has_author', label: 'Has author' },
    { value: 'no_author',  label: 'Missing author' },
  ],
  local: [
    { value: 'location_pages',  label: 'Location pages' },
    { value: 'no_local_schema', label: 'No local schema' },
  ],
};

// ─── Active chip derivation ───────────────────────────────────────────────────

function getActiveChips(filter: WqaFilterState): { key: keyof WqaFilterState; label: string }[] {
  const chips: { key: keyof WqaFilterState; label: string }[] = [];

  const add = (key: keyof WqaFilterState, label: string | undefined | null, defaultValue: any = 'all') => {
    if (filter[key] !== defaultValue && label && label.trim() !== '') {
      chips.push({ key, label: label.trim() });
    }
  };

  add('pageCategory',    formatCat(filter.pageCategory));
  add('technicalAction', filter.technicalAction);
  add('contentAction',   filter.contentAction);
  add('action',          filter.action);
  add('priorityLevel',   PRIORITY_LABELS[String(filter.priorityLevel)] ?? '', 0);
  add('valueTier',       filter.valueTier);
  add('trafficStatus',   TRAFFIC_LABELS[filter.trafficStatus] ?? filter.trafficStatus);
  add('searchStatus',    SEARCH_LABELS[filter.searchStatus]  ?? filter.searchStatus);
  add('contentAge',      AGE_LABELS[filter.contentAge]       ?? filter.contentAge);
  add('indexability',    INDEX_LABELS[filter.indexability]   ?? filter.indexability);
  add('funnelStage',     FUNNEL_LABELS[filter.funnelStage]   ?? filter.funnelStage);
  add('industryFilter',  filter.industryFilter);
  
  return chips;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FilterItemProps {
  label:    string;
  count:    number;
  active:   boolean;
  onClick:  () => void;
  barPct?:  number;
  hideCount?: boolean;
}

function FilterItem({ label, count, active, onClick, barPct, hideCount = false }: FilterItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center justify-between gap-1 px-2.5 py-1 rounded-sm transition-all ${
        active
          ? 'bg-[#F5364E]/10 text-[#F5364E] font-medium'
          : 'text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1a]'
      }`}
    >
      <span className="truncate flex-1 text-[11px]">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        {barPct !== undefined && (
          <div className="w-[32px] h-[3px] bg-[#222] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${active ? 'bg-[#F5364E]' : 'bg-[#333]'}`}
              style={{ width: `${barPct}%` }}
            />
          </div>
        )}
        {!hideCount && (
          <span className={`text-[10px] font-mono shrink-0 ${active ? 'text-[#F5364E]/70' : 'text-[#555]'}`}>
            {count > 0 ? count : ''}
          </span>
        )}
      </div>
    </button>
  );
}

interface SectionHeaderProps {
  label:     string;
  icon:      React.ReactNode;
  isOpen:    boolean;
  onToggle:  () => void;
  hasActive: boolean;
}

function SectionHeader({ label, icon, isOpen, onToggle, hasActive }: SectionHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm transition-colors group ${
        isOpen ? 'text-[#eee]' : 'text-[#aaa] hover:bg-[#1a1a1a]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`shrink-0 transition-colors ${hasActive ? 'text-[#F5364E]/60' : 'text-[#666] group-hover:text-[#888]'}`}>
          {icon}
        </span>
        <span className={`truncate text-[12px] font-semibold tracking-tight`}>
          {label}
        </span>
        {hasActive && <div className="w-1.5 h-1.5 rounded-full bg-[#F5364E] shrink-0" />}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isOpen ? <ChevronDown size={12} className="text-[#555]"/> : <ChevronRight size={12} className="text-[#555]"/>}
      </div>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const SHOW_ACTIONS_DEFAULT = 6;
const COLLAPSE_KEY = 'wqa_sidebar_sections';

interface WQACategoryTreeProps {
  industry: DetectedIndustry;
}

export default function WQACategoryTree({ industry }: WQACategoryTreeProps) {
  const { wqaFilter, setWqaFilter, wqaFacets, pages } = useSeoCrawler();

  // Section collapse state, persisted
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? '{}'); } catch { return {}; }
  });

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed)); } catch {}
  }, [collapsed]);

  const [showMoreTech,    setShowMoreTech]    = useState(false);
  const [showMoreContent, setShowMoreContent] = useState(false);

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isOpen = (id: string) => !collapsed[id]; // default open

  // Setter that toggles back to default if the same value is clicked
  const set = useCallback((key: keyof WqaFilterState, value: any) => {
    setWqaFilter((prev: WqaFilterState) => ({
      ...prev,
      [key]: (prev[key] as any) === value ? (DEFAULT_WQA_FILTER[key] as any) : value,
    }));
  }, [setWqaFilter]);

  const clearAll = useCallback(() => setWqaFilter(DEFAULT_WQA_FILTER), [setWqaFilter]);

  const chips     = useMemo(() => getActiveChips(wqaFilter), [wqaFilter]);
  const hasActive = chips.length >= 2;

  const dismissChip = (key: keyof WqaFilterState) => {
    setWqaFilter((prev: WqaFilterState) => ({ ...prev, [key]: DEFAULT_WQA_FILTER[key] as any }));
  };

  // Sorted category items
  const categoryItems = useMemo(() =>
    Object.entries(wqaFacets.categories).sort((a, b) => b[1] - a[1]),
  [wqaFacets.categories]);

  // Action items (non-trivial only, sorted by count)
  const techActionItems = useMemo(() =>
    Object.entries(wqaFacets.technicalActions)
      .filter(([a]) => a !== 'Monitor')
      .sort((a, b) => b[1] - a[1]),
  [wqaFacets.technicalActions]);

  const contentActionItems = useMemo(() =>
    Object.entries(wqaFacets.contentActions)
      .filter(([a]) => a !== 'No Action')
      .sort((a, b) => b[1] - a[1]),
  [wqaFacets.contentActions]);

  // Priority bar widths
  const maxPriority = Math.max(
    wqaFacets.priorities['1'],
    wqaFacets.priorities['2'],
    wqaFacets.priorities['3'],
    1,
  );

  // Industry section
  const industryOptions = INDUSTRY_OPTIONS[industry] ?? [];
  const showIndustry    = industryOptions.length > 0;

  // Industry facet counts (computed from pages directly, since they're industry-specific)
  const industryFacets = useMemo(() => {
    if (!showIndustry) return {};
    const counts: Record<string, number> = {};
    for (const opt of industryOptions) {
      counts[opt.value] = pages.filter(p => matchesIndustryFilter(p, opt.value)).length;
    }
    return counts;
  }, [pages, industryOptions, showIndustry]);

  const total = wqaFacets.total;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#111]">

      {/* Search input */}
      <div className="px-2 pt-2 pb-1.5 shrink-0 border-b border-[#1a1a1a]">
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
          <input
            type="text"
            value={wqaFilter.searchTerm}
            onChange={e => setWqaFilter((prev: WqaFilterState) => ({ ...prev, searchTerm: e.target.value }))}
            placeholder="Search... (⌘K)"
            className="w-full bg-[#0a0a0a]/50 border border-[#222] rounded pl-6 pr-2 py-1 text-[11px] text-[#e0e0e0] placeholder-[#444] focus:border-[#F5364E]/50 focus:outline-none transition-colors"
          />
          {wqaFilter.searchTerm && (
            <button
              onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, searchTerm: '' }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] transition-colors"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Active filter chips - Only show if >= 2 active */}
      {hasActive && (
        <div className="px-2 py-1.5 shrink-0 border-b border-[#1a1a1a] flex flex-wrap gap-1">
          {chips.map(chip => (
            <button
              key={chip.key}
              onClick={() => dismissChip(chip.key)}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-[#F5364E]/10 border border-[#F5364E]/20 rounded text-[10px] text-[#F5364E] hover:bg-[#F5364E]/20 transition-colors max-w-[120px]"
            >
              <span className="truncate">{chip.label}</span>
              <X size={9} className="shrink-0" />
            </button>
          ))}
          <button
            onClick={clearAll}
            className="px-1.5 py-0.5 text-[10px] text-[#555] hover:text-[#888] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter sections */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-1">

        {/* ── Page Category ── */}
        <div className="mb-0.5">
          <SectionHeader
            label="Page Category"
            icon={<Layers size={14} />}
            isOpen={isOpen('category')}
            onToggle={() => toggle('category')}
            hasActive={wqaFilter.pageCategory !== 'all'}
          />
          {isOpen('category') && (
            <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
              <FilterItem label="All" count={total} active={wqaFilter.pageCategory === 'all'}
                onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, pageCategory: 'all' }))} />
              {categoryItems.map(([cat, count]) => (
                <FilterItem key={cat} label={formatCat(cat)} count={count}
                  active={wqaFilter.pageCategory === cat}
                  onClick={() => set('pageCategory', cat)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Priority ── */}
        <div className="mb-0.5">
          <SectionHeader
            label="Priority"
            icon={<Zap size={14} />}
            isOpen={isOpen('priority')}
            onToggle={() => toggle('priority')}
            hasActive={wqaFilter.priorityLevel !== 0}
          />
          {isOpen('priority') && (
            <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
              <FilterItem label="All" count={total} active={wqaFilter.priorityLevel === 0}
                onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, priorityLevel: 0 }))} />
              {([['1', 'High'], ['2', 'Medium'], ['3', 'Low']] as [string, string][]).map(([level, label]) => {
                const count = wqaFacets.priorities[level as '1' | '2' | '3'];
                return (
                  <FilterItem key={level} label={label} count={count}
                    active={String(wqaFilter.priorityLevel) === level}
                    onClick={() => set('priorityLevel', Number(level))}
                    barPct={Math.round((count / maxPriority) * 100)} />
                );
              })}
            </div>
          )}
        </div>

        {/* ── Technical Action ── */}
        {techActionItems.length > 0 && (
          <div className="mb-0.5">
            <SectionHeader
              label="Technical Action"
              icon={<Settings size={14} />}
              isOpen={isOpen('techAction')}
              onToggle={() => toggle('techAction')}
              hasActive={wqaFilter.technicalAction !== 'all'}
            />
            {isOpen('techAction') && (
              <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
                <FilterItem label="All" count={total} active={wqaFilter.technicalAction === 'all'}
                  onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, technicalAction: 'all' }))} />
                {(showMoreTech ? techActionItems : techActionItems.slice(0, SHOW_ACTIONS_DEFAULT)).map(([action, count]) => (
                  <FilterItem key={action} label={action} count={count}
                    active={wqaFilter.technicalAction === action}
                    onClick={() => set('technicalAction', action)} />
                ))}
                {techActionItems.length > SHOW_ACTIONS_DEFAULT && (
                  <button
                    onClick={() => setShowMoreTech(v => !v)}
                    className="w-full text-left px-2.5 py-[5px] text-[10px] text-[#555] hover:text-[#888] transition-colors"
                  >
                    {showMoreTech ? '↑ Show less' : `+ ${techActionItems.length - SHOW_ACTIONS_DEFAULT} more`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Content Action ── */}
        {contentActionItems.length > 0 && (
          <div className="mb-0.5">
            <SectionHeader
              label="Content Action"
              icon={<FileText size={14} />}
              isOpen={isOpen('contentAction')}
              onToggle={() => toggle('contentAction')}
              hasActive={wqaFilter.contentAction !== 'all'}
            />
            {isOpen('contentAction') && (
              <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
                <FilterItem label="All" count={total} active={wqaFilter.contentAction === 'all'}
                  onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, contentAction: 'all' }))} />
                {(showMoreContent ? contentActionItems : contentActionItems.slice(0, SHOW_ACTIONS_DEFAULT)).map(([action, count]) => (
                  <FilterItem key={action} label={action} count={count}
                    active={wqaFilter.contentAction === action}
                    onClick={() => set('contentAction', action)} />
                ))}
                {contentActionItems.length > SHOW_ACTIONS_DEFAULT && (
                  <button
                    onClick={() => setShowMoreContent(v => !v)}
                    className="w-full text-left px-2.5 py-[5px] text-[10px] text-[#555] hover:text-[#888] transition-colors"
                  >
                    {showMoreContent ? '↑ Show less' : `+ ${contentActionItems.length - SHOW_ACTIONS_DEFAULT} more`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Page Value ── */}
        <div className="mb-0.5">
          <SectionHeader
            label="Page Value"
            icon={<Star size={14} />}
            isOpen={isOpen('valueTier')}
            onToggle={() => toggle('valueTier')}
            hasActive={wqaFilter.valueTier !== 'all'}
          />
          {isOpen('valueTier') && (
            <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
              <FilterItem label="All" count={total} active={wqaFilter.valueTier === 'all'}
                onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, valueTier: 'all' }))} />
              {(['★★★', '★★', '★', '☆'] as const).map(tier => (
                <FilterItem key={tier} label={VALUE_LABELS[tier]} count={wqaFacets.valueTiers[tier] ?? 0}
                  active={wqaFilter.valueTier === tier}
                  onClick={() => set('valueTier', tier)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Traffic Status ── */}
        <div className="mb-0.5">
          <SectionHeader
            label="Traffic Status"
            icon={<Activity size={14} />}
            isOpen={isOpen('trafficStatus')}
            onToggle={() => toggle('trafficStatus')}
            hasActive={wqaFilter.trafficStatus !== 'all'}
          />
          {isOpen('trafficStatus') && (
            <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
              <FilterItem label="All" count={total} active={wqaFilter.trafficStatus === 'all'}
                onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, trafficStatus: 'all' }))} />
              {(['growing', 'declining', 'stable', 'none'] as const).map(s => (
                <FilterItem key={s} label={TRAFFIC_LABELS[s]} count={wqaFacets.trafficStatuses[s] ?? 0}
                  active={wqaFilter.trafficStatus === s}
                  onClick={() => set('trafficStatus', s)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Search Status ── */}
        <div className="mb-0.5">
          <SectionHeader
            label="Search Status"
            icon={<SearchIcon size={14} />}
            isOpen={isOpen('searchStatus')}
            onToggle={() => toggle('searchStatus')}
            hasActive={wqaFilter.searchStatus !== 'all'}
          />
          {isOpen('searchStatus') && (
            <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
              <FilterItem label="All" count={total} active={wqaFilter.searchStatus === 'all'}
                onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, searchStatus: 'all' }))} />
              {(['top3', 'page1', 'striking', 'weak', 'none'] as const).map(s => (
                <FilterItem key={s} label={SEARCH_LABELS[s]} count={wqaFacets.searchStatuses[s] ?? 0}
                  active={wqaFilter.searchStatus === s}
                  onClick={() => set('searchStatus', s)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Content Age ── */}
        <div className="mb-0.5">
          <SectionHeader
            label="Content Age"
            icon={<Clock size={14} />}
            isOpen={isOpen('contentAge')}
            onToggle={() => toggle('contentAge')}
            hasActive={wqaFilter.contentAge !== 'all'}
          />
          {isOpen('contentAge') && (
            <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
              <FilterItem label="All" count={total} active={wqaFilter.contentAge === 'all'}
                onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, contentAge: 'all' }))} />
              {(['fresh', 'aging', 'stale', 'nodate'] as const).map(a => (
                <FilterItem key={a} label={AGE_LABELS[a]} count={wqaFacets.contentAges[a] ?? 0}
                  active={wqaFilter.contentAge === a}
                  onClick={() => set('contentAge', a)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Indexability ── */}
        <div className="mb-0.5">
          <SectionHeader
            label="Indexability"
            icon={<Fingerprint size={14} />}
            isOpen={isOpen('indexability')}
            onToggle={() => toggle('indexability')}
            hasActive={wqaFilter.indexability !== 'all'}
          />
          {isOpen('indexability') && (
            <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
              <FilterItem label="All" count={total} active={wqaFilter.indexability === 'all'}
                onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, indexability: 'all' }))} />
              {(['indexed', 'blocked', 'redirect', 'error'] as const).map(s => (
                <FilterItem key={s} label={INDEX_LABELS[s]} count={wqaFacets.indexabilities[s] ?? 0}
                  active={wqaFilter.indexability === s}
                  onClick={() => set('indexability', s)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Funnel Stage ── */}
        {Object.keys(wqaFacets.funnelStages).length > 1 && (
          <div className="mb-0.5">
            <SectionHeader
              label="Funnel Stage"
              icon={<Filter size={14} />}
              isOpen={isOpen('funnelStage')}
              onToggle={() => toggle('funnelStage')}
              hasActive={wqaFilter.funnelStage !== 'all'}
            />
            {isOpen('funnelStage') && (
              <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
                <FilterItem label="All" count={total} active={wqaFilter.funnelStage === 'all'}
                  onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, funnelStage: 'all' }))} />
                {Object.entries(wqaFacets.funnelStages).sort((a, b) => b[1] - a[1]).map(([stage, count]) => (
                  <FilterItem key={stage} label={FUNNEL_LABELS[stage] ?? stage} count={count}
                    active={wqaFilter.funnelStage === stage}
                    onClick={() => set('funnelStage', stage)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Industry-specific ── */}
        {showIndustry && (
          <div className="mb-0.5">
            <SectionHeader
              label={formatIndustryLabel(industry)}
              icon={<Briefcase size={14} />}
              isOpen={isOpen('industry')}
              onToggle={() => toggle('industry')}
              hasActive={wqaFilter.industryFilter !== 'all'}
            />
            {isOpen('industry') && (
              <div className="ml-[18px] pl-3 my-1 border-l border-[#222]">
                <FilterItem label="All" count={total} active={wqaFilter.industryFilter === 'all'}
                  onClick={() => setWqaFilter((prev: WqaFilterState) => ({ ...prev, industryFilter: 'all' }))} />
                {industryOptions.map(opt => (
                  <FilterItem key={opt.value} label={opt.label}
                    count={industryFacets[opt.value] ?? 0}
                    active={wqaFilter.industryFilter === opt.value}
                    onClick={() => set('industryFilter', opt.value)} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
