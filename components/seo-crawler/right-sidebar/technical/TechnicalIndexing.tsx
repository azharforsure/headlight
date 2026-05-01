import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, MetricRow, Donut,
  TopList, AlertRow, EmptyState,
  fmtPct,
} from '../_shared'

export function TechnicalIndexing() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const notInSitemap = pages.filter(p => p.inSitemap === false && p.statusCode === 200 && p.isHtmlPage)

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Indexing KPIs" dense>
        <KpiRow>
          <KpiTile label="Indexable" value={s.indexability.indexable} tone="good" />
          <KpiTile label="Noindex" value={s.indexability.noindex} tone="warn" />
          <KpiTile label="Orphans" value={s.indexability.orphan} tone="warn" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Sitemap Parity" dense>
        <div className="flex items-center gap-6 py-2">
          <Donut segments={[
            { value: pages.filter(p => p.inSitemap).length, tone: 'good', label: 'In Sitemap' },
            { value: notInSitemap.length, tone: 'warn', label: 'Missing' },
          ]} />
          <div className="flex-1 space-y-1">
            <MetricRow label="In Sitemap" value={pages.filter(p => p.inSitemap).length} />
            <MetricRow label="Missing from Sitemap" value={notInSitemap.length} tone="warn" />
          </div>
        </div>
      </Section></Card>

      <Card><Section title="Top Indexable (Not in Sitemap)" dense>
        <TopList items={notInSitemap.slice(0, 5).map(p => ({
          id: p.url,
          primary: p.title || p.url,
          tail: 'Missing',
          onClick: () => drill.toPage(p)
        }))} />
      </Section></Card>

      <Card><Section title="Indexing Alerts" dense>
        {s.indexability.canonMismatch > 0 && (
          <AlertRow alert={{ id: 'c', tone: 'warn', title: 'Canonical mismatches', count: s.indexability.canonMismatch }} 
                    onClick={() => drill.toCategory('indexability', 'Canonical Mismatch')} />
        )}
      </Section></Card>
    </div>
  )
}
