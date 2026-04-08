import React, { useState } from 'react';
import ChartCard from './ChartCard';

type HeatmapRow = {
  url: string;
  lcp: number; cls: number; inp: number;
  ttfb: number; fcp: number; size: number; score: number;
};

type MetricConfig = {
  key: keyof HeatmapRow;
  label: string;
  thresholds: [number, number]; // [good, poor] boundary
  format: (v: number) => string;
  invert?: boolean; // higher = better (like score)
};

const METRICS: MetricConfig[] = [
  { key: 'lcp', label: 'LCP', thresholds: [2500, 4000], format: v => `${(v / 1000).toFixed(1)}s` },
  { key: 'cls', label: 'CLS', thresholds: [0.1, 0.25], format: v => v.toFixed(3) },
  { key: 'inp', label: 'INP', thresholds: [200, 500], format: v => `${Math.round(v)}ms` },
  { key: 'ttfb', label: 'TTFB', thresholds: [600, 1500], format: v => `${Math.round(v)}ms` },
  { key: 'fcp', label: 'FCP', thresholds: [1800, 3000], format: v => `${(v / 1000).toFixed(1)}s` },
  {
    key: 'size', label: 'Size',
    thresholds: [500000, 2000000],
    format: v => v > 1e6 ? `${(v / 1e6).toFixed(1)}MB` : `${Math.round(v / 1024)}KB`,
  },
  { key: 'score', label: 'Score', thresholds: [60, 80], format: v => String(Math.round(v)), invert: true },
];

function getCellColor(value: number, thresholds: [number, number], invert?: boolean): string {
  if (value === 0) return '#333';
  if (invert) {
    // Higher is better (score)
    if (value >= thresholds[1]) return 'rgba(74, 222, 128, 0.35)'; // green
    if (value >= thresholds[0]) return 'rgba(251, 191, 36, 0.3)'; // yellow
    return 'rgba(248, 113, 113, 0.35)'; // red
  }
  // Lower is better (LCP, CLS, etc.)
  if (value <= thresholds[0]) return 'rgba(74, 222, 128, 0.35)';
  if (value <= thresholds[1]) return 'rgba(251, 191, 36, 0.3)';
  return 'rgba(248, 113, 113, 0.35)';
}

function getCellEmoji(value: number, thresholds: [number, number], invert?: boolean): string {
  if (value === 0) return '—';
  if (invert) {
    if (value >= thresholds[1]) return '🟢';
    if (value >= thresholds[0]) return '🟡';
    return '🔴';
  }
  if (value <= thresholds[0]) return '🟢';
  if (value <= thresholds[1]) return '🟡';
  return '🔴';
}

export default function PerformanceHeatmap({ data }: { data: HeatmapRow[] }) {
  const [showValues, setShowValues] = useState(false);

  if (data.length === 0) {
    return (
      <ChartCard title="Page Performance Heatmap">
        <div className="flex items-center justify-center h-32 text-[#666] text-xs">
          No page data available.
        </div>
      </ChartCard>
    );
  }

  const truncateUrl = (url: string) => {
    try {
      const path = new URL(url).pathname;
      return path.length > 35 ? path.slice(0, 32) + '...' : path;
    } catch {
      return url.slice(0, 35);
    }
  };

  return (
    <ChartCard title="Page Performance Heatmap" className="overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[#666]">
          Top {data.length} pages by traffic
        </span>
        <button
          onClick={() => setShowValues(v => !v)}
          className="text-[10px] text-[#888] hover:text-white px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#333]"
        >
          {showValues ? 'Show Dots' : 'Show Values'}
        </button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <th className="text-left text-[#888] font-medium py-1 px-2 sticky left-0 bg-[#111112] z-10 min-w-[180px]">
                URL
              </th>
              {METRICS.map(m => (
                <th key={m.key} className="text-center text-[#888] font-medium py-1 px-3 whitespace-nowrap">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                <td className="py-1.5 px-2 text-[#ccc] font-mono sticky left-0 bg-[#111112] z-10 border-r border-[#1e1e1e]">
                  {truncateUrl(row.url)}
                </td>
                {METRICS.map(m => {
                  const val = row[m.key] as number;
                  return (
                    <td
                      key={m.key}
                      className="text-center py-1.5 px-3"
                      style={{ background: getCellColor(val, m.thresholds, m.invert) }}
                    >
                      {showValues ? (
                        <span className="text-white font-mono text-[10px]">
                          {m.format(val)}
                        </span>
                      ) : (
                        <span className="text-sm">
                          {getCellEmoji(val, m.thresholds, m.invert)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-[#666]">
        <span>🟢 Good</span>
        <span>🟡 Needs Work</span>
        <span>🔴 Poor</span>
        <span>— No data</span>
      </div>
    </ChartCard>
  );
}
