import { useMemo, useState } from 'react';
import { Search, ArrowUpRight, Filter } from 'lucide-react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { findKeywordGaps } from '../../../../services/KeywordDiscoveryService';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { CompetitorProfile } from '../../../../services/CompetitorMatrixConfig';
import { BRAND_RED, EMPTY_STATE_BOX, EMPTY_STATE_TEXT } from '../../competitive/shared/styles';

const INTENT_STYLES: Record<string, string> = {
  informational: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  commercial: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  transactional: 'bg-green-500/10 text-green-400 border-green-500/20',
  navigational: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const DIFFICULTY_STYLES: Record<string, string> = {
  High: 'text-red-400',
  Medium: 'text-yellow-400',
  Low: 'text-green-400',
};

type GapSortKey = 'keyword' | 'intent' | 'volume' | 'position' | 'difficulty';

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 shadow-xl">
      <div className="mb-1 max-w-[280px] truncate text-[11px] font-bold text-white">{d.keyword}</div>
      <div className="space-y-0.5 text-[10px] text-[#999]">
        <div className="flex justify-between gap-4">
          <span>Position</span>
          <span className="font-mono text-white">#{d.position}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Impressions</span>
          <span className="font-mono text-white">{Number(d.impressions).toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Clicks</span>
          <span className="font-mono text-white">{Number(d.clicks).toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Opportunity</span>
          <span className={`font-mono font-bold ${d.opportunity > 60 ? 'text-[#F5364E]' : d.opportunity > 30 ? 'text-yellow-400' : 'text-blue-400'}`}>
            {d.opportunity}/100
          </span>
        </div>
      </div>
      <div className="mt-1 max-w-[280px] truncate text-[9px] text-[#555]">{d.url}</div>
    </div>
  );
}

export default function KeywordLandscapeView() {
  const { competitiveState, analysisPages } = useSeoCrawler();
  const { competitorProfiles, activeCompetitorDomains } = competitiveState;

  const [gapSort, setGapSort] = useState<GapSortKey>('volume');
  const [gapSortDir, setGapSortDir] = useState<'asc' | 'desc'>('desc');
  const [intentFilter, setIntentFilter] = useState<string>('all');

  const activeComps = useMemo(
    () =>
      activeCompetitorDomains
        .map((d) => competitorProfiles.get(d))
        .filter(Boolean) as CompetitorProfile[],
    [activeCompetitorDomains, competitorProfiles]
  );

  const scatterData = useMemo(() => {
    return analysisPages
      .filter((p: any) => (p.gscPosition || 0) > 0 && (p.gscImpressions || 0) > 0)
      .map((p: any) => ({
        url: p.url,
        keyword: p.mainKeyword || p.title?.substring(0, 50) || p.url,
        position: Math.min(100, Math.max(1, p.gscPosition)),
        impressions: p.gscImpressions,
        clicks: p.gscClicks || 0,
        opportunity: p.opportunityScore || 0,
      }))
      .sort((a: any, b: any) => b.impressions - a.impressions)
      .slice(0, 300);
  }, [analysisPages]);

  const allKeywordGaps = useMemo(() => {
    if (activeComps.length === 0) return [];
    const competitorFakePages = activeComps.flatMap((comp) => [
      ...(comp.topBlogPages || []).map((p) => ({ ...p, url: p.url || '' })),
      ...(comp.topOrganicPages || []).map((p) => ({ ...p, url: p.url || '' })),
    ]);
    return findKeywordGaps(analysisPages, competitorFakePages);
  }, [analysisPages, activeComps]);

  const filteredGaps = useMemo(() => {
    let gaps = [...allKeywordGaps];
    if (intentFilter !== 'all') {
      gaps = gaps.filter((g: any) => (g.intent || 'informational').toLowerCase() === intentFilter);
    }
    gaps.sort((a: any, b: any) => {
      const aVal = a[gapSort] ?? '';
      const bVal = b[gapSort] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return gapSortDir === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return gapSortDir === 'desc'
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });
    return gaps;
  }, [allKeywordGaps, intentFilter, gapSort, gapSortDir]);

  const stats = useMemo(() => {
    const quickWins = scatterData.filter((d) => d.position >= 4 && d.position <= 20 && d.impressions > 100).length;
    const top3Count = scatterData.filter((d) => d.position <= 3).length;
    const highOpp = scatterData.filter((d) => d.opportunity > 60).length;
    return { total: scatterData.length, quickWins, top3Count, highOpp, gapCount: allKeywordGaps.length };
  }, [scatterData, allKeywordGaps]);

  const toggleSort = (key: GapSortKey) => {
    if (gapSort === key) setGapSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setGapSort(key);
      setGapSortDir('desc');
    }
  };

  const SortArrow = ({ col }: { col: GapSortKey }) => {
    if (gapSort !== col) return null;
    return <span className="ml-0.5 text-[8px]">{gapSortDir === 'desc' ? '▼' : '▲'}</span>;
  };

  return (
    <div className="custom-scrollbar flex h-full flex-col overflow-y-auto bg-[#0a0a0a]">
      <div className="grid grid-cols-5 gap-3 border-b border-[#1a1a1e] px-5 py-4">
        {[
          { label: 'Ranking Keywords', value: stats.total, color: 'text-white' },
          { label: 'Top 3 Positions', value: stats.top3Count, color: 'text-green-400' },
          { label: 'Quick Win Zone', value: stats.quickWins, color: 'text-yellow-400' },
          { label: 'High Opportunity', value: stats.highOpp, color: 'text-[#F5364E]' },
          { label: 'Keyword Gaps', value: stats.gapCount, color: 'text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#1a1a1e] bg-[#111] px-4 py-3">
            <div className={`font-mono text-[18px] font-black ${s.color}`}>{s.value.toLocaleString()}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[#555]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="border-b border-[#1a1a1e] px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-white">Keyword Positions</h3>
            <p className="mt-0.5 text-[10px] text-[#555]">
              Each dot is a ranking keyword. Size = clicks. Color = opportunity score.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[9px] text-[#666]">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: BRAND_RED }} /> High opportunity</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" /> Medium</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#3B82F6]" /> Stable</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-2">
          {scatterData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center p-4">
              <div className={EMPTY_STATE_BOX}>
                <p className={EMPTY_STATE_TEXT}>No ranking keyword data. Connect Google Search Console to populate this chart.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                <XAxis
                  type="number"
                  dataKey="position"
                  domain={[1, 100]}
                  reversed
                  tick={{ fontSize: 10, fill: '#555' }}
                  tickLine={{ stroke: '#222' }}
                  axisLine={{ stroke: '#222' }}
                  label={{ value: '← Better Positions', position: 'insideBottomRight', offset: -4, fontSize: 9, fill: '#444' }}
                />
                <YAxis
                  type="number"
                  dataKey="impressions"
                  scale="log"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: '#555' }}
                  tickLine={{ stroke: '#222' }}
                  axisLine={{ stroke: '#222' }}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  label={{ value: 'Impressions ↑', angle: -90, position: 'insideLeft', offset: 4, fontSize: 9, fill: '#444' }}
                />
                <ZAxis type="number" dataKey="clicks" range={[30, 400]} />
                <Tooltip content={<ScatterTooltip />} cursor={false} />

                <ReferenceLine x={3} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.4} />
                <ReferenceLine x={10} stroke="#eab308" strokeDasharray="4 4" strokeOpacity={0.3} />
                <ReferenceLine x={20} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.2} />

                <Scatter data={scatterData} isAnimationActive={false}>
                  {scatterData.map((entry, i) => (
                    <Cell
                      key={`kw-${i}`}
                      fill={entry.opportunity > 60 ? '#F5364E' : entry.opportunity > 30 ? '#F59E0B' : '#3B82F6'}
                      fillOpacity={0.75}
                      stroke={entry.opportunity > 60 ? '#F5364E' : entry.opportunity > 30 ? '#F59E0B' : '#3B82F6'}
                      strokeOpacity={0.3}
                      strokeWidth={1}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-2 flex items-center gap-6 text-[9px] text-[#555]">
          <span><span className="text-green-500">|</span> Position 3 — Top results</span>
          <span><span className="text-yellow-500">|</span> Position 10 — First page</span>
          <span><span className="text-red-500">|</span> Position 20 — Second page</span>
        </div>
      </div>

      <div className="flex-1 px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-white">
              Keyword Gaps
              <span className="ml-2 font-mono text-[11px] font-normal text-[#555]">
                {filteredGaps.length} keywords
              </span>
            </h3>
            <p className="mt-0.5 text-[10px] text-[#555]">
              Keywords your competitors rank for that you don't.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={11} className="text-[#555]" />
            <select
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value)}
              className="rounded-lg border border-[#222] bg-[#111] px-2 py-1 text-[10px] text-[#ccc] outline-none focus:border-[#F5364E]/30"
            >
              <option value="all">All Intents</option>
              <option value="informational">Informational</option>
              <option value="commercial">Commercial</option>
              <option value="transactional">Transactional</option>
              <option value="navigational">Navigational</option>
            </select>
          </div>
        </div>

        {filteredGaps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#222] bg-[#111] py-12 text-center">
            <Search size={28} className="mx-auto mb-2 text-[#222]" />
            <p className="text-[12px] text-[#555]">
              {allKeywordGaps.length === 0
                ? 'No keyword gaps detected. Add more competitors or connect GSC for richer data.'
                : 'No keywords match this filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#1a1a1e]">
            <div className="custom-scrollbar max-h-[420px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-[#111]">
                  <tr className="border-b border-[#1a1a1e]">
                    {[
                      { key: 'keyword' as GapSortKey, label: 'Keyword', align: 'text-left', width: '' },
                      { key: 'intent' as GapSortKey, label: 'Intent', align: 'text-left', width: 'w-[100px]' },
                      { key: 'volume' as GapSortKey, label: 'Est. Volume', align: 'text-right', width: 'w-[100px]' },
                      { key: 'position' as GapSortKey, label: 'Comp. Position', align: 'text-right', width: 'w-[110px]' },
                      { key: 'difficulty' as GapSortKey, label: 'Difficulty', align: 'text-center', width: 'w-[90px]' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className={`cursor-pointer px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest text-[#555] transition-colors hover:text-[#999] ${col.align} ${col.width}`}
                      >
                        {col.label}
                        <SortArrow col={col.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGaps.map((gap: any, i: number) => {
                    const intent = (gap.intent || 'informational').toLowerCase();
                    const difficulty = gap.difficulty || (gap.confidence > 70 ? 'High' : gap.confidence > 40 ? 'Medium' : 'Low');
                    return (
                      <tr
                        key={`${gap.keyword}-${i}`}
                        className="border-b border-[#111] transition-colors hover:bg-[#F5364E]/[0.02]"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-[#ddd]">{gap.keyword}</span>
                            {gap.volume > 500 && <ArrowUpRight size={10} className="shrink-0 text-[#F5364E]" />}
                          </div>
                          {gap.source && (
                            <div className="mt-0.5 text-[9px] text-[#444]">from {gap.source}</div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${INTENT_STYLES[intent] || INTENT_STYLES.informational}`}>
                            {intent}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-[#ccc]">
                          {gap.volume != null ? Number(gap.volume).toLocaleString() : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-[#ccc]">
                          {gap.position != null ? `#${gap.position}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] font-bold ${DIFFICULTY_STYLES[difficulty] || 'text-[#888]'}`}>
                            {difficulty}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
