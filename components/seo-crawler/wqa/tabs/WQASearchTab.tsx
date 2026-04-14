import React, { useMemo } from 'react';
import type { WqaSiteStats } from '../../../../services/WebsiteQualityModeTypes';
import type { DetectedIndustry } from '../../../../services/SiteTypeDetector';
import PositionHistogram from '../charts/PositionHistogram';
import ScatterPlot from '../charts/ScatterPlot';

interface Props {
    pages: any[];
    filteredPages: any[];
    stats: WqaSiteStats | null;
    industry: DetectedIndustry;
}

export default function WQASearchTab({ pages, stats }: Props) {
    if (!stats) return <div className="p-4 text-[12px] text-[#555] text-center">No data yet.</div>;

    const htmlPages = useMemo(() => pages.filter((p) => p.isHtmlPage && p.statusCode === 200), [pages]);

    const positionBuckets = useMemo(() => {
        const buckets: Record<string, number> = { '1-3': 0, '4-10': 0, '11-20': 0, '21-50': 0, '50+': 0, 'None': 0 };
        htmlPages.forEach((p) => {
            const pos = Number(p.gscPosition || 0);
            if (!pos) buckets.None += 1;
            else if (pos <= 3) buckets['1-3'] += 1;
            else if (pos <= 10) buckets['4-10'] += 1;
            else if (pos <= 20) buckets['11-20'] += 1;
            else if (pos <= 50) buckets['21-50'] += 1;
            else buckets['50+'] += 1;
        });
        return Object.entries(buckets).map(([label, count]) => ({ label, count }));
    }, [htmlPages]);

    const scatterData = useMemo(() => {
        return htmlPages
            .filter((p) => Number(p.gscPosition || 0) > 0 && Number(p.gscImpressions || 0) > 0)
            .map((p) => ({
                x: Number(p.gscPosition),
                y: Number(p.gscCtr || 0) * 100,
                size: Math.max(3, Math.min(20, Math.sqrt(Number(p.gscImpressions || 0)) / 5)),
                color: Number(p.ctrGap || 0) < -0.02 ? '#ef4444' : Number(p.ctrGap || 0) > 0.01 ? '#3b82f6' : '#666',
                label: p.pagePath || p.url,
            }))
            .slice(0, 200);
    }, [htmlPages]);

    const topKeywords = useMemo(() => {
        return htmlPages
            .filter((p) => p.mainKeyword && Number(p.gscImpressions || 0) > 0)
            .sort((a, b) => Number(b.gscImpressions || 0) - Number(a.gscImpressions || 0))
            .slice(0, 10)
            .map((p) => ({
                keyword: p.mainKeyword,
                position: Math.round(Number(p.gscPosition || 0)),
                impressions: Number(p.gscImpressions || 0),
                ctr: Number(p.gscCtr || 0),
            }));
    }, [htmlPages]);

    const cannibalized = useMemo(() => {
        const kwMap = new Map<string, string[]>();
        htmlPages.forEach((p) => {
            if (p.mainKeyword && p.isCannibalized) {
                const kw = String(p.mainKeyword).toLowerCase().trim();
                if (!kwMap.has(kw)) kwMap.set(kw, []);
                kwMap.get(kw)?.push(p.pagePath || p.url);
            }
        });
        return Array.from(kwMap.entries())
            .filter(([, urls]) => urls.length > 1)
            .slice(0, 8)
            .map(([keyword, urls]) => ({ keyword, urls }));
    }, [htmlPages]);

    const intentStats = useMemo(() => {
        let aligned = 0;
        let misaligned = 0;
        let noKw = 0;
        htmlPages.forEach((p) => {
            if (!p.mainKeyword) noKw += 1;
            else if (p.intentMatch === 'aligned') aligned += 1;
            else if (p.intentMatch === 'misaligned') misaligned += 1;
            else noKw += 1;
        });
        const total = aligned + misaligned + noKw;
        return { aligned, misaligned, noKw, total };
    }, [htmlPages]);

    const heatmapData = useMemo(() => {
        const categories = ['product', 'blog_post', 'category', 'landing_page', 'service_page'];
        return categories
            .map((cat) => {
                const catPages = htmlPages.filter((p) => p.pageCategory === cat);
                if (catPages.length === 0) return null;
                const growing = catPages.filter((p) => Number(p.sessionsDeltaPct || 0) > 0.15).length;
                const declining = catPages.filter((p) => p.isLosingTraffic).length;
                const total = catPages.length;
                const status = declining / total > 0.3 ? 'declining' : growing / total > 0.3 ? 'growing' : 'flat';
                return { category: formatCategoryLabel(cat), status, growing, declining, total };
            })
            .filter(Boolean) as Array<{ category: string; status: string; growing: number; declining: number; total: number }>;
    }, [htmlPages]);

    return (
        <div className="p-3 space-y-4">
            <section>
                <SectionHeader title="Search Visibility" />
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <MiniStat label="Impressions" value={formatCompact(stats.totalImpressions)} />
                    <MiniStat label="Clicks" value={formatCompact(stats.totalClicks)} />
                    <MiniStat label="Avg Position" value={stats.avgPosition > 0 ? stats.avgPosition.toFixed(1) : '—'} />
                    <MiniStat label="Avg CTR" value={stats.totalImpressions > 0 ? `${((stats.totalClicks / stats.totalImpressions) * 100).toFixed(1)}%` : '—'} />
                </div>
            </section>

            <section>
                <SectionHeader title="Position Distribution" />
                <PositionHistogram data={positionBuckets} />
            </section>

            {scatterData.length > 0 && (
                <section>
                    <SectionHeader title="CTR vs Position" />
                    <ScatterPlot data={scatterData} xLabel="Position" yLabel="CTR %" height={180} />
                    <div className="flex gap-3 mt-1 text-[9px] text-[#555]">
                        <span><span className="text-red-400">●</span> Below expected</span>
                        <span><span className="text-blue-400">●</span> Above expected</span>
                        <span><span className="text-[#666]">●</span> Normal</span>
                    </div>
                </section>
            )}

            {heatmapData.length > 0 && (
                <section>
                    <SectionHeader title="Traffic by Category" />
                    <div className="space-y-1">
                        {heatmapData.map((row) => (
                            <div key={row.category} className="flex items-center justify-between text-[10px]">
                                <span className="text-[#888] w-24 truncate">{row.category}</span>
                                <span className={`text-[10px] font-bold ${
                                    row.status === 'growing' ? 'text-green-400' :
                                    row.status === 'declining' ? 'text-red-400' :
                                    'text-yellow-500'
                                }`}>
                                    {row.status === 'growing' ? '🟢' : row.status === 'declining' ? '🔴' : '🟡'}
                                </span>
                                <span className="text-[#555] text-[9px]">{row.growing}↑ {row.declining}↓ / {row.total}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {topKeywords.length > 0 && (
                <section>
                    <SectionHeader title="Top Keywords" />
                    <div className="space-y-1.5">
                        {topKeywords.map((kw, i) => (
                            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded p-2">
                                <div className="text-[11px] text-white font-medium truncate">{kw.keyword}</div>
                                <div className="flex gap-3 text-[9px] text-[#666] mt-0.5">
                                    <span>pos: {kw.position}</span>
                                    <span>{formatCompact(kw.impressions)} impr</span>
                                    <span>{(kw.ctr * 100).toFixed(1)}% CTR</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {cannibalized.length > 0 && (
                <section>
                    <SectionHeader title="Cannibalized Keywords" />
                    <div className="space-y-2">
                        {cannibalized.map((c, i) => (
                            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded p-2">
                                <div className="text-[11px] text-orange-400 font-medium">"{c.keyword}"</div>
                                <div className="text-[9px] text-[#555] mt-1">
                                    {c.urls.map((u, j) => <div key={j} className="truncate">{u}</div>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <SectionHeader title="Intent Alignment" />
                <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between text-[#888]">
                        <span>Aligned</span>
                        <span className="text-green-400 font-mono">{intentStats.aligned} ({intentStats.total > 0 ? Math.round((intentStats.aligned / intentStats.total) * 100) : 0}%)</span>
                    </div>
                    <div className="flex justify-between text-[#888]">
                        <span>Misaligned</span>
                        <span className="text-red-400 font-mono">{intentStats.misaligned} ({intentStats.total > 0 ? Math.round((intentStats.misaligned / intentStats.total) * 100) : 0}%)</span>
                    </div>
                    <div className="flex justify-between text-[#888]">
                        <span>No keyword</span>
                        <span className="text-[#555] font-mono">{intentStats.noKw}</span>
                    </div>
                </div>
            </section>
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1 mb-3">{title}</h4>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[#111] border border-[#1a1a1a] rounded p-2 text-center">
            <div className="text-[13px] font-bold text-white font-mono">{value}</div>
            <div className="text-[9px] text-[#555] uppercase">{label}</div>
        </div>
    );
}

function formatCompact(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
}

function formatCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
        product: 'Product', blog_post: 'Blog', category: 'Category', landing_page: 'Landing', service_page: 'Service',
        homepage: 'Home', about_legal: 'About', faq_help: 'FAQ', other: 'Other',
    };
    return map[cat] || cat;
}
