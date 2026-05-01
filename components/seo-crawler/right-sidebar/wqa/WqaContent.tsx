import React from 'react'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import { RsCard, RsHistogram, RsRow, RsBar, RsEmpty, RsKpi, fmtNum, fmtPct } from '../parts'

export function WqaContent() {
    const w = useWqaInsights()
    if (w.total === 0) return <RsEmpty title="No content data" hint="Run a crawl to score content quality." />

    const fresh = [
        { label: '<7d',   count: 0, tone: 'good' as const },
        { label: '<30d',  count: 0, tone: 'good' as const },
        { label: '<90d',  count: 0, tone: 'warn' as const },
        { label: '<1y',   count: w.total - w.stale, tone: 'warn' as const },
        { label: '>1y',   count: w.stale, tone: 'bad' as const },
    ]

    return (
        <div className="space-y-3">
            <RsCard title="Word count">
                <RsHistogram bins={w.wcDist} />
            </RsCard>

            <div className="grid grid-cols-2 gap-2">
                <RsKpi label="Avg readability" value={fmtNum(w.readability, { maximumFractionDigits: 1 })} sub="Flesch" />
                <RsKpi label="Avg freshness"   value={`${fmtNum(w.freshAvg)}d`} sub="since updated" />
                <RsKpi label="Duplicates"      value={fmtNum(w.dupes)}    tone={w.dupes > 0 ? 'warn' : 'neutral'} />
                <RsKpi label="Cannibalization" value={fmtNum(w.cannibal)} tone={w.cannibal > 0 ? 'warn' : 'neutral'} />
            </div>

            <RsCard title="Freshness">
                <RsHistogram bins={fresh} />
            </RsCard>

            <RsCard title="E-E-A-T coverage">
                <RsBar label="Bylines"   value={Math.round(w.eeat.bylines)}   total={100} tone={w.eeat.bylines >= 70 ? 'good' : 'warn'} suffix="%" />
                <div className="h-1" />
                <RsBar label="Author bios" value={Math.round(w.eeat.bios)}    total={100} tone={w.eeat.bios >= 50 ? 'good' : 'warn'} suffix="%" />
                <div className="h-1" />
                <RsBar label="Citations"  value={Math.round(w.eeat.citations)} total={100} tone={w.eeat.citations >= 50 ? 'good' : 'warn'} suffix="%" />
                <div className="h-1" />
                <RsBar label="Updated dates" value={Math.round(w.eeat.updated)} total={100} tone={w.eeat.updated >= 60 ? 'good' : 'warn'} suffix="%" />
            </RsCard>

            <RsCard title="Schema coverage">
                <RsRow label="Article" value={fmtPct(w.schemaCoverage.article, 100, 0)} tone={w.schemaCoverage.article >= 50 ? 'good' : 'warn'} />
                <RsRow label="Product" value={fmtPct(w.schemaCoverage.product, 100, 0)} />
                <RsRow label="FAQ"     value={fmtPct(w.schemaCoverage.faq,     100, 0)} />
                <RsRow label="HowTo"   value={fmtPct(w.schemaCoverage.howto,   100, 0)} />
            </RsCard>
        </div>
    )
}
