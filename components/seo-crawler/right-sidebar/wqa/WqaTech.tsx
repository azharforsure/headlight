import React from 'react'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import { RsCard, RsBar, RsKpi, RsRow, RsHistogram, RsEmpty, fmtNum, fmtPct, fmtMs } from '../parts'

export function WqaTech() {
    const w = useWqaInsights()
    if (w.total === 0) return <RsEmpty title="No technical data" hint="Run a crawl to surface tech health." />

    const statusBins = [
        { label: '2xx', count: w.status.ok,       tone: 'good' as const },
        { label: '3xx', count: w.status.redirect, tone: 'warn' as const },
        { label: '4xx', count: w.status.client,   tone: 'bad'  as const },
        { label: '5xx', count: w.status.server,   tone: 'bad'  as const },
    ]

    return (
        <div className="space-y-3">
            <RsCard title="Indexability">
                <RsBar label="Indexable"   value={w.indexable}    total={w.total} tone="good"  suffix={fmtPct(w.indexable, w.total, 0)} />
                <div className="h-1" />
                <RsBar label="Noindex"     value={w.noindex}      total={w.total} tone="warn" suffix={fmtPct(w.noindex, w.total, 0)} />
                <div className="h-1" />
                <RsBar label="Blocked"     value={w.blocked}      total={w.total} tone="bad"  suffix={fmtPct(w.blocked, w.total, 0)} />
                <div className="h-1" />
                <RsBar label="Canonical ≠" value={w.canonMismatch} total={w.total} tone="warn" suffix={fmtPct(w.canonMismatch, w.total, 0)} />
            </RsCard>

            <RsCard title="Status codes">
                <RsHistogram bins={statusBins} />
            </RsCard>

            <RsCard title="Core Web Vitals">
                <RsRow label="LCP good" value={fmtPct(w.cwv.lcpGood, w.total, 0)} tone={w.cwv.lcpGood / Math.max(1, w.total) >= 0.75 ? 'good' : 'warn'} />
                <RsRow label="INP good" value={fmtPct(w.cwv.inpGood, w.total, 0)} tone={w.cwv.inpGood / Math.max(1, w.total) >= 0.75 ? 'good' : 'warn'} />
                <RsRow label="CLS good" value={fmtPct(w.cwv.clsGood, w.total, 0)} tone={w.cwv.clsGood / Math.max(1, w.total) >= 0.75 ? 'good' : 'warn'} />
                <RsRow label="LCP poor" value={fmtNum(w.cwv.lcpPoor)} tone={w.cwv.lcpPoor > 0 ? 'bad' : 'neutral'} />
                <RsRow label="INP poor" value={fmtNum(w.cwv.inpPoor)} tone={w.cwv.inpPoor > 0 ? 'bad' : 'neutral'} />
            </RsCard>

            <div className="grid grid-cols-2 gap-2">
                <RsKpi label="Avg TTFB" value={fmtMs(w.ttfb)} tone={w.ttfb < 500 ? 'good' : w.ttfb < 1500 ? 'warn' : 'bad'} />
                <RsKpi label="Orphans"  value={fmtNum(w.orphans)} tone={w.orphans > 0 ? 'warn' : 'good'} />
                <RsKpi label="Deep > 5" value={fmtNum(w.deep)}    tone={w.deep > 0 ? 'warn' : 'neutral'} />
                <RsKpi label="Pages"    value={fmtNum(w.total)} />
            </div>
        </div>
    )
}
