import React, { useMemo } from 'react';
import type { WqaSiteStats } from '../../../../services/WebsiteQualityModeTypes';
import type { DetectedIndustry } from '../../../../services/SiteTypeDetector';
import GaugeBar from '../charts/GaugeBar';

interface Props {
    pages: any[];
    filteredPages: any[];
    stats: WqaSiteStats | null;
    industry: DetectedIndustry;
}

export default function WQAContentTab({ pages, stats }: Props) {
    if (!stats) return <div className="p-4 text-[12px] text-[#555] text-center">No data yet.</div>;

    const htmlPages = useMemo(() => pages.filter((p) => p.isHtmlPage && p.statusCode === 200), [pages]);

    const qualityByCategory = useMemo(() => {
        const cats = ['product', 'blog_post', 'category', 'landing_page', 'service_page', 'other'];
        return cats.map((cat) => {
            const catPages = htmlPages.filter((p) => p.pageCategory === cat);
            if (catPages.length === 0) return null;
            const scored = catPages.filter((p) => Number(p.contentQualityScore || 0) > 0);
            const good = scored.filter((p) => Number(p.contentQualityScore) >= 70).length;
            const fair = scored.filter((p) => { const s = Number(p.contentQualityScore); return s >= 40 && s < 70; }).length;
            const poor = scored.filter((p) => Number(p.contentQualityScore) < 40).length;
            return { cat: formatCat(cat), total: catPages.length, good, fair, poor };
        }).filter(Boolean) as Array<{ cat: string; total: number; good: number; fair: number; poor: number }>;
    }, [htmlPages]);

    const wordBuckets = useMemo(() => {
        const buckets = [
            { label: '<100', min: 0, max: 100, count: 0 },
            { label: '100-300', min: 100, max: 300, count: 0 },
            { label: '300-800', min: 300, max: 800, count: 0 },
            { label: '800-1500', min: 800, max: 1500, count: 0 },
            { label: '1500+', min: 1500, max: Infinity, count: 0 },
        ];
        htmlPages.forEach((p) => {
            const wc = Number(p.wordCount || 0);
            const bucket = buckets.find((b) => wc >= b.min && wc < b.max);
            if (bucket) bucket.count += 1;
        });
        return buckets;
    }, [htmlPages]);

    const maxWordCount = Math.max(...wordBuckets.map((b) => b.count), 1);

    const eeat = useMemo(() => {
        const scored = htmlPages.filter((p) => Number(p.eeatScore || 0) > 0);
        if (scored.length === 0) return null;
        const avg = scored.reduce((s, p) => s + Number(p.eeatScore || 0), 0) / scored.length;
        return { overall: Math.round(avg) };
    }, [htmlPages]);

    const freshness = useMemo(() => {
        const now = Date.now();
        const sixMo = 180 * 24 * 60 * 60 * 1000;
        const oneYr = 365 * 24 * 60 * 60 * 1000;
        const twoYr = 2 * oneYr;

        let fresh = 0; let aging = 0; let stale = 0; let ancient = 0; let unknown = 0;
        htmlPages.forEach((p) => {
            const date = p.visibleDate || p.lastModified;
            if (!date) { unknown += 1; return; }
            const age = now - new Date(date).getTime();
            if (age < sixMo) fresh += 1;
            else if (age < oneYr) aging += 1;
            else if (age < twoYr) stale += 1;
            else ancient += 1;
        });
        return { fresh, aging, stale, ancient, unknown };
    }, [htmlPages]);

    const freshnessTotal = freshness.fresh + freshness.aging + freshness.stale + freshness.ancient;

    const contentIssues = useMemo(() => {
        const exactDup = htmlPages.filter((p) => p.exactDuplicate).length;
        const nearDup = htmlPages.filter((p) => Number(p.noNearDuplicates || 0) > 0).length;
        const thin = htmlPages.filter((p) => p.isThinContent).length;
        const empty = htmlPages.filter((p) => Number(p.wordCount || 0) === 0 && p.statusCode === 200).length;
        const stuffing = htmlPages.filter((p) => p.hasKeywordStuffing).length;
        const cannibalized = htmlPages.filter((p) => p.isCannibalized).length;
        return { exactDup, nearDup, thin, empty, stuffing, cannibalized };
    }, [htmlPages]);

    const missing = useMemo(() => ({
        title: htmlPages.filter((p) => !p.title).length,
        meta: htmlPages.filter((p) => !p.metaDesc).length,
        h1: htmlPages.filter((p) => !p.h1_1).length,
        schema: htmlPages.filter((p) => !(p.schemaTypes || []).length).length,
        ogTags: htmlPages.filter((p) => !p.ogTitle).length,
        altText: htmlPages.filter((p) => Number(p.missingAltImages || 0) > 0).length,
    }), [htmlPages]);

    return (
        <div className="p-3 space-y-4">
            <section>
                <SectionHeader title="Quality by Category" />
                <div className="space-y-2">
                    {qualityByCategory.map((row) => (
                        <div key={row.cat}>
                            <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="text-[#888]">{row.cat}</span>
                                <span className="text-[#555]">{row.total} pages</span>
                            </div>
                            <div className="flex h-2 rounded-full overflow-hidden bg-[#1a1a1a]">
                                {row.good > 0 && <div className="bg-green-500" style={{ width: `${(row.good / row.total) * 100}%` }} />}
                                {row.fair > 0 && <div className="bg-yellow-500" style={{ width: `${(row.fair / row.total) * 100}%` }} />}
                                {row.poor > 0 && <div className="bg-red-500" style={{ width: `${(row.poor / row.total) * 100}%` }} />}
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-3 text-[9px] text-[#555] mt-1">
                        <span><span className="text-green-400">■</span> Good</span>
                        <span><span className="text-yellow-400">■</span> Fair</span>
                        <span><span className="text-red-400">■</span> Poor</span>
                    </div>
                </div>
            </section>

            <section>
                <SectionHeader title="Word Count" />
                <div className="space-y-1">
                    {wordBuckets.map((b) => (
                        <div key={b.label} className="flex items-center gap-2 text-[10px]">
                            <span className="text-[#888] w-14 text-right">{b.label}</span>
                            <div className="flex-1 h-3 bg-[#1a1a1a] rounded overflow-hidden">
                                <div className="h-full bg-[#3b82f6] rounded" style={{ width: `${(b.count / maxWordCount) * 100}%` }} />
                            </div>
                            <span className="text-[#555] w-10 font-mono text-right">{b.count}</span>
                        </div>
                    ))}
                </div>
            </section>

            {eeat && (
                <section>
                    <SectionHeader title="E-E-A-T Score" />
                    <GaugeBar label="Overall E-E-A-T" value={eeat.overall} suffix="/100" />
                    <div className="text-[9px] text-[#555] mt-1">Average across {htmlPages.filter((p) => Number(p.eeatScore || 0) > 0).length} scored pages</div>
                </section>
            )}

            <section>
                <SectionHeader title="Content Freshness" />
                <div className="space-y-1">
                    {[
                        { label: 'Fresh (<6mo)', count: freshness.fresh, color: '#22c55e' },
                        { label: 'Aging (6-12mo)', count: freshness.aging, color: '#f59e0b' },
                        { label: 'Stale (1-2yr)', count: freshness.stale, color: '#f97316' },
                        { label: 'Ancient (2yr+)', count: freshness.ancient, color: '#ef4444' },
                    ].map((row) => (
                        <div key={row.label} className="flex items-center gap-2 text-[10px]">
                            <span className="text-[#888] w-24">{row.label}</span>
                            <div className="flex-1 h-3 bg-[#1a1a1a] rounded overflow-hidden">
                                <div className="h-full rounded" style={{ backgroundColor: row.color, width: `${freshnessTotal > 0 ? (row.count / freshnessTotal) * 100 : 0}%` }} />
                            </div>
                            <span className="text-[#555] w-10 font-mono text-right">{row.count}</span>
                        </div>
                    ))}
                    {freshness.unknown > 0 && <div className="text-[9px] text-[#444]">{freshness.unknown} pages with no date detected</div>}
                </div>
            </section>

            <section>
                <SectionHeader title="Content Issues" />
                <div className="space-y-1 text-[10px]">
                    {[
                        { label: 'Exact duplicates', count: contentIssues.exactDup, severity: 'error' },
                        { label: 'Near-duplicates', count: contentIssues.nearDup, severity: 'warn' },
                        { label: 'Thin content', count: contentIssues.thin, severity: 'warn' },
                        { label: 'Empty pages', count: contentIssues.empty, severity: 'error' },
                        { label: 'Keyword stuffing', count: contentIssues.stuffing, severity: 'warn' },
                        { label: 'Cannibalized keywords', count: contentIssues.cannibalized, severity: 'warn' },
                    ].filter((r) => r.count > 0).map((row) => (
                        <div key={row.label} className="flex justify-between">
                            <span className="text-[#888]">{row.label}</span>
                            <span className={`font-mono ${row.severity === 'error' ? 'text-red-400' : 'text-orange-400'}`}>{row.count}</span>
                        </div>
                    ))}
                    {Object.values(contentIssues).every((v) => v === 0) && <div className="text-[#555]">No content issues found ✓</div>}
                </div>
            </section>

            <section>
                <SectionHeader title="Missing Elements" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    {[
                        { label: 'Title', count: missing.title },
                        { label: 'Meta', count: missing.meta },
                        { label: 'H1', count: missing.h1 },
                        { label: 'Schema', count: missing.schema },
                        { label: 'OG Tags', count: missing.ogTags },
                        { label: 'Alt Text', count: missing.altText },
                    ].map((row) => (
                        <div key={row.label} className="flex justify-between">
                            <span className="text-[#888]">{row.label}</span>
                            <span className={`font-mono ${row.count > 0 ? 'text-orange-400' : 'text-green-400'}`}>{row.count > 0 ? row.count : '✓'}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1 mb-3">{title}</h4>;
}

function formatCat(cat: string): string {
    const map: Record<string, string> = {
        product: 'Product', blog_post: 'Blog', category: 'Category', landing_page: 'Landing',
        service_page: 'Service', homepage: 'Home', other: 'Other',
    };
    return map[cat] || cat;
}
