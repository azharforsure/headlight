// components/seo-crawler/right-sidebar/_shared/HealthStrip.tsx
import React from 'react'

type Segment = { label: string; value: number; color: string }

export function HealthStrip({ segments, total }: { segments: Segment[]; total: number }) {
  const safeTotal = total > 0 ? total : 1
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#141414]">
        {segments.map((s) => {
          const w = `${(s.value / safeTotal) * 100}%`
          return <div key={s.label} title={`${s.label}: ${s.value}`} style={{ width: w, background: s.color }} />
        })}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#888]">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
            {s.label} <span className="text-[#ccc]">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
