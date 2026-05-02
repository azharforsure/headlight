import React from 'react'

export type Alert = { id: string; tone: 'bad' | 'warn'; text: string; onClick?: () => void }

const toneCls: Record<Alert['tone'], string> = {
  bad:  'border-red-500/30 bg-red-500/10 text-red-300',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
}

export function AlertsBlock({ title = 'Top alerts', items }: { title?: string; items: Alert[] }) {
  if (!items.length) return null
  return (
    <div className="rounded-md border border-[#161616] bg-[#0a0a0a] p-3">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
      <div className="flex flex-col gap-1.5">
        {items.map(a => (
          <button
            key={a.id}
            onClick={a.onClick}
            className={`text-left text-[11px] px-2 py-1.5 rounded border ${toneCls[a.tone]} hover:brightness-125 transition-all`}
          >
            {a.text}
          </button>
        ))}
      </div>
    </div>
  )
}
