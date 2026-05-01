import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import {
  Card, Section, Distribution, TopList, EmptyState, DrillChip,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function ContentTopics() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Top Clusters" dense>
          <TopList items={s.topics.slice(0, 8).map(([topic, count]) => ({
            id: topic,
            primary: topic,
            tail: `${count} pages`,
            onClick: () => {}
          }))} />
        </Section>
      </Card>

      <Card>
        <Section title="Topic Distribution" dense>
          <Distribution rows={s.topics.slice(0, 5).map(([label, value]) => ({
            label, value, tone: 'info'
          }))} />
        </Section>
      </Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Internal Links" onClick={() => {}} />
      </div>
    </div>
  )
}
