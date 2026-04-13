import { useMemo, useState } from 'react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#F5364E', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
const METRICS = [
  { id: 'overallSeoScore',   label: 'SEO Score' },
  { id: 'referringDomains',  label: 'Referring Domains' },
  { id: 'pagesIndexed',      label: 'Pages Indexed' },
  { id: 'techHealthScore',   label: 'Technical Health' },
  { id: 'avgGeoScore',       label: 'AI Discoverability' },
] as const;

export default function CompetitorTimelineView() {
  const { ownProfile, competitorProfiles } = useSeoCrawler();
  const [selectedMetric, setSelectedMetric] = useState<string>('overallSeoScore');

  const allProfiles = useMemo(() => {
    const profiles = [];
    if (ownProfile) profiles.push(ownProfile);
    profiles.push(...competitorProfiles);
    return profiles;
  }, [ownProfile, competitorProfiles]);

  // Since we don't have historical crawl data per competitor yet,
  // show a single-point "current snapshot" comparison as a bar-like line chart.
  // When history is available, this will become a true time series.
  const snapshotData = useMemo(() => {
    // Single point for now — "Current"
    const point: Record<string, any> = { date: 'Current' };
    allProfiles.forEach(p => {
      point[p.domain] = Number((p as any)[selectedMetric] || 0);
    });
    return [point];
  }, [allProfiles, selectedMetric]);

  // Delta table: compare own vs each competitor on the selected metric
  const deltaRows = useMemo(() => {
    if (!ownProfile) return [];
    const ownVal = Number((ownProfile as any)[selectedMetric] || 0);
    return competitorProfiles.map(comp => {
      const compVal = Number((comp as any)[selectedMetric] || 0);
      const delta = ownVal - compVal;
      return {
        domain: comp.domain,
        value: compVal,
        ownValue: ownVal,
        delta,
        status: delta > 0 ? 'ahead' : delta < 0 ? 'behind' : 'tied',
      };
    });
  }, [ownProfile, competitorProfiles, selectedMetric]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#0a0a0a]">
      {/* Metric selector */}
      <div className="flex items-center gap-2 mb-4">
        {METRICS.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMetric(m.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border
              ${selectedMetric === m.id
                ? 'bg-[#F5364E]/10 text-[#F5364E] border-[#F5364E]/20'
                : 'text-[#888] border-[#222] hover:bg-[#1a1a1e] hover:text-[#ccc]'
              }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4 mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#666] mb-3">
          {METRICS.find(m => m.id === selectedMetric)?.label || selectedMetric} — Comparison
        </h3>
        <p className="text-[10px] text-[#555] mb-3">
          Historical trends will appear here after multiple crawls. Currently showing the latest snapshot.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={snapshotData}>
            <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {allProfiles.map((profile, i) => (
              <Line
                key={profile.domain}
                type="monotone"
                dataKey={profile.domain}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={i === 0 ? 3 : 1.5}
                dot={{ r: 6, fill: COLORS[i % COLORS.length] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Delta Table */}
      <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#666] mb-3">
          Your Position vs. Competitors
        </h3>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#1a1a1e]">
              <th className="text-left px-3 py-2 text-[10px] font-bold uppercase text-[#666]">Competitor</th>
              <th className="text-center px-3 py-2 text-[10px] font-bold uppercase text-[#666]">Their Value</th>
              <th className="text-center px-3 py-2 text-[10px] font-bold uppercase text-[#666]">Your Value</th>
              <th className="text-center px-3 py-2 text-[10px] font-bold uppercase text-[#666]">Delta</th>
              <th className="text-center px-3 py-2 text-[10px] font-bold uppercase text-[#666]">Status</th>
            </tr>
          </thead>
          <tbody>
            {deltaRows.map(row => (
              <tr key={row.domain} className="border-b border-[#111]">
                <td className="px-3 py-2 text-white font-medium">{row.domain}</td>
                <td className="px-3 py-2 text-center text-[#aaa] font-mono">{row.value.toLocaleString()}</td>
                <td className="px-3 py-2 text-center text-[#F5364E] font-mono font-bold">{row.ownValue.toLocaleString()}</td>
                <td className={`px-3 py-2 text-center font-mono font-bold ${
                  row.delta > 0 ? 'text-green-400' : row.delta < 0 ? 'text-red-400' : 'text-[#888]'
                }`}>
                  {row.delta > 0 ? '+' : ''}{row.delta.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    row.status === 'ahead' ? 'bg-green-500/10 text-green-400' :
                    row.status === 'behind' ? 'bg-red-500/10 text-red-400' :
                    'bg-[#1a1a1e] text-[#888]'
                  }`}>
                    {row.status === 'ahead' ? '🔺 AHEAD' : row.status === 'behind' ? '🔻 BEHIND' : '— TIED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
