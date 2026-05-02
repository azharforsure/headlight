// components/seo-crawler/right-sidebar/full-audit/FullAuditIssues.tsx
import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useHasTrend } from '../_hooks/useSessionsCount'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { HealthStrip } from '../_shared/HealthStrip'
import { RsSparkline } from '../parts/RsSparkline'
import { selectIssues } from './_selectors'

const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#94a3b8' } as const

export default function FullAuditIssues() {
  const { pages, site, openIssueDrawer } = useSeoCrawler() as any
  const hasTrend = useHasTrend()
  const { rows, severity, category, openTotal } = selectIssues(pages)

  const newCount = Number(site?.lastSession?.newIssues ?? 0)
  const resolvedCount = Number(site?.lastSession?.resolvedIssues ?? 0)
  const issuesSpark = (site?.history?.issuesOpen ?? []) as number[]

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[#888]">Issues open</div>
            <div className="text-2xl font-semibold text-white">{openTotal}</div>
          </div>
          {hasTrend && issuesSpark.length ? (
            <div className="w-28"><RsSparkline points={issuesSpark} invertColor /></div>
          ) : null}
        </div>
      </Card>

      <Card title="By severity">
        <HealthStrip
          total={openTotal || 1}
          segments={[
            { label: 'Critical', value: severity.critical, color: SEV_COLOR.critical },
            { label: 'High', value: severity.high, color: SEV_COLOR.high },
            { label: 'Medium', value: severity.medium, color: SEV_COLOR.medium },
            { label: 'Low', value: severity.low, color: SEV_COLOR.low },
          ]}
        />
      </Card>

      <Card title="By category">
        <Distribution
          rows={[
            { label: 'Content', value: category.content },
            { label: 'Technical', value: category.technical },
            { label: 'Schema', value: category.schema },
            { label: 'Links', value: category.links },
            { label: 'A11y', value: category.a11y },
            { label: 'Security', value: category.security },
            { label: 'Performance', value: category.performance },
            { label: 'UX', value: category.ux },
          ]}
        />
      </Card>

      {hasTrend ? (
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="New" value={newCount} accent="#ef4444" />
          <KpiTile label="Resolved" value={resolvedCount} accent="#22c55e" />
        </div>
      ) : null}

      <Card title="Top issues">
        <ul className="flex flex-col">
          {rows.slice(0, 5).map((r) => (
            <li key={r.code}>
              <button
                onClick={() => openIssueDrawer?.(r.code)}
                className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-[#141414]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SEV_COLOR[r.severity] }} />
                  <span className="truncate text-[12px] text-[#ccc]">{r.title}</span>
                </span>
                <span className="text-[11px] tabular-nums text-[#888]">{r.count}</span>
              </button>
            </li>
          ))}
          {rows.length === 0 && <li className="px-2 py-2 text-[11px] text-[#666]">No issues found</li>}
        </ul>
      </Card>
    </div>
  )
}
