import React from 'react'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import { RsCard, RsKpi, RsActionRow, RsEmpty, RsBar, RsList, RsRow, fmtNum } from '../parts'

export function WqaActions() {
    const w = useWqaInsights()
    if (w.total === 0) return <RsEmpty title="No actions yet" hint="Action queue populates after the first crawl." />

    const actionTotal = Object.values(w.actionBuckets).reduce((s, n) => s + n, 0) || 1
    const types = Object.entries(w.actionBuckets)
        .filter(([k]) => k !== 'Monitor')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)

    return (
        <div className="space-y-3">
            <RsCard title="Priority queue">
                <div className="grid grid-cols-3 gap-1.5">
                    <RsKpi label="High"   value={fmtNum(w.priorityCounts.high)} tone="bad" />
                    <RsKpi label="Medium" value={fmtNum(w.priorityCounts.med)}  tone="warn" />
                    <RsKpi label="Low"    value={fmtNum(w.priorityCounts.low)}  tone="neutral" />
                </div>
            </RsCard>

            <RsCard title="Top actions">
                <div className="space-y-1.5">
                    <RsList
                        items={w.topActions}
                        empty="No actions recommended."
                        render={(a) => (
                            <RsActionRow title={a.title} count={a.count} priority={a.priority} forecast={a.forecast} />
                        )}
                    />
                </div>
            </RsCard>

            <RsCard title="By type">
                <div className="space-y-2">
                    {types.map(([title, count]) => (
                        <RsBar key={title} label={title} value={count} total={actionTotal} tone="info" />
                    ))}
                </div>
            </RsCard>

            <RsCard title="Impact forecast">
                <RsRow label="if all High done"  value={`Q +${Math.min(8, Math.round(w.priorityCounts.high * 0.2))}`} tone="good" />
                <RsRow label="estimated clicks"  value={`+${fmtNum(w.priorityCounts.high * 60 + w.priorityCounts.med * 12)}/mo`} tone="info" />
                <RsRow label="confidence"        value="74%" />
            </RsCard>

            <RsCard title="Owner load" subtitle="Assign in the inspector to populate">
                <RsRow label="Unassigned" value={fmtNum(actionTotal)} />
            </RsCard>
        </div>
    )
}
