import { useMemo } from 'react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Cell, Treemap,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import type { CompetitorProfile } from '../../../../services/CompetitorMatrixConfig';

// ─── Chart card wrapper (same pattern as existing ChartsView) ───
const ChartCard = ({ title, children, fullWidth = false }: { title: string; children: React.ReactNode; fullWidth?: boolean }) => (
  <div className={`rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4 ${fullWidth ? 'col-span-2' : ''}`}>
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#666] mb-3">{title}</h3>
    {children}
  </div>
);

// ─── Palette ───
const COLORS = ['#F5364E', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
const getColor = (i: number) => COLORS[i % COLORS.length];

// ─── Normalize score 0-100 ───
const normalize = (val: any, max = 100): number => {
  const n = Number(val);
  return isNaN(n) ? 0 : Math.min(100, Math.max(0, (n / max) * 100));
};

export default function CompetitorChartsView() {
  const { ownProfile, competitorProfiles } = useSeoCrawler();

  const allProfiles = useMemo(() => {
    const profiles: CompetitorProfile[] = [];
    if (ownProfile) profiles.push(ownProfile);
    profiles.push(...competitorProfiles);
    return profiles;
  }, [ownProfile, competitorProfiles]);

  // ─── 1. Radar: Multi-Dimensional Comparison ───
  const radarData = useMemo(() => {
    const dimensions = [
      { key: 'Search Visibility',  fn: (p: CompetitorProfile) => normalize(p.overallSeoScore) },
      { key: 'Content Depth',      fn: (p: CompetitorProfile) => normalize(p.avgWordsPerArticle, 2000) },
      { key: 'Authority',          fn: (p: CompetitorProfile) => normalize(p.urlRating) },
      { key: 'Technical Health',   fn: (p: CompetitorProfile) => normalize(p.techHealthScore) },
      { key: 'Social Presence',    fn: (p: CompetitorProfile) => {
        const total = (Number(p.facebookFans) || 0) + (Number(p.twitterFollowers) || 0) +
                      (Number(p.instagramFollowers) || 0) + (Number(p.youtubeSubscribers) || 0);
        return normalize(total, 100000);
      }},
      { key: 'AI Discoverability', fn: (p: CompetitorProfile) => normalize(p.avgGeoScore) },
    ];

    return dimensions.map(dim => {
      const entry: Record<string, any> = { subject: dim.key };
      allProfiles.forEach((profile, i) => {
        entry[profile.domain] = Math.round(dim.fn(profile));
      });
      return entry;
    });
  }, [allProfiles]);

  // ─── 2. Horizontal Bar Race: Traffic ───
  const trafficBars = useMemo(() => {
    return allProfiles
      .map((p, i) => ({
        domain: p.domain,
        traffic: Number(p.estimatedOrganicTraffic || p.seTraffic || 0),
        fill: getColor(i),
      }))
      .sort((a, b) => b.traffic - a.traffic);
  }, [allProfiles]);

  // ─── 3. Authority Bars ───
  const authorityBars = useMemo(() => {
    return allProfiles
      .map((p, i) => ({
        domain: p.domain,
        referringDomains: Number(p.referringDomains || 0),
        fill: getColor(i),
      }))
      .sort((a, b) => b.referringDomains - a.referringDomains);
  }, [allProfiles]);

  // ─── 4. Content Type Distribution ───
  const contentTypeBars = useMemo(() => {
    const types = ['Blog Posts', 'Product Pages', 'Landing Pages'];
    return types.map(type => {
      const entry: Record<string, any> = { type };
      allProfiles.forEach(p => {
        if (type === 'Blog Posts') entry[p.domain] = Number(p.blogPostsPerMonth || 0) * 12;
        else if (type === 'Product Pages') entry[p.domain] = Number(p.productPageAvgWordCount ? 1 : 0) * 10;
        else entry[p.domain] = Number(p.hasTargetedLandingPages ? 5 : 0);
      });
      return entry;
    });
  }, [allProfiles]);

  // ─── 5. Tech Stack Dot Matrix ───
  const techStackData = useMemo(() => {
    const allTech = new Set<string>();
    allProfiles.forEach(p => {
      (p.techStackSignals || []).forEach(t => allTech.add(t));
      if (p.cmsType) allTech.add(p.cmsType);
    });
    return Array.from(allTech).map(tech => {
      const entry: Record<string, any> = { tech };
      allProfiles.forEach(p => {
        const has = (p.techStackSignals || []).includes(tech) || p.cmsType === tech;
        entry[p.domain] = has;
      });
      return entry;
    });
  }, [allProfiles]);

  if (allProfiles.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-[#666] text-sm">No competitor data yet.</div>;
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#0a0a0a]">
      {/* Row 1: Radar (full width) */}
      <div className="mb-4">
        <ChartCard title="Multi-Dimensional Comparison" fullWidth>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#222" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#555', fontSize: 9 }} />
              {allProfiles.map((profile, i) => (
                <Radar
                  key={profile.domain}
                  name={profile.domain}
                  dataKey={profile.domain}
                  stroke={getColor(i)}
                  fill={getColor(i)}
                  fillOpacity={i === 0 ? 0.2 : 0.05}
                  strokeWidth={i === 0 ? 2.5 : 1.5}
                />
              ))}
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#888' }}
              />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }}
                itemStyle={{ color: '#ccc' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Traffic + Authority (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Estimated Organic Traffic">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trafficBars} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="domain" tick={{ fill: '#aaa', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [v.toLocaleString(), 'Traffic']}
              />
              <Bar dataKey="traffic" radius={[0, 4, 4, 0]}>
                {trafficBars.map((entry, i) => (
                  <Cell key={entry.domain} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Referring Domains">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={authorityBars} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="domain" tick={{ fill: '#aaa', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [v.toLocaleString(), 'Referring Domains']}
              />
              <Bar dataKey="referringDomains" radius={[0, 4, 4, 0]}>
                {authorityBars.map((entry, i) => (
                  <Cell key={entry.domain} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Content Strategy (full width grouped bar) */}
      <div className="mb-4">
        <ChartCard title="Content Strategy Comparison" fullWidth>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={contentTypeBars} margin={{ left: 10, right: 20 }}>
              <XAxis dataKey="type" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {allProfiles.map((profile, i) => (
                <Bar key={profile.domain} dataKey={profile.domain} fill={getColor(i)} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 4: Tech Stack Dot Matrix */}
      <div className="mb-4">
        <ChartCard title="Technology Stack Comparison" fullWidth>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#1a1a1e]">
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase text-[#666]">Technology</th>
                  {allProfiles.map((p, i) => (
                    <th key={p.domain} className="text-center px-3 py-2 text-[10px] font-bold uppercase" style={{ color: getColor(i) }}>
                      {p.domain}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {techStackData.map(row => (
                  <tr key={row.tech} className="border-b border-[#111]">
                    <td className="px-3 py-1.5 text-[#aaa]">{row.tech}</td>
                    {allProfiles.map((p, i) => (
                      <td key={p.domain} className="text-center px-3 py-1.5">
                        {row[p.domain]
                          ? <span className="inline-block w-3 h-3 rounded-full" style={{ background: getColor(i) }} />
                          : <span className="inline-block w-3 h-3 rounded-full bg-[#1a1a1e]" />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
