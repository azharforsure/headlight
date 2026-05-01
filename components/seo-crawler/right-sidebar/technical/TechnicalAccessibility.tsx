import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, Distribution,
  TopList, AlertRow, EmptyState,
} from '../_shared'

export function TechnicalAccessibility() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="A11y Overview" dense>
        <KpiRow>
          <KpiTile label="Avg Violations" value="12" tone="warn" />
          <KpiTile label="Contrast Issues" value="85" tone="warn" />
          <MetricRow label="Missing Alt" value="140" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Top Violations" dense>
        <TopList items={[
          { id: '1', primary: 'Form labels missing', tail: '12 pages', onClick: () => drill.toCategory('a11y', 'Forms') },
          { id: '2', primary: 'Invalid ARIA attributes', tail: '8 pages', onClick: () => drill.toCategory('a11y', 'ARIA') },
          { id: '3', primary: 'Image alt text missing', tail: '45 pages', onClick: () => drill.toCategory('a11y', 'Images') },
        ]} />
      </Section></Card>
    </div>
  )
}
