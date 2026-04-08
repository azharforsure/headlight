import React from 'react';
import { DataRow, formatBytes, formatDuration, formatNumber, MetricCard, SectionHeader, StatusBadge, TruncatedUrl } from './shared';

export default function GeneralTab({ page }: { page: any }) {
    const responseHeaders = page?.responseHeaders && typeof page.responseHeaders === 'object'
        ? Object.entries(page.responseHeaders)
        : [];
    const redirectChain = Array.isArray(page?.redirectChain) ? page.redirectChain : [];

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
                <MetricCard
                    label="Recommended Action"
                    value={page?.recommendedAction || 'Monitor'}
                    sub={page?.recommendedActionReason || 'No action assigned'}
                />
                <MetricCard
                    label="Opportunity"
                    value={formatNumber(page?.opportunityScore, { maximumFractionDigits: 0 })}
                    sub={`Confidence ${formatNumber(page?.insightConfidence, { maximumFractionDigits: 0 })}`}
                />
                <MetricCard
                    label="Business Value"
                    value={formatNumber(page?.businessValueScore, { maximumFractionDigits: 0 })}
                    sub={`Traffic quality ${formatNumber(page?.trafficQuality, { maximumFractionDigits: 0 })}`}
                />
                <MetricCard
                    label="Authority"
                    value={formatNumber(page?.authorityScore, { maximumFractionDigits: 0 })}
                    sub={`Coverage ${formatNumber(page?.dataCoverage, { maximumFractionDigits: 0 })}%`}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="HTTP & Server" />
                    <DataRow
                        label="URL"
                        value={<TruncatedUrl url={String(page?.url || '')} />}
                    />
                    <DataRow
                        label="Status"
                        value={`${page?.statusCode || '—'} ${page?.status || ''}`}
                        status={Number(page?.statusCode || 0) >= 400 ? 'fail' : Number(page?.statusCode || 0) >= 300 ? 'warn' : 'pass'}
                    />
                    <DataRow label="Content-Type" value={page?.contentType} />
                    <DataRow label="Protocol" value={page?.httpVersion} />
                    <DataRow label="Response Time" value={formatDuration(page?.loadTime)} mono status={Number(page?.loadTime || 0) > 1500 ? 'warn' : 'pass'} />
                    <DataRow label="DNS Time" value={formatDuration(page?.dnsResolutionTime)} mono />
                    <DataRow label="Size" value={formatBytes(page?.sizeBytes)} mono />
                    <DataRow label="Transferred" value={formatBytes(page?.transferredBytes)} mono />
                </div>

                <div>
                    <SectionHeader title="Crawl Info" />
                    <DataRow label="Crawl Depth" value={formatNumber(page?.crawlDepth)} mono />
                    <DataRow label="Folder Depth" value={formatNumber(page?.folderDepth)} mono />
                    <DataRow label="Indexability" value={page?.indexabilityStatus} status={page?.indexable === false ? 'fail' : 'pass'} />
                    <DataRow label="Canonical" value={page?.canonical} status={page?.canonical && page?.canonical !== page?.url ? 'info' : 'pass'} />
                    <DataRow label="Meta Robots" value={page?.metaRobots1} />
                    <DataRow label="Hash" value={page?.hash ? String(page.hash).slice(0, 24) : '—'} mono />
                    <DataRow label="In Sitemap" value={page?.inSitemap ? 'Yes' : 'No'} status={page?.inSitemap ? 'pass' : 'warn'} />
                    <DataRow label="Timestamp" value={page?.crawlTimestamp || page?.timestamp ? new Date(page?.crawlTimestamp || page?.timestamp).toLocaleString() : '—'} />
                </div>

                <div>
                    <SectionHeader title="Environment" />
                    <DataRow label="CO2" value={page?.co2Mg ? `${page.co2Mg}mg` : '—'} mono />
                    <DataRow
                        label="Carbon Rating"
                        value={page?.carbonRating}
                        status={page?.carbonRating === 'A' ? 'pass' : page?.carbonRating ? 'warn' : 'info'}
                    />
                    <DataRow label="Cookies" value={formatNumber(page?.cookieCount)} mono />
                    <DataRow label="SSL Valid" value={page?.sslValid === true ? 'Yes' : page?.sslValid === false ? 'No' : '—'} status={page?.sslValid === false ? 'fail' : 'pass'} />
                    <DataRow label="TLS" value={page?.sslProtocol} />
                    <DataRow label="Last Modified" value={page?.lastModified} />
                    <DataRow label="Cache-Control" value={page?.cacheControlValue} />
                    <DataRow label="X-Robots" value={page?.xRobots || page?.xRobotsTag} />
                </div>
            </div>

            {responseHeaders.length > 0 && (
                <div className="mt-6">
                    <SectionHeader title="Response Headers" />
                    <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden max-h-[240px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-[11px] font-mono">
                            <tbody>
                                {responseHeaders.map(([key, value]) => (
                                    <tr key={key} className="border-b border-[#1a1a1a] hover:bg-[#111]">
                                        <td className="px-3 py-1 text-[#F5364E] w-[210px]">{key}</td>
                                        <td className="px-3 py-1 text-[#ccc] break-all">{String(value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {redirectChain.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                        <SectionHeader title="Redirect Chain" />
                        <StatusBadge status={redirectChain.length > 2 ? 'warn' : 'info'} label={`${redirectChain.length} hops`} />
                    </div>
                    <div className="space-y-2">
                        {redirectChain.map((url: string, index: number) => (
                            <div key={`${url}-${index}`} className="bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-[11px] font-mono text-[#ccc] break-all">
                                <span className="text-[#666] mr-2">#{index + 1}</span>{url}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
