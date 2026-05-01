import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, KpiTile, KpiRow, Distribution,
  TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function FullAuditIssues() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  // This is a simplified version of issue grouping
  const severityRows = [
    { label: 'Critical', value: s.issues.errors, tone: 'bad' as const },
    { label: 'Warning',  value: s.issues.warnings, tone: 'warn' as const },
    { label: 'Notice',   value: s.issues.notices, tone: 'info' as const },
  ]

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Issue Summary" dense>
          <KpiRow>
            <KpiTile label="Errors" value={s.issues.errors} tone={s.issues.errors > 0 ? 'bad' : 'neutral'} />
            <KpiTile label="Warnings" value={s.issues.warnings} tone={s.issues.warnings > 0 ? 'warn' : 'neutral'} />
            <KpiTile label="Notices" value={s.issues.notices} tone="info" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Severity Distribution" dense>
          <Distribution rows={severityRows} />
        </Section>
      </Card>

      <Card>
        <Section title="Top Issues" dense>
          <TopList 
            items={[
              { id: '4xx', primary: 'Broken Links (4xx)', tail: s.issues.errors, onClick: () => drill.toCategory('status', '4xx Errors') },
              { id: 'noindex', primary: 'Noindex Pages', tail: s.tech.indexable, onClick: () => drill.toCategory('indexability', 'Noindex') },
              { id: 'lcp', primary: 'Slow LCP (>2.5s)', tail: 'Check', onClick: () => drill.toCategory('performance', 'Core Web Vitals') },
            ]} 
            onSeeAll={() => drill.toCategory('status', 'All')}
          />
        </Section>
      </Card>
    </div>
  )
}
