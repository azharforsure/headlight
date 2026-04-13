import React, { useMemo, useState } from 'react';
import { FileText, Link2, Search } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import type { CompetitorProfile } from '../../../services/CompetitorMatrixConfig';
import { analyzeCompetitorOverlap } from '../../../services/CompetitorDiscoveryService';
import { findKeywordGaps } from '../../../services/KeywordDiscoveryService';
import GapList, { type GapItem } from './shared/GapList';
import { SUBTAB_ACTIVE, SUBTAB_BASE, SUBTAB_INACTIVE } from './shared/styles';

type SubTab = 'keywords' | 'content' | 'links';

function profilePages(profile: CompetitorProfile): Array<{ url: string; title: string }> {
    return [...(profile.topOrganicPages || []), ...(profile.topBlogPages || [])]
        .filter((p) => p?.url)
        .map((p) => ({ url: p.url, title: p.title || '' }));
}

export default function CompGapsTab() {
    const [subTab, setSubTab] = useState<SubTab>('keywords');
    const { competitiveState, pages } = useSeoCrawler();
    const { ownProfile, competitorProfiles, activeCompetitorDomains } = competitiveState;

    const activeComps = useMemo(
        () => activeCompetitorDomains.map((d) => competitorProfiles.get(d)).filter(Boolean) as CompetitorProfile[],
        [activeCompetitorDomains, competitorProfiles]
    );

    const compPages = useMemo(() => activeComps.flatMap((comp) => profilePages(comp)), [activeComps]);

    const keywordGaps = useMemo(() => {
        if (!pages || pages.length === 0) return [];
        return findKeywordGaps(pages, compPages);
    }, [pages, compPages]);

    const contentGaps = useMemo(() => {
        if (!pages || pages.length === 0 || compPages.length === 0) {
            return { commonKeywords: [] as string[], uniqueKeywords: [] as string[] };
        }

        const unique = new Set<string>();
        const common = new Set<string>();
        activeComps.forEach((comp) => {
            const overlap = analyzeCompetitorOverlap(pages, profilePages(comp));
            overlap.uniqueKeywords.forEach((k) => unique.add(k));
            overlap.commonKeywords.forEach((k) => common.add(k));
        });
        return { commonKeywords: [...common], uniqueKeywords: [...unique] };
    }, [pages, compPages, activeComps]);

    const linkGaps = useMemo(() => {
        if (!ownProfile || activeComps.length === 0) return null;

        const yourRD = Number(ownProfile.referringDomains || 0);
        const compAvgRD = activeComps.reduce((sum, c) => sum + Number(c.referringDomains || 0), 0) / activeComps.length;
        const gap = Math.round(compAvgRD - yourRD);
        const yourUR = Number(ownProfile.urlRating || 0);
        const compAvgUR = activeComps.reduce((sum, c) => sum + Number(c.urlRating || 0), 0) / activeComps.length;

        return {
            yourRD,
            compAvgRD: Math.round(compAvgRD),
            gap,
            yourUR,
            compAvgUR: Math.round(compAvgUR),
        };
    }, [ownProfile, activeComps]);

    const subTabs: Array<{ id: SubTab; label: string; icon: React.ReactNode }> = [
        { id: 'keywords', label: 'Keywords', icon: <Search size={12} /> },
        { id: 'content', label: 'Content', icon: <FileText size={12} /> },
        { id: 'links', label: 'Links', icon: <Link2 size={12} /> },
    ];

    const keywordGapItems: GapItem[] = keywordGaps.map((g) => ({
        keyword: g.keyword,
        intent: g.intent || undefined,
        volume: g.volume ?? null,
        competitorPosition: g.position ?? null,
    }));

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex gap-1 border-b border-[#222] p-2">
                {subTabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setSubTab(t.id)}
                        className={`${SUBTAB_BASE} ${subTab === t.id ? SUBTAB_ACTIVE : SUBTAB_INACTIVE}`}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
                {subTab === 'keywords' && (
                    <>
                        <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#555]">Keyword Universe</div>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                <div className="text-center">
                                    <div className="font-mono text-[18px] font-black text-white">{contentGaps.commonKeywords.length}</div>
                                    <div className="text-[9px] uppercase text-[#666]">Shared</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-mono text-[18px] font-black text-green-400">
                                        {pages?.filter((p: any) => p.mainKeyword).length || 0}
                                    </div>
                                    <div className="text-[9px] uppercase text-[#666]">Your Unique</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-mono text-[18px] font-black text-red-400">{keywordGaps.length}</div>
                                    <div className="text-[9px] uppercase text-red-400/60">Gaps</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                                Keyword Gaps ({keywordGapItems.length})
                            </div>
                            <GapList items={keywordGapItems.slice(0, 10)} emptyMessage="No keyword gaps detected. Great coverage!" />
                            {keywordGapItems.length > 10 && (
                                <div className="mt-2 text-center text-[10px] text-[#555]">
                                    +{keywordGapItems.length - 10} more - see full list in Keywords view
                                </div>
                            )}
                        </div>
                    </>
                )}

                {subTab === 'content' && (
                    <>
                        <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#555]">Content Type Comparison</div>
                            {activeComps.length === 0 && <div className="py-2 text-[11px] text-[#555]">No competitors selected.</div>}
                            {activeComps.map((comp) => (
                                <div key={comp.domain} className="mb-3">
                                    <div className="mb-1 text-[11px] font-bold text-[#aaa]">{comp.domain}</div>
                                    <div className="space-y-1">
                                        {[
                                            {
                                                label: 'Indexable Pages',
                                                yours: ownProfile?.totalIndexablePages,
                                                theirs: comp.totalIndexablePages,
                                            },
                                            {
                                                label: 'Blog Posts/Mo',
                                                yours: ownProfile?.blogPostsPerMonth,
                                                theirs: comp.blogPostsPerMonth,
                                            },
                                            {
                                                label: 'Avg Words/Article',
                                                yours: ownProfile?.avgWordsPerArticle,
                                                theirs: comp.avgWordsPerArticle,
                                            },
                                        ].map((row) => (
                                            <div key={row.label} className="flex items-center text-[10px]">
                                                <span className="w-[110px] text-[#666]">{row.label}</span>
                                                <span className="w-[50px] text-right font-mono text-white">{row.yours ?? '—'}</span>
                                                <span className="mx-1 text-[#333]">vs</span>
                                                <span
                                                    className={`w-[50px] font-mono ${
                                                        Number(row.theirs || 0) > Number(row.yours || 0) ? 'text-red-400' : 'text-green-400'
                                                    }`}
                                                >
                                                    {row.theirs ?? '—'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                                Topic Gaps ({contentGaps.uniqueKeywords.length})
                            </div>
                            <GapList
                                items={contentGaps.uniqueKeywords.slice(0, 10).map((kw) => ({ keyword: kw }))}
                                emptyMessage="No content topic gaps detected."
                            />
                            {contentGaps.uniqueKeywords.length > 10 && (
                                <div className="mt-2 text-center text-[10px] text-[#555]">
                                    +{contentGaps.uniqueKeywords.length - 10} more topics
                                </div>
                            )}
                        </div>
                    </>
                )}

                {subTab === 'links' && (
                    <>
                        {!linkGaps && <div className="py-8 text-center text-[11px] text-[#555]">No link data available yet.</div>}
                        {linkGaps && (
                            <>
                                <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#555]">Backlink Gap</div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-[#888]">Your Referring Domains</span>
                                            <span className="font-mono text-[14px] font-bold text-white">{linkGaps.yourRD.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-[#888]">Competitor Avg RD</span>
                                            <span className="font-mono text-[14px] font-bold text-white">{linkGaps.compAvgRD.toLocaleString()}</span>
                                        </div>
                                        <div className="h-px bg-[#222]" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-[#888]">Gap</span>
                                            <span
                                                className={`font-mono text-[16px] font-black ${
                                                    linkGaps.gap > 0 ? 'text-red-400' : 'text-green-400'
                                                }`}
                                            >
                                                {linkGaps.gap > 0 ? '+' : ''}
                                                {linkGaps.gap.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#555]">URL Rating Comparison</div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 text-center">
                                            <div className="font-mono text-[20px] font-black text-white">{linkGaps.yourUR}</div>
                                            <div className="text-[9px] uppercase text-[#666]">You</div>
                                        </div>
                                        <div className="text-[12px] text-[#333]">vs</div>
                                        <div className="flex-1 text-center">
                                            <div
                                                className={`font-mono text-[20px] font-black ${
                                                    linkGaps.compAvgUR > linkGaps.yourUR ? 'text-red-400' : 'text-green-400'
                                                }`}
                                            >
                                                {linkGaps.compAvgUR}
                                            </div>
                                            <div className="text-[9px] uppercase text-[#666]">Comp Avg</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-4">
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#555]">Per Competitor</div>
                                    {activeComps.map((comp) => {
                                        const rd = Number(comp.referringDomains || 0);
                                        return (
                                            <div
                                                key={comp.domain}
                                                className="flex items-center justify-between border-b border-[#111] py-1.5 last:border-0"
                                            >
                                                <span className="max-w-[120px] truncate text-[11px] text-[#aaa]">{comp.domain}</span>
                                                <div className="flex gap-3 text-[10px] font-mono">
                                                    <span className={rd > linkGaps.yourRD ? 'text-red-400' : 'text-green-400'}>
                                                        {rd.toLocaleString()} RD
                                                    </span>
                                                    <span className="text-[#666]">UR {comp.urlRating ?? '—'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
