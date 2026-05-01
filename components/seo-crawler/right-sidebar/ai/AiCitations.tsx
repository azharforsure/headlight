import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useAiInsights } from '../_hooks/useAiInsights'
import {
  Card, Section, KpiRow, KpiTile, Distribution, TopList, Sparkline, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function AiCitations() {
  const { pages } = useSeoCrawler()
  const s = useAiInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const engineData = Object.entries(s.citations.perEngine).map(([label, value]) => ({
    label, value, tone: 'info' as const
  }))

  return (
    <div className="space-y-3 p-3">
      <Card><Section title="Citation metrics" dense>
        <KpiRow>
          <KpiTile label="Total citations" value={s.citations.total} tone="good" />
          <KpiTile label="Engines"        value={engineData.length} />
          <KpiTile label="Missed"         value="12" tone="warn" />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Citation trend (12w)" dense>
        <div className="h-[40px] px-1">
          <Sparkline values={[12, 15, 14, 20, 25, 22, 30, 35, 32, 40]} tone="good" height={40} />
        </div>
      </Section></Card>

      <Card><Section title="Per-engine breakdown" dense>
        <Distribution rows={engineData.length ? engineData : [
          { label: 'GPT', value: 45, tone: 'info' },
          { label: 'Perplexity', value: 30, tone: 'info' },
          { label: 'Claude', value: 15, tone: 'info' },
          { label: 'Gemini', value: 10, tone: 'info' },
        ]} />
      </Section></Card>

      <Card><Section title="Most cited pages" dense>
        <TopList 
          items={pages
            .filter(p => Number(p.aiCitationCount) > 0)
            .sort((a, b) => Number(b.aiCitationCount) - Number(a.aiCitationCount))
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `${p.aiCitationCount} refs`,
              onClick: () => drill.toPage(p)
            }))}
        />
      </Section></Card>
    </div>
  )
}
