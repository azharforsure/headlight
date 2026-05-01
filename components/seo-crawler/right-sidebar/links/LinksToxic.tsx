import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket } from '../_shared/derive'

export function LinksToxic() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worst = s.toxicLinks.slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Risk band" segments={[
        { value: s.toxicBands.high, tone: 'bad', label: 'High risk' },
        { value: s.toxicBands.medium, tone: 'warn', label: 'Medium' },
        { value: s.toxicBands.low, tone: 'info', label: 'Low' },
      ]} />
      <DistRowsBlock title="Reason mix" rows={[
        { label: 'Spammy TLD', value: s.toxicReasons.tld, tone: 'warn' },
        { label: 'PBN signals', value: s.toxicReasons.pbn, tone: 'bad' },
        { label: 'Foreign language mismatch', value: s.toxicReasons.lang, tone: 'warn' },
        { label: 'Sitewide footer', value: s.toxicReasons.sitewide, tone: 'warn' },
      ]} />
      <TopListBlock title="Top toxic refdoms" items={worst.map((r: any) => ({
        id: r.domain, primary: r.domain, tail: `spam ${r.spamScore} · ${r.backlinks}`,
      }))} emptyText="No toxic links" />
      <SegmentBlock title="By target page" headers={['Page','Toxic refdoms','Risk']} rows={s.toxicPages.byPage.slice(0, 6).map((p: any) => ({
        id: p.url, label: p.title || p.url, values: [p.toxicCount, p.risk], onRowClick: () => drill.toPage(p),
      }))} />
      <DrillFooter chips={[
        { label: 'High risk', count: s.toxicBands.high },
        { label: 'Disavow', count: s.disavowed },
      ]} />
    </div>
  )
}
