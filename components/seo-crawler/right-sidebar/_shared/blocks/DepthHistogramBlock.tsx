import React from 'react'

export function DepthHistogramBlock({ title = 'Click depth', depth, onBucketClick }: {
  title?: string
  depth?: { d0: number; d1: number; d2: number; d3: number; d4: number; d5plus: number }
  onBucketClick?: (id: string) => void
}) {
  const buckets = [
    { id: 'Depth 0–1', v: (depth?.d0 || 0) + (depth?.d1 || 0) },
    { id: 'Depth 2–3', v: (depth?.d2 || 0) + (depth?.d3 || 0) },
    { id: 'Depth 4–5', v: (depth?.d4 || 0) },
    { id: 'Depth 6+',  v: (depth?.d5plus || 0) },
  ]
  const max = Math.max(1, ...buckets.map(b => b.v))

  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
      <div className="grid grid-cols-4 gap-1.5">
        {buckets.map(b => {
          const h = Math.max(6, Math.round((b.v / max) * 56))
          return (
            <button
              key={b.id}
              onClick={() => onBucketClick?.(b.id)}
              className="flex flex-col items-center gap-1 hover:brightness-125 transition-all"
            >
              <div className="w-full bg-[#141414] rounded relative h-[60px] flex items-end">
                <div className="w-full bg-blue-500 rounded" style={{ height: `${h}px` }} />
              </div>
              <div className="text-[10px] text-[#bbb] text-center leading-tight">{b.id}</div>
              <div className="text-[10px] font-mono text-[#888]">{b.v.toLocaleString()}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
