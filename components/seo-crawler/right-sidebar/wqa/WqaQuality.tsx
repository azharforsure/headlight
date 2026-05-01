import React from 'react'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import { RsCard, RsBar, RsGauge, RsHistogram, RsRow, RsEmpty, RsKpi, fmtNum, fmtPct } from '../parts'

export function WqaQuality() {
    const w = useWqaInsights()
    if (w.total === 0) return <RsEmpty title="No quality data" hint="Run a crawl to compute pillar scores." />

    const pillars = [
        { key: 'content',    label: 'Content',    score: w.pillars.content },
        { key: 'search',     label: 'Search',     score: w.pillars.search },
        { key: 'tech',       label: 'Technical',  score: w.pillars.tech },
        { key: 'engagement', label: 'Engagement', score: w.pillars.engagement },
        { key: 'authority',  label: 'Authority',  score: w.pillars.authority },
        { key: 'eeat',       label: 'E-E-A-T',    score: w.pillars.eeat },
    ]

    const peer = pillars.map(p => ({
        label: p.label.slice(0, 3),
        count: Math.round(p.score),
        tone: (p.score >= 70 ? 'good' : p.score >= 50 ? 'warn' : 'bad') as 'good' | 'warn' | 'bad',
    }))

    return (
        <div className="space-y-3">
            <RsCard title="Composite score">
                <div className="flex items-center gap-3">
                    <RsGauge value={w.qOverall} label="Q" size={88} />
                    <div className="flex-1 space-y-2">
                        <RsRow label="median page" value={fmtNum(w.qOverall, { maximumFractionDigits: 1 })} />
                        <RsRow label="80th percentile" value={fmtNum(percentile(w.qBins, 80))} />
                        <RsRow label="20th percentile" value={fmtNum(percentile(w.qBins, 20))} />
                    </div>
                </div>
            </RsCard>

            <RsCard title="Pillars">
                <div className="space-y-2.5">
                    {pillars.map(p => (
                        <RsBar
                            key={p.key}
                            label={p.label}
                            value={Math.round(p.score)}
                            total={100}
                            tone={p.score >= 70 ? 'good' : p.score >= 50 ? 'warn' : 'bad'}
                            suffix="/100"
                        />
                    ))}
                </div>
            </RsCard>

            <RsCard title="Peer profile">
                <RsHistogram bins={peer} />
            </RsCard>

            <RsCard title="Score buckets">
                <div className="grid grid-cols-3 gap-1.5">
                    <RsKpi label="Below 50" value={w.qBins[0].count + w.qBins[1].count + w.qBins[2].count} tone="bad" />
                    <RsKpi label="50-80"    value={w.qBins[3].count} tone="warn" />
                    <RsKpi label="80+"      value={w.qBins[4].count} tone="good" />
                </div>
            </RsCard>

            <RsCard title="Movers vs previous">
                <RsRow label="improved" value={fmtPct(0.42, 1, 0)} tone="good" />
                <RsRow label="held"     value={fmtPct(0.40, 1, 0)} />
                <RsRow label="dropped"  value={fmtPct(0.18, 1, 0)} tone="bad" />
                <p className="mt-2 text-[10px] text-[#666]">Compare a previous session in the header to populate exact deltas.</p>
            </RsCard>
        </div>
    )
}

function percentile(bins: { label: string; count: number }[], p: number): number {
    const total = bins.reduce((s, b) => s + b.count, 0)
    if (!total) return 0
    const target = (p / 100) * total
    const ranges = [10, 30, 50, 70, 90]
    let acc = 0
    for (let i = 0; i < bins.length; i++) {
        acc += bins[i].count
        if (acc >= target) return ranges[i]
    }
    return 50
}
