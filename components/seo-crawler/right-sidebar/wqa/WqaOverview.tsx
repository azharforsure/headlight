import React from 'react'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import {
    RsCard, RsKpi, RsGauge, RsHistogram, RsBar, RsRow, RsEmpty, RsPill, RsSection, RsList,
    fmtNum, fmtPct,
} from '../parts'

export function WqaOverview() {
    const w = useWqaInsights()

    if (w.total === 0) {
        return <RsEmpty title="No crawl data yet" hint="Run a scan to populate the Website Quality dashboard." />
    }

    const catEntries = Object.entries(w.categories).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const catTotal = catEntries.reduce((s, [, n]) => s + n, 0) || 1

    return (
        <div className="space-y-3">
            {/* Hero — site Q score + spark */}
            <RsCard title="Site quality">
                <div className="flex items-center justify-between gap-3">
                    <RsGauge value={w.qOverall} label="Q score" sub={`${fmtNum(w.total)} pages`} size={104} />
                    <div className="flex-1 space-y-1 min-w-0">
                        <RsRow 
                            label="vs previous"  
                            value={w.qPrev > 0 ? `${w.qOverall - w.qPrev > 0 ? '+' : ''}${(w.qOverall - w.qPrev).toFixed(1)}` : '—'} 
                            tone={w.qOverall >= w.qPrev ? 'good' : 'bad'} 
                        />
                        <RsRow label="median"       value={fmtNum(w.qOverall)} />
                        <RsRow label="indexable"    value={fmtPct(w.indexable, w.total)} tone="info" />
                        <RsRow label="needs action" value={fmtNum(w.priorityCounts.high + w.priorityCounts.med)} tone="warn" />
                    </div>
                </div>
            </RsCard>

            {/* KPI tiles */}
            <div className="grid grid-cols-2 gap-2">
                <RsKpi label="Clicks 28d" value={fmtNum(w.clicks)} delta={{ curr: w.clicks, prev: w.clicksPrev, digits: 1 }} />
                <RsKpi label="Impressions" value={fmtNum(w.impr)} delta={{ curr: w.impr, prev: w.imprPrev, digits: 1 }} />
                <RsKpi label="Avg CTR"   value={fmtPct(w.ctr, 1, 2)} delta={{ curr: w.ctr, prev: w.ctrPrev, digits: 1 }} />
                <RsKpi label="Avg pos"   value={fmtNum(w.avgPos, { maximumFractionDigits: 1 })} delta={{ curr: -w.avgPos, prev: -w.posPrev, digits: 1 }} />
            </div>

            {/* Quality distribution */}
            <RsCard title="Quality distribution">
                <RsHistogram bins={w.qBins} />
            </RsCard>

            {/* Page categories */}
            <RsCard title="Page mix">
                <div className="space-y-2">
                    {catEntries.map(([cat, count]) => (
                        <RsBar key={cat} label={cat} value={count} total={catTotal} tone="info" />
                    ))}
                </div>
            </RsCard>

            {/* Alerts */}
            <RsCard title="Top alerts" subtitle={w.alerts.length ? undefined : 'No active alerts'}>
                <RsList
                    items={w.alerts.slice(0, 5)}
                    empty="Site is clean."
                    render={(a) => (
                        <div className="flex items-start gap-2 py-1">
                            <RsPill tone={a.tone}>{a.tone === 'bad' ? 'critical' : 'warn'}</RsPill>
                            <span className="text-[11px] text-[#bbb] leading-snug">{a.text}</span>
                        </div>
                    )}
                />
            </RsCard>

            <RsSection title="Action queue">
                <div className="grid grid-cols-3 gap-1.5">
                    <RsKpi label="High" value={w.priorityCounts.high} tone="bad" />
                    <RsKpi label="Med"  value={w.priorityCounts.med}  tone="warn" />
                    <RsKpi label="Low"  value={w.priorityCounts.low}  tone="neutral" />
                </div>
            </RsSection>
        </div>
    )
}
