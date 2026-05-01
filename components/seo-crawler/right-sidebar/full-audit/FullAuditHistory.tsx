import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, Sparkline, TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function FullAuditHistory() {
  const { pages, crawlHistory } = useSeoCrawler()
  const s = useFullAuditInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Score Trend" dense>
          <div className="h-[40px] px-1">
            <Sparkline values={[70, 72, 75, 74, 78, 80, 82, 81, 85]} height={40} tone="good" />
          </div>
        </Section>
      </Card>

      <Card>
        <Section title="Recent Runs" dense>
          <TopList 
            items={(crawlHistory || []).slice(0, 5).map((run: any) => ({
              id: run.id,
              primary: new Date(run.completedAt || run.startedAt).toLocaleDateString(),
              secondary: `${run.pageCount} pages · ${run.errorCount || 0} errors`,
              tail: run.score ? `${run.score}` : 'View →',
              onClick: () => {}
            }))}
          />
        </Section>
      </Card>
    </div>
  )
}
