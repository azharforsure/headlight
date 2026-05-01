import React from 'react'

export type TimelineEntry = { id: string; ts: string; title: string; detail?: string; tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral' }

export function TimelineList({ entries, max = 6 }: { entries: ReadonlyArray<TimelineEntry>; max?: number }) {
  const items = entries.slice(0, max)
  if (!items.length) return <div className="text-[11px] text-[#666] italic">No history yet</div>
  return (
    <ol className="space-y-2">
      {items.map(e => (
        <li key={e.id} className="flex gap-2">
          <span className={`mt-1 inline-block w-1.5 h-1.5 rounded-full ${DOT[e.tone || 'neutral']}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[12px] text-white truncate">{e.title}</div>
              <div className="text-[10px] font-mono text-[#666] shrink-0">{e.ts}</div>
            </div>
            {e.detail && <div className="text-[11px] text-[#888] truncate">{e.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

const DOT: Record<NonNullable<TimelineEntry['tone']>, string> = {
  good: 'bg-emerald-400', warn: 'bg-amber-400', bad: 'bg-[#F5364E]',
  info: 'bg-sky-400', neutral: 'bg-[#666]',
}
