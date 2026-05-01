import React from 'react'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import { RsCard, RsSparkline, RsRow, RsList, RsEmpty, fmtNum } from '../parts'

export function WqaHistory() {
    const w = useWqaInsights()
    const sessions = (w.history || []).slice(-12).reverse()

    if (!w.history || w.history.length === 0) {
        return <RsEmpty title="No history yet" hint="Sessions appear here after each crawl." />
    }

    return (
        <div className="space-y-3">
            <RsCard title="Q score trend">
                <div className="flex items-center justify-between">
                    <RsSparkline values={w.trend.length ? w.trend : [w.qOverall]} width={180} height={36} />
                    <span className="text-[18px] font-bold tabular-nums text-white">{fmtNum(w.qOverall, { maximumFractionDigits: 1 })}</span>
                </div>
            </RsCard>

            <RsCard title="Recent sessions">
                <RsList
                    items={sessions}
                    empty="No sessions."
                    render={(s: any) => (
                        <RsRow
                            label={new Date(s.completedAt || s.startedAt || Date.now()).toLocaleDateString()}
                            value={`${fmtNum(s.summary?.pageCount ?? s.pageCount ?? 0)} pages`}
                        />
                    )}
                />
            </RsCard>

            <RsCard title="Action log" subtitle="Approved & dismissed actions">
                <RsList
                    items={[]}
                    empty="No actions logged yet. Approve from the Actions tab to populate."
                    render={() => null}
                />
            </RsCard>
        </div>
    )
}
