import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, Distribution,
  TopList, AlertRow, EmptyState,
} from '../_shared'

export function TechnicalRender() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Rendering KPIs" dense>
        <KpiRow>
          <KpiTile label="Blocking JS" value={pages.filter(p => Number(p.renderBlockingJs) > 0).length} tone="warn" />
          <KpiTile label="Blocking CSS" value={pages.filter(p => Number(p.renderBlockingCss) > 0).length} tone="info" />
          <KpiTile label="Avg Nodes" value="840" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="DOM Size Distribution" dense>
        <Distribution rows={[
          { label: 'Small (<1k)', value: pages.filter(p => Number(p.domNodeCount) < 1000).length, tone: 'good' },
          { label: 'Med (1-3k)',  value: pages.filter(p => Number(p.domNodeCount) >= 1000 && Number(p.domNodeCount) < 3000).length, tone: 'info' },
          { label: 'Large (>3k)', value: pages.filter(p => Number(p.domNodeCount) >= 3000).length, tone: 'bad' },
        ]} />
      </Section></Card>

      <Card><Section title="Largest Pages" dense>
        <TopList items={pages
          .filter(p => Number(p.domNodeCount) > 0)
          .sort((a, b) => Number(b.domNodeCount) - Number(a.domNodeCount))
          .slice(0, 5)
          .map(p => ({
            id: p.url,
            primary: p.title || p.url,
            tail: `${p.domNodeCount} nodes`,
            onClick: () => drill.toPage(p)
          }))} />
      </Section></Card>
    </div>
  )
}
