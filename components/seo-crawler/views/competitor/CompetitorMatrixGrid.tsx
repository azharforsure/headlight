import { useMemo, useState, Fragment } from 'react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { COMPARISON_ROWS, type CompetitorProfile, type ComparisonRowDef } from '../../../../services/CompetitorMatrixConfig';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────
function getProfileValue(profile: CompetitorProfile | null, profileKey: string): any {
  if (!profile) return null;
  // Handle nested keys like "topBlogPages.0.url"
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
    case 'number': return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'score_100': return `${value}/100`;
    case 'percentage': return `${(Number(value) * 100).toFixed(1)}%`;
    case 'boolean': return value ? '✅' : '❌';
    case 'url': {
      try {
        return new URL(String(value)).pathname === '/' ? String(value) : new URL(String(value)).pathname;
      } catch { return String(value); }
    }
    case 'manual_text':
    case 'text':
    default:
      return String(value);
  }
}

type CellComparison = 'winning' | 'losing' | 'tie' | 'neutral';

function compareCells(ownVal: any, compVal: any, format: string): CellComparison {
  if (ownVal == null || compVal == null) return 'neutral';
  if (format === 'boolean') return ownVal === compVal ? 'tie' : ownVal ? 'winning' : 'losing';
  if (format === 'text' || format === 'manual_text' || format === 'url') return 'neutral';
  const ownNum = Number(ownVal);
  const compNum = Number(compVal);
  if (isNaN(ownNum) || isNaN(compNum)) return 'neutral';
  if (ownNum > compNum) return 'winning';
  if (ownNum < compNum) return 'losing';
  return 'tie';
}

const COMPARISON_COLORS: Record<CellComparison, string> = {
  winning: 'text-green-400',
  losing: 'text-red-400',
  tie: 'text-[#888]',
  neutral: 'text-[#ccc]',
};

const COMPARISON_BG: Record<CellComparison, string> = {
  winning: 'bg-green-500/5',
  losing: 'bg-red-500/5',
  tie: '',
  neutral: '',
};

export default function CompetitorMatrixGrid() {
  const { ownProfile, competitorProfiles } = useSeoCrawler();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

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
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Win/loss counters per competitor
  const winLossCounts = useMemo(() => {
    return competitorProfiles.map(comp => {
      let wins = 0, losses = 0, ties = 0;
      for (const row of COMPARISON_ROWS) {
        const ownVal = getProfileValue(ownProfile, row.profileKey);
        const compVal = getProfileValue(comp, row.profileKey);
        const result = compareCells(ownVal, compVal, row.format);
        if (result === 'winning') wins++;
        else if (result === 'losing') losses++;
        else if (result === 'tie') ties++;
      }
      return { domain: comp.domain, wins, losses, ties };
    });
  }, [ownProfile, competitorProfiles]);

  const allProfiles = [ownProfile, ...competitorProfiles].filter(Boolean) as CompetitorProfile[];
  const compCount = allProfiles.length;

  if (compCount === 0) return null;

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <table className="w-full border-collapse text-[11px]">
        {/* Header */}
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#0d0d0f] border-b border-[#222]">
            <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#666] w-[280px] min-w-[280px] bg-[#0d0d0f] sticky left-0 z-20">
              Metric
            </th>
            {allProfiles.map((profile, i) => (
              <th key={profile.domain} className="text-center px-3 py-3 min-w-[160px] bg-[#0d0d0f]">
                <div className="flex flex-col items-center gap-1">
                  <span className={`text-[11px] font-bold ${i === 0 ? 'text-[#F5364E]' : 'text-white'}`}>
                    {profile.domain}
                  </span>
                  {i === 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F5364E]/10 text-[#F5364E]">YOU</span>
                  )}
                  {i > 0 && winLossCounts[i - 1] && (
                    <span className="text-[9px] text-[#666]">
                      <span className="text-green-400">{winLossCounts[i - 1].wins}W</span>
                      {' / '}
                      <span className="text-red-400">{winLossCounts[i - 1].losses}L</span>
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupedRows.map(group => {
            const isCollapsed = collapsedCategories.has(group.category);
            return (
              <Fragment key={group.category}>
                {/* Category header row */}
                <tr
                  onClick={() => toggleCategory(group.category)}
                  className="cursor-pointer bg-[#111] border-y border-[#1a1a1e] hover:bg-[#151518] transition-colors"
                >
                  <td
                    colSpan={compCount + 1}
                    className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#999] sticky left-0 bg-[#111]"
                  >
                    <span className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      {group.category}
                      <span className="text-[#555] font-normal">({group.rows.length})</span>
                    </span>
                  </td>
                </tr>
                {/* Data rows */}
                {!isCollapsed && group.rows.map(row => {
                  const ownVal = getProfileValue(ownProfile, row.profileKey);
                  return (
                    <tr key={row.id} className="border-b border-[#111] hover:bg-[#0e0e10] transition-colors">
                      <td className="px-4 py-2 text-[#aaa] sticky left-0 bg-[#0a0a0a] z-10" title={row.tooltip}>
                        {row.label}
                      </td>
                      {allProfiles.map((profile, i) => {
                        const val = getProfileValue(profile, row.profileKey);
                        const comparison: CellComparison = i === 0
                          ? 'neutral'
                          : compareCells(ownVal, val, row.format);
                        const formatted = formatCell(val, row.format);
                        const isUrl = row.format === 'url' && val;
                        return (
                          <td
                            key={profile.domain}
                            className={`px-3 py-2 text-center font-mono text-[11px] ${COMPARISON_COLORS[comparison]} ${COMPARISON_BG[comparison]}`}
                          >
                            {isUrl ? (
                              <a href={String(val)} target="_blank" rel="noopener noreferrer"
                                className="text-blue-400 hover:underline inline-flex items-center gap-1">
                                {formatted} <ExternalLink size={9} />
                              </a>
                            ) : (
                              formatted
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
