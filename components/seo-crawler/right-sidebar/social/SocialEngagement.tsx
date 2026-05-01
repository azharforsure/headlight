import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import {
  Card, Section, Heatcells, Distribution, TopList, EmptyState,
} from '../_shared'

export function SocialEngagement() {
  const { pages } = useSeoCrawler()
  const s = useSocialInsights()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  // Mock engagement heatmap data (7 days * 4 time blocks)
  const heatmapValues = [
    2, 5, 8, 3,  1, 4, 10, 2,  5, 9, 3, 1,  4, 2, 8, 10,  1, 2, 5, 3,  4, 10, 8, 2,  5, 3, 2, 1
  ]

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Best time to post" dense>
        <div className="py-2">
          <Heatcells values={heatmapValues} cols={4} />
          <div className="flex justify-between mt-1 text-[9px] text-[#555] uppercase px-0.5">
            <span>Morning</span>
            <span>Afternoon</span>
            <span>Evening</span>
            <span>Night</span>
          </div>
        </div>
      </Section></Card>

      <Card><Section title="Content performance" dense>
        <Distribution rows={[
          { label: 'Short Video', value: 45, tone: 'good' },
          { label: 'Carousel',    value: 30, tone: 'info' },
          { label: 'Image',       value: 15, tone: 'neutral' },
          { label: 'Text only',   value: 10, tone: 'warn' },
        ]} />
      </Section></Card>

      <Card><Section title="Top performing posts" dense>
        <TopList 
          items={[
            { id: 'p1', primary: 'Product Launch Video', secondary: 'Engagement: 4.2%', tail: '12k views', tone: 'good' },
            { id: 'p2', primary: 'Industry Insights Threads', secondary: 'Engagement: 3.8%', tail: '8k views', tone: 'info' },
          ]}
        />
      </Section></Card>

      <div className="rounded bg-[#0a0a0a] border border-[#222] p-2 flex justify-between items-center">
        <span className="text-[11px] text-[#888]">Avg. Reply Rate</span>
        <span className="text-[12px] font-mono text-green-500">82%</span>
      </div>
    </div>
  )
}
