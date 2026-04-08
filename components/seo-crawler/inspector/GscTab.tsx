import React from 'react';
import { DataRow, formatNumber, formatPercent, MetricCard, SectionHeader, StatusBadge } from './shared';

export default function GscTab({ page }: { page: any }) {
    const hasGsc = [page?.gscClicks, page?.gscImpressions, page?.gscCtr, page?.gscPosition].some(
        (value) => value !== null && value !== undefined
    );
    const topQueries = Array.isArray(page?.gscTopQueries) ? page.gscTopQueries : [];

    if (!hasGsc) {
        return (
            <div className="bg-[#0a0a0a] border border-[#222] rounded p-5 text-center">
                <div className="text-[14px] text-white font-semibold mb-2">Google Search Console not connected</div>
                <div className="text-[12px] text-[#666]">Connect GSC in Integrations to populate clicks, impressions, CTR, and query data.</div>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <MetricCard label="Clicks (30d)" value={formatNumber(page?.gscClicks)} />
                <MetricCard label="Impressions (30d)" value={formatNumber(page?.gscImpressions)} />
                <MetricCard label="CTR" value={formatPercent(page?.gscCtr, 100)} />
                <MetricCard label="Avg Position" value={formatNumber(page?.gscPosition, { maximumFractionDigits: 1 })} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="Primary Keywords" />
                    <DataRow label="Main Keyword" value={page?.mainKeyword} />
                    <DataRow label="Main Position" value={formatNumber(page?.mainKwPosition, { maximumFractionDigits: 1 })} />
                    <DataRow label="Main Volume" value={formatNumber(page?.mainKwVolume)} />
                    <DataRow label="Best Keyword" value={page?.bestKeyword} />
                    <DataRow label="Best Position" value={formatNumber(page?.bestKwPosition, { maximumFractionDigits: 1 })} />
                    <DataRow label="Best Volume" value={formatNumber(page?.bestKwVolume)} />
                </div>

                <div>
                    <SectionHeader title="Query Health" />
                    <StatusBadge status={Number(page?.gscImpressions || 0) > 1000 && Number(page?.gscCtr || 0) < 0.01 ? 'warn' : 'pass'} label={Number(page?.gscImpressions || 0) > 1000 && Number(page?.gscCtr || 0) < 0.01 ? 'High impressions, low CTR' : 'CTR profile healthy'} />
                    <div className="mt-3">
                        <DataRow label="Position Bucket" value={Number(page?.gscPosition || 0) <= 10 ? 'Page 1' : Number(page?.gscPosition || 0) <= 20 ? 'Page 2' : 'Beyond page 2'} />
                        <DataRow label="Opportunity" value={Number(page?.gscPosition || 0) > 10 && Number(page?.gscPosition || 0) <= 20 ? 'Striking distance' : '—'} />
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <SectionHeader title="Top Queries" />
                {topQueries.length === 0 ? (
                    <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-[12px] text-[#666]">
                        No query-level rows captured for this page.
                    </div>
                ) : (
                    <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden max-h-[320px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-[11px] font-mono">
                            <thead className="sticky top-0 bg-[#111] border-b border-[#222]">
                                <tr>
                                    <th className="text-left px-3 py-2 text-[#555]">Query</th>
                                    <th className="text-left px-3 py-2 text-[#555]">Clicks</th>
                                    <th className="text-left px-3 py-2 text-[#555]">Impr.</th>
                                    <th className="text-left px-3 py-2 text-[#555]">CTR</th>
                                    <th className="text-left px-3 py-2 text-[#555]">Pos.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topQueries.map((query: any, index: number) => (
                                    <tr key={`query-${index}`} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                                        <td className="px-3 py-1.5 text-[#ddd]">{query?.query || query?.keyword || '—'}</td>
                                        <td className="px-3 py-1.5 text-[#bbb]">{formatNumber(query?.clicks)}</td>
                                        <td className="px-3 py-1.5 text-[#bbb]">{formatNumber(query?.impressions)}</td>
                                        <td className="px-3 py-1.5 text-[#bbb]">{formatPercent(query?.ctr, 100)}</td>
                                        <td className="px-3 py-1.5 text-[#bbb]">{formatNumber(query?.position, { maximumFractionDigits: 1 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
