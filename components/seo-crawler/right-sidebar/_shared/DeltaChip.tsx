import React from 'react'

export function DeltaChip({ value, suffix = '' }: { value: number | null | undefined; suffix?: string }) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return <span className="text-[10px] text-[#666]">—</span>
    }
    if (value === 0) return <span className="text-[10px] text-[#888]">0{suffix}</span>
    const up = value > 0
    return (
        <span className={`text-[10px] font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? '▲' : '▼'} {Math.abs(value).toLocaleString()}{suffix}
        </span>
    )
}
