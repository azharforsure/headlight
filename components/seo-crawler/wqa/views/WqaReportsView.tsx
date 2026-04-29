import React, { useMemo, useRef } from 'react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    LineChart, Line, AreaChart, Area,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    Treemap,
} from 'recharts';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { computeWqaSiteStats, computeWqaActionGroups } from '../../../../services/right-sidebar/wqa';
import { computeWqaFacets } from '../../../../services/WqaFilterEngine';
import { formatCat } from '../wqaUtils';
import { EmptyViewState } from './shared';
import GaugeBar from '../charts/GaugeBar';

const ACCENT = '#F5364E';
const TONE = { good: '#22c55e', warn: '#f59e0b', bad: '#ef4444', info: '#3b82f6', violet: '#a855f7' };

function Card({ col, row, children, title, subtitle, action }: {
    col: number; row?: number; title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <div
            className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 flex flex-col min-w-0"
            style={{ gridColumn: `span ${col} / span ${col}`, gridRow: row ? `span ${row} / span ${row}` : undefined }}
        >
            {(title || action) && (
                <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0">
                        {title    && <div className="text-[11px] font-bold uppercase tracking-widest text-white truncate">{title}</div>}
                        {subtitle && <div className="text-[10px] text-[#666] truncate">{subtitle}</div>}
                    </div>
                    {action}
                </div>
            )}
            <div className="flex-1 min-h-0">{children}</div>
        </div>
    );
}

function Kpi({ label, value, hint, tone = 'info' }: { label: string; value: React.ReactNode; hint?: string; tone?: keyof typeof TONE | 'white' }) {
    const color = tone === 'white' ? '#fff' : TONE[tone as keyof typeof TONE];
    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-[#555]">{label}</span>
            <span className="text-[22px] font-mono font-bold leading-none" style={{ color }}>{value}</span>
            {hint && <span className="text-[10px] text-[#666] truncate">{hint}</span>}
        </div>
    );
}

const tooltipStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    fontSize: '11px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
};

const itemStyle = { color: '#fff', padding: '2px 0' };
const labelStyle = { color: '#666', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.05em' };

export default function WqaReportsView() {
    const { filteredPages, wqaState } = useSeoCrawler() as any;
    const rootRef  = useRef<HTMLDivElement | null>(null);

    const pages   = filteredPages || [];
    const industry = wqaState?.effectiveIndustry || wqaState?.industry || 'general';
    const stats   = useMemo(() => computeWqaSiteStats(pages, industry), [pages, industry]);
    const facets  = useMemo(() => computeWqaFacets(pages),               [pages]);
    const actions = useMemo(() => computeWqaActionGroups(pages),         [pages]);

    // ── derived datasets ────────────────────────────────────────────────
    const radarData = [
        { dim: 'Content',   v: stats.radarContent    },
        { dim: 'SEO',       v: stats.radarSeo        },
        { dim: 'Authority', v: stats.radarAuthority  },
        { dim: 'UX',        v: stats.radarUx         },
        { dim: 'Search',    v: stats.radarSearchPerf },
        { dim: 'Trust',     v: stats.radarTrust      },
    ];

    const valueTierData = [
        { tier: 'Top ★★★',  count: stats.highValuePages,   color: TONE.good   },
        { tier: 'High ★★',  count: stats.mediumValuePages, color: TONE.info   },
        { tier: 'Med ★',    count: stats.lowValuePages,    color: TONE.warn   },
        { tier: 'Low ☆',    count: stats.zeroValuePages,   color: TONE.bad    },
    ];

    const searchBands = [
        { band: 'Top 3',   count: facets.searchStatuses.top3,     color: TONE.good },
        { band: 'Page 1',  count: facets.searchStatuses.page1,    color: TONE.info },
        { band: 'Striking',count: facets.searchStatuses.striking, color: TONE.warn },
        { band: 'Weak',    count: facets.searchStatuses.weak,     color: TONE.violet },
        { band: 'None',    count: facets.searchStatuses.none,     color: TONE.bad },
    ];

    const trafficTrend = [
        { state: 'Growing',   count: facets.trafficStatuses.growing,   color: TONE.good },
        { state: 'Stable',    count: facets.trafficStatuses.stable,    color: TONE.info },
        { state: 'Declining', count: facets.trafficStatuses.declining, color: TONE.bad  },
        { state: 'No traffic',count: facets.trafficStatuses.none,      color: '#555'    },
    ];

    const contentAge = [
        { age: 'Fresh',   count: facets.contentAges.fresh,  color: TONE.good },
        { age: 'Aging',   count: facets.contentAges.aging,  color: TONE.warn },
        { age: 'Stale',   count: facets.contentAges.stale,  color: TONE.bad  },
        { age: 'No date', count: facets.contentAges.nodate, color: '#555'    },
    ];

    const categoryTree = Object.entries(stats.pagesByCategory || {})
        .map(([name, size]) => ({ name: formatCat(name), size: Number(size) }))
        .sort((a, b) => b.size - a.size);

    const funnelData = Object.entries(facets.funnelStages || {})
        .map(([stage, count]) => ({ stage, count: Number(count) }));

    const ctrScatter = pages
        .filter((p: any) => Number(p.gscImpressions || 0) > 0)
        .slice(0, 300)
        .map((p: any) => ({ pos: Number(p.gscPosition || 0), ctr: Number(p.gscCtr || 0) * 100, impr: Number(p.gscImpressions || 0) }));

    const topActions = [...actions]
        .sort((a, b) => b.totalEstimatedImpact - a.totalEstimatedImpact)
        .slice(0, 8)
        .map(a => ({ label: a.action, impact: Math.round(a.totalEstimatedImpact), pages: a.pageCount, category: a.category }));

    const priorityData = [
        { p: 'P1', count: facets.priorities['1'], color: TONE.bad  },
        { p: 'P2', count: facets.priorities['2'], color: TONE.warn },
        { p: 'P3', count: facets.priorities['3'], color: TONE.info },
    ];

    const indexabilityData = [
        { state: 'Indexed',  count: facets.indexabilities.indexed,  color: TONE.good },
        { state: 'Blocked',  count: facets.indexabilities.blocked,  color: TONE.warn },
        { state: 'Redirect', count: facets.indexabilities.redirect, color: TONE.info },
        { state: 'Error',    count: facets.indexabilities.error,    color: TONE.bad  },
    ];

    if (pages.length === 0) {
        return (
            <div className="flex-1 flex flex-col bg-[#070707]">
                <EmptyViewState title="Nothing to report yet" subtitle="Run a crawl or clear filters to see charts." />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#070707] overflow-hidden">
            <div ref={rootRef} className="flex-1 overflow-auto custom-scrollbar p-4">
                {/* 12-col grid. Breakpoints collapse to 6 cols <1200 and 2 cols <900 via media query below. */}
                <div className="wqa-reports-grid grid grid-cols-12 gap-3 auto-rows-[minmax(160px,auto)]">
                    {/* Row 1 — KPIs (12 cols total, 5 cells) */}
                    <Card col={2} title="Pages"            subtitle="Current filter">
                        <Kpi label="Total"       value={pages.length.toLocaleString()}         tone="white" hint={`${stats.indexedPages.toLocaleString()} indexed`} />
                    </Card>
                    <Card col={2} title="Search"           subtitle="GSC totals">
                        <Kpi label="Impressions" value={stats.totalImpressions.toLocaleString()} tone="info"  hint={`${stats.totalClicks.toLocaleString()} clicks`} />
                    </Card>
                    <Card col={2} title="Traffic"          subtitle="GA4 sessions">
                        <Kpi label="Sessions"    value={stats.totalSessions.toLocaleString()} tone="violet" hint={`CTR avg ${stats.avgCtr}%`} />
                    </Card>
                    <Card col={2} title="Avg position"     subtitle="GSC position">
                        <Kpi label="Position"    value={stats.avgPosition.toFixed(1)} tone="warn" hint={`${stats.pagesInStrikingDistance} striking`} />
                    </Card>
                    <Card col={2} title="Decay risk"       subtitle="Pages at risk">
                        <Kpi label="Pages"       value={stats.decayRiskCount}    tone="bad" hint={`${stats.pagesLosingTraffic} losing traffic`} />
                    </Card>
                    <Card col={2} title="Health"           subtitle="Site composite">
                        <Kpi label="Avg score"   value={Math.round(stats.avgHealthScore)} tone={stats.avgHealthScore >= 70 ? 'good' : stats.avgHealthScore >= 50 ? 'warn' : 'bad'} />
                    </Card>

                    {/* Row 2 — Quality radar (6) + Value tier (6) */}
                    <Card col={6} title="Quality radar"    subtitle="Six composite dimensions">
                        <ResponsiveContainer width="100%" height={220}>
                            <RadarChart data={radarData} outerRadius="72%">
                                <PolarGrid stroke="#1a1a1a" />
                                <PolarAngleAxis  dataKey="dim" tick={{ fill: '#888', fontSize: 10 }} />
                                <PolarRadiusAxis tick={{ fill: '#444', fontSize: 9 }} domain={[0, 100]} />
                                <Radar dataKey="v" stroke={ACCENT} fill={ACCENT} fillOpacity={0.18} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card col={6} title="Value tiers"      subtitle="Distribution of business value">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={valueTierData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                                <CartesianGrid stroke="#1a1a1a" vertical={false} />
                                <XAxis dataKey="tier" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={ACCENT} activeBar={{ fill: '#ff4d63' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Row 3 — Search position bands (6) + Traffic trend (3) + Content age (3) */}
                    <Card col={6} title="Search position bands">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={searchBands} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                                <CartesianGrid stroke="#1a1a1a" horizontal={false} />
                                <XAxis type="number"      tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="band" tick={{ fill: '#aaa', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} activeBar={{ opacity: 0.8 }}>
                                    {searchBands.map((b, i) => <Bar key={i} dataKey="count" fill={b.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card col={3} title="Traffic trend">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={trafficTrend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                <CartesianGrid stroke="#1a1a1a" vertical={false} />
                                <XAxis dataKey="state" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={TONE.info} activeBar={{ fill: '#4f95ff' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card col={3} title="Content age">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={contentAge} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                <CartesianGrid stroke="#1a1a1a" vertical={false} />
                                <XAxis dataKey="age" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={TONE.warn} activeBar={{ fill: '#ffaf2b' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Row 4 — Pages-by-category treemap (8) + Funnel stages (4) */}
                    <Card col={8} title="Pages by category" subtitle="Treemap sized by page count">
                        <ResponsiveContainer width="100%" height={260}>
                            <Treemap data={categoryTree} dataKey="size" stroke="#070707" fill={ACCENT} />
                        </ResponsiveContainer>
                    </Card>
                    <Card col={4} title="Funnel stages">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                                <CartesianGrid stroke="#1a1a1a" horizontal={false} />
                                <XAxis type="number"      tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="stage" tick={{ fill: '#aaa', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill={TONE.violet} activeBar={{ fill: '#bb78ff' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Row 5 — CTR vs position (8, scatter via recharts LineChart w/ dots) + Indexability donut bars (4) */}
                    <Card col={8} title="CTR vs position" subtitle="Each page (capped at 300)">
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={ctrScatter.slice().sort((a, b) => a.pos - b.pos)}
                                       margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid stroke="#1a1a1a" />
                                <XAxis dataKey="pos" type="number" domain={[1, 100]} tick={{ fill: '#888', fontSize: 10 }} label={{ value: 'Position', fill: '#555', fontSize: 10, dy: 12 }} />
                                <YAxis dataKey="ctr"               tick={{ fill: '#888', fontSize: 10 }} label={{ value: 'CTR %', angle: -90, fill: '#555', fontSize: 10, dx: -12 }} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
                                <Line dataKey="ctr" stroke={ACCENT} strokeWidth={0} dot={{ r: 2, stroke: ACCENT, fill: ACCENT }} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card col={4} title="Indexability">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={indexabilityData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                <CartesianGrid stroke="#1a1a1a" vertical={false} />
                                <XAxis dataKey="state" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={TONE.info} activeBar={{ fill: '#4f95ff' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Row 6 — Priority stack (3) + Top actions by impact (9) */}
                    <Card col={3} title="Priority mix">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={priorityData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                <CartesianGrid stroke="#1a1a1a" vertical={false} />
                                <XAxis dataKey="p" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={TONE.bad} activeBar={{ fill: '#ff5c6a' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                    <Card col={9} title="Top actions by estimated impact" subtitle="Ranked across technical, content, industry">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topActions} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                                <CartesianGrid stroke="#1a1a1a" horizontal={false} />
                                <XAxis type="number"         tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="label" tick={{ fill: '#ccc', fontSize: 10 }} axisLine={false} tickLine={false} width={220} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="impact" radius={[0, 4, 4, 0]} fill={ACCENT} activeBar={{ fill: '#ff4d63' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Row 7 — Site-level quality gauges (12) */}
                    <Card col={12} title="Site-level coverage" subtitle="Percentages across crawled pages">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <GaugeBar label="Sitemap"   value={stats.sitemapCoverage} />
                            <GaugeBar label="Schema"    value={stats.schemaCoverage} />
                            <GaugeBar label="Broken"    value={100 - stats.brokenRate} />
                            <GaugeBar label="Orphans"   value={100 - stats.orphanRate} />
                            <GaugeBar label="Duplicate" value={100 - stats.duplicateRate} />
                            <GaugeBar label="Thin"      value={100 - stats.thinContentRate} />
                        </div>
                    </Card>

                    {/* Row 8 — Revenue / conversions (6) + Orphans-with-value + cannibalization (6) */}
                    <Card col={6} title="Commercial signals">
                        <div className="grid grid-cols-2 gap-4">
                            <Kpi label="Revenue"        value={stats.totalRevenue.toLocaleString()}          tone="good" />
                            <Kpi label="Transactions"   value={stats.totalTransactions.toLocaleString()}     tone="info" />
                            <Kpi label="Goal comps."    value={stats.totalGoalCompletions.toLocaleString()}  tone="violet" />
                            <Kpi label="Subscribers"    value={stats.totalSubscribers.toLocaleString()}      tone="warn" />
                        </div>
                    </Card>
                    <Card col={6} title="Risk signals">
                        <div className="grid grid-cols-2 gap-4">
                            <Kpi label="Orphans w/ value" value={stats.orphanPagesWithValue} tone="warn" hint="Inlinks=0 but traffic > 0" />
                            <Kpi label="Cannibalizing"    value={stats.cannibalizationCount} tone="bad"  hint="Competing URLs on same query" />
                            <Kpi label="Zero impressions" value={stats.pagesWithZeroImpressions} tone="bad" hint="Indexed but invisible" />
                            <Kpi label="Est. impact"      value={Math.round(stats.totalEstimatedImpact).toLocaleString()} tone="good" hint="Sum across actions" />
                        </div>
                    </Card>

                    {/* Row 9 — Clicks over position decay curve (12) */}
                    <Card col={12} title="Clicks distribution by position" subtitle="Area curve, pages aggregated per integer position">
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart
                                data={Array.from({ length: 30 }, (_, i) => {
                                    const pos = i + 1;
                                    const bucket = pages.filter((p: any) => Math.round(Number(p.gscPosition || 0)) === pos);
                                    return { pos, clicks: bucket.reduce((s: number, p: any) => s + Number(p.gscClicks || 0), 0) };
                                })}
                                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                            >
                                <CartesianGrid stroke="#1a1a1a" />
                                <XAxis dataKey="pos" tick={{ fill: '#888', fontSize: 10 }} />
                                <YAxis              tick={{ fill: '#555', fontSize: 10 }} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
                                <Area dataKey="clicks" stroke={ACCENT} fill={ACCENT} fillOpacity={0.15} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            </div>

            <style>{`
                @media (max-width: 1200px) { .wqa-reports-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); } .wqa-reports-grid > div { grid-column: span 6 / span 6 !important; } }
                @media (max-width: 900px)  { .wqa-reports-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .wqa-reports-grid > div { grid-column: span 2 / span 2 !important; } }
            `}</style>
        </div>
    );
}
