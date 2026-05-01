import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useTechnicalInsights } from '../_hooks/useTechnicalInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBar,
  CompareBlock, KvBlock, TimelineList, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, depthBucket } from '../_shared/derive'

export function TechnicalOverview() {
  const { pages } = useSeoCrawler()
  const s = useTechnicalInsights()
  const drill = useDrill()
  const tplRows = useMemo(() => {
    if (!pages?.length) return []
    const m = new Map<string, { total: number; cwv: number; idx: number; err: number }>()
    for (const p of pages) {
      const t = templateOf(p)
      const cur = m.get(t) || { total: 0, cwv: 0, idx: 0, err: 0 }
      cur.total++
      if (Number(p.lcpMs) < 2500 && Number(p.cls) < 0.1) cur.cwv++
      if (p.indexable) cur.idx++
      if (Number(p.statusCode) >= 400) cur.err++
      m.set(t, cur)
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 6)
      .map(([id, v]) => ({ id, label: id, values: [v.total, fmtPct((v.cwv/v.total)*100), fmtPct((v.idx/v.total)*100), v.err] }))
  }, [pages])

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const topIssues = [...pages].filter(p => Number(p.statusCode) >= 400 || p.indexable === false || Number(p.lcpMs) > 2500).slice(0, 6)

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="Tech"
        scoreHint="Crawl, indexing, render, perf, security, a11y"
        kpis={[
          { label: 'HTTPS', value: fmtPct(s.tech.httpsCoverage), tone: scoreToTone(s.tech.httpsCoverage) },
          { label: 'Indexable', value: fmtPct(s.tech.indexable), tone: scoreToTone(s.tech.indexable) },
          { label: 'CWV pass', value: fmtPct(s.tech.cwvPass), tone: scoreToTone(s.tech.cwvPass) },
        ]}
        trendCurrent={s.score} trendPrevious={s.scorePrev} />
      <DistBlock title="Status mix" segments={[
        { value: s.status.ok, tone: 'good', label: '2xx' },
        { value: s.status.redirect, tone: 'info', label: '3xx' },
        { value: s.status.client, tone: 'bad', label: '4xx' },
        { value: s.status.server, tone: 'bad', label: '5xx' },
        { value: s.status.blocked, tone: 'warn', label: 'blocked' },
      ]} />
      <DistRowsBlock title="Indexability mix" rows={[
        { label: 'Indexable', value: s.indexability.indexable, tone: 'good' },
        { label: 'Noindex', value: s.indexability.noindex, tone: 'warn' },
        { label: 'Canonicalized', value: s.indexability.canonicalized, tone: 'info' },
        { label: 'Blocked', value: s.indexability.blocked, tone: 'bad' },
        { label: 'Orphan', value: s.indexability.orphan, tone: 'warn' },
      ]} />
      <TrendBlock title="Tech score (12 weeks)" values={s.history.scoreSeries} tone="info" />
      <TopListBlock title="Top issues" items={topIssues.map(p => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: Number(p.statusCode) >= 400 ? `${p.statusCode}` : (p.indexable === false ? 'noindex' : fmtMs(Number(p.lcpMs))),
        onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By template" headers={['Template','Pages','CWV','Idx','Errors']} rows={tplRows} />
      <CompareBlock title="vs last crawl" rows={[
        { label: 'Score', a: { v: s.score, tag: 'now' }, b: { v: s.scorePrev, tag: 'prev' } },
        { label: 'CWV pass', a: { v: s.tech.cwvPass, tag: 'now' }, b: { v: s.tech.cwvPassPrev, tag: 'prev' }, format: fmtPct },
        { label: 'Errors', a: { v: s.status.client + s.status.server, tag: 'now' }, b: { v: s.status.errPrev, tag: 'prev' } },
      ]} />

      <DrillFooter chips={[
        { label: 'Crawl' }, { label: 'Indexing', count: s.indexability.noindex },
        { label: 'Perf' }, { label: 'Security' }, { label: 'A11y' },
      ]} />
    </div>
  )
}
