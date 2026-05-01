import React from 'react'

export type SegmentRow = { id: string; label: string; values: ReadonlyArray<number | string>; tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral' }

export function SegmentTable({
  headers, rows, max = 6, onRowClick,
}: {
  headers: ReadonlyArray<string>
  rows: ReadonlyArray<SegmentRow>
  max?: number
  onRowClick?: (row: SegmentRow) => void
}) {
  const top = rows.slice(0, max)
  if (!top.length) return <div className="text-[11px] text-[#666] italic">No segments</div>
  return (
    <div className="text-[11px]">
      <div className="grid gap-1 pb-1 border-b border-[#1a1a1a] text-[10px] uppercase tracking-wide text-[#666]"
           style={{ gridTemplateColumns: `1fr repeat(${headers.length - 1}, 70px)` }}>
        {headers.map(h => <div key={h} className="truncate">{h}</div>)}
      </div>
      {top.map(r => (
        <button key={r.id}
          onClick={onRowClick ? () => onRowClick(r) : undefined}
          className="w-full grid gap-1 py-1 text-left hover:bg-[#0d0d0d] transition-colors"
          style={{ gridTemplateColumns: `1fr repeat(${headers.length - 1}, 70px)` }}>
          <span className="text-[#ccc] truncate">{r.label}</span>
          {r.values.map((v, i) => (
            <span key={i} className="font-mono text-white tabular-nums truncate">{v}</span>
          ))}
        </button>
      ))}
    </div>
  )
}
