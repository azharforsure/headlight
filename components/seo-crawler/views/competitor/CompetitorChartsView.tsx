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
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid,
} from 'recharts';
import type { CompetitorProfile } from '../../../../services/CompetitorMatrixConfig';
import {
  BRAND_RED,
  COMP_COLORS,
  EMPTY_STATE_BOX,
  EMPTY_STATE_TEXT,
  SECTION_HEADER_WITH_MARGIN,
  YOU_BADGE,
} from '../../competitive/shared/styles';

const COLORS = [BRAND_RED, ...COMP_COLORS];
const getColor = (i: number) => COLORS[i % COLORS.length];

const normalize = (val: unknown, max = 100): number => {
  const n = Number(val);
  if (Number.isNaN(n) || max === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((n / max) * 100)));
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className={SECTION_HEADER_WITH_MARGIN}>{title}</h3>
      {children}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4 ${className}`}>
      <div className="mb-3">
        <div className="text-[11px] font-semibold text-[#888]">{title}</div>
        {subtitle && <div className="mt-0.5 text-[9px] text-[#555]">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function GaugeMeter({ value, label }: { value: number; label: string; maxLabel?: string }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color = clampedValue >= 70 ? '#22c55e' : clampedValue >= 40 ? '#eab308' : '#ef4444';
  return (
    <div className="text-center">
      <div className="relative mx-auto h-16 w-16">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1e" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${clampedValue * 2.64} 264`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[14px] font-black text-white">{clampedValue}</span>
        </div>
      </div>
      <div className="mt-1 max-w-[80px] truncate text-[9px] text-[#666]">{label}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 shadow-xl">
      {label && <div className="mb-1 text-[10px] font-bold text-white">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[10px]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-[#888]">{p.name || p.dataKey}</span>
          <span className="ml-auto font-mono text-white">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

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
      { key: 'Search', fn: (p: CompetitorProfile) => normalize(p.overallSeoScore) },
      { key: 'Content', fn: (p: CompetitorProfile) => normalize(p.totalIndexablePages, 2000) },
      { key: 'Authority', fn: (p: CompetitorProfile) => normalize(p.urlRating) },
      { key: 'Tech', fn: (p: CompetitorProfile) => normalize(p.techHealthScore) },
      { key: 'UX', fn: (p: CompetitorProfile) => normalize(p.trustSignalScore) },
      {
        key: 'Social',
        fn: (p: CompetitorProfile) => {
          const total =
            (Number(p.facebookFans) || 0) +
            (Number(p.twitterFollowers) || 0) +
            (Number(p.instagramFollowers) || 0) +
            (Number(p.youtubeSubscribers) || 0);
          return normalize(total, 100000);
        },
      },
      { key: 'AI Ready', fn: (p: CompetitorProfile) => normalize(p.avgGeoScore) },
      { key: 'Freshness', fn: (p: CompetitorProfile) => normalize(p.contentFreshnessScore) },
    ];
    return dimensions.map((dim) => {
      const row: Record<string, string | number> = { subject: dim.key };
      allProfiles.forEach((profile) => {
        row[profile.domain] = dim.fn(profile);
      });
      return row;
    });
  }, [allProfiles]);

  const scoreRanking = useMemo(
    () =>
      allProfiles
        .map((p, i) => ({
          domain: p.domain,
          score: Number(p.overallSeoScore || 0),
          fill: getColor(i),
          isOwn: i === 0 && !!ownProfile,
        }))
        .sort((a, b) => b.score - a.score),
    [allProfiles, ownProfile]
  );

  const keywordDistData = useMemo(
    () =>
      allProfiles.map((p) => {
        const top3 = Number(p.keywordsInTop3 || 0);
        const top10 = Math.max(0, Number(p.keywordsInTop10 || 0) - top3);
        const top20 = Math.max(0, Number(p.keywordsInTop20 || 0) - top3 - top10);
        const rest = Math.max(0, Number(p.totalRankingKeywords || 0) - top3 - top10 - top20);
        return { domain: p.domain, 'Top 3': top3, 'Top 10': top10, 'Top 20': top20, Rest: rest };
      }),
    [allProfiles]
  );

  const trafficData = useMemo(
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

  const sovData = useMemo(() => {
    const total = allProfiles.reduce((sum, p) => sum + Number(p.totalRankingKeywords || 0), 0);
    if (total === 0) return [];
    return allProfiles.map((p, i) => ({
      name: p.domain,
      value: Number(p.totalRankingKeywords || 0),
      fill: getColor(i),
    }));
  }, [allProfiles]);

  const authorityScatter = useMemo(
    () =>
      allProfiles.map((p, i) => ({
        domain: p.domain,
        referringDomains: Number(p.referringDomains || 0),
        traffic: Number(p.estimatedOrganicTraffic || p.seTraffic || 0),
        authority: Number(p.domainAuthority || p.urlRating || 0),
        fill: getColor(i),
      })),
    [allProfiles]
  );

  const contentBubble = useMemo(
    () =>
      allProfiles.map((p, i) => ({
        domain: p.domain,
        pages: Number(p.totalIndexablePages || 0),
        freshness: Number(p.contentFreshnessScore || 0),
        traffic: Number(p.estimatedOrganicTraffic || 0),
        fill: getColor(i),
      })),
    [allProfiles]
  );

  const aiData = useMemo(() => {
    const metrics = [
      { key: 'avgGeoScore', label: 'GEO Score' },
      { key: 'avgCitationWorthiness', label: 'Citation' },
      { key: 'passageReadyPct', label: 'Passage Ready' },
      { key: 'featuredSnippetReadyPct', label: 'Snippet Ready' },
    ] as const;
    return metrics.map((m) => {
      const row: Record<string, string | number> = { metric: m.label };
      allProfiles.forEach((p) => {
        row[p.domain] = Number((p as any)[m.key] || 0);
      });
      return row;
    });
  }, [allProfiles]);

  const socialData = useMemo(() => {
    const platforms = [
      { key: 'facebookFans', label: 'Facebook' },
      { key: 'twitterFollowers', label: 'X/Twitter' },
      { key: 'instagramFollowers', label: 'Instagram' },
      { key: 'youtubeSubscribers', label: 'YouTube' },
    ] as const;
    return platforms.map((pl) => {
      const row: Record<string, string | number> = { platform: pl.label };
      allProfiles.forEach((p) => {
        row[p.domain] = Number((p as any)[pl.key] || 0);
      });
      return row;
    });
  }, [allProfiles]);

  const techStackData = useMemo(() => {
    const allTech = new Set<string>();
    allProfiles.forEach((p) => {
      (p.techStackSignals || []).forEach((t) => allTech.add(t));
      if (p.cmsType) allTech.add(p.cmsType);
    });
    return Array.from(allTech).map((tech) => {
      const row: Record<string, any> = { tech };
      allProfiles.forEach((p) => {
        row[p.domain] = (p.techStackSignals || []).includes(tech) || p.cmsType === tech;
      });
      return row;
    });
  }, [allProfiles]);

  if (allProfiles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a] p-8">
        <div className={EMPTY_STATE_BOX}>
          <p className={EMPTY_STATE_TEXT}>No competitor data yet. Add competitors and run a crawl.</p>
        </div>
      </div>
    );
  }

  const profileLegend = allProfiles.map((p, i) => ({
    domain: p.domain,
    color: getColor(i),
    isOwn: i === 0 && !!ownProfile,
  }));

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-[#0a0a0a] p-5 space-y-5">
      <div className="mb-5 flex flex-wrap items-center gap-4">
        {profileLegend.map((p) => (
          <div key={p.domain} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className={`text-[10px] font-bold ${p.isOwn ? 'text-white' : 'text-[#888]'}`}>
              {p.domain} {p.isOwn && <span className={YOU_BADGE}>YOU</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <Section title="Big Picture">
          <div className="grid grid-cols-2 gap-3">
            <ChartCard title="Competitive Radar" subtitle="8-dimension comparison across all competitors">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#1a1a1e" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#666' }} />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  {allProfiles.map((p, i) => (
                    <Radar
                      key={p.domain}
                      name={p.domain}
                      dataKey={p.domain}
                      stroke={getColor(i)}
                      fill={getColor(i)}
                      fillOpacity={i === 0 ? 0.15 : 0.05}
                      strokeWidth={i === 0 ? 2 : 1.5}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Overall SEO Score" subtitle="All competitors ranked by composite score">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreRanking} layout="vertical" margin={{ left: 4, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#555' }} axisLine={{ stroke: '#222' }} />
                  <YAxis
                    dataKey="domain"
                    type="category"
                    width={110}
                    tick={{ fontSize: 10, fill: '#888' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff06' }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                    {scoreRanking.map((entry, i) => (
                      <Cell key={`sc-${i}`} fill={entry.fill} fillOpacity={entry.isOwn ? 1 : 0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </Section>

        <Section title="Search Visibility">
          <div className="grid grid-cols-3 gap-3">
            <ChartCard title="Keyword Distribution" subtitle="Keywords by ranking position">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={keywordDistData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                  <XAxis
                    dataKey="domain"
                    tick={{ fontSize: 8, fill: '#666' }}
                    axisLine={{ stroke: '#222' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis tick={{ fontSize: 9, fill: '#555' }} axisLine={{ stroke: '#222' }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff06' }} />
                  <Bar dataKey="Top 3" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Top 10" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Top 20" stackId="a" fill="#a855f7" />
                  <Bar dataKey="Rest" stackId="a" fill="#374151" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Organic Traffic" subtitle="Estimated monthly organic visits">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trafficData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                  <XAxis
                    dataKey="domain"
                    tick={{ fontSize: 8, fill: '#666' }}
                    axisLine={{ stroke: '#222' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#555' }}
                    axisLine={{ stroke: '#222' }}
                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff06' }} />
                  <Bar dataKey="traffic" radius={[4, 4, 0, 0]} barSize={28}>
                    {trafficData.map((e, i) => (
                      <Cell key={`tr-${i}`} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Share of Voice" subtitle="Keyword universe split by site">
              {sovData.length === 0 ? (
                <div className="flex h-[220px] items-center justify-center text-[11px] text-[#555]">No keyword data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={sovData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {sovData.map((e, i) => (
                        <Cell key={`sv-${i}`} fill={e.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </Section>

        <Section title="Content & Authority">
          <div className="grid grid-cols-2 gap-3">
            <ChartCard title="Content Volume vs Freshness" subtitle="X = pages, Y = freshness %, bubble size = traffic">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ bottom: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                  <XAxis
                    type="number"
                    dataKey="pages"
                    tick={{ fontSize: 9, fill: '#555' }}
                    axisLine={{ stroke: '#222' }}
                    label={{ value: 'Pages', position: 'insideBottomRight', offset: -4, fontSize: 9, fill: '#444' }}
                  />
                  <YAxis
                    type="number"
                    dataKey="freshness"
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: '#555' }}
                    axisLine={{ stroke: '#222' }}
                    label={{
                      value: 'Freshness %',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 4,
                      fontSize: 9,
                      fill: '#444',
                    }}
                  />
                  <ZAxis type="number" dataKey="traffic" range={[60, 600]} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.[0]?.payload) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 shadow-xl">
                          <div className="text-[10px] font-bold text-white">{d.domain}</div>
                          <div className="mt-1 space-y-0.5 text-[9px] text-[#999]">
                            <div>
                              Pages: <span className="font-mono text-white">{d.pages.toLocaleString()}</span>
                            </div>
                            <div>
                              Freshness: <span className="font-mono text-white">{d.freshness}%</span>
                            </div>
                            <div>
                              Traffic: <span className="font-mono text-white">{d.traffic.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={contentBubble} isAnimationActive={false}>
                    {contentBubble.map((e, i) => (
                      <Cell key={`cb-${i}`} fill={e.fill} fillOpacity={0.75} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Authority Landscape" subtitle="X = referring domains, Y = traffic, bubble size = authority">
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ bottom: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                  <XAxis
                    type="number"
                    dataKey="referringDomains"
                    tick={{ fontSize: 9, fill: '#555' }}
                    axisLine={{ stroke: '#222' }}
                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                    label={{
                      value: 'Referring Domains',
                      position: 'insideBottomRight',
                      offset: -4,
                      fontSize: 9,
                      fill: '#444',
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="traffic"
                    tick={{ fontSize: 9, fill: '#555' }}
                    axisLine={{ stroke: '#222' }}
                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                    label={{ value: 'Traffic', angle: -90, position: 'insideLeft', offset: 4, fontSize: 9, fill: '#444' }}
                  />
                  <ZAxis type="number" dataKey="authority" range={[60, 600]} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.[0]?.payload) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 shadow-xl">
                          <div className="text-[10px] font-bold text-white">{d.domain}</div>
                          <div className="mt-1 space-y-0.5 text-[9px] text-[#999]">
                            <div>
                              Referring Domains:{' '}
                              <span className="font-mono text-white">{d.referringDomains.toLocaleString()}</span>
                            </div>
                            <div>
                              Traffic: <span className="font-mono text-white">{d.traffic.toLocaleString()}</span>
                            </div>
                            <div>
                              Authority: <span className="font-mono text-white">{d.authority}/100</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={authorityScatter} isAnimationActive={false}>
                    {authorityScatter.map((e, i) => (
                      <Cell key={`as-${i}`} fill={e.fill} fillOpacity={0.75} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </Section>

        <Section title="Technical & AI Readiness">
          <div className="grid grid-cols-2 gap-3">
            <ChartCard title="Technical Health" subtitle="Composite health score per site">
              <div className="flex flex-wrap items-center justify-center gap-6 py-4">
                {allProfiles.map((p) => (
                  <GaugeMeter key={p.domain} value={Number(p.techHealthScore || 0)} label={p.domain} />
                ))}
              </div>
            </ChartCard>

            <ChartCard title="AI Readiness" subtitle="GEO score, citation, passage & snippet readiness">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={aiData} layout="vertical" margin={{ left: 4, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#555' }} axisLine={{ stroke: '#222' }} />
                  <YAxis dataKey="metric" type="category" width={85} tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff06' }} />
                  {allProfiles.map((p, i) => (
                    <Bar key={p.domain} dataKey={p.domain} fill={getColor(i)} barSize={8} radius={[0, 3, 3, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </Section>

        <Section title="Social Presence">
          <ChartCard title="Social Following by Platform" subtitle="Follower counts across major platforms">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={socialData} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                <XAxis dataKey="platform" tick={{ fontSize: 10, fill: '#666' }} axisLine={{ stroke: '#222' }} />
                <YAxis
                  tick={{ fontSize: 9, fill: '#555' }}
                  axisLine={{ stroke: '#222' }}
                  tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff06' }} />
                {allProfiles.map((p, i) => (
                  <Bar key={p.domain} dataKey={p.domain} fill={getColor(i)} barSize={14} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Section>

        {techStackData.length > 0 && (
          <Section title="Tech Stack">
            <ChartCard title="Technologies Detected" subtitle="Frameworks, CMS, libraries, and tools per competitor">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1a1a1e]">
                      <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#555]">Technology</th>
                      {allProfiles.map((p, i) => (
                        <th
                          key={p.domain}
                          className="px-3 py-2 text-center text-[9px] font-bold uppercase tracking-widest"
                          style={{ color: getColor(i) }}
                        >
                          {p.domain}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {techStackData.map((row) => (
                      <tr key={row.tech} className="border-b border-[#111] transition-colors hover:bg-white/[0.01]">
                        <td className="px-3 py-1.5 text-[10px] text-[#ccc]">{row.tech}</td>
                        {allProfiles.map((p) => (
                          <td key={p.domain} className="px-3 py-1.5 text-center">
                            {row[p.domain] ? (
                              <span className="text-[11px] text-green-400">✓</span>
                            ) : (
                              <span className="text-[11px] text-[#333]">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </Section>
        )}
      </div>
    </div>
  );
}
