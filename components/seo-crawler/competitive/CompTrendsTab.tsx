import React, { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import type { CompetitorProfile } from '../../../services/CompetitorMatrixConfig';
import DeltaIndicator from './shared/DeltaIndicator';
import EmptyState from './shared/EmptyState';
import { COMP_COLORS, SIDEBAR_SCROLL } from './shared/styles';

type TrendMetricKey =
  | 'estimatedOrganicTraffic'
  | 'referringDomains'
  | 'totalIndexablePages'
  | 'techHealthScore'
  | 'avgGeoScore'
  | 'cwvPassRate'
  | 'schemaCoveragePct'
  | 'blogPostsPerMonth';

const TREND_METRICS: Array<{ key: TrendMetricKey; label: string }> = [
  { key: 'estimatedOrganicTraffic', label: 'Organic Traffic' },
  { key: 'referringDomains', label: 'Referring Domains' },
  { key: 'totalIndexablePages', label: 'Indexable Pages' },
  { key: 'techHealthScore', label: 'Tech Health' },
  { key: 'avgGeoScore', label: 'GEO Score' },
  { key: 'cwvPassRate', label: 'CWV Pass Rate' },
  { key: 'schemaCoveragePct', label: 'Schema Coverage' },
  { key: 'blogPostsPerMonth', label: 'Blog Posts/Mo' },
];

function PositionBar({ yours, values }: { yours: number; values: number[] }) {
  const all = [yours, ...values].filter((v) => v > 0);
  const max = Math.max(...all, 1);
  const yourPct = Math.round((yours / max) * 100);

  return (
    <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-[#1a1a1e]">
      <div className="absolute left-0 top-0 h-full rounded-full bg-[#F5364E]" style={{ width: `${yourPct}%` }} />
    </div>
  );
}

export default function CompTrendsTab() {
  const { competitiveState, crawlHistory } = useSeoCrawler();
  const { ownProfile, competitorProfiles, activeCompetitorDomains } = competitiveState;
  const [selectedMetric, setSelectedMetric] = useState<TrendMetricKey>('estimatedOrganicTraffic');

  const activeComps = useMemo(
    () => activeCompetitorDomains.map((d) => competitorProfiles.get(d)).filter(Boolean) as CompetitorProfile[],
    [activeCompetitorDomains, competitorProfiles]
  );

  const metricComparison = useMemo(() => {
    if (!ownProfile) return [];
    return TREND_METRICS.map((m) => {
      const yours = Number(ownProfile[m.key] || 0);
      const compValues = activeComps.map((c) => Number(c[m.key] || 0));
      const compAvg = compValues.length > 0 ? compValues.reduce((a, b) => a + b, 0) / compValues.length : 0;
      const diff = yours - compAvg;
      return { ...m, yours, compAvg: Math.round(compAvg), diff: Math.round(diff), compValues };
    });
  }, [ownProfile, activeComps]);

  const changeLog = useMemo(() => {
    const entries: Array<{
      date: string;
      timestamp: number;
      domain: string;
      changes: string[];
      isOwn: boolean;
    }> = [];

    if (crawlHistory && crawlHistory.length >= 2) {
      const latest = crawlHistory[0];
      const previous = crawlHistory[1];

      if (latest && previous) {
        const changes: string[] = [];
        const pageDiff = (latest.totalPages || 0) - (previous.totalPages || 0);
        if (pageDiff !== 0) {
          changes.push(`${pageDiff > 0 ? '+' : ''}${pageDiff} pages (${previous.totalPages} -> ${latest.totalPages})`);
        }
        const healthDiff = (latest.healthScore || 0) - (previous.healthScore || 0);
        if (healthDiff !== 0) {
          changes.push(`Health: ${previous.healthScore} -> ${latest.healthScore} (${healthDiff > 0 ? '+' : ''}${healthDiff})`);
        }
        if (changes.length > 0) {
          const ts = new Date(latest.startedAt).getTime();
          entries.push({
            date: new Date(latest.startedAt).toLocaleDateString(),
            timestamp: Number.isFinite(ts) ? ts : 0,
            domain: 'Your Site',
            changes,
            isOwn: true,
          });
        }
      }
    }

    activeComps.forEach((comp) => {
      const crawledAt = comp._meta?.crawledAt;
      if (!crawledAt) return;

      const changes: string[] = [];
      if (comp.trafficTrend30d && comp.trafficTrend30d !== 0) {
        changes.push(`Traffic trend: ${comp.trafficTrend30d > 0 ? '+' : ''}${comp.trafficTrend30d}%`);
      }
      if (comp.contentVelocityTrend && comp.contentVelocityTrend !== 0) {
        changes.push(`Publishing speed: ${comp.contentVelocityTrend > 0 ? '+' : ''}${comp.contentVelocityTrend}%`);
      }
      if (comp.linkVelocity60d && comp.linkVelocity60d > 0) {
        changes.push(`+${comp.linkVelocity60d} new referring domains (60d)`);
      }
      if (comp.recentNewPages && comp.recentNewPages > 0) {
        changes.push(`${comp.recentNewPages} new pages in last 30d`);
      }

      if (changes.length > 0) {
        const ts = new Date(crawledAt).getTime();
        entries.push({
          date: new Date(crawledAt).toLocaleDateString(),
          timestamp: Number.isFinite(ts) ? ts : 0,
          domain: comp.domain,
          changes,
          isOwn: false,
        });
      }
    });

    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }, [crawlHistory, activeComps]);

  if (!ownProfile && activeComps.length === 0) {
    return <EmptyState message="No competitive data yet." submessage="Run a crawl and add competitors to see trends." />;
  }

  return (
    <div className={SIDEBAR_SCROLL}>
      <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#555]">Your Position vs Competitors</div>
        <div className="space-y-2">
          {metricComparison.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`w-full rounded-lg border p-2.5 text-left transition-all ${
                selectedMetric === m.key
                  ? 'border-[#F5364E]/20 bg-[#F5364E]/5'
                  : 'border-transparent bg-transparent hover:bg-[#111]'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] text-[#888]">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-bold text-white">{m.yours.toLocaleString()}</span>
                  <span className="text-[10px] text-[#444]">vs</span>
                  <span className="font-mono text-[11px] text-[#888]">{m.compAvg.toLocaleString()}</span>
                  <span className="ml-1">
                    <DeltaIndicator diff={m.diff} size={11} />
                  </span>
                </div>
              </div>
              <PositionBar yours={m.yours} values={m.compValues} />
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
          {TREND_METRICS.find((m) => m.key === selectedMetric)?.label} - Breakdown
        </div>
        <div className="space-y-1.5">
          {ownProfile && (
            <div className="flex items-center gap-2 py-1">
              <div className="h-2 w-2 rounded-full bg-[#F5364E]" />
              <span className="flex-1 text-[11px] text-[#ccc]">Your Site</span>
              <span className="font-mono text-[12px] font-bold text-white">
                {Number(ownProfile[selectedMetric] || 0).toLocaleString()}
              </span>
            </div>
          )}
          {activeComps.map((comp, i) => {
            const val = Number(comp[selectedMetric] || 0);
            const yours = Number(ownProfile?.[selectedMetric] || 0);
            const diff = yours - val;
            return (
              <div key={comp.domain} className="flex items-center gap-2 py-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COMP_COLORS[i % COMP_COLORS.length] }} />
                <span className="flex-1 truncate text-[11px] text-[#888]">{comp.domain}</span>
                <span className="font-mono text-[11px] text-[#ccc]">{val.toLocaleString()}</span>
                {diff !== 0 && (
                  <span className={`text-[10px] font-mono ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {diff > 0 ? '+' : ''}
                    {diff.toLocaleString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={12} className="text-[#555]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#555]">Change Log</span>
        </div>

        {changeLog.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#222] bg-[#0a0a0c] py-6 text-center text-[11px] text-[#444]">
            No changes detected yet. Run multiple crawls to track competitor movements.
          </div>
        ) : (
          <div className="space-y-3">
            {changeLog.map((entry, i) => (
              <div key={`${entry.domain}-${i}`} className="border-l-2 border-[#222] py-1 pl-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${entry.isOwn ? 'text-[#F5364E]' : 'text-[#ccc]'}`}>{entry.domain}</span>
                  <span className="text-[9px] text-[#444]">{entry.date}</span>
                </div>
                <ul className="space-y-0.5">
                  {entry.changes.map((change, j) => (
                    <li key={j} className="text-[10px] text-[#888]">
                      • {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
