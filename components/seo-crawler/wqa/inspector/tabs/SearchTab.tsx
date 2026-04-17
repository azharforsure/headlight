import React from 'react';
import {
  DataRow, MetricCard, SectionHeader, StatusBadge,
  formatNumber, formatPercent,
} from '../../../inspector/shared';
import Sparkline from '../parts/Sparkline';

function seriesOf(p: any, k: string): number[] {
  const s = p?.[`${k}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function SearchTab({ page }: { page: any }) {
  const hasGsc = [page?.gscClicks, page?.gscImpressions, page?.gscCtr, page?.gscPosition]
    .some((v) => v !== null && v !== undefined);
  const topQueries = Array.isArray(page?.gscTopQueries) ? page.gscTopQueries : [];
  const siblings = Array.isArray(page?.cannibalizationSiblings) ? page.cannibalizationSiblings : [];
  const strikingKw = Array.isArray(page?.strikingDistanceKeywords) ? page.strikingDistanceKeywords : [];

  if (!hasGsc) {
    return (
      <div className="bg-[#0a0a0a] border border-[#222] rounded p-5 text-center">
        <div className="text-[14px] text-white font-semibold mb-2">Google Search Console not connected</div>
        <div className="text-[12px] text-[#666]">Connect GSC in Integrations to enable search-performance actions.</div>
      </div>
    );
  }

  const ctrGap = Number(page?.ctrGap || 0);
  const gapTone = ctrGap < -0.02 ? 'fail' : ctrGap < -0.005 ? 'warn' : 'pass';

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Clicks 28d" value={formatNumber(page?.gscClicks)} />
        <MetricCard label="Impressions 28d" value={formatNumber(page?.gscImpressions)} />
        <MetricCard label="CTR" value={formatPercent(page?.gscCtr, 100)} sub={`Gap ${formatPercent(ctrGap, 100)}`} />
        <MetricCard label="Avg position" value={formatNumber(page?.gscPosition, { maximumFractionDigits: 1 })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <SparkCard label="Clicks 28d" values={seriesOf(page, 'gscClicks')} />
        <SparkCard label="Impressions 28d" values={seriesOf(page, 'gscImpressions')} />
        <SparkCard label="CTR 28d" values={seriesOf(page, 'gscCtr')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8 mb-5">
        <div>
          <SectionHeader title="Primary keywords" />
          <DataRow label="Main KW" value={page?.mainKeyword} />
          <DataRow label="Main position" value={formatNumber(page?.mainKwPosition, { maximumFractionDigits: 1 })} />
          <DataRow label="Main volume" value={formatNumber(page?.mainKwVolume)} />
          <DataRow label="Best KW" value={page?.bestKeyword} />
          <DataRow label="Best position" value={formatNumber(page?.bestKwPosition, { maximumFractionDigits: 1 })} />
        </div>
        <div>
          <SectionHeader title="Query health" />
          <div className="flex flex-wrap gap-2 mb-2">
            <StatusBadge
              status={gapTone as any}
              label={ctrGap < 0 ? `Underperforming CTR ${formatPercent(Math.abs(ctrGap), 100)}` : 'CTR on benchmark'}
            />
            <StatusBadge
              status={page?.intentMatch === 'misaligned' ? 'warn' : 'pass'}
              label={`Intent: ${page?.intentMatch || 'unknown'}`}
            />
            <StatusBadge
              status={page?.isCannibalized ? 'fail' : 'pass'}
              label={page?.isCannibalized ? 'Cannibalized' : 'No cannibalization'}
            />
          </div>
          <DataRow
            label="Position bucket"
            value={
              Number(page?.gscPosition || 0) <= 3 ? 'Top 3'
                : Number(page?.gscPosition || 0) <= 10 ? 'Page 1'
                  : Number(page?.gscPosition || 0) <= 20 ? 'Page 2 (striking)'
                    : 'Beyond page 2'
            }
          />
          <DataRow label="Expected CTR" value={formatPercent(page?.expectedCtr, 100)} />
        </div>
      </div>

      <SectionHeader title="Top queries" />
      {topQueries.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-[12px] text-[#666] mb-5">
          No query-level rows captured for this page.
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden max-h-[320px] overflow-y-auto custom-scrollbar mb-5">
          <table className="w-full text-[11px] font-mono">
            <thead className="sticky top-0 bg-[#111] border-b border-[#222]">
              <tr>
                <th className="text-left px-3 py-2 text-[#555]">Query</th>
                <th className="text-right px-3 py-2 text-[#555]">Clicks</th>
                <th className="text-right px-3 py-2 text-[#555]">Impr.</th>
                <th className="text-right px-3 py-2 text-[#555]">CTR</th>
                <th className="text-right px-3 py-2 text-[#555]">Pos.</th>
                <th className="text-right px-3 py-2 text-[#555]">Δ Pos</th>
              </tr>
            </thead>
            <tbody>
              {topQueries.map((q: any, i: number) => (
                <tr key={`q-${i}`} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                  <td className="px-3 py-1.5 text-[#ddd]">{q?.query || q?.keyword || '—'}</td>
                  <td className="px-3 py-1.5 text-[#bbb] text-right">{formatNumber(q?.clicks)}</td>
                  <td className="px-3 py-1.5 text-[#bbb] text-right">{formatNumber(q?.impressions)}</td>
                  <td className="px-3 py-1.5 text-[#bbb] text-right">{formatPercent(q?.ctr, 100)}</td>
                  <td className="px-3 py-1.5 text-[#bbb] text-right">{formatNumber(q?.position, { maximumFractionDigits: 1 })}</td>
                  <td className={`px-3 py-1.5 text-right ${Number(q?.positionDelta || 0) < 0 ? 'text-green-400' : Number(q?.positionDelta || 0) > 0 ? 'text-red-400' : 'text-[#666]'}`}>
                    {q?.positionDelta ? formatNumber(q.positionDelta, { maximumFractionDigits: 1 }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {strikingKw.length > 0 && (
        <>
          <SectionHeader title="Striking distance for this page" />
          <div className="flex flex-wrap gap-2 mb-5">
            {strikingKw.map((k: any, i: number) => (
              <span key={i} className="px-2 py-1 rounded border border-[#222] bg-[#0a0a0a] text-[11px] text-[#ccc]">
                {k?.query} <span className="text-[#666] font-mono ml-1">pos {formatNumber(k?.position, { maximumFractionDigits: 1 })}</span>
              </span>
            ))}
          </div>
        </>
      )}

      {siblings.length > 0 && (
        <>
          <SectionHeader title="Cannibalization siblings" />
          <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden mb-2">
            <table className="w-full text-[11px] font-mono">
              <tbody>
                {siblings.map((s: any, i: number) => (
                  <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                    <td className="px-3 py-1.5 text-blue-400 break-all">{s?.url}</td>
                    <td className="px-3 py-1.5 text-[#bbb] text-right">pos {formatNumber(s?.position, { maximumFractionDigits: 1 })}</td>
                    <td className="px-3 py-1.5 text-[#bbb] text-right">cl {formatNumber(s?.clicks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SparkCard({ label, values }: { label: string; values: number[] }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
      <div className="text-[10px] uppercase tracking-widest text-[#666] mb-2">{label}</div>
      <Sparkline values={values} width={240} height={40} />
    </div>
  );
}
