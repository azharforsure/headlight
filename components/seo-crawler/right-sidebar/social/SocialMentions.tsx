import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function SocialMentions() {
  const { socialMentions } = useSeoCrawler() as any
  const s = useSocialInsights()
  if (!socialMentions?.length) return <EmptyState title="No mentions tracked" />

  const top = [...socialMentions].sort((a, b) => Number(b.engagement) - Number(a.engagement)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Sentiment" segments={[
        { value: s.sentiment.positive, tone: 'good', label: 'Positive' },
        { value: s.sentiment.neutral, tone: 'info', label: 'Neutral' },
        { value: s.sentiment.negative, tone: 'bad', label: 'Negative' },
      ]} />
      <DistRowsBlock title="By channel" rows={[
        { label: 'X', value: s.byChannel.twitter },
        { label: 'Reddit', value: s.byChannel.reddit },
        { label: 'News', value: s.byChannel.news },
        { label: 'Blog', value: s.byChannel.blog },
        { label: 'Forum', value: s.byChannel.forum },
      ]} />
      <TrendBlock title="Mentions (90d)" values={s.mentions.series90d} tone="info" />
      <TopListBlock title="Top mentions" items={top.map((m: any) => ({
        id: m.id, primary: m.author, secondary: m.text.slice(0, 80),
        tail: `${m.channel} · ${compactNum(m.engagement)}`,
      }))} />
      <TopListBlock title="Negative mentions" items={s.mentions.negativeList.slice(0, 6).map((m: any) => ({
        id: m.id, primary: m.author, secondary: m.text.slice(0, 80), tail: m.channel,
      }))} emptyText="No negative mentions" />
      <SegmentBlock title="By topic" headers={['Topic','Mentions','Sent.','Reach']} rows={s.topics.list.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.mentions, t.sentiment, compactNum(t.reach)],
      }))} />
      <DrillFooter chips={[
        { label: 'Negative', count: s.sentiment.negative },
        { label: 'Topics', count: s.topics.list.length },
      ]} />
    </div>
  )
}
