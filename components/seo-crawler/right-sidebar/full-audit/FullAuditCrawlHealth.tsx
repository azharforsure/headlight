// components/seo-crawler/right-sidebar/full-audit/FullAuditCrawlHealth.tsx
import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { Card } from '../_shared/Card'
import { KpiTile } from '../_shared/KpiTile'
import { Distribution } from '../_shared/Distribution'
import { HealthStrip } from '../_shared/HealthStrip'
import { CrawlHeaderCard } from '../_shared/CrawlHeaderCard'
import { selectCrawlHealth } from './_selectors'

function fmtMs(ms: number) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export default function FullAuditCrawlHealth() {
  const { site } = useSeoCrawler() as any
  const h = selectCrawlHealth(site)

  const errorTotal = h.errors.timeouts + h.errors.server + h.errors.parse + h.errors.dns
  const blockedTotal = h.blocked.robots + h.blocked.metaNoindex + h.blocked.auth
  const renderTotal = h.render.staticHtml + h.render.ssr + h.render.csr

  return (
    <div className="flex flex-col gap-3 p-3">
      <CrawlHeaderCard
        startedAt={h.startedAt}
        finishedAt={h.finishedAt}
        durationMs={h.durationMs}
        pagesCrawled={h.pagesCrawled}
      />

      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Avg" value={fmtMs(h.avgMs)} />
        <KpiTile label="p90" value={fmtMs(h.p90Ms)} />
        <KpiTile label="p99" value={fmtMs(h.p99Ms)} />
      </div>

      <Card title={`Errors (${errorTotal})`}>
        <Distribution
          rows={[
            { label: 'Timeouts', value: h.errors.timeouts, color: '#ef4444' },
            { label: '5xx', value: h.errors.server, color: '#f97316' },
            { label: 'Parse', value: h.errors.parse, color: '#f59e0b' },
            { label: 'DNS', value: h.errors.dns, color: '#a78bfa' },
          ]}
        />
      </Card>

      <Card title={`Blocked (${blockedTotal})`}>
        <Distribution
          rows={[
            { label: 'robots.txt', value: h.blocked.robots, color: '#94a3b8' },
            { label: 'noindex', value: h.blocked.metaNoindex, color: '#64748b' },
            { label: 'auth', value: h.blocked.auth, color: '#475569' },
          ]}
        />
      </Card>

      <Card title="Sitemap parity">
        <HealthStrip
          total={h.sitemap.inSitemap + h.sitemap.missingFromSitemap + h.sitemap.orphanInSitemap || 1}
          segments={[
            { label: 'In sitemap', value: h.sitemap.inSitemap, color: '#22c55e' },
            { label: 'Missing', value: h.sitemap.missingFromSitemap, color: '#f59e0b' },
            { label: 'Orphan', value: h.sitemap.orphanInSitemap, color: '#ef4444' },
          ]}
        />
      </Card>

      <Card title="Render mode">
        <HealthStrip
          total={renderTotal || 1}
          segments={[
            { label: 'Static', value: h.render.staticHtml, color: '#22c55e' },
            { label: 'SSR', value: h.render.ssr, color: '#3b82f6' },
            { label: 'CSR', value: h.render.csr, color: '#f59e0b' },
          ]}
        />
      </Card>
    </div>
  )
}
