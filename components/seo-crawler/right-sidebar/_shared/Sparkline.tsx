import React, { useMemo } from 'react'

type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral'

export function Sparkline({
  values,
  height = 28,
  width = 120,
  tone = 'info',
  showArea = true,
  showDots = false,
}: {
  values: ReadonlyArray<number>
  height?: number
  width?: number
  tone?: Tone
  showArea?: boolean
  showDots?: boolean
}) {
  const stroke = TONE_STROKE[tone]
  const fill   = TONE_FILL[tone]

  const path = useMemo(() => {
    if (!values?.length) return { line: '', area: '', dots: [] as Array<{ x: number; y: number }> }
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const stepX = values.length > 1 ? width / (values.length - 1) : 0
    const pts = values.map((v, i) => ({
      x: i * stepX,
      y: height - ((v - min) / range) * (height - 2) - 1,
    }))
    const line = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ')
    const area = `${line} L${width},${height} L0,${height} Z`
    return { line, area, dots: pts }
  }, [values, height, width])

  if (!values?.length) {
    return <div className="h-7 w-[120px] rounded bg-[#0d0d0d] border border-[#1a1a1a]" aria-label="No trend data yet" />
  }

  return (
    <svg width={width} height={height} className="block" aria-hidden>
      {showArea && <path d={path.area} fill={fill} />}
      <path d={path.line} stroke={stroke} strokeWidth={1.25} fill="none" />
      {showDots && path.dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.5} fill={stroke} />
      ))}
    </svg>
  )
}

const TONE_STROKE: Record<Tone, string> = {
  good: '#22c55e', warn: '#f59e0b', bad: '#F5364E',
  info: '#60a5fa', neutral: '#666',
}
const TONE_FILL: Record<Tone, string> = {
  good: 'rgba(34,197,94,0.12)', warn: 'rgba(245,158,11,0.12)', bad: 'rgba(245,54,78,0.12)',
  info: 'rgba(96,165,250,0.12)', neutral: 'rgba(140,140,140,0.10)',
}
