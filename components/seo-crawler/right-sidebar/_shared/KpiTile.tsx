import React from 'react'
import { Card } from './Card'

export function KpiTile({
    label, value, sub, delta, deltaTone = 'flat', mono = true,
}: {
    label: string
    value: React.ReactNode
    sub?: string
    delta?: string
    deltaTone?: 'up' | 'down' | 'flat'
    mono?: boolean
}) {
    const tone =
        deltaTone === 'up' ? 'text-emerald-400' :
        deltaTone === 'down' ? 'text-red-400' :
        'text-[#888]'
    return (
        <Card tone="sunken" padded>
            <div className="text-[9px] uppercase tracking-widest text-[#666]">{label}</div>
            <div className={`mt-1 text-[18px] font-bold leading-tight ${mono ? 'font-mono' : ''} text-white`}>
                {value}
            </div>
            <div className="mt-1 flex items-center justify-between">
                <span className={`text-[10px] ${tone}`}>{delta || ''}</span>
                {sub && <span className="text-[10px] text-[#666]">{sub}</span>}
            </div>
        </Card>
    )
}
