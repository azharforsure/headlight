import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, Distribution,
  TopList, AlertRow, EmptyState, fmtNum,
} from '../_shared'

export function LinksInternal() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const avgInlinks = s.total > 0 ? (s.inlinksTotal / s.total).toFixed(1) : '0'
  const nearOrphans = pages.filter(p => Number(p.inlinks) > 0 && Number(p.inlinks) <= 2).length

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Internal summary" dense>
        <KpiRow>
          <KpiTile label="Avg inlinks" value={avgInlinks} />
          <KpiTile label="Orphans"     value={s.internal.orphans} tone={s.internal.orphans > 0 ? 'warn' : 'neutral'} />
          <KpiTile label="Near orphans" value={nearOrphans} tone="info" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Inlink distribution" dense>
        <Distribution rows={[
          { label: '0 (Orphan)', value: s.internal.orphans, tone: 'warn' },
          { label: '1–2', value: nearOrphans, tone: 'info' },
          { label: '3–10', value: pages.filter(p => Number(p.inlinks) >= 3 && Number(p.inlinks) <= 10).length },
          { label: '11–50', value: pages.filter(p => Number(p.inlinks) > 10 && Number(p.inlinks) <= 50).length },
          { label: '50+', value: pages.filter(p => Number(p.inlinks) > 50).length, tone: 'good' },
        ]} />
      </Section></Card>

      <Card><Section title="Orphan pages" dense>
        <TopList 
          items={pages
            .filter(p => Number(p.inlinks) === 0 && Number(p.crawlDepth) > 0)
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              secondary: p.url,
              onClick: () => drill.toCategory('links', 'Orphan Pages')
            }))} 
        />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        {s.internal.nofollow > 0 && (
          <AlertRow alert={{ id: 'n', tone: 'warn', title: 'Nofollow internal links', count: s.internal.nofollow }} />
        )}
        {s.internal.redirects > 0 && (
          <AlertRow alert={{ id: 'r', tone: 'warn', title: 'Internal redirect chains', count: s.internal.redirects }} />
        )}
      </Section></Card>
    </div>
  )
}
