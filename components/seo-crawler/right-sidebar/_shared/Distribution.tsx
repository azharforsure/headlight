import React from 'react'
import { Bar } from './bars'
import { fmtNum } from './format'
import { SourceChip, type SourceTier } from './SourceChip'
import { FreshnessChip, type Freshness } from './FreshnessChip'

export function Distribution({
    rows, total,
}: {
    rows: Array<{
        label: string;
        value: number;
        color?: string;
        tone?: 'good' | 'warn' | 'bad';
        source?: SourceTier;
        freshness?: Freshness;
    }>
    total?: number
}) {
    const max = total ?? rows.reduce((a, r) => a + r.value, 0)
    return (
        <div className="space-y-1.5">
            {rows.map((r) => {
                const c = r.color
                    ?? (r.tone === 'good' ? '#10b981'
                    : r.tone === 'warn' ? '#f59e0b'
                    : r.tone === 'bad'  ? '#ef4444' : '#666')
                return (
                    <div key={r.label} className="grid grid-cols-[80px_1fr_50px_auto] items-center gap-2">
                        <span className="text-[11px] text-[#bbb] truncate">{r.label}</span>
                        <Bar value={r.value} max={max || 1} color={c} right={<span className="hidden" />} />
                        <span className="text-[11px] font-mono text-right text-[#888]">{fmtNum(r.value)}</span>
                        <div className="flex gap-0.5 items-center">
                            <SourceChip tier={r.source} />
                            <FreshnessChip value={r.freshness} />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
