import React from 'react'

export function BotMatrixBlock({ title = 'Bot allow / block', bots = [], onBotClick }: {
  title?: string
  bots?: Array<{ id: string; label: string; allowed: boolean; partial?: boolean }>
  onBotClick?: (id: string) => void
}) {
  if (!bots?.length) return null
  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
      <div className="grid grid-cols-2 gap-1.5">
        {bots.map(b => {
          const tone = b.allowed && !b.partial
            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
            : b.partial
            ? 'border-amber-500/30 bg-amber-500/5 text-amber-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
          return (
            <button
              key={b.id}
              onClick={() => onBotClick?.(b.id)}
              className={`text-left rounded border px-2 py-1.5 hover:brightness-125 transition-all ${tone}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] truncate">{b.label}</span>
                <span className="text-[10px] font-mono">
                  {b.allowed && !b.partial ? 'allow' : b.partial ? 'partial' : 'block'}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
