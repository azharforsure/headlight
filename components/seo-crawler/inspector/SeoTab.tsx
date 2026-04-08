import React from 'react';
import { DataRow, formatNumber, IssuesList, getPageIssues, SectionHeader, StatusBadge, TruncatedUrl } from './shared';

const renderSnippet = (page: any) => (
    <div className="border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] p-4">
        <div className="text-[#8ab4f8] text-[20px] leading-tight truncate">{page?.title || 'Untitled Page'}</div>
        <div className="text-[#5f6368] text-[12px] mt-1 truncate">{page?.url}</div>
        <div className="text-[#bdc1c6] text-[13px] mt-2 line-clamp-3">
            {page?.metaDesc || 'No meta description found. Search engines may auto-generate a snippet.'}
        </div>
    </div>
);

export default function SeoTab({ page }: { page: any }) {
    const issues = getPageIssues(page).filter((issue) =>
        /title|meta|h1|h2|canonical|index|robots|hreflang|amp|mobile|pagination|schema/i.test(issue.label)
    );
    const hreflang = Array.isArray(page?.hreflang) ? page.hreflang : [];

    return (
        <div>
            <IssuesList issues={issues} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="Title & Meta" />
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] text-[#666] uppercase tracking-widest">Title</span>
                                <StatusBadge
                                    status={!page?.title ? 'fail' : Number(page?.titleLength || 0) > 60 ? 'warn' : 'pass'}
                                    label={!page?.title ? 'Missing' : `${formatNumber(page?.titleLength)}ch / ${formatNumber(page?.titlePixelWidth)}px`}
                                />
                            </div>
                            <div className="text-[12px] text-white bg-[#0a0a0a] border border-[#222] rounded p-2 break-all">
                                {page?.title || <span className="text-red-400 italic">No title tag found</span>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] text-[#666] uppercase tracking-widest">Meta Description</span>
                                <StatusBadge
                                    status={!page?.metaDesc ? 'fail' : Number(page?.metaDescLength || 0) > 155 ? 'warn' : 'pass'}
                                    label={!page?.metaDesc ? 'Missing' : `${formatNumber(page?.metaDescLength)}ch`}
                                />
                            </div>
                            <div className="text-[12px] text-[#ddd] bg-[#0a0a0a] border border-[#222] rounded p-2 break-all">
                                {page?.metaDesc || <span className="text-red-400 italic">No meta description found</span>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] text-[#666] uppercase tracking-widest">H1</span>
                                <StatusBadge
                                    status={!page?.h1_1 ? 'fail' : page?.multipleH1s ? 'warn' : 'pass'}
                                    label={!page?.h1_1 ? 'Missing' : page?.multipleH1s ? 'Multiple' : `${formatNumber(page?.h1_1Length)}ch`}
                                />
                            </div>
                            <div className="text-[12px] text-white bg-[#0a0a0a] border border-[#222] rounded p-2 break-all">
                                {page?.h1_1 || <span className="text-red-400 italic">No H1 tag found</span>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <SectionHeader title="SERP Preview" />
                        {renderSnippet(page)}
                    </div>
                </div>

                <div>
                    <SectionHeader title="Indexability & Tech SEO" />
                    <DataRow label="Indexable" value={page?.indexable !== false ? 'Yes' : 'No'} status={page?.indexable === false ? 'fail' : 'pass'} />
                    <DataRow label="Indexability Status" value={page?.indexabilityStatus} />
                    <DataRow label="Canonical" value={page?.canonical ? <TruncatedUrl url={page.canonical} /> : 'None'} status={page?.canonical && page?.canonical !== page?.url ? 'info' : 'pass'} />
                    <DataRow label="Meta Robots" value={page?.metaRobots1} />
                    <DataRow label="X-Robots-Tag" value={page?.xRobots || page?.xRobotsTag} />
                    <DataRow label="rel=next" value={page?.relNextTag || page?.httpRelNext} />
                    <DataRow label="rel=prev" value={page?.relPrevTag || page?.httpRelPrev} />
                    <DataRow label="Meta Refresh" value={page?.metaRefresh} status={page?.metaRefresh ? 'warn' : 'pass'} />
                    <DataRow label="AMP Link" value={page?.amphtml} />
                    <DataRow label="Mobile Alt" value={page?.mobileAlt} />
                    <DataRow label="Language" value={page?.language} />

                    <div className="mt-5">
                        <SectionHeader title="Hreflang" />
                        {hreflang.length === 0 ? (
                            <div className="text-[12px] text-[#666] bg-[#0a0a0a] border border-[#222] rounded p-3">
                                No hreflang annotations found.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {hreflang.map((entry: any, index: number) => (
                                    <DataRow
                                        key={`${entry?.lang || 'lang'}-${index}`}
                                        label={entry?.lang || `Tag ${index + 1}`}
                                        value={entry?.href || entry}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
