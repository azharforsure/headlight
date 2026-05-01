import React, { useMemo } from 'react'

export type TreeNode = { id: string; label: string; value: number; tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral' }

export function Treemap({
  nodes,
  height = 120,
  onClick,
}: {
  nodes: ReadonlyArray<TreeNode>
  height?: number
  onClick?: (n: TreeNode) => void
}) {
  const total = nodes.reduce((s, n) => s + Math.max(0, n.value), 0)
  const layout = useMemo(() => {
    let acc = 0
    return nodes.map(n => {
      const pct = total > 0 ? n.value / total : 0
      const left = acc * 100
      acc += pct
      return { ...n, left, width: pct * 100 }
    })
  }, [nodes, total])

  const styleContainer = { height }

  if (!total) {
    return <div className="text-[11px] text-[#666] italic">No data</div>
  }
  return (
    <div className="relative w-full overflow-hidden rounded-md border border-[#1a1a1a]" style={styleContainer}>
      {layout.map(n => {
        const styleNode = { left: `${n.left}%`, width: `${n.width}%`, background: TONE_BG[n.tone || 'info'] }
        return (
          <button
            key={n.id}
            onClick={onClick ? () => onClick(n) : undefined}
            className="absolute top-0 bottom-0 border-r border-[#0a0a0a] hover:brightness-125 transition-all text-left p-2"
            style={styleNode}
            title={`${n.label}: ${n.value}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white truncate">{n.label}</div>
            <div className="text-[11px] font-mono text-white/80">{n.value}</div>
          </button>
        )
      })}
    </div>
  )
}

const TONE_BG: Record<NonNullable<TreeNode['tone']>, string> = {
  good: 'rgba(34,197,94,0.25)', warn: 'rgba(245,158,11,0.25)',
  bad:  'rgba(245,54,78,0.25)', info: 'rgba(96,165,250,0.25)',
  neutral: 'rgba(120,120,120,0.25)',
}
