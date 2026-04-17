import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { WebsiteQualityState, WqaSiteStats } from '../../../../services/WebsiteQualityModeTypes';
import { getConversionLabel } from '../../../../services/WebsiteQualityModeTypes';
import type { DetectedIndustry } from '../../../../services/SiteTypeDetector';
import RadarChart from '../charts/RadarChart';
import DonutChart from '../charts/DonutChart';
import GaugeBar from '../charts/GaugeBar';
import { formatCompact, formatIndustryLabel } from '../wqaUtils';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';

interface Props {
    stats: WqaSiteStats | null;
    wqaState: WebsiteQualityState;
    aiNarrative: string;
    industry: DetectedIndustry;
}

export default function WQAQualityTab({ stats, wqaState, aiNarrative, industry }: Props) {
    const { wqaForecast } = useSeoCrawler();
    const [siteInfoOpen, setSiteInfoOpen] = useState(false);

    if (!stats) {
        return <div className="p-4 text-[12px] text-[#555] text-center">Run a crawl to see quality data.</div>;
    }

    const radarData = useMemo(() => [
        { axis: 'Content',  value: stats.radarContent },
        { axis: 'SEO',      value: stats.radarSeo },
        { axis: 'Authority',value: stats.radarAuthority },
        { axis: 'UX',       value: stats.radarUx },
        { axis: 'Search',   value: stats.radarSearchPerf },
        { axis: 'Trust',    value: stats.radarTrust },
    ], [stats]);

    const valueDonutData = useMemo(() => [
        { label: '★★★ High',   value: stats.highValuePages,   color: '#22c55e' },
        { label: '★★ Medium',  value: stats.mediumValuePages,  color: '#3b82f6' },
        { label: '★ Low',      value: stats.lowValuePages,     color: '#f59e0b' },
        { label: '☆ None',     value: stats.zeroValuePages,    color: '#2a2a2a' },
    ], [stats]);

    const conversionLabel = getConversionLabel(industry);
    const conversionValue = useMemo(() => {
        switch (industry) {
            case 'ecommerce': return { value: stats.totalRevenue,          fmt: (v: number) => `$${v.toLocaleString()}` };
            case 'news':
            case 'blog':      return { value: stats.totalPageviews,        fmt: (v: number) => formatCompact(v) };
            case 'local':     return { value: stats.totalGoalCompletions,  fmt: (v: number) => v.toLocaleString() };
            case 'saas':      return { value: stats.totalSubscribers,      fmt: (v: number) => v.toLocaleString() };
            default:          return { value: stats.totalGoalCompletions,  fmt: (v: number) => v.toLocaleString() };
        }
    }, [stats, industry]);

    const watchItems = useMemo(() => {
        const items: Array<{ label: string; value: number; color: string; urgent: boolean }> = [];
        if (stats.pagesLosingTraffic > 0)
            items.push({ label: 'Losing traffic', value: stats.pagesLosingTraffic, color: '#ef4444', urgent: true });
        if (stats.pagesInStrikingDistance > 0)
            items.push({ label: 'Striking distance', value: stats.pagesInStrikingDistance, color: '#3b82f6', urgent: false });
        if (stats.pagesWithZeroImpressions > 0)
            items.push({ label: 'Zero impressions', value: stats.pagesWithZeroImpressions, color: '#f59e0b', urgent: false });
        if (stats.cannibalizationCount > 0)
            items.push({ label: 'Cannibalized', value: stats.cannibalizationCount, color: '#a855f7', urgent: true });
        if (stats.orphanPagesWithValue > 0)
            items.push({ label: 'Orphans with value', value: stats.orphanPagesWithValue, color: '#f97316', urgent: true });
        return items;
    }, [stats]);

    return (
        <div className="p-3 space-y-4">

            {/* Score ring */}
            <section className="text-center py-2 border-b border-[#111]">
                <GradeRing
                    grade={wqaState.siteGrade}
                    score={wqaState.siteScore}
                    delta={wqaState.scoreDelta}
                />
            </section>

            {/* Growth forecast */}
            {wqaForecast && (
                <section className="bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F5364E]">Growth Projection</h4>
                        <span className="text-[9px] text-[#555]">If all actions resolved</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                            <div className="text-[18px] font-bold text-green-400">+{wqaForecast.projectedScore - wqaForecast.currentScore}</div>
                            <div className="text-[9px] text-[#888] uppercase">Score pts</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[18px] font-bold text-blue-400">+{formatCompact(wqaForecast.estimatedClickGain || 0)}</div>
                            <div className="text-[9px] text-[#888] uppercase">Est. clicks</div>
                        </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                        <ProjectionBar label="Technical"  pct={wqaForecast.breakdown.technical}  color="#ef4444" />
                        <ProjectionBar label="Content"    pct={wqaForecast.breakdown.content}    color="#3b82f6" />
                        <ProjectionBar label="Authority"  pct={wqaForecast.breakdown.authority}  color="#a855f7" />
                    </div>
                </section>
            )}

            {/* Quality radar */}
            <section>
                <SectionHeader title="Quality Breakdown" />
                <RadarChart data={radarData} size={200} />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                    {radarData.map((d) => (
                        <div key={d.axis} className="flex justify-between text-[10px]">
                            <span className="text-[#666]">{d.axis}</span>
                            <span className="text-white font-mono">{d.value}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Page value donut */}
            <section>
                <SectionHeader title="Page Value" />
                <DonutChart data={valueDonutData} size={160} />
                <div className="space-y-1 mt-2">
                    {valueDonutData.map((d) => (
                        <div key={d.label} className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                <span className="text-[#888]">{d.label}</span>
                            </div>
                            <span className="text-white font-mono">
                                {d.value.toLocaleString()}{' '}
                                <span className="text-[#555]">
                                    ({stats.totalPages > 0 ? Math.round((d.value / stats.totalPages) * 100) : 0}%)
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Key numbers */}
            <section>
                <SectionHeader title="Key Numbers" />
                <div className="grid grid-cols-3 gap-2">
                    <NumberCard label="Pages"      value={stats.totalPages.toLocaleString()} />
                    <NumberCard label="Indexed"    value={stats.indexedPages.toLocaleString()} />
                    <NumberCard label="Sitemap"    value={stats.sitemapPages.toLocaleString()} />
                    <NumberCard label="Clicks"     value={formatCompact(stats.totalClicks)} />
                    <NumberCard label="Impressions"value={formatCompact(stats.totalImpressions)} />
                    <NumberCard label="Avg CTR"    value={stats.avgCtr > 0 ? `${stats.avgCtr.toFixed(1)}%` : '—'} />
                    <NumberCard label="Sessions"   value={formatCompact(stats.totalSessions)} />
                    <NumberCard label={conversionLabel} value={conversionValue.fmt(conversionValue.value)} />
                    <NumberCard label="Actions"    value={(stats.pagesWithTechAction + stats.pagesWithContentAction).toLocaleString()} />
                </div>
            </section>

            {/* Watch list */}
            {watchItems.length > 0 && (
                <section>
                    <SectionHeader title="Watch" />
                    <div className="space-y-1.5">
                        {watchItems.map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center justify-between bg-[#111] border border-[#1a1a1a] rounded px-3 py-1.5"
                            >
                                <span className="text-[10px] text-[#888]">{item.label}</span>
                                <span
                                    className="text-[11px] font-bold font-mono"
                                    style={{ color: item.color }}
                                >
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Industry health */}
            {stats.industryStats && (
                <section>
                    <SectionHeader title={`${formatIndustryLabel(industry)} Health`} />
                    <IndustryHealthBlock industry={industry} stats={stats.industryStats} />
                </section>
            )}

            {/* AI summary */}
            {aiNarrative && (
                <section>
                    <SectionHeader title="AI Summary" />
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3 text-[11px] text-[#aaa] leading-relaxed">
                        {aiNarrative}
                    </div>
                </section>
            )}

            {/* Site info — collapsible */}
            <section>
                <button
                    onClick={() => setSiteInfoOpen((v) => !v)}
                    className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1 mb-1"
                >
                    <span>Site Info</span>
                    {siteInfoOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>
                {siteInfoOpen && (
                    <div className="space-y-1 text-[10px] mt-2">
                        <InfoRow label="Type"     value={`${formatIndustryLabel(industry)}${wqaState.industryConfidence > 0 ? ` (${wqaState.industryConfidence}%)` : ''}`} />
                        <InfoRow label="Language" value={wqaState.detectedLanguage !== 'unknown' ? wqaState.detectedLanguage.toUpperCase() : '—'} />
                        {wqaState.isMultiLanguage && (
                            <InfoRow
                                label="Languages"
                                value={wqaState.detectedLanguages.map((l) => `${l.code} (${l.percentage}%)`).join(', ')}
                            />
                        )}
                        <InfoRow label="CMS"           value={wqaState.detectedCms || 'Not detected'} />
                        <InfoRow label="Schema"        value={`${Math.round(stats.schemaCoverage)}%`} />
                        <InfoRow label="Sitemap cover" value={`${Math.round(stats.sitemapCoverage)}%`} />
                        <InfoRow label="Duplicates"    value={`${stats.duplicateRate.toFixed(1)}%`} />
                        <InfoRow label="Orphans"       value={`${stats.orphanRate.toFixed(1)}%`} />
                        <InfoRow label="Broken"        value={`${stats.brokenRate.toFixed(1)}%`} />
                    </div>
                )}
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

function GradeRing({ grade, score, delta }: { grade: string; score: number; delta: number }) {
    const pct = Math.min(100, Math.max(0, score));
    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
    const circumference = 2 * Math.PI * 42;
    const offset = circumference * (1 - pct / 100);

    return (
        <div className="flex flex-col items-center py-2">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={color} strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-700"
                />
                <text x="50" y="46" textAnchor="middle" fill="white"  fontSize="22" fontWeight="bold">{grade}</text>
                <text x="50" y="62" textAnchor="middle" fill="#888"   fontSize="10">{score}/100</text>
            </svg>
            {delta !== 0 && (
                <span className={`text-[11px] mt-1 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {delta > 0 ? '↑' : '↓'} {Math.abs(delta)} vs last crawl
                </span>
            )}
        </div>
    );
}

function NumberCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-[#111] border border-[#1a1a1a] rounded p-2 text-center">
            <div className="text-[13px] font-bold text-white font-mono">{value}</div>
            <div className="text-[9px] text-[#555] uppercase tracking-wider mt-0.5">{label}</div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-[#555]">{label}</span>
            <span className="text-[#ccc] font-mono text-right max-w-[60%] truncate">{value}</span>
        </div>
    );
}

function ProjectionBar({ label, pct, color }: { label: string; pct: number; color: string }) {
    return (
        <div className="space-y-0.5">
            <div className="flex justify-between text-[9px]">
                <span className="text-[#888]">{label}</span>
                <span className="text-[#ccc]">{Math.round(pct)}%</span>
            </div>
            <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function IndustryHealthBlock({
    industry,
    stats,
}: {
    industry: DetectedIndustry;
    stats: NonNullable<WqaSiteStats['industryStats']>;
}) {
    const bars: Array<{ label: string; value: number; suffix?: string }> = [];

    if (industry === 'ecommerce') {
        if (stats.productSchemaCoverage  != null) bars.push({ label: 'Product Schema',  value: stats.productSchemaCoverage,  suffix: '%' });
        if (stats.reviewSchemaCoverage   != null) bars.push({ label: 'Review Schema',   value: stats.reviewSchemaCoverage,   suffix: '%' });
        if (stats.breadcrumbCoverage     != null) bars.push({ label: 'Breadcrumbs',     value: stats.breadcrumbCoverage,     suffix: '%' });
    }
    if (industry === 'news' || industry === 'blog') {
        if (stats.articleSchemaCoverage  != null) bars.push({ label: 'Article Schema',  value: stats.articleSchemaCoverage,  suffix: '%' });
        if (stats.authorAttributionRate  != null) bars.push({ label: 'Author Rate',     value: stats.authorAttributionRate,  suffix: '%' });
        if (stats.publishDateRate        != null) bars.push({ label: 'Publish Date',    value: stats.publishDateRate,        suffix: '%' });
    }
    if (industry === 'local') {
        bars.push({ label: 'Local Schema',   value: stats.hasLocalSchema   ? 100 : 0, suffix: stats.hasLocalSchema   ? '✓' : '✗' });
        bars.push({ label: 'NAP Consistent', value: stats.napConsistent    ? 100 : 0, suffix: stats.napConsistent    ? '✓' : '✗' });
        bars.push({ label: 'GMB Linked',     value: stats.hasGmbLink       ? 100 : 0, suffix: stats.hasGmbLink       ? '✓' : '✗' });
    }
    if (industry === 'saas') {
        bars.push({ label: 'Pricing Page',   value: stats.hasPricingPage   ? 100 : 0, suffix: stats.hasPricingPage   ? '✓' : '✗' });
        bars.push({ label: 'Docs Section',   value: stats.hasDocsSection   ? 100 : 0, suffix: stats.hasDocsSection   ? '✓' : '✗' });
        bars.push({ label: 'Changelog',      value: stats.hasChangelog     ? 100 : 0, suffix: stats.hasChangelog     ? '✓' : '✗' });
        bars.push({ label: 'Status Page',    value: stats.hasStatusPage    ? 100 : 0, suffix: stats.hasStatusPage    ? '✓' : '✗' });
    }
    if (industry === 'healthcare') {
        if (stats.medicalAuthorRate    != null) bars.push({ label: 'Medical Author',   value: stats.medicalAuthorRate,    suffix: '%' });
        if (stats.medicalReviewRate    != null) bars.push({ label: 'Medical Review',   value: stats.medicalReviewRate,    suffix: '%' });
        if (stats.medicalDisclaimerRate!= null) bars.push({ label: 'Disclaimer',       value: stats.medicalDisclaimerRate,suffix: '%' });
    }
    if (industry === 'finance') {
        if (stats.financialDisclaimerRate != null) bars.push({ label: 'Disclaimer',    value: stats.financialDisclaimerRate, suffix: '%' });
        if (stats.authorCredentialsRate   != null) bars.push({ label: 'Credentials',   value: stats.authorCredentialsRate,   suffix: '%' });
    }
    if (industry === 'real_estate') {
        if (stats.priceMarkupCoverage != null) bars.push({ label: 'Price Markup',  value: stats.priceMarkupCoverage, suffix: '%' });
    }
    if (industry === 'restaurant') {
        bars.push({ label: 'Menu Schema',       value: stats.hasMenuSchema       ? 100 : 0, suffix: stats.hasMenuSchema       ? '✓' : '✗' });
        bars.push({ label: 'Reservation Link',  value: stats.hasReservationLink  ? 100 : 0, suffix: stats.hasReservationLink  ? '✓' : '✗' });
    }

    if (bars.length === 0) return null;

    return (
        <div className="space-y-2">
            {bars.map((bar) => (
                <GaugeBar key={bar.label} label={bar.label} value={bar.value} suffix={bar.suffix} />
            ))}
            {industry === 'ecommerce' && stats.outOfStockIndexed != null && stats.outOfStockIndexed > 0 && (
                <div className="text-[10px] text-orange-400 mt-1">
                    {stats.outOfStockIndexed} out-of-stock pages still indexed
                </div>
            )}
            {(industry === 'news' || industry === 'blog') && (
                <>
                    {stats.hasNewsSitemap === false && <div className="text-[10px] text-orange-400">No news sitemap detected</div>}
                    {stats.hasRssFeed    === false && <div className="text-[10px] text-[#666]">No RSS feed detected</div>}
                    {stats.publishingFrequency != null && (
                        <div className="text-[10px] text-[#888]">~{stats.publishingFrequency.toFixed(1)} articles/week</div>
                    )}
                </>
            )}
            {industry === 'local' && stats.serviceAreaPageCount != null && (
                <div className="text-[10px] text-[#888]">{stats.serviceAreaPageCount} service area pages</div>
            )}
        </div>
    );
}
