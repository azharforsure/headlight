import React from 'react'

export function BenchmarkBar({
  site,
  benchmark,
  unit = '',
  label,
  higherIsBetter = true,
}: {
  site: number
  benchmark: number
  unit?: string
  label?: string
  higherIsBetter?: boolean
}) {
  const max = Math.max(site, benchmark) * 1.1 || 1
  const sitePct = (site / max) * 100
  const benchPct = (benchmark / max) * 100
  const ahead = higherIsBetter ? site >= benchmark : site <= benchmark
  const tone = ahead ? '#22c55e' : '#F5364E'
  const siteStyle    = { width: `${sitePct}%`,  background: tone }
  const markerStyle  = { left:  `${benchPct}%` }
  return (
    <div>
      {label && <div className="text-[11px] text-[#888] mb-1">{label}</div>}
      <div className="relative h-2.5 rounded-full bg-[#0d0d0d] border border-[#1a1a1a] overflow-visible">
        <div className="absolute inset-y-0 left-0 rounded-full" style={siteStyle} />
        <div className="absolute -top-1 -bottom-1 w-px bg-white" style={markerStyle} title={`Benchmark: ${benchmark}${unit}`} />
      </div>
      <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
        <span className="text-white">You {site}{unit}</span>
        <span className="text-[#888]">Bench {benchmark}{unit}</span>
      </div>
    </div>
  )
}
