import React from 'react'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import {
    RsCard, RsKpi, RsBar, RsRow, RsList, RsEmpty, RsPill,
    fmtNum, fmtPct,
} from '../parts'

export function WqaSearch() {
    const w = useWqaInsights()
    if (w.total === 0) return <RsEmpty title="No search data" hint="Connect Google Search Console and run a crawl." />

    const buckets = [
        { label: 'Top 3',        count: w.rankBuckets.top3,     tone: 'good' as const },
        { label: 'Top 10',       count: w.rankBuckets.top10,    tone: 'good' as const },
        { label: 'Striking 11-20', count: w.rankBuckets.striking, tone: 'warn' as const },
        { label: 'Tail 21-50',   count: w.rankBuckets.tail,     tone: 'neutral' as const },
        { label: 'Beyond 50',    count: w.rankBuckets.beyond,   tone: 'bad' as const },
    ]
    const bucketTotal = buckets.reduce((s, b) => s + b.count, 0) || 1

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <RsKpi label="Clicks 28d"  value={fmtNum(w.clicks)} delta={{ curr: w.clicks, prev: w.clicksPrev, digits: 1 }} />
                <RsKpi label="Impressions" value={fmtNum(w.impr)}   delta={{ curr: w.impr,   prev: w.imprPrev, digits: 1 }} />
                <RsKpi label="CTR"         value={fmtPct(w.ctr, 1, 2)} delta={{ curr: w.ctr,   prev: w.ctrPrev, digits: 1 }} />
                <RsKpi label="Avg pos"     value={fmtNum(w.avgPos, { maximumFractionDigits: 1 })} delta={{ curr: -w.avgPos, prev: -w.posPrev, digits: 1 }} />
            </div>

            <RsCard title="Ranking buckets">
                <div className="space-y-2">
                    {buckets.map(b => (
                        <RsBar key={b.label} label={b.label} value={b.count} total={bucketTotal} tone={b.tone} />
                    ))}
                </div>
            </RsCard>

            <RsCard title="CTR vs benchmark">
                <RsRow label="actual"   value={fmtPct(w.ctr, 1, 2)} tone="info" />
                <RsRow label="expected" value={fmtPct(estCtrForPos(w.avgPos), 1, 2)} />
                <RsRow label="gap"      value={fmtPct(w.ctr - estCtrForPos(w.avgPos), 1, 2)} tone={w.ctr >= estCtrForPos(w.avgPos) ? 'good' : 'bad'} />
                <p className="mt-2 text-[10px] text-[#666]">Benchmark = blended CTR curve at the site's average position.</p>
            </RsCard>

            <RsCard title="Winners">
                <RsList
                    items={w.winners}
                    empty="No movers yet."
                    render={(p: any) => (
                        <div className="flex items-center justify-between gap-2 py-1 border-b border-[#161616] last:border-0">
                            <span className="text-[11px] text-[#bbb] truncate">{shortPath(p.url)}</span>
                            <RsPill tone="good">+{fmtNum(p.gscClicks)}</RsPill>
                        </div>
                    )}
                />
            </RsCard>

            <RsCard title="Losers">
                <RsList
                    items={w.losers}
                    empty="None."
                    render={(p: any) => (
                        <div className="flex items-center justify-between gap-2 py-1 border-b border-[#161616] last:border-0">
                            <span className="text-[11px] text-[#bbb] truncate">{shortPath(p.url)}</span>
                            <RsPill tone="bad">{fmtNum(p.gscClicks)}</RsPill>
                        </div>
                    )}
                />
            </RsCard>
        </div>
    )
}

function estCtrForPos(pos: number): number {
    if (pos <= 1) return 0.28
    if (pos <= 3) return 0.18
    if (pos <= 10) return 0.06
    if (pos <= 20) return 0.018
    return 0.005
}

function shortPath(url: string): string {
    try { return new URL(url).pathname || url } catch { return url }
}
