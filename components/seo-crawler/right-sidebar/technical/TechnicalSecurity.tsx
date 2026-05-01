import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar,
  CompareBlock, KvBlock, TimelineList, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function TechnicalSecurity() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const mixed = pages.filter(p => p.mixedContent).slice(0, 6)
  const missingHeaders = pages.filter(p => p.missingSecurityHeaders).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Cert health" segments={[
        { value: s.security.certValid, tone: 'good', label: 'Valid' },
        { value: s.security.certExpiring, tone: 'warn', label: 'Expiring soon' },
        { value: s.security.certInvalid, tone: 'bad', label: 'Invalid' },
      ]} />
      <DistRowsBlock title="Header coverage" rows={[
        { label: 'CSP', value: s.security.csp, tone: s.security.csp ? 'good' : 'warn' },
        { label: 'HSTS', value: s.security.hsts ? 1 : 0, tone: s.security.hsts ? 'good' : 'warn' },
        { label: 'X-Frame-Options', value: s.security.xfo ? 1 : 0, tone: s.security.xfo ? 'good' : 'warn' },
        { label: 'Referrer-Policy', value: s.security.referrer ? 1 : 0, tone: s.security.referrer ? 'good' : 'warn' },
      ]} />
      <TopListBlock title="Mixed-content pages" items={mixed.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url, tail: 'mixed',
        onClick: () => drill.toPage(p),
      }))} emptyText="No mixed content" />
      <TopListBlock title="Missing security headers" items={missingHeaders.map(p => ({
        id: p.url, primary: p.title || p.url, tail: 'no headers',
        onClick: () => drill.toPage(p),
      }))} emptyText="All pages have headers" />
      <DrillFooter chips={[
        { label: 'Mixed content', count: mixed.length },
        { label: 'Missing headers', count: missingHeaders.length },
      ]} />
    </div>
  )
}
