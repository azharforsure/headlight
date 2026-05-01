import React from 'react'

export type FunnelStep = { id: string; label: string; value: number }

export function Funnel({ steps }: { steps: ReadonlyArray<FunnelStep> }) {
  if (!steps.length) return null
  const top = Math.max(1, steps[0].value)
  return (
    <div className="space-y-1">
      {steps.map((s, i) => {
        const pct = (s.value / top) * 100
        const drop = i > 0 ? ((steps[i-1].value - s.value) / (steps[i-1].value || 1)) * 100 : 0
        const widthStyle = { width: `${Math.max(3, pct)}%` }
        return (
          <div key={s.id} className="flex items-center gap-2">
            <span className="text-[10px] text-[#888] w-20 truncate">{s.label}</span>
            <div className="flex-1 h-5 rounded-sm bg-[#0d0d0d] border border-[#1a1a1a] overflow-hidden">
              <div className="h-full bg-[#F5364E]/30 border-r border-[#F5364E]" style={widthStyle} />
            </div>
            <span className="text-[10px] font-mono text-white tabular-nums w-12 text-right">{s.value.toLocaleString()}</span>
            {i > 0 && <span className="text-[10px] font-mono text-[#666] w-10 text-right">-{drop.toFixed(0)}%</span>}
          </div>
        )
      })}
    </div>
  )
}
