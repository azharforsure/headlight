import React, { useMemo } from 'react';
import type { WebsiteQualityState, WqaSiteStats } from '../../../../services/WebsiteQualityModeTypes';
import { getConversionLabel } from '../../../../services/WebsiteQualityModeTypes';
import type { DetectedIndustry } from '../../../../services/SiteTypeDetector';
import RadarChart from '../charts/RadarChart';
import DonutChart from '../charts/DonutChart';
import GaugeBar from '../charts/GaugeBar';

interface Props {
    stats: WqaSiteStats | null;
    wqaState: WebsiteQualityState;
    aiNarrative: string;
    industry: DetectedIndustry;
}

export default function WQAQualityTab({ stats, wqaState, aiNarrative, industry }: Props) {
    if (!stats) {
        return <div className="p-4 text-[12px] text-[#555] text-center">Run a crawl to see quality data.</div>;
    }

    const radarData = useMemo(() => [
        { axis: 'Content', value: stats.radarContent },
        { axis: 'SEO', value: stats.radarSeo },
        { axis: 'Authority', value: stats.radarAuthority },
        { axis: 'UX', value: stats.radarUx },
        { axis: 'Search', value: stats.radarSearchPerf },
        { axis: 'Trust', value: stats.radarTrust },
    ], [stats]);

    const valueDonutData = useMemo(() => [
        { label: '★★★ High', value: stats.highValuePages, color: '#22c55e' },
        { label: '★★ Medium', value: stats.mediumValuePages, color: '#3b82f6' },
        { label: '★ Low', value: stats.lowValuePages, color: '#f59e0b' },
        { label: '☆ Zero', value: stats.zeroValuePages, color: '#444' },
    ], [stats]);

    const conversionLabel = getConversionLabel(industry);

    const conversionValue = useMemo(() => {
        switch (industry) {
            case 'ecommerce': return { value: stats.totalRevenue, format: (v: number) => `$${v.toLocaleString()}` };
            case 'news':
            case 'blog': return { value: stats.totalPageviews, format: (v: number) => v.toLocaleString() };
            case 'local': return { value: stats.totalGoalCompletions, format: (v: number) => v.toLocaleString() };
            case 'saas': return { value: stats.totalSubscribers, format: (v: number) => v.toLocaleString() };
            default: return { value: stats.totalGoalCompletions, format: (v: number) => v.toLocaleString() };
        }
    }, [stats, industry]);

    return (
        <div className="p-3 space-y-4">
            <section className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#222] bg-[#111]">
                    <span className="text-2xl font-black text-white">{wqaState.siteGrade}</span>
                </div>
                <div className="mt-2 text-[13px] text-white font-semibold">
                    {wqaState.siteScore}/100
                    {wqaState.scoreDelta !== 0 && (
                        <span className={`ml-2 text-[11px] ${wqaState.scoreDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {wqaState.scoreDelta > 0 ? '↑' : '↓'} {Math.abs(wqaState.scoreDelta)} vs last
                        </span>
                    )}
                </div>
            </section>

            <section>
                <SectionHeader title="Quality Breakdown" />
                <RadarChart data={radarData} size={200} />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px]">
                    {radarData.map((d) => (
                        <div key={d.axis} className="flex justify-between text-[#888]">
                            <span>{d.axis}</span>
                            <span className="text-white font-mono">{d.value}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <SectionHeader title="Page Value" />
                <DonutChart data={valueDonutData} size={160} />
                <div className="space-y-1 mt-2">
                    {valueDonutData.map((d) => (
                        <div key={d.label} className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-[#888]">{d.label}</span>
                            </div>
                            <span className="text-white font-mono">{d.value.toLocaleString()} <span className="text-[#555]">({stats.totalPages > 0 ? Math.round((d.value / stats.totalPages) * 100) : 0}%)</span></span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <SectionHeader title="Key Numbers" />
                <div className="grid grid-cols-3 gap-2">
                    <NumberCard label="Pages" value={stats.totalPages.toLocaleString()} />
                    <NumberCard label="Indexed" value={stats.indexedPages.toLocaleString()} />
                    <NumberCard label="In Sitemap" value={stats.sitemapPages.toLocaleString()} />
                    <NumberCard label="Clicks" value={stats.totalClicks.toLocaleString()} />
                    <NumberCard label="Impressions" value={formatCompact(stats.totalImpressions)} />
                    <NumberCard label="Avg. Pos" value={stats.avgPosition > 0 ? stats.avgPosition.toFixed(1) : '—'} />
                    <NumberCard label="Sessions" value={formatCompact(stats.totalSessions)} />
                    <NumberCard label={conversionLabel} value={conversionValue.format(conversionValue.value)} />
                    <NumberCard label="Actions" value={stats.pagesWithTechAction + stats.pagesWithContentAction} />
                </div>
            </section>

            <section>
                <SectionHeader title="Site Info" />
                <div className="space-y-1 text-[10px]">
                    <InfoRow label="Type" value={`${formatIndustryLabel(industry)}${wqaState.industryConfidence > 0 ? ` (${wqaState.industryConfidence}%)` : ''}`} />
                    <InfoRow label="Language" value={wqaState.detectedLanguage !== 'unknown' ? wqaState.detectedLanguage.toUpperCase() : '—'} />
                    {wqaState.isMultiLanguage && (
                        <InfoRow
                            label="Languages"
                            value={wqaState.detectedLanguages.map((l) => `${l.code} (${l.percentage}%)`).join(', ')}
                        />
                    )}
                    <InfoRow label="CMS" value={wqaState.detectedCms || 'Not detected'} />
                    <InfoRow label="Schema Coverage" value={`${Math.round(stats.schemaCoverage)}%`} />
                    <InfoRow label="Sitemap Coverage" value={`${Math.round(stats.sitemapCoverage)}%`} />
                    <InfoRow label="Duplicate Rate" value={`${stats.duplicateRate.toFixed(1)}%`} />
                    <InfoRow label="Orphan Rate" value={`${stats.orphanRate.toFixed(1)}%`} />
                    <InfoRow label="Broken Rate" value={`${stats.brokenRate.toFixed(1)}%`} />
                </div>
            </section>

            {aiNarrative && (
                <section>
                    <SectionHeader title="AI Summary" />
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3 text-[11px] text-[#aaa] leading-relaxed">
                        {aiNarrative}
                    </div>
                </section>
            )}

            {stats.industryStats && (
                <section>
                    <SectionHeader title={`${formatIndustryLabel(industry)} Health`} />
                    <IndustryHealthBlock industry={industry} stats={stats.industryStats} />
                </section>
            )}
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1 mb-3">
            {title}
        </h4>
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

function IndustryHealthBlock({ industry, stats }: { industry: DetectedIndustry; stats: NonNullable<WqaSiteStats['industryStats']> }) {
    const bars: Array<{ label: string; value: number; suffix?: string }> = [];

    if (industry === 'ecommerce') {
        if (stats.productSchemaCoverage != null) bars.push({ label: 'Product Schema', value: stats.productSchemaCoverage, suffix: '%' });
        if (stats.reviewSchemaCoverage != null) bars.push({ label: 'Review Schema', value: stats.reviewSchemaCoverage, suffix: '%' });
        if (stats.breadcrumbCoverage != null) bars.push({ label: 'Breadcrumbs', value: stats.breadcrumbCoverage, suffix: '%' });
    }
    if (industry === 'news' || industry === 'blog') {
        if (stats.articleSchemaCoverage != null) bars.push({ label: 'Article Schema', value: stats.articleSchemaCoverage, suffix: '%' });
        if (stats.authorAttributionRate != null) bars.push({ label: 'Author Attribution', value: stats.authorAttributionRate, suffix: '%' });
        if (stats.publishDateRate != null) bars.push({ label: 'Publish Date', value: stats.publishDateRate, suffix: '%' });
    }
    if (industry === 'local') {
        bars.push({ label: 'Local Schema', value: stats.hasLocalSchema ? 100 : 0, suffix: stats.hasLocalSchema ? '✓' : '✗' });
        bars.push({ label: 'NAP Consistent', value: stats.napConsistent ? 100 : 0, suffix: stats.napConsistent ? '✓' : '✗' });
        bars.push({ label: 'GMB Linked', value: stats.hasGmbLink ? 100 : 0, suffix: stats.hasGmbLink ? '✓' : '✗' });
    }
    if (industry === 'saas') {
        bars.push({ label: 'Pricing Page', value: stats.hasPricingPage ? 100 : 0, suffix: stats.hasPricingPage ? '✓' : '✗' });
        bars.push({ label: 'Docs Section', value: stats.hasDocsSection ? 100 : 0, suffix: stats.hasDocsSection ? '✓' : '✗' });
        bars.push({ label: 'Changelog', value: stats.hasChangelog ? 100 : 0, suffix: stats.hasChangelog ? '✓' : '✗' });
    }
    if (industry === 'healthcare') {
        if (stats.medicalAuthorRate != null) bars.push({ label: 'Medical Author', value: stats.medicalAuthorRate, suffix: '%' });
        if (stats.medicalReviewRate != null) bars.push({ label: 'Medical Review', value: stats.medicalReviewRate, suffix: '%' });
        if (stats.medicalDisclaimerRate != null) bars.push({ label: 'Disclaimer', value: stats.medicalDisclaimerRate, suffix: '%' });
    }
    if (industry === 'finance') {
        if (stats.financialDisclaimerRate != null) bars.push({ label: 'Disclaimer', value: stats.financialDisclaimerRate, suffix: '%' });
        if (stats.authorCredentialsRate != null) bars.push({ label: 'Credentials', value: stats.authorCredentialsRate, suffix: '%' });
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
                    {stats.hasNewsSitemap === false && (
                        <div className="text-[10px] text-orange-400">No news sitemap detected</div>
                    )}
                    {stats.hasRssFeed === false && (
                        <div className="text-[10px] text-[#666]">No RSS feed detected</div>
                    )}
                    {stats.publishingFrequency != null && (
                        <div className="text-[10px] text-[#888]">Publishing: ~{stats.publishingFrequency.toFixed(1)} articles/week</div>
                    )}
                </>
            )}
            {industry === 'local' && stats.serviceAreaPageCount != null && (
                <div className="text-[10px] text-[#888]">Service area pages: {stats.serviceAreaPageCount}</div>
            )}
        </div>
    );
}

function formatIndustryLabel(industry: DetectedIndustry): string {
    const labels: Record<DetectedIndustry, string> = {
        ecommerce: 'E-commerce',
        news: 'News / Magazine',
        blog: 'Blog / Content',
        local: 'Local Business',
        saas: 'SaaS',
        healthcare: 'Healthcare',
        finance: 'Finance',
        education: 'Education',
        real_estate: 'Real Estate',
        restaurant: 'Restaurant',
        portfolio: 'Portfolio',
        job_board: 'Job Board',
        general: 'General',
    };
    return labels[industry] || 'General';
}

function formatCompact(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
}
