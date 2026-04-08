import React from 'react';
import { DataRow, formatNumber, formatPercent, MetricCard, SectionHeader, StatusBadge } from './shared';

export default function Ga4Tab({ page }: { page: any }) {
    const hasGa4 = [
        page?.ga4Views,
        page?.ga4Sessions,
        page?.ga4Users,
        page?.ga4BounceRate
    ].some((value) => value !== null && value !== undefined);

    if (!hasGa4) {
        return (
            <div className="bg-[#0a0a0a] border border-[#222] rounded p-5 text-center">
                <div className="text-[14px] text-white font-semibold mb-2">Google Analytics 4 not connected</div>
                <div className="text-[12px] text-[#666]">Connect GA4 in Integrations to populate engagement, sessions, and conversions.</div>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <MetricCard label="Views (30d)" value={formatNumber(page?.ga4Views)} />
                <MetricCard label="Sessions (30d)" value={formatNumber(page?.ga4Sessions)} />
                <MetricCard label="Users (30d)" value={formatNumber(page?.ga4Users)} />
                <MetricCard label="Bounce Rate" value={formatPercent(page?.ga4BounceRate, 100)} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="Engagement" />
                    <DataRow label="Avg Time on Page" value={formatNumber(page?.ga4EngagementTimePerPage, { maximumFractionDigits: 1 })} />
                    <DataRow label="Engagement Rate" value={formatPercent(page?.ga4EngagementRate, 100)} />
                    <DataRow label="Avg Session Duration" value={formatNumber(page?.ga4AvgSessionDuration, { maximumFractionDigits: 1 })} />
                    <DataRow label="Traffic Δ (Abs)" value={formatNumber(page?.sessionsDeltaAbsolute)} status={Number(page?.sessionsDeltaAbsolute || 0) < 0 ? 'warn' : 'pass'} />
                    <DataRow label="Traffic Δ (%)" value={formatPercent((Number(page?.sessionsDeltaPct || 0)) / 100, 100)} status={Number(page?.sessionsDeltaPct || 0) < 0 ? 'warn' : 'pass'} />
                </div>
                <div>
                    <SectionHeader title="Conversions & Revenue" />
                    <DataRow label="Conversions" value={formatNumber(page?.ga4Conversions)} />
                    <DataRow label="Conversion Rate" value={formatPercent(page?.ga4ConversionRate, 100)} />
                    <DataRow label="Revenue" value={formatNumber(page?.ga4Revenue)} />
                    <DataRow label="Transactions" value={formatNumber(page?.ga4Transactions)} />
                    <DataRow label="Add to Cart" value={formatNumber(page?.ga4AddtoCart)} />
                    <DataRow label="Checkouts" value={formatNumber(page?.ga4Checkouts)} />
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <StatusBadge status={page?.isLosingTraffic ? 'fail' : 'pass'} label={page?.isLosingTraffic ? 'Traffic decline detected' : 'Traffic trend stable'} />
                <StatusBadge status={Number(page?.ga4BounceRate || 0) > 0.7 ? 'warn' : 'pass'} label={Number(page?.ga4BounceRate || 0) > 0.7 ? 'High bounce rate' : 'Bounce rate healthy'} />
                <StatusBadge status={Number(page?.ga4ConversionRate || 0) > 0 ? 'pass' : 'info'} label={Number(page?.ga4ConversionRate || 0) > 0 ? 'Conversions tracked' : 'No conversions'} />
            </div>
        </div>
    );
}
