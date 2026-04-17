import React, { useMemo } from 'react';
import {
    TrendingDown, TrendingUp, AlertTriangle, Target, Zap, Layers,
    Activity, Link2, Search,
} from 'lucide-react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { formatIndustryLabel } from '../wqaUtils';
import ViewHeader        from './shared/ViewHeader';
import ScoreRing         from './shared/ScoreRing';
import MetricTile        from './shared/MetricTile';
import ImpactBar         from './shared/ImpactBar';
import PagePreviewRow    from './shared/PagePreviewRow';
import EmptyViewState    from './shared/EmptyViewState';

import ContentQualityRadar from '../../charts/ContentQualityRadar';
import IssueCategoryTreemap from '../../charts/IssueCategoryTreemap';
import CrawlDepthFunnel  from '../../charts/CrawlDepthFunnel';
import SunburstChart     from '../charts/SunburstChart';
import StackedBar        from '../charts/StackedBar';
import TrendLine         from '../charts/TrendLine';

const VALUE_COLORS: Record<string, string> = {
    '★★★': '#22c55e', '★★': '#3b82f6', '★': '#eab308', '☆': '#6b7280',
};

export default function WqaOverviewView() {
    const ctx = useSeoCrawler() as any;
    const {
        wqaState,
        wqaForecast,
        filteredWqaPagesExport = [],
        setWqaFilter,
        wqaFilter,
        applyWqaQuickFilter,
    } = ctx;

    const stats = wqaState?.siteStats;

    const radar = useMemo(() => stats ? [
        { metric: 'Content',   value: stats.radarContent || 0 },
        { metric: 'SEO',       value: stats.radarSeo || 0 },
        { metric: 'Authority', value: stats.radarAuthority || 0 },
        { metric: 'UX',        value: stats.radarUx || 0 },
        { metric: 'Search',    value: stats.radarSearchPerf || 0 },
        { metric: 'Trust',     value: stats.radarTrust || 0 },
    ] : [], [stats]);

    const valueTierData = useMemo(() => stats ? [
        { label: 'Top',      value: stats.highValuePages || 0,   color: VALUE_COLORS['★★★'] },
        { label: 'High',     value: stats.mediumValuePages || 0, color: VALUE_COLORS['★★'] },
        { label: 'Mid',      value: stats.lowValuePages || 0,    color: VALUE_COLORS['★'] },
        { label: 'Low/none', value: stats.zeroValuePages || 0,   color: VALUE_COLORS['☆'] },
    ] : [], [stats]);

    const categoryData = useMemo(() => {
        if (!stats?.pagesByCategory) return [];
        const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f97316'];
        return Object.entries(stats.pagesByCategory)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 7)
            .map(([k, v], i) => ({ label: k, value: v as number, color: palette[i % palette.length] }));
    }, [stats]);

    const issueTreemapData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredWqaPagesExport.forEach((p: any) =>
            (p.issueCategories || []).forEach((c: string) => { counts[c] = (counts[c] || 0) + 1; })
        );
        return Object.entries(counts).map(([name, size]) => ({ name, size }));
    }, [filteredWqaPagesExport]);

    const depthData = useMemo(() => {
        const buckets: Record<string, number> = {};
        filteredWqaPagesExport.forEach((p: any) => {
            const d = Number(p.crawlDepth ?? 0);
            const key = d >= 6 ? '6+' : String(d);
            buckets[key] = (buckets[key] || 0) + 1;
        });
        return ['0','1','2','3','4','5','6+'].map((k) => ({ depth: `Depth ${k}`, count: buckets[k] || 0 }));
    }, [filteredWqaPagesExport]);

    const topOpportunities = useMemo(() => [...filteredWqaPagesExport]
        .filter((p: any) => (p.opportunityScore || 0) > 0)
        .sort((a: any, b: any) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
        .slice(0, 8),
    [filteredWqaPagesExport]);

    const topLosing = useMemo(() => [...filteredWqaPagesExport]
        .filter((p: any) => Number(p.sessionsDeltaPct || 0) < 0)
        .sort((a: any, b: any) => Number(a.sessionsDeltaPct || 0) - Number(b.sessionsDeltaPct || 0))
        .slice(0, 5),
    [filteredWqaPagesExport]);

    const maxActionImpact = Math.max(1, ...(wqaState?.actionGroups || []).map((a: any) => a.impact || 0));

    const applyQuick = (id: string) => applyWqaQuickFilter?.(id);

    if (!stats) {
        return <EmptyViewState
            title="Run a crawl to see your overview"
            subtitle="This view summarizes the whole site: score, distribution, top actions, losing pages, and forecast."
        />;
    }

    return (
        <div className="flex-1 flex flex-col bg-[#070707] overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">

                {/* Row 1 · Score + 8 clickable tiles */}
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-4 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-4 flex items-center gap-5">
                        <ScoreRing score={wqaState.siteScore} grade={wqaState.siteGrade} delta={wqaState.scoreDelta} />
                        <div className="flex-1 space-y-1.5 text-[11px] min-w-0">
                            <Meta label="Industry" value={formatIndustryLabel(wqaState.detectedIndustry)} />
                            <Meta label="Language" value={wqaState.detectedLanguage || '—'} />
                            <Meta label="CMS"      value={wqaState.detectedCms || 'Unknown'} />
                            <Meta label="Pages"    value={`${stats.totalPages.toLocaleString()} (${stats.htmlPages.toLocaleString()} HTML)`} />
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MetricTile label="Impressions 30d" value={stats.totalImpressions.toLocaleString()} sub={`CTR ${(stats.avgCtr).toFixed(2)}%`} icon={<Search size={10}/>} />
                        <MetricTile label="Sessions 30d"    value={stats.totalSessions.toLocaleString()}    sub={`Avg pos ${stats.avgPosition.toFixed(1)}`} icon={<Activity size={10}/>} />
                        <MetricTile label="Losing traffic"  value={stats.pagesLosingTraffic.toLocaleString()} sub="declining vs prev period" tone={stats.pagesLosingTraffic > 0 ? 'warn' : 'good'} icon={<TrendingDown size={10}/>} onClick={() => applyQuick('losing_traffic')} />
                        <MetricTile label="Striking distance" value={stats.pagesInStrikingDistance.toLocaleString()} sub="pos 4–20, impr > 100" tone="info" icon={<Target size={10}/>} onClick={() => applyQuick('striking_distance')} />
                        <MetricTile label="Zero impressions" value={stats.pagesWithZeroImpressions.toLocaleString()} sub="indexable, no impr" tone="warn" icon={<AlertTriangle size={10}/>} onClick={() => applyQuick('no_search_traffic')} />
                        <MetricTile label="Orphans w/ value" value={stats.orphanPagesWithValue.toLocaleString()} sub="0 inlinks + real traffic" tone="bad" icon={<Link2 size={10}/>} onClick={() => applyQuick('orphans')} />
                        <MetricTile label="Cannibalization" value={stats.cannibalizationCount.toLocaleString()} sub="overlapping queries" tone="warn" icon={<Layers size={10}/>} />
                        <MetricTile label="Decay risk"      value={stats.decayRiskCount.toLocaleString()} sub="stale + declining" tone="warn" icon={<Zap size={10}/>} onClick={() => applyQuick('stale')} />
                    </div>
                </div>

                {/* Row 2 · Forecast + Top actions */}
                <div className="grid grid-cols-12 gap-4">
                    <Card className="col-span-12 lg:col-span-5" title="Forecast · if top 20 actions ship" icon={<TrendingUp size={12}/>}>
                        {wqaForecast ? (
                            <>
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <Stat label="Projected clicks" value={`+${Number(wqaForecast.projectedClickLift || 0).toLocaleString()}`} color="#22c55e" />
                                    <Stat label="Projected score"  value={Math.round(Number(wqaForecast.projectedScore || wqaState.siteScore))} color="#3b82f6" />
                                    <Stat label="Effort"           value={wqaForecast.effortLabel || '—'} color="#ffffff" />
                                </div>
                                <TrendLine data={wqaForecast.trajectory || []} color="#22c55e" height={120} />
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-[140px] text-[11px] text-[#666] text-center px-4">
                                Forecast appears once enrichment has scored at least 10 pages with an action.
                            </div>
                        )}
                    </Card>

                    <Card className="col-span-12 lg:col-span-7" title="Top actions by estimated impact">
                        <div className="space-y-1">
                            {(wqaState.actionGroups || []).slice(0, 6).map((g: any) => (
                                <button
                                    key={`${g.category}:${g.action}`}
                                    onClick={() => setWqaFilter({
                                        ...wqaFilter,
                                        ...(g.category === 'technical' ? { technicalAction: g.action } : {}),
                                        ...(g.category === 'content'   ? { contentAction: g.action }   : {}),
                                    })}
                                    className="w-full text-left grid grid-cols-[90px_1fr_48px_140px] gap-3 items-center px-3 h-[34px] rounded hover:bg-[#111] border border-transparent hover:border-[#2a2a2a] transition-colors"
                                >
                                    <CatPill cat={g.category} />
                                    <span className="text-[12px] text-white truncate">{g.action}</span>
                                    <span className="text-[11px] font-mono text-[#aaa] text-right">{g.count}</span>
                                    <ImpactBar value={g.impact} max={maxActionImpact} />
                                </button>
                            ))}
                            {(wqaState.actionGroups || []).length === 0 && (
                                <div className="text-[11px] text-[#666] py-4 text-center">No actions assigned. Run enrichment.</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Row 3 · Radar + Category sunburst + Value tiers */}
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-5">
                        <ContentQualityRadar data={radar} />
                    </div>
                    <Card className="col-span-12 lg:col-span-4" title="Page categories">
                        <div className="flex items-center gap-4">
                            <SunburstChart data={categoryData} size={180} />
                            <div className="flex-1 space-y-1">
                                {categoryData.map((c) => (
                                    <div key={c.label} className="flex items-center justify-between text-[11px]">
                                        <span className="text-[#ccc] flex items-center gap-1.5 truncate">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                                            <span className="truncate">{c.label}</span>
                                        </span>
                                        <span className="font-mono text-[#888] ml-2">{c.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                    <Card className="col-span-12 lg:col-span-3" title="Value distribution">
                        <StackedBar data={valueTierData} />
                    </Card>
                </div>

                {/* Row 4 · Issue treemap + Depth */}
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-7">
                        <IssueCategoryTreemap data={issueTreemapData} />
                    </div>
                    <div className="col-span-12 lg:col-span-5">
                        <CrawlDepthFunnel data={depthData} />
                    </div>
                </div>

                {/* Row 5 · Opportunities + Losing */}
                <div className="grid grid-cols-12 gap-4">
                    <Card className="col-span-12 lg:col-span-7" title="Top opportunities" icon={<Target size={12}/>}>
                        <div className="space-y-1.5">
                            {topOpportunities.map((p: any) => <PagePreviewRow key={p.url} page={p} />)}
                            {topOpportunities.length === 0 && <div className="text-[11px] text-[#666]">No scored opportunities yet.</div>}
                        </div>
                    </Card>
                    <Card className="col-span-12 lg:col-span-5" title="Losing traffic" icon={<TrendingDown size={12}/>}>
                        <div className="space-y-1.5">
                            {topLosing.map((p: any) => <PagePreviewRow key={p.url} page={p} />)}
                            {topLosing.length === 0 && <div className="text-[11px] text-[#666]">No declining pages detected.</div>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/* ── helpers ─────────────────────────────────────────────────────── */

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#555] w-[56px] shrink-0">{label}</span>
            <span className="text-white truncate">{value}</span>
        </div>
    );
}

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
    return (
        <div>
            <div className="text-[10px] text-[#666] uppercase tracking-widest">{label}</div>
            <div className="text-[18px] font-black" style={{ color }}>{value}</div>
        </div>
    );
}

function Card({
    className = '', title, icon, children,
}: { className?: string; title: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className={`bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-4 ${className}`}>
            <div className="text-[11px] text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
                {icon} {title}
            </div>
            {children}
        </div>
    );
}

function CatPill({ cat }: { cat: 'technical' | 'content' | 'industry' }) {
    const s =
        cat === 'technical' ? 'bg-red-500/10 text-red-400 border-red-500/30'
      : cat === 'content'   ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    return <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border w-fit ${s}`}>{cat}</span>;
}
