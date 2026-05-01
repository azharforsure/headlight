import React from 'react'

export function RsRow({
    label, value, tone, mono = true,
}: {
    label: string
    value: React.ReactNode
    tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral'
    mono?: boolean
}) {
    const valueColor =
        tone === 'good' ? 'text-[#10b981]' :
        tone === 'warn' ? 'text-[#f59e0b]' :
        tone === 'bad' ? 'text-[#ef4444]' :
        tone === 'info' ? 'text-[#3b82f6]' :
        'text-[#ddd]'
    return (
        <div className="flex items-center justify-between gap-2 py-1 border-b border-[#161616] last:border-0">
            <span className="text-[11px] text-[#888] truncate">{label}</span>
            <span className={`text-[11px] tabular-nums ${mono ? 'font-mono' : ''} ${valueColor} text-right`}>{value}</span>
        </div>
    )
}
