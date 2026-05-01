import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useWqaInsights } from '../_hooks/useWqaInsights'
import {
  Card, Section, Sparkline, TopList, EmptyState,
} from '../_shared'

export function WqaHistory() {
  const { pages, crawlHistory } = useSeoCrawler()
  const s = useWqaInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Quality Trend" dense>
          <div className="h-[40px] px-1">
            <Sparkline values={s.trend} height={40} tone="good" />
          </div>
        </Section>
      </Card>

      <Card>
        <Section title="Search History" dense>
          <div className="h-[40px] px-1">
            <Sparkline values={[1200, 1250, 1180, 1300, 1400, 1350, 1450]} height={40} tone="info" />
          </div>
        </Section>
      </Card>

      <Card>
        <Section title="Recent Scans" dense>
          <TopList 
            items={(crawlHistory || []).slice(0, 5).map((run: any) => ({
              id: run.id,
              primary: new Date(run.completedAt || run.startedAt).toLocaleDateString(),
              tail: run.qScore || run.score || '—',
              onClick: () => {}
            }))}
          />
        </Section>
      </Card>
    </div>
  )
}
