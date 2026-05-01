import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useSocialInsights } from '../_hooks/useSocialInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function SocialOverview() {
  const { socialProfiles } = useSeoCrawler() as any
  const s = useSocialInsights()
  if (!socialProfiles?.length) return <EmptyState title="No social profiles connected" />

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="Brand"
        kpis={[
          { label: 'Mentions (30d)', value: compactNum(s.mentions.total) },
          { label: 'Sentiment', value: s.sentiment.label, tone: s.sentiment.label === 'Positive' ? 'good' : s.sentiment.label === 'Negative' ? 'bad' : 'info' },
          { label: 'Engagement rate', value: fmtPct(s.engagement.rate * 100), tone: scoreToTone(s.engagement.rate * 1000) },
        ]} />
      <DistBlock title="Channel mix" segments={[
        { value: s.byChannel.twitter, tone: 'info', label: 'X' },
        { value: s.byChannel.linkedin, tone: 'info', label: 'LinkedIn' },
        { value: s.byChannel.instagram, tone: 'info', label: 'IG' },
        { value: s.byChannel.youtube, tone: 'info', label: 'YouTube' },
        { value: s.byChannel.tiktok, tone: 'info', label: 'TikTok' },
        { value: s.byChannel.facebook, tone: 'info', label: 'FB' },
      ]} />
      <DistRowsBlock title="Sentiment mix" rows={[
        { label: 'Positive', value: s.sentiment.positive, tone: 'good' },
        { label: 'Neutral', value: s.sentiment.neutral, tone: 'info' },
        { label: 'Negative', value: s.sentiment.negative, tone: 'bad' },
      ]} />
      <TrendBlock title="Mentions (30d)" values={s.mentions.series} tone="info" />
      <TopListBlock title="Top mentions" items={s.mentions.top.slice(0, 6).map((m: any) => ({
        id: m.id, primary: m.author, secondary: m.text.slice(0, 80),
        tail: `${m.channel} · ${compactNum(m.engagement)}`,
      }))} />
      <TopListBlock title="Trending topics" items={s.topics.trending.slice(0, 6).map((t: any) => ({
        id: t.id, primary: t.label, tail: `+${fmtPct(t.delta * 100)}`,
      }))} emptyText="No trending topics" />
      <SegmentBlock title="By profile" headers={['Profile','Followers','Engagement','Posts']} rows={s.byProfile.slice(0, 6).map((p: any) => ({
        id: p.id, label: `${p.channel} · ${p.handle}`,
        values: [compactNum(p.followers), fmtPct(p.engagementRate * 100), p.posts30d],
      }))} />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Mentions', a: { v: s.mentions.total, tag: 'now' }, b: { v: s.mentions.totalPrev, tag: 'prev' } },
        { label: 'Engagement rate', a: { v: s.engagement.rate * 100, tag: 'now' }, b: { v: s.engagement.ratePrev * 100, tag: 'prev' }, format: fmtPct },
      ]} />

      <DrillFooter chips={[
        { label: 'Mentions', count: compactNum(s.mentions.total) },
        { label: 'Negative', count: s.sentiment.negative },
        { label: 'Engagement', count: fmtPct(s.engagement.rate * 100) },
      ]} />
    </div>
  )
}
