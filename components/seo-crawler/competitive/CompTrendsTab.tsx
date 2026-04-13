import { useMemo, useState } from 'react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import type { CompetitorProfile } from '../../../services/CompetitorMatrixConfig';
import EmptyState from './shared/EmptyState';
import HorizontalBar from './shared/HorizontalBar';
import MetricRow from './shared/MetricRow';
import { CARD, COMP_COLORS, SECTION_HEADER_WITH_MARGIN, SIDEBAR_SCROLL } from './shared/styles';

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

export default function CompTrendsTab() {
  const { competitiveState } = useSeoCrawler();
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
      return { ...m, yours, compAvg: Math.round(compAvg) };
    });
  }, [ownProfile, activeComps]);

  if (!ownProfile && activeComps.length === 0) {
    return <EmptyState message="No competitive data yet." submessage="Run a crawl and add competitors to see trends." />;
  }

  return (
    <div className={SIDEBAR_SCROLL}>
      <div className={CARD}>
        <div className={SECTION_HEADER_WITH_MARGIN}>Your Position vs Competitors</div>
        <div className="space-y-1.5">
          {metricComparison.map((m) => (
            <MetricRow
              key={m.key}
              label={m.label}
              yours={m.yours}
              compAvg={m.compAvg}
              onClick={() => setSelectedMetric(m.key)}
              selected={selectedMetric === m.key}
            />
          ))}
        </div>
      </div>

      <div className={CARD}>
        <div className={SECTION_HEADER_WITH_MARGIN}>
          {TREND_METRICS.find((m) => m.key === selectedMetric)?.label} - All Sites
        </div>
        {(() => {
          const allValues: Array<{ domain: string; value: number; isOwn: boolean }> = [];
          if (ownProfile) {
            allValues.push({
              domain: 'Your Site',
              value: Number(ownProfile[selectedMetric] || 0),
              isOwn: true,
            });
          }
          activeComps.forEach((comp) => {
            allValues.push({ domain: comp.domain, value: Number(comp[selectedMetric] || 0), isOwn: false });
          });

          allValues.sort((a, b) => b.value - a.value);
          const maxVal = Math.max(...allValues.map((v) => v.value), 1);

          return (
            <div className="space-y-1">
              {allValues.map((item, i) => (
                <HorizontalBar
                  key={item.domain}
                  label={item.domain}
                  value={item.value}
                  maxValue={maxVal}
                  color={COMP_COLORS[i % COMP_COLORS.length]}
                  isOwn={item.isOwn}
                />
              ))}
            </div>
          );
        })()}
      </div>

      <div className={CARD}>
        <div className={SECTION_HEADER_WITH_MARGIN}>Monthly Snapshot</div>
        <div className="mb-2 text-[10px] text-[#555]">This period vs. previous</div>
        <div className="space-y-1">
          {[
            { label: 'Traffic Trend', key: 'trafficTrend30d' as const, unit: '%' },
            { label: 'Content Velocity', key: 'contentVelocityTrend' as const, unit: '%' },
            { label: 'Link Velocity (60d)', key: 'linkVelocity60d' as const, unit: '' },
            { label: 'New Pages (30d)', key: 'recentNewPages' as const, unit: '' },
          ].map((row) => {
            const yours = Number(ownProfile?.[row.key] || 0);
            const compAvg =
              activeComps.length > 0
                ? Math.round(activeComps.reduce((sum, c) => sum + Number(c[row.key] || 0), 0) / activeComps.length)
                : 0;
            const youWin = yours >= compAvg;

            return (
              <div key={row.key} className="flex items-center py-1 text-[10px]">
                <span className="flex-1 text-[#888]">{row.label}</span>
                <span className={`w-[50px] text-right font-mono ${youWin ? 'text-green-400' : 'text-red-400'}`}>
                  {yours > 0 ? '+' : ''}
                  {yours}
                  {row.unit}
                </span>
                <span className="mx-1.5 w-[16px] text-center text-[#333]">vs</span>
                <span className="w-[50px] text-right font-mono text-[#666]">
                  {compAvg > 0 ? '+' : ''}
                  {compAvg}
                  {row.unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
