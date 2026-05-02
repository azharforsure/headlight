// components/seo-crawler/right-sidebar/full-audit/FullAuditOverview.tsx
import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { ProgressRing } from '../_shared/ProgressRing'
import { HealthStrip } from '../_shared/HealthStrip'
import { RsSparkline } from '../parts/RsSparkline'
import {
  selectStatusMix,
  selectDepthDistribution,
  selectCategoryDonut,
  selectIndexable,
  selectIssues,
  selectPillars,
  selectOverallScore,
} from './_selectors'

export default function FullAuditOverview() {
  const { pages, site, scoreSpark } = useSeoCrawler() as any
  const hasTrend = useHasTrend()

  const status = selectStatusMix(pages)
  const depth = selectDepthDistribution(pages)
  const donut = selectCategoryDonut(pages)
  const idx = selectIndexable(pages)
  const issues = selectIssues(pages)
  const pillars = selectPillars(pages)
  const score = selectOverallScore(pillars)
  const newPages = Number(site?.lastSession?.newPages ?? 0)

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#888]">Site score</div>
            <div className="mt-1 text-2xl font-semibold text-white">{score}</div>
            {hasTrend && scoreSpark?.length ? (
              <div className="mt-1 w-24"><RsSparkline points={scoreSpark} /></div>
            ) : null}
          </div>
          <ProgressRing value={score} max={100} size={72} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <KpiTile label="Pages" value={status.total} />
        <KpiTile label="Indexable" value={idx.indexable} secondary={`${idx.notIndexable} blocked`} />
        <KpiTile label="Issues open" value={issues.openTotal} accent={issues.severity.critical > 0 ? '#ef4444' : '#94a3b8'} />
        <KpiTile label="New since last crawl" value={newPages} delta={hasTrend ? newPages : undefined} />
      </div>

      <Card title="Status mix">
        <HealthStrip
          total={status.total}
          segments={[
            { label: '2xx', value: status.ok, color: '#22c55e' },
            { label: '3xx', value: status.redirect, color: '#3b82f6' },
            { label: '4xx', value: status.clientError, color: '#f59e0b' },
            { label: '5xx', value: status.serverError, color: '#ef4444' },
          ]}
        />
      </Card>

      <Card title="Depth distribution">
        <Distribution rows={depth.map((d) => ({ label: `D${d.depth}`, value: d.count }))} />
      </Card>

      <Card title="Page types">
        <Distribution rows={donut.map((d) => ({ label: d.name, value: d.value, color: d.color }))} />
      </Card>
    </div>
  )
}
