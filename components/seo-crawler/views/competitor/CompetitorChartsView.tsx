import { useMemo } from 'react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { CompetitorProfile } from '../../../../services/CompetitorMatrixConfig';

const ChartCard = ({ title, children, fullWidth = false }: { title: string; children: React.ReactNode; fullWidth?: boolean }) => (
  <div className={`rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4 ${fullWidth ? 'col-span-2' : ''}`}>
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#666] mb-3">{title}</h3>
    {children}
  </div>
);

const COLORS = ['#F5364E', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
const getColor = (i: number) => COLORS[i % COLORS.length];

const normalize = (val: unknown, max = 100): number => {
  const n = Number(val);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, (n / max) * 100));
};

export default function CompetitorChartsView() {
  const { competitiveState } = useSeoCrawler();
  const { ownProfile, competitorProfiles, activeCompetitorDomains } = competitiveState;

  const allProfiles = useMemo(() => {
    const profiles: CompetitorProfile[] = [];
    if (ownProfile) profiles.push(ownProfile);
    activeCompetitorDomains.forEach((domain) => {
      const profile = competitorProfiles.get(domain);
      if (profile) profiles.push(profile);
    });
    return profiles;
  }, [ownProfile, competitorProfiles, activeCompetitorDomains]);

  const radarData = useMemo(() => {
    const dimensions = [
      { key: 'Search Visibility', fn: (p: CompetitorProfile) => normalize(p.overallSeoScore) },
      { key: 'Content Depth', fn: (p: CompetitorProfile) => normalize(p.avgWordsPerArticle, 2000) },
      { key: 'Authority', fn: (p: CompetitorProfile) => normalize(p.urlRating) },
      { key: 'Technical Health', fn: (p: CompetitorProfile) => normalize(p.techHealthScore) },
      {
        key: 'Social Presence',
        fn: (p: CompetitorProfile) => {
          const totalFollowers =
            (Number(p.facebookFans) || 0) +
            (Number(p.twitterFollowers) || 0) +
            (Number(p.instagramFollowers) || 0) +
            (Number(p.youtubeSubscribers) || 0);
          return normalize(totalFollowers, 100000);
        },
      },
      { key: 'AI Discoverability', fn: (p: CompetitorProfile) => normalize(p.avgGeoScore) },
    ];

    return dimensions.map((dim) => {
      const row: Record<string, any> = { subject: dim.key };
      allProfiles.forEach((profile) => {
        row[profile.domain] = Math.round(dim.fn(profile));
      });
      return row;
    });
  }, [allProfiles]);

  const trafficBars = useMemo(
    () =>
      allProfiles
        .map((p, i) => ({
          domain: p.domain,
          traffic: Number(p.estimatedOrganicTraffic || p.seTraffic || 0),
          fill: getColor(i),
        }))
        .sort((a, b) => b.traffic - a.traffic),
    [allProfiles]
  );

  const authorityBars = useMemo(
    () =>
      allProfiles
        .map((p, i) => ({
          domain: p.domain,
          referringDomains: Number(p.referringDomains || 0),
          fill: getColor(i),
        }))
        .sort((a, b) => b.referringDomains - a.referringDomains),
    [allProfiles]
  );

  const scoreComparisonData = useMemo(() => {
    const metrics: Array<{ key: keyof CompetitorProfile; label: string }> = [
      { key: 'techHealthScore', label: 'Health' },
      { key: 'siteSpeedScore', label: 'Speed' },
      { key: 'crawlabilityScore', label: 'Crawlability' },
      { key: 'avgGeoScore', label: 'GEO' },
      { key: 'trustSignalScore', label: 'Trust' },
      { key: 'ctaDensityScore', label: 'CTA Density' },
    ];

    return metrics.map((metric) => {
      const row: Record<string, any> = { metric: metric.label };
      allProfiles.forEach((profile) => {
        row[profile.domain] = Number(profile[metric.key] || 0);
      });
      return row;
    });
  }, [allProfiles]);

  const keywordDistributionData = useMemo(
    () =>
      allProfiles.map((profile) => {
        const top3 = Number(profile.keywordsInTop3 || 0);
        const top10Total = Number(profile.keywordsInTop10 || 0);
        const top20Total = Number(profile.keywordsInTop20 || 0);
        const total = Number(profile.totalRankingKeywords || 0);
        return {
          domain: profile.domain,
          top3,
          top10: Math.max(0, top10Total - top3),
          top20: Math.max(0, top20Total - top10Total),
          rest: Math.max(0, total - top20Total),
        };
      }),
    [allProfiles]
  );

  const socialFootprintData = useMemo(() => {
    const platforms = [
      { key: 'facebookFans', label: 'Facebook' },
      { key: 'twitterFollowers', label: 'X/Twitter' },
      { key: 'instagramFollowers', label: 'Instagram' },
      { key: 'youtubeSubscribers', label: 'YouTube' },
    ] as const;

    return platforms.map((platform) => {
      const row: Record<string, any> = { platform: platform.label };
      allProfiles.forEach((profile) => {
        row[profile.domain] = Number(profile[platform.key] || 0);
      });
      return row;
    });
  }, [allProfiles]);

  const threatRadarData = useMemo(
    () => [
      {
        subject: 'Content Threat',
        ...Object.fromEntries(allProfiles.map((profile) => [profile.domain, Number(profile.contentThreatScore || 0)])),
      },
      {
        subject: 'Authority Threat',
        ...Object.fromEntries(allProfiles.map((profile) => [profile.domain, Number(profile.authorityThreatScore || 0)])),
      },
      {
        subject: 'Innovation Threat',
        ...Object.fromEntries(allProfiles.map((profile) => [profile.domain, Number(profile.innovationThreatScore || 0)])),
      },
    ],
    [allProfiles]
  );

  const techStackData = useMemo(() => {
    const allTech = new Set<string>();
    allProfiles.forEach((profile) => {
      (profile.techStackSignals || []).forEach((tech) => allTech.add(tech));
      if (profile.cmsType) allTech.add(profile.cmsType);
    });

    return Array.from(allTech).map((tech) => {
      const row: Record<string, any> = { tech };
      allProfiles.forEach((profile) => {
        row[profile.domain] = (profile.techStackSignals || []).includes(tech) || profile.cmsType === tech;
      });
      return row;
    });
  }, [allProfiles]);

  if (allProfiles.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-[#666] text-sm">No competitor data yet.</div>;
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-[#0a0a0a]">
      <div className="mb-4">
        <ChartCard title="Multi-Dimensional Comparison" fullWidth>
          <ResponsiveContainer width="100%" height={360}>
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
                  fillOpacity={i === 0 ? 0.2 : 0.06}
                  strokeWidth={i === 0 ? 2.5 : 1.5}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Estimated Organic Traffic">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trafficBars} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="domain" tick={{ fill: '#aaa', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [v.toLocaleString(), 'Traffic']} />
              <Bar dataKey="traffic" radius={[0, 4, 4, 0]}>
                {trafficBars.map((entry) => (
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
              <YAxis type="category" dataKey="domain" tick={{ fill: '#aaa', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [v.toLocaleString(), 'Referring Domains']} />
              <Bar dataKey="referringDomains" radius={[0, 4, 4, 0]}>
                {authorityBars.map((entry) => (
                  <Cell key={entry.domain} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mb-4">
        <ChartCard title="Score Comparison" fullWidth>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={scoreComparisonData} margin={{ left: 10, right: 20 }}>
              <XAxis dataKey="metric" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {allProfiles.map((profile, i) => (
                <Bar key={profile.domain} dataKey={profile.domain} fill={getColor(i)} fillOpacity={0.75} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Keyword Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={keywordDistributionData}>
              <XAxis dataKey="domain" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="top3" stackId="a" fill="#10B981" />
              <Bar dataKey="top10" stackId="a" fill="#3B82F6" />
              <Bar dataKey="top20" stackId="a" fill="#F59E0B" />
              <Bar dataKey="rest" stackId="a" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Social Footprint">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={socialFootprintData} margin={{ left: 10, right: 20 }}>
              <XAxis dataKey="platform" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {allProfiles.map((profile, i) => (
                <Bar key={profile.domain} dataKey={profile.domain} fill={getColor(i)} fillOpacity={0.75} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mb-4">
        <ChartCard title="Threat Radar" fullWidth>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={threatRadarData}>
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
                  fillOpacity={0.08}
                  strokeWidth={1.75}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mb-4">
        <ChartCard title="Technology Stack Comparison" fullWidth>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#1a1a1e]">
                  <th className="text-left px-3 py-2 text-[10px] font-bold uppercase text-[#666]">Technology</th>
                  {allProfiles.map((profile, i) => (
                    <th key={profile.domain} className="text-center px-3 py-2 text-[10px] font-bold uppercase" style={{ color: getColor(i) }}>
                      {profile.domain}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {techStackData.map((row) => (
                  <tr key={row.tech} className="border-b border-[#111]">
                    <td className="px-3 py-1.5 text-[#aaa]">{row.tech}</td>
                    {allProfiles.map((profile, i) => (
                      <td key={profile.domain} className="text-center px-3 py-1.5">
                        {row[profile.domain] ? (
                          <span className="inline-block w-3 h-3 rounded-full" style={{ background: getColor(i) }} />
                        ) : (
                          <span className="inline-block w-3 h-3 rounded-full bg-[#1a1a1e]" />
                        )}
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
