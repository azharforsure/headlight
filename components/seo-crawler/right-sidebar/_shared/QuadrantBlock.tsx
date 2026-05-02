import React from 'react'

type Item = { effort: 'low'|'med'|'high'; impact: 'low'|'med'|'high' }
type Props = {
  title: string
  items: Item[]
  onCellClick?: (cell: { impact: 'low'|'med'|'high'; effort: 'low'|'med'|'high' }) => void
}

const impacts: Array<'high'|'med'|'low'> = ['high', 'med', 'low']
const efforts: Array<'low'|'med'|'high'> = ['low', 'med', 'high']

function toneFor(impact: string, effort: string): string {
  if (impact === 'high' && effort === 'low')  return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'  // quick win
  if (impact === 'high' && effort === 'high') return 'bg-amber-500/10 text-amber-300 border-amber-500/30'        // big bet
  if (impact === 'low'  && effort === 'low')  return 'bg-sky-500/10 text-sky-300 border-sky-500/30'              // fill-in
  if (impact === 'low'  && effort === 'high') return 'bg-rose-500/10 text-rose-300 border-rose-500/30'           // skip
  return 'bg-neutral-800/60 text-neutral-300 border-neutral-700'
}

function labelFor(impact: string, effort: string): string {
  if (impact === 'high' && effort === 'low')  return 'Quick wins'
  if (impact === 'high' && effort === 'med')  return 'Plan'
  if (impact === 'high' && effort === 'high') return 'Big bets'
  if (impact === 'med'  && effort === 'low')  return 'Easy'
  if (impact === 'med'  && effort === 'med')  return 'Routine'
  if (impact === 'med'  && effort === 'high') return 'Heavy'
  if (impact === 'low'  && effort === 'low')  return 'Fill-in'
  if (impact === 'low'  && effort === 'med')  return 'Defer'
  return 'Skip'
}

export function QuadrantBlock({ title, items, onCellClick }: Props) {
  const matrix: Record<string, number> = {}
  for (const it of items) matrix[`${it.impact}::${it.effort}`] = (matrix[`${it.impact}::${it.effort}`] ?? 0) + 1
  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-neutral-500">{title}</div>
        <div className="text-[11px] text-neutral-500">impact ↑ · effort →</div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {impacts.flatMap((imp) => efforts.map((eff) => {
          const n = matrix[`${imp}::${eff}`] ?? 0
          const tone = toneFor(imp, eff)
          return (
            <button
              key={`${imp}-${eff}`}
              onClick={() => onCellClick?.({ impact: imp, effort: eff })}
              className={`flex flex-col items-start rounded border px-2 py-1.5 text-left transition-colors ${tone} hover:brightness-125`}
            >
              <span className="text-[16px] font-semibold tabular-nums">{n}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">{labelFor(imp, eff)}</span>
            </button>
          )
        }))}
      </div>
    </div>
  )
}
