import React from 'react'

type Props = {
  title?: string
  rows: Array<{ id: string; name: string; count: number }>
  onClick?: (id: string) => void
}

export function OwnerLoadBlock({ title = 'Owner load', rows, onClick }: Props) {
  const filtered = rows.filter(r => r.id !== 'unassigned')
  if (filtered.length === 0) return null
  const max = Math.max(1, ...filtered.map(r => r.count))
  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="mb-2 text-[11px] uppercase tracking-wider text-neutral-500">{title}</div>
      <ul className="space-y-1.5">
        {filtered.slice(0, 6).map((r) => (
          <li key={r.id}>
            <button onClick={() => onClick?.(r.id)} className="flex w-full items-center gap-2 text-left">
              <span className="w-20 shrink-0 truncate text-[12px] text-neutral-300">{r.name}</span>
              <span className="relative flex-1 h-1.5 rounded bg-[#161616]">
                <span className="absolute inset-y-0 left-0 rounded bg-neutral-400" style={{ width: `${(r.count / max) * 100}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-neutral-400">{r.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
