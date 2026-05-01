import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, TreemapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket, depthBucket, ageBucket } from '../_shared/derive'

export function FullAuditTech() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()
  const tplRows = useMemo(() => {
    if (!pages?.length) return []
    const m = new Map<string, { total: number; cwv: number; idx: number }>()
    for (const p of pages) {
      const t = templateOf(p)
      const cur = m.get(t) || { total: 0, cwv: 0, idx: 0 }
      cur.total++
      if (Number(p.lcpMs) < 2500 && Number(p.cls) < 0.1) cur.cwv++
      if (p.indexable) cur.idx++
      m.set(t, cur)
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 6)
      .map(([id, v]) => ({ id, label: id, values: [v.total, fmtPct((v.cwv / v.total) * 100), fmtPct((v.idx / v.total) * 100)] }))
  }, [pages])

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const worstPerf = [...pages].filter(p => p.lcpMs).sort((a, b) => Number(b.lcpMs) - Number(a.lcpMs)).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <DistBlock title="Status mix" segments={[
        { value: s.status.ok, tone: 'good', label: '2xx' },
        { value: s.status.redirect, tone: 'info', label: '3xx' },
        { value: s.status.client, tone: 'bad', label: '4xx' },
        { value: s.status.server, tone: 'bad', label: '5xx' },
        { value: s.status.blocked, tone: 'warn', label: 'blocked' },
      ]} />
      <DistRowsBlock title="Protocol mix" rows={[
        { label: 'HTTP/2', value: s.tech.http2, tone: 'good' },
        { label: 'HTTP/3', value: s.tech.http3, tone: 'good' },
        { label: 'HTTP/1.1', value: s.tech.http11, tone: 'warn' },
      ]} />
      <TopListBlock title="Worst LCP pages" items={worstPerf.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: fmtMs(Number(p.lcpMs)), onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template', 'Pages', 'CWV pass', 'Indexable']} rows={tplRows} />

      <DrillFooter chips={[
        { label: 'Errors', count: s.status.client + s.status.server },
        { label: 'Noindex', count: s.tech.noindex },
        { label: 'Mixed content', count: s.tech.mixedContent },
      ]} />
    </div>
  )
}
