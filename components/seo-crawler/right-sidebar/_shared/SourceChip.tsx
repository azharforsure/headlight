import React from 'react'

type Source = 'gsc' | 'ga4' | 'crux' | 'crawl' | 'ai' | 'estimated' | 'default'

const COLORS: Record<Source, string> = {
    gsc: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    ga4: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    crux: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    crawl: 'bg-[#222] text-[#aaa] border-[#333]',
    ai: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
    estimated: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    default: 'bg-[#222] text-[#777] border-[#333]',
}

export function SourceChip({ source, label }: { source: Source; label?: string }) {
    return (
        <span className={`px-1 py-[1px] rounded text-[8px] font-bold tracking-tight border ${COLORS[source]}`}>
            {label || source.toUpperCase()}
        </span>
    )
}
