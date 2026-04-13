import { useMemo, useState, Fragment } from 'react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import {
  COMPARISON_ROWS,
  type CompetitorProfile,
  type ComparisonRowDef,
} from '../../../../services/CompetitorMatrixConfig';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ChevronsUpDown,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────
function getProfileValue(
  profile: CompetitorProfile | null,
  profileKey: string
): any {
  if (!profile) return null;
  const parts = profileKey.split('.');
  let val: any = profile;
  for (const part of parts) {
    if (val == null) return null;
    val = val[part];
  }
  return val;
}

function formatCell(value: any, format: string): string {
  if (value == null || value === '') return '—';
  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'score_100':
      return `${value}/100`;
    case 'percentage':
      return `${(Number(value) * 100).toFixed(1)}%`;
    case 'currency':
      return typeof value === 'number'
        ? `$${value.toLocaleString()}`
        : `$${String(value)}`;
    case 'boolean':
      return value ? '✅' : '❌';
    case 'url': {
      try {
        const u = new URL(String(value));
        return u.pathname === '/' ? u.hostname : u.pathname;
      } catch {
        return String(value);
      }
    }
    case 'list':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'manual_text':
    case 'manual_boolean':
    case 'text':
    default:
      if (format === 'manual_boolean') return value ? '✅' : '❌';
      return String(value);
  }
}

type CellComparison = 'winning' | 'losing' | 'tie' | 'neutral';

function compareCells(
  ownVal: any,
  compVal: any,
  format: string
): CellComparison {
  if (ownVal == null || compVal == null) return 'neutral';
  if (format === 'boolean' || format === 'manual_boolean') {
    return ownVal === compVal ? 'tie' : ownVal ? 'winning' : 'losing';
  }
  if (['text', 'manual_text', 'url', 'list'].includes(format)) {
    return 'neutral';
  }
  const ownNum = Number(ownVal);
  const compNum = Number(compVal);
  if (isNaN(ownNum) || isNaN(compNum)) return 'neutral';
  if (ownNum > compNum) return 'winning';
  if (ownNum < compNum) return 'losing';
  return 'tie';
}

const CELL_TEXT: Record<CellComparison, string> = {
  winning: 'text-green-400',
  losing: 'text-red-400',
  tie: 'text-[#888]',
  neutral: 'text-[#ccc]',
};

const CELL_BG: Record<CellComparison, string> = {
  winning: 'bg-green-500/5',
  losing: 'bg-red-500/5',
  tie: '',
  neutral: '',
};

// ─── Trend indicator ───
function TrendArrow({ comparison }: { comparison: CellComparison }) {
  if (comparison === 'winning') {
    return <span className="ml-1 text-[9px] text-green-500">▲</span>;
  }
  if (comparison === 'losing') {
    return <span className="ml-1 text-[9px] text-red-500">▼</span>;
  }
  return null;
}

// ─── Component ──────────────────────────────────
export default function CompetitorMatrixGrid() {
  const { competitiveState } = useSeoCrawler();
  const { ownProfile, competitorProfiles, activeCompetitorDomains } =
    competitiveState;

  const activeComps = useMemo(
    () =>
      activeCompetitorDomains
        .map((d) => competitorProfiles.get(d))
        .filter(Boolean) as CompetitorProfile[],
    [activeCompetitorDomains, competitorProfiles]
  );

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );

  // Group rows by category
  const groupedRows = useMemo(() => {
    const groups: { category: string; rows: ComparisonRowDef[] }[] = [];
    let currentCategory = '';
    let currentRows: ComparisonRowDef[] = [];

    for (const row of COMPARISON_ROWS) {
      if (row.category !== currentCategory) {
        if (currentRows.length > 0) {
          groups.push({ category: currentCategory, rows: currentRows });
        }
        currentCategory = row.category;
        currentRows = [];
      }
      currentRows.push(row);
    }
    if (currentRows.length > 0) {
      groups.push({ category: currentCategory, rows: currentRows });
    }
    return groups;
  }, []);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleAll = () => {
    const allCategories = groupedRows.map((g) => g.category);
    if (collapsedCategories.size === allCategories.length) {
      // All collapsed → expand all
      setCollapsedCategories(new Set());
    } else {
      // Collapse all
      setCollapsedCategories(new Set(allCategories));
    }
  };

  // Win/loss counters per competitor
  const winLossCounts = useMemo(() => {
    return activeComps.map((comp) => {
      let wins = 0;
      let losses = 0;
      let ties = 0;
      for (const row of COMPARISON_ROWS) {
        const ownVal = getProfileValue(ownProfile, String(row.profileKey));
        const compVal = getProfileValue(comp, String(row.profileKey));
        const result = compareCells(ownVal, compVal, row.format);
        if (result === 'winning') wins++;
        else if (result === 'losing') losses++;
        else if (result === 'tie') ties++;
      }
      return { domain: comp.domain, wins, losses, ties };
    });
  }, [ownProfile, activeComps]);

  const allProfiles = [ownProfile, ...activeComps].filter(
    Boolean
  ) as CompetitorProfile[];
  const compCount = allProfiles.length;

  if (compCount === 0) return null;

  const allCollapsed = collapsedCategories.size === groupedRows.length;

  return (
    <div className="h-full overflow-auto custom-scrollbar bg-[#0a0a0a]">
      <table className="w-full border-collapse text-[11px]">
        {/* ─── Sticky Header ─── */}
        <thead className="sticky top-0 z-20">
          <tr className="bg-[#0d0d0f] border-b border-[#222]">
            <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-[#555] min-w-[200px] bg-[#0d0d0f]">
              <div className="flex items-center gap-2">
                <span>Metric</span>
                <button
                  onClick={toggleAll}
                  className="p-0.5 rounded hover:bg-[#222] text-[#555] hover:text-[#aaa] transition-colors"
                  title={allCollapsed ? 'Expand all' : 'Collapse all'}
                >
                  <ChevronsUpDown size={12} />
                </button>
              </div>
            </th>
            {allProfiles.map((profile, i) => (
              <th
                key={profile.domain}
                className={`py-2.5 px-3 text-center min-w-[140px] ${
                  i === 0 ? 'bg-[#F5364E]/[0.03]' : 'bg-[#0d0d0f]'
                }`}
              >
                <div className="text-[11px] font-bold text-white truncate max-w-[130px] mx-auto">
                  {profile.domain}
                </div>
                {i === 0 && (
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#F5364E]">
                    YOU
                  </span>
                )}
                {i > 0 && winLossCounts[i - 1] && (
                  <div className="text-[9px] mt-0.5">
                    <span className="text-green-400 font-bold">
                      {winLossCounts[i - 1].wins}W
                    </span>
                    <span className="text-[#333] mx-0.5">/</span>
                    <span className="text-red-400 font-bold">
                      {winLossCounts[i - 1].losses}L
                    </span>
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groupedRows.map((group) => {
            const isCollapsed = collapsedCategories.has(group.category);
            return (
              <Fragment key={group.category}>
                {/* Category header row */}
                <tr
                  onClick={() => toggleCategory(group.category)}
                  className="cursor-pointer bg-[#111] border-y border-[#1a1a1e] hover:bg-[#151518] transition-colors"
                >
                  <td colSpan={compCount + 1} className="py-2 px-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#666]">
                      {isCollapsed ? (
                        <ChevronRight size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                      {group.category}
                      <span className="text-[9px] font-normal text-[#444] ml-1">
                        ({group.rows.length})
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Data rows */}
                {!isCollapsed &&
                  group.rows.map((row) => {
                    const ownVal = getProfileValue(
                      ownProfile,
                      String(row.profileKey)
                    );
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-[#111] hover:bg-[#0e0e12] transition-colors"
                      >
                        <td className="py-1.5 px-3 text-[11px] text-[#888]">
                          <div className="flex items-center gap-1">
                            {row.label}
                            {row.tooltip && (
                              <span
                                title={row.tooltip}
                                className="text-[#333] cursor-help"
                              >
                                ⓘ
                              </span>
                            )}
                          </div>
                        </td>
                        {allProfiles.map((profile, i) => {
                          const val = getProfileValue(
                            profile,
                            String(row.profileKey)
                          );
                          const comparison: CellComparison =
                            i === 0
                              ? 'neutral'
                              : compareCells(ownVal, val, row.format);
                          const formatted = formatCell(val, row.format);
                          const isUrl = row.format === 'url' && val;
                          return (
                            <td
                              key={`${row.id}-${profile.domain}`}
                              className={`py-1.5 px-3 text-center font-mono text-[11px] ${
                                i === 0
                                  ? 'text-white bg-[#F5364E]/[0.03]'
                                  : `${CELL_TEXT[comparison]} ${CELL_BG[comparison]}`
                              }`}
                            >
                              {isUrl ? (
                                <a
                                  href={String(val)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  {formatted}
                                  <ExternalLink size={9} />
                                </a>
                              ) : (
                                <span>
                                  {formatted}
                                  {i > 0 && (
                                    <TrendArrow comparison={comparison} />
                                  )}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
