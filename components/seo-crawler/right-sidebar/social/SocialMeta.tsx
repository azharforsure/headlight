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

export function SocialMeta() {
  const { pages } = useSeoCrawler()
  const s = useSocialInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const missing = pages.filter(p => !p.ogImage || !p.ogTitle).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistRowsBlock title="OG field coverage" rows={[
        { label: 'og:title', value: fmtPct(s.meta.fields.title * 100), tone: scoreToTone(s.meta.fields.title * 100) },
        { label: 'og:description', value: fmtPct(s.meta.fields.description * 100), tone: scoreToTone(s.meta.fields.description * 100) },
        { label: 'og:image', value: fmtPct(s.meta.fields.image * 100), tone: scoreToTone(s.meta.fields.image * 100) },
        { label: 'twitter:card', value: fmtPct(s.meta.fields.twitterCard * 100), tone: scoreToTone(s.meta.fields.twitterCard * 100) },
      ]} />
      <DistBlock title="OG image issues" segments={[
        { value: s.meta.imageIssues.missing, tone: 'bad', label: 'Missing' },
        { value: s.meta.imageIssues.tooSmall, tone: 'warn', label: 'Too small' },
        { value: s.meta.imageIssues.broken, tone: 'bad', label: 'Broken' },
        { value: s.meta.imageIssues.ok, tone: 'good', label: 'OK' },
      ]} />
      <TopListBlock title="Pages missing OG" items={missing.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url, tail: 'missing',
        onClick: () => drill.toPage(p),
      }))} emptyText="All pages have OG" />
      <SegmentBlock title="By template" headers={['Template','Pages','OG complete','Image OK']} rows={s.meta.byTemplate.slice(0, 6).map((t: any) => ({
        id: t.id, label: t.label, values: [t.pages, fmtPct(t.complete * 100), fmtPct(t.image * 100)],
      }))} />
      <DrillFooter chips={[
        { label: 'Missing OG', count: s.meta.missingTotal },
        { label: 'Bad image', count: s.meta.imageIssues.broken + s.meta.imageIssues.tooSmall },
      ]} />
    </div>
  )
}
