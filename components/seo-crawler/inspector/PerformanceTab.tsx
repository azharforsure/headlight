import React from 'react';
import { DataRow, formatBytes, formatDuration, formatNumber, MetricCard, SectionHeader, StatusBadge } from './shared';

const MetricGauge = ({ label, value, unit, goodThreshold, warnThreshold }: {
    label: string;
    value: number | null;
    unit: string;
    goodThreshold: number;
    warnThreshold: number;
}) => {
    if (value === null || Number.isNaN(value)) {
        return (
            <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
                <div className="text-[10px] text-[#666] uppercase tracking-widest">{label}</div>
                <div className="text-[22px] font-black mt-1 text-[#666]">—</div>
                <div className="text-[10px] text-[#555] mt-1">Not available</div>
            </div>
        );
    }

    const status = value <= goodThreshold ? 'pass' : value <= warnThreshold ? 'warn' : 'fail';
    const color = status === 'pass' ? 'text-green-400' : status === 'warn' ? 'text-orange-400' : 'text-red-400';
    const ratio = Math.min(100, Math.round((value / warnThreshold) * 100));

    return (
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
            <div className="text-[10px] text-[#666] uppercase tracking-widest">{label}</div>
            <div className={`text-[22px] font-black mt-1 ${color}`}>{value}{unit}</div>
            <div className="mt-2 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className={`h-full ${status === 'pass' ? 'bg-green-500' : status === 'warn' ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${ratio}%` }} />
            </div>
        </div>
    );
};

export default function PerformanceTab({ page }: { page: any }) {
    const lcp = page?.lcp === null || page?.lcp === undefined ? null : Number(page.lcp);
    const cls = page?.cls === null || page?.cls === undefined ? null : Number(page.cls);
    const inp = page?.inp === null || page?.inp === undefined ? null : Number(page.inp);

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <MetricGauge label="LCP" value={lcp} unit="ms" goodThreshold={2500} warnThreshold={4000} />
                <MetricGauge label="CLS" value={cls} unit="" goodThreshold={0.1} warnThreshold={0.25} />
                <MetricGauge label="INP" value={inp} unit="ms" goodThreshold={200} warnThreshold={500} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <MetricCard label="TTFB" value={formatDuration(page?.loadTime)} />
                <MetricCard label="DOM Nodes" value={formatNumber(page?.domNodeCount)} />
                <MetricCard label="Render Blocking" value={formatNumber(Number(page?.renderBlockingCss || 0) + Number(page?.renderBlockingJs || 0))} />
                <MetricCard label="Third-Party Scripts" value={formatNumber(page?.thirdPartyScriptCount)} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="Runtime Metrics" />
                    <DataRow label="Response Time" value={formatDuration(page?.loadTime)} status={Number(page?.loadTime || 0) > 1500 ? 'warn' : 'pass'} />
                    <DataRow label="DNS Time" value={formatDuration(page?.dnsResolutionTime)} />
                    <DataRow label="HTTP Version" value={page?.httpVersion} />
                    <DataRow label="Size" value={formatBytes(page?.sizeBytes)} />
                    <DataRow label="Transferred" value={formatBytes(page?.transferredBytes)} />
                    <DataRow label="Total Transferred" value={formatBytes(page?.totalTransferred)} />
                    <DataRow label="Carbon" value={page?.co2Mg ? `${formatNumber(page.co2Mg)} mg` : '—'} />
                </div>
                <div>
                    <SectionHeader title="Optimization Signals" />
                    <DataRow label="Render-Blocking CSS" value={formatNumber(page?.renderBlockingCss)} status={Number(page?.renderBlockingCss || 0) > 3 ? 'warn' : 'pass'} />
                    <DataRow label="Render-Blocking JS" value={formatNumber(page?.renderBlockingJs)} status={Number(page?.renderBlockingJs || 0) > 2 ? 'warn' : 'pass'} />
                    <DataRow label="Preconnect Hints" value={formatNumber(page?.preconnectCount)} />
                    <DataRow label="DNS Prefetch Hints" value={formatNumber(page?.prefetchCount)} />
                    <DataRow label="Preload Hints" value={formatNumber(page?.preloadCount)} />
                    <DataRow label="Cache-Control" value={page?.hasCacheControl ? 'Present' : 'Missing'} status={page?.hasCacheControl ? 'pass' : 'warn'} />
                    <DataRow label="ETag" value={page?.hasEtag ? 'Present' : 'Missing'} status={page?.hasEtag ? 'pass' : 'warn'} />
                    <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge status={Number(page?.imagesWithoutDimensions || 0) > 0 ? 'warn' : 'pass'} label={`CLS image risk: ${formatNumber(page?.imagesWithoutDimensions)}`} />
                        <StatusBadge status={Number(page?.imagesWithoutLazy || 0) > 0 ? 'warn' : 'pass'} label={`No lazy images: ${formatNumber(page?.imagesWithoutLazy)}`} />
                        <StatusBadge status={Number(page?.legacyFormatImages || 0) > 0 && Number(page?.modernFormatImages || 0) === 0 ? 'warn' : 'info'} label={`Modern formats: ${formatNumber(page?.modernFormatImages)}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
