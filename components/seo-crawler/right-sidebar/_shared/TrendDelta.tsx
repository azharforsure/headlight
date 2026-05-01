import React from 'react'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

export function TrendDelta({
  current, previous, unit = '', invert = false,
}: {
  current: number; previous: number; unit?: string; invert?: boolean
}) {
  if (!isFinite(current) || !isFinite(previous) || previous === 0) {
    return <span className="text-[10px] font-mono text-[#666]">— no prior</span>
  }
  const delta = current - previous
  const pct = (delta / Math.abs(previous)) * 100
  const better = invert ? delta < 0 : delta > 0
  const Icon = delta === 0 ? Minus : delta > 0 ? ArrowUp : ArrowDown
  const tone = delta === 0 ? 'text-[#666]' : better ? 'text-emerald-400' : 'text-[#F5364E]'
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono ${tone}`}>
      <Icon size={10} />
      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%{unit}
    </span>
  )
}
