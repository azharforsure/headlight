// components/seo-crawler/right-sidebar/full-audit/FullAuditScores.tsx
import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { BenchmarkBar } from '../_shared/BenchmarkBar'
import { selectPillars, selectOverallScore, selectScoreDistribution } from './_selectors'

const PILLARS: { key: keyof ReturnType<typeof selectPillars>; label: string; color: string }[] = [
  { key: 'content', label: 'Content', color: '#f59e0b' },
  { key: 'technical', label: 'Technical', color: '#3b82f6' },
  { key: 'schema', label: 'Schema', color: '#a78bfa' },
  { key: 'links', label: 'Links', color: '#14b8a6' },
  { key: 'a11y', label: 'A11y', color: '#10b981' },
  { key: 'security', label: 'Security', color: '#ef4444' },
]

export default function FullAuditScores() {
  const { pages, site } = useSeoCrawler() as any
  const hasTrend = useHasTrend()

  const pillars = selectPillars(pages)
  const overall = selectOverallScore(pillars)
  const distribution = selectScoreDistribution(pages)
  const cohort = site?.cohort ?? null
  const moverCount = Number(site?.lastSession?.movers ?? 0)

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#888]">Overall</div>
            <div className="mt-1 text-2xl font-semibold text-white">{overall}</div>
          </div>
          <ProgressRing value={overall} max={100} size={72} />
        </div>
      </Card>

      <Card title="Pillars">
        <ul className="flex flex-col gap-2">
          {PILLARS.map((p) => (
            <li key={p.key} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[11px] text-[#888]">{p.label}</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#141414]">
                <div className="absolute inset-y-0 left-0" style={{ width: `${pillars[p.key]}%`, background: p.color }} />
              </div>
              <span className="w-7 text-right text-[11px] tabular-nums text-[#ccc]">{pillars[p.key]}</span>
            </li>
          ))}
        </ul>
      </Card>

      {cohort ? (
        <Card title={`Cohort: ${cohort.label}`}>
          <BenchmarkBar value={overall} p25={cohort.p25} p50={cohort.p50} p75={cohort.p75} max={100} />
          <div className="mt-1 text-[11px] text-[#888]">
            Percentile <span className="text-[#ccc] tabular-nums">{cohort.percentile}</span>
          </div>
        </Card>
      ) : null}

      <Card title="Quality distribution">
        <Distribution rows={distribution.map((d) => ({ label: d.bucket, value: d.count }))} />
      </Card>

      {hasTrend ? (
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Movers" value={moverCount} />
          <KpiTile label="Δ overall" value={Number(site?.lastSession?.scoreDelta ?? 0)} delta={Number(site?.lastSession?.scoreDelta ?? 0)} />
        </div>
      ) : null}
    </div>
  )
}
