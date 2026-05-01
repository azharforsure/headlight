import React from 'react'
import { RsPill } from './RsPill'

export function RsActionRow({
    title, count, priority, forecast, onClick,
}: {
    title: string
    count: number
    priority: 'high' | 'med' | 'low'
    forecast?: string
    onClick?: () => void
}) {
    const tone = priority === 'high' ? 'bad' : priority === 'med' ? 'warn' : 'info'
    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded border border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#141414] hover:border-[#2a2a2a] p-2.5 transition-colors"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#ddd] truncate flex-1">{title}</span>
                <RsPill tone={tone}>{priority}</RsPill>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[#666]">
                <span>{count.toLocaleString()} {count === 1 ? 'page' : 'pages'} affected</span>
                {forecast && <span className="text-[#888] font-mono tabular-nums">{forecast}</span>}
            </div>
        </button>
    )
}
