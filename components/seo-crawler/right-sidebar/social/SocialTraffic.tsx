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

export function SocialTraffic() {
  const { pages } = useSeoCrawler()
  const s = useSocialInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Channel mix (sessions)" segments={[
        { value: s.traffic.byChannel.twitter, tone: 'info', label: 'X' },
        { value: s.traffic.byChannel.linkedin, tone: 'info', label: 'LinkedIn' },
        { value: s.traffic.byChannel.facebook, tone: 'info', label: 'FB' },
        { value: s.traffic.byChannel.youtube, tone: 'info', label: 'YouTube' },
        { value: s.traffic.byChannel.reddit, tone: 'info', label: 'Reddit' },
        { value: s.traffic.byChannel.other, tone: 'neutral', label: 'Other' },
      ]} />
      <DistRowsBlock title="Device" rows={[
        { label: 'Mobile', value: s.traffic.mobile },
        { label: 'Desktop', value: s.traffic.desktop },
        { label: 'Tablet', value: s.traffic.tablet },
      ]} />
      <TrendBlock title="Social sessions (30d)" values={s.traffic.series} tone="info" />
      <TopListBlock title="Top landing pages" items={s.traffic.topLandingPages.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, tail: compactNum(p.sessions),
        onClick: () => drill.toPage(p),
      }))} />
      <TopListBlock title="Top referring posts" items={s.traffic.topPosts.slice(0, 6).map((p: any) => ({
        id: p.id, primary: p.text.slice(0, 80), secondary: p.channel, tail: compactNum(p.sessions),
      }))} />
      <SegmentBlock title="By campaign" headers={['Campaign','Sessions','Conv','CR']} rows={s.traffic.byCampaign.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.name, values: [compactNum(c.sessions), c.conv, fmtPct(c.cvr * 100)],
      }))} />
      <DrillFooter chips={[
        { label: 'Sessions', count: compactNum(s.traffic.sessions) },
        { label: 'Top channel', count: s.traffic.topChannel },
      ]} />
    </div>
  )
}
