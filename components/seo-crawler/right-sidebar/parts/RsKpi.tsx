import React from 'react'
import { RsDelta } from './RsDelta'
import { RsSparkline } from './RsSparkline'

export function RsKpi({
    label, value, sub, delta, spark, tone,
}: {
    label: string
    value: React.ReactNode
    sub?: string
    delta?: { curr: number; prev: number; digits?: number }
    spark?: number[]
    tone?: 'good' | 'warn' | 'bad' | 'neutral'
}) {
    const valueColor =
        tone === 'good' ? 'text-[#10b981]' :
        tone === 'warn' ? 'text-[#f59e0b]' :
        tone === 'bad' ? 'text-[#ef4444]' :
        'text-white'
    return (
        <div className="rounded border border-[#1f1f1f] bg-[#0f0f0f] p-2.5 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#666] truncate">{label}</div>
            <div className={`mt-1 text-[20px] font-bold font-mono tabular-nums leading-none ${valueColor}`}>{value}</div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
                {sub && <span className="text-[10px] text-[#666] truncate">{sub}</span>}
                {delta && <RsDelta curr={delta.curr} prev={delta.prev} digits={delta.digits} />}
            </div>
            {spark && spark.length > 1 && (
                <div className="mt-1.5">
                    <RsSparkline values={spark} width={120} height={18} />
                </div>
            )}
        </div>
    )
}
