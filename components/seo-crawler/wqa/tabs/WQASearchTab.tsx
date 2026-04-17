import React, { useMemo } from 'react';
import type { WqaSiteStats } from '../../../../services/WebsiteQualityModeTypes';
import type { DetectedIndustry } from '../../../../services/SiteTypeDetector';
import PositionHistogram from '../charts/PositionHistogram';
import ScatterPlot from '../charts/ScatterPlot';
import HeatmapGrid from '../charts/HeatmapGrid';
import { formatCat, formatCompact } from '../wqaUtils';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';

interface Props {
    pages: any[];
    filteredPages: any[];
    stats: WqaSiteStats | null;
    industry: DetectedIndustry;
}

export default function WQASearchTab({ pages, stats }: Props) {
    const { setWqaFilter } = useSeoCrawler();

    if (!stats) {
        return <div className="p-4 text-[12px] text-[#555] text-center">No data yet.</div>;
    }

    const htmlPages = useMemo(
        () => pages.filter((p) => p.isHtmlPage && p.statusCode === 200),
        [pages]
    );

    const positionBuckets = useMemo(() => {
        const buckets: Record<string, number> = { '1–3': 0, '4–10': 0, '11–20': 0, '21–50': 0, '50+': 0, 'None': 0 };
        htmlPages.forEach((p) => {
            const pos = Number(p.gscPosition || 0);
            if (!pos)         buckets['None']  += 1;
            else if (pos <=  3) buckets['1–3']   += 1;
            else if (pos <= 10) buckets['4–10']  += 1;
            else if (pos <= 20) buckets['11–20'] += 1;
            else if (pos <= 50) buckets['21–50'] += 1;
            else                buckets['50+']   += 1;
        });
        return Object.entries(buckets).map(([label, count]) => ({ label, count }));
    }, [htmlPages]);

    const scatterData = useMemo(() =>
        htmlPages
            .filter((p) => Number(p.gscPosition || 0) > 0 && Number(p.gscImpressions || 0) > 0)
            .map((p) => ({
                x:     Number(p.gscPosition),
                y:     Number(p.gscCtr || 0) * 100,
                size:  Math.max(3, Math.min(20, Math.sqrt(Number(p.gscImpressions || 0)) / 5)),
                color: Number(p.ctrGap || 0) < -0.02 ? '#ef4444' : Number(p.ctrGap || 0) > 0.01 ? '#3b82f6' : '#555',
                label: p.pagePath || p.url,
            }))
            .slice(0, 200),
    [htmlPages]);

    const topKeywords = useMemo(() =>
        htmlPages
            .filter((p) => p.mainKeyword && Number(p.gscImpressions || 0) > 0)
            .sort((a, b) => Number(b.gscImpressions) - Number(a.gscImpressions))
            .slice(0, 10)
            .map((p) => ({
                keyword:     p.mainKeyword,
                position:    Math.round(Number(p.gscPosition || 0)),
                impressions: Number(p.gscImpressions || 0),
                ctr:         Number(p.gscCtr || 0),
                ctrGap:      Number(p.ctrGap || 0),
            })),
    [htmlPages]);

    const trafficMovers = useMemo(() => {
        const withDelta = htmlPages.filter((p) => p.sessionsDeltaPct != null && Number(p.ga4Sessions || 0) > 0);
        const gaining = [...withDelta]
            .filter((p) => Number(p.sessionsDeltaPct) > 0.1)
            .sort((a, b) => Number(b.sessionsDeltaPct) - Number(a.sessionsDeltaPct))
            .slice(0, 5)
            .map((p) => ({ path: p.pagePath || p.url, pct: Number(p.sessionsDeltaPct) * 100 }));
        const losing = [...withDelta]
            .filter((p) => p.isLosingTraffic === true)
            .sort((a, b) => Number(a.sessionsDeltaPct) - Number(b.sessionsDeltaPct))
            .slice(0, 5)
            .map((p) => ({ path: p.pagePath || p.url, pct: Number(p.sessionsDeltaPct) * 100 }));
        return { gaining, losing };
    }, [htmlPages]);

    const strikingPages = useMemo(() =>
        htmlPages
            .filter((p) => {
                const pos = Number(p.gscPosition || 0);
                return pos >= 4 && pos <= 20 && Number(p.gscImpressions || 0) > 100;
            })
            .sort((a, b) => Number(b.gscImpressions) - Number(a.gscImpressions))
            .slice(0, 5),
    [htmlPages]);

    const strikingEstImpact = useMemo(() => {
        return strikingPages.reduce((sum, p) => {
            const impr = Number(p.gscImpressions || 0);
            const pos  = Number(p.gscPosition || 0);
            const ctr  = Number(p.gscCtr || 0);
            const newCtr = pos <= 10 ? 0.028 : 0.08;
            return sum + Math.max(0, Math.round(impr * (newCtr - ctr)));
        }, 0);
    }, [strikingPages]);

    const cannibalized = useMemo(() => {
        const kwMap = new Map<string, string[]>();
        htmlPages.forEach((p) => {
            if (p.mainKeyword && p.isCannibalized) {
                const kw = String(p.mainKeyword).toLowerCase().trim();
                if (!kwMap.has(kw)) kwMap.set(kw, []);
                kwMap.get(kw)!.push(p.pagePath || p.url);
            }
        });
        return Array.from(kwMap.entries())
            .filter(([, urls]) => urls.length > 1)
            .slice(0, 5)
            .map(([keyword, urls]) => ({ keyword, urls }));
    }, [htmlPages]);

    const intentStats = useMemo(() => {
        let aligned = 0, misaligned = 0, noKw = 0;
        htmlPages.forEach((p) => {
            if (!p.mainKeyword)                    noKw      += 1;
            else if (p.intentMatch === 'aligned')   aligned   += 1;
            else if (p.intentMatch === 'misaligned')misaligned += 1;
            else                                    noKw      += 1;
        });
        const total = aligned + misaligned + noKw;
        return { aligned, misaligned, noKw, total };
    }, [htmlPages]);

    const heatmapData = useMemo(() => {
        const categories = ['product', 'blog_post', 'category', 'landing_page', 'service_page'];
        const cells = categories.map((cat) => {
            const catPages = htmlPages.filter((p) => p.pageCategory === cat);
            if (catPages.length === 0) return null;
            const growing   = catPages.filter((p) => Number(p.sessionsDeltaPct || 0) > 0.15).length;
            const declining = catPages.filter((p) => p.isLosingTraffic).length;
            const total     = catPages.length;
            const status: 'growing' | 'flat' | 'declining' =
                declining / total > 0.3 ? 'declining' :
                growing   / total > 0.3 ? 'growing'   : 'flat';
            return { row: formatCat(cat), col: 'Now', status, growing, declining, total };
        }).filter(Boolean) as Array<{ row: string; col: string; status: 'growing' | 'flat' | 'declining'; growing: number; declining: number; total: number }>;

        return {
            cells,
            rows: cells.map((c) => c.row),
            cols: ['Now'],
        };
    }, [htmlPages]);

    const showHeatmap    = heatmapData.cells.length > 0;
    const showScatter    = scatterData.length > 0;
    const showMovers     = trafficMovers.gaining.length > 0 || trafficMovers.losing.length > 0;
    const showStriking   = strikingPages.length > 0;
    const showCannibal   = cannibalized.length > 0;
    const avgCtrDisplay  = stats.avgCtr > 0 ? `${stats.avgCtr.toFixed(1)}%` : '—';
    const avgPosDisplay  = stats.avgPosition > 0 ? stats.avgPosition.toFixed(1) : '—';

    return (
        <div className="p-3 space-y-4">

            {/* Summary stats */}
            <section>
                <SectionHeader title="Search Visibility" />
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <MiniStat label="Impressions" value={formatCompact(stats.totalImpressions)} />
                    <MiniStat label="Clicks"      value={formatCompact(stats.totalClicks)} />
                    <MiniStat label="Avg Position"value={avgPosDisplay} />
                    <MiniStat label="Avg CTR"     value={avgCtrDisplay} />
                    <MiniStat label="Sessions"    value={formatCompact(stats.totalSessions)} />
                    <MiniStat label="Losing"      value={stats.pagesLosingTraffic > 0 ? String(stats.pagesLosingTraffic) : '—'} warn={stats.pagesLosingTraffic > 0} />
                </div>
            </section>

            {/* Position distribution */}
            <section>
                <SectionHeader title="Position Distribution" />
                <PositionHistogram data={positionBuckets} />
            </section>

            {/* Striking distance */}
            {showStriking && (
                <section>
                    <SectionHeader title="Striking Distance" />
                    <div className="bg-[#0f1a24] border border-[#1a2d40] rounded-lg p-3 mb-2">
                        <div className="text-[11px] text-[#ccc] mb-1">
                            <span className="text-blue-400 font-bold">{stats.pagesInStrikingDistance}</span> pages at pos 4–20 with 100+ impressions
                        </div>
                        {strikingEstImpact > 0 && (
                            <div className="text-[10px] text-[#888]">
                                Est. +<span className="text-green-400 font-mono">{formatCompact(strikingEstImpact)}</span> clicks if they reach top 3
                            </div>
                        )}
                        <button
                            onClick={() => setWqaFilter((prev) => ({ ...prev, searchStatus: 'striking' }))}
                            className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Filter to these pages →
                        </button>
                    </div>
                    <div className="space-y-1">
                        {strikingPages.map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                                <span className="text-[#888] truncate max-w-[160px]">{p.pagePath || p.url}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[#555]">pos {Math.round(Number(p.gscPosition))}</span>
                                    <span className="text-[#444] font-mono">{formatCompact(Number(p.gscImpressions))} impr</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* CTR scatter */}
            {showScatter && (
                <section>
                    <SectionHeader title="CTR vs Position" />
                    <ScatterPlot data={scatterData} xLabel="Position" yLabel="CTR %" height={180} />
                    <div className="flex gap-3 mt-1 text-[9px] text-[#555]">
                        <span><span className="text-red-400">●</span> Below expected</span>
                        <span><span className="text-blue-400">●</span> Above expected</span>
                        <span><span className="text-[#555]">●</span> Normal</span>
                    </div>
                </section>
            )}

            {/* Traffic movers */}
            {showMovers && (
                <section>
                    <SectionHeader title="Traffic Movement" />
                    {trafficMovers.gaining.length > 0 && (
                        <div className="mb-3">
                            <div className="text-[9px] text-green-400 uppercase tracking-widest mb-1.5 font-bold">Gaining</div>
                            <div className="space-y-1">
                                {trafficMovers.gaining.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between text-[10px]">
                                        <span className="text-[#888] truncate max-w-[180px]">{m.path}</span>
                                        <span className="text-green-400 font-mono shrink-0">▲ {m.pct.toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {trafficMovers.losing.length > 0 && (
                        <div>
                            <div className="text-[9px] text-red-400 uppercase tracking-widest mb-1.5 font-bold">Losing</div>
                            <div className="space-y-1">
                                {trafficMovers.losing.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between text-[10px]">
                                        <span className="text-[#888] truncate max-w-[180px]">{m.path}</span>
                                        <span className="text-red-400 font-mono shrink-0">▼ {Math.abs(m.pct).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Traffic by category heatmap */}
            {showHeatmap && (
                <section>
                    <SectionHeader title="Traffic by Category" />
                    <HeatmapGrid data={heatmapData.cells} rows={heatmapData.rows} cols={heatmapData.cols} />
                    <div className="space-y-1 mt-2">
                        {heatmapData.cells.map((row) => (
                            <div key={row.row} className="flex items-center justify-between text-[10px]">
                                <span className="text-[#888] w-28 truncate">{row.row}</span>
                                <span className="text-[#555] text-[9px]">{row.growing}↑ {row.declining}↓ / {row.total}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Top keywords */}
            {topKeywords.length > 0 && (
                <section>
                    <SectionHeader title="Top Keywords" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="border-b border-[#151515]">
                                    <th className="text-left   text-[#555] font-normal pb-1">Keyword</th>
                                    <th className="text-right  text-[#555] font-normal pb-1 w-10">Pos</th>
                                    <th className="text-right  text-[#555] font-normal pb-1 w-14">Impr</th>
                                    <th className="text-right  text-[#555] font-normal pb-1 w-12">CTR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topKeywords.map((kw, i) => (
                                    <tr key={i} className="border-b border-[#0e0e0e] hover:bg-[#111]">
                                        <td className="text-[#ccc] py-1.5 truncate max-w-[150px]">{kw.keyword}</td>
                                        <td className="text-right text-[#888] py-1.5">{kw.position}</td>
                                        <td className="text-right text-[#888] py-1.5">{formatCompact(kw.impressions)}</td>
                                        <td className={`text-right py-1.5 font-mono ${kw.ctrGap < -0.02 ? 'text-red-400' : 'text-[#888]'}`}>
                                            {(kw.ctr * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Cannibalization */}
            {showCannibal && (
                <section>
                    <SectionHeader title="Cannibalized Keywords" />
                    <div className="space-y-2">
                        {cannibalized.map((c, i) => (
                            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded p-2">
                                <div className="text-[11px] text-orange-400 font-medium">"{c.keyword}"</div>
                                <div className="text-[9px] text-[#555] mt-1 space-y-0.5">
                                    {c.urls.map((u, j) => <div key={j} className="truncate">{u}</div>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Intent alignment */}
            <section>
                <SectionHeader title="Intent Alignment" />
                <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-[#888]">Aligned</span>
                        <span className="text-green-400 font-mono">
                            {intentStats.aligned}
                            {intentStats.total > 0 && <span className="text-[#555]"> ({Math.round((intentStats.aligned / intentStats.total) * 100)}%)</span>}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#888]">Misaligned</span>
                        <span className="text-red-400 font-mono">
                            {intentStats.misaligned}
                            {intentStats.total > 0 && <span className="text-[#555]"> ({Math.round((intentStats.misaligned / intentStats.total) * 100)}%)</span>}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#888]">No keyword</span>
                        <span className="text-[#555] font-mono">{intentStats.noKw}</span>
                    </div>
                </div>
            </section>

        </div>
    );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1 mb-3">
            {title}
        </h4>
    );
}

function MiniStat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
    return (
        <div className="bg-[#111] border border-[#1a1a1a] rounded p-2 text-center">
            <div className={`text-[13px] font-bold font-mono ${warn ? 'text-red-400' : 'text-white'}`}>{value}</div>
            <div className="text-[9px] text-[#555] uppercase">{label}</div>
        </div>
    );
}
