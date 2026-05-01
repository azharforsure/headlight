import React from 'react'
import { KpiTile, RingGauge, ProgressRing, TrendDelta, scoreToTone } from '..'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'

export type HeroKpi = { label: string; value: React.ReactNode; tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral'; hint?: string }

export function HeroStrip({
  title = 'Snapshot',
  ring, score, scoreLabel, scoreHint,
  kpis,
  trendCurrent, trendPrevious, trendUnit, trendInvert,
}: {
  title?: string
  ring?: 'gauge' | 'progress'
  score?: number
  scoreLabel?: string
  scoreHint?: string
  kpis: ReadonlyArray<HeroKpi>
  trendCurrent?: number
  trendPrevious?: number
  trendUnit?: string
  trendInvert?: boolean
}) {
  const { crawlHistory } = useSeoCrawler()
  const Ring = ring === 'progress' ? ProgressRing : RingGauge
  const hasHistory = crawlHistory && crawlHistory.length > 1
  
  return (
    <div className="flex flex-col @md:flex-row items-stretch gap-2 w-full">
      
      {/* Left: Score & Trend */}
      <div className="flex items-center gap-5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md p-4 shrink-0 @md:min-w-[220px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        
        {typeof score === 'number' && (
          <div className="relative shrink-0 flex items-center justify-center">
            <Ring value={score} size={68} />
          </div>
        )}

        <div className="flex flex-col justify-center">
          <div className="text-[11px] font-semibold tracking-wider text-[#999] uppercase">
            {scoreLabel || 'Site score'}
          </div>
          
          <div className="mt-1.5 h-[16px] flex items-center">
            {trendCurrent != null && trendPrevious != null && hasHistory ? (
              <TrendDelta current={trendCurrent} previous={trendPrevious} unit={trendUnit} invert={trendInvert} />
            ) : (
              <span className="text-[10px] font-mono text-[#555]">—</span>
            )}
          </div>

          {scoreHint && <div className="text-[10px] text-[#666] mt-1.5 max-w-[130px] leading-snug">{scoreHint}</div>}
        </div>

      </div>

      {/* Right: KPIs Grid */}
      {kpis && kpis.length > 0 && (
        <div className="flex-1 w-full grid grid-cols-2 @md:grid-cols-3 gap-2">
          {kpis.map(k => (
            <KpiTile key={k.label} label={k.label} value={k.value} tone={k.tone} sub={k.hint} />
          ))}
        </div>
      )}

    </div>
  )
}
