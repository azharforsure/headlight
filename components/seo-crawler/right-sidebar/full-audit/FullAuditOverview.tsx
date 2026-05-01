import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, TreemapBlock, BenchmarkBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone,
} from '../_shared'
import { templateOf, inlinkBucket, depthBucket, ageBucket } from '../_shared/derive'

export function FullAuditOverview() {
  const { pages } = useSeoCrawler()
  const s = useFullAuditInsights()
  const drill = useDrill()
  const tplRows = useMemo(() => {
    if (!pages?.length) return []
    const m = new Map<string, { total: number; errors: number; thin: number }>()
    for (const p of pages) {
      const t = templateOf(p)
      const cur = m.get(t) || { total: 0, errors: 0, thin: 0 }
      cur.total++
      if (Number(p.statusCode) >= 400) cur.errors++
      if (Number(p.wordCount) < 300) cur.thin++
      m.set(t, cur)
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 6)
      .map(([id, v]) => ({ id, label: id, values: [v.total, v.errors, v.thin] }))
  }, [pages])

  if (!pages?.length) return <EmptyState title="No crawl data yet" hint="Start a crawl to see this tab." />

  const healthy = s.total - (s.issues.errors + s.issues.warnings + s.issues.notices)

  return (
    <div className="flex flex-col gap-3 p-3">
      <HeroStrip title="Snapshot" ring="gauge" score={s.score} scoreLabel="Site score"
        kpis={[
          { label: 'Pages', value: compactNum(s.total) },
          { label: 'HTTPS', value: fmtPct(s.tech.httpsCoverage), tone: scoreToTone(s.tech.httpsCoverage) },
          { label: 'Indexable', value: fmtPct(s.tech.indexable), tone: scoreToTone(s.tech.indexable) },
        ]}
        trendCurrent={s.score} trendPrevious={s.scorePrev} />
        
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-3">
        <DistBlock title="Status mix" segments={[
          { value: s.issues.errors, tone: 'bad', label: 'Errors' },
          { value: s.issues.warnings, tone: 'warn', label: 'Warnings' },
          { value: s.issues.notices, tone: 'info', label: 'Notices' },
          { value: healthy, tone: 'good', label: 'Healthy' },
        ]} />
        <DistRowsBlock title="Severity by category" rows={[
          { label: 'Indexability', value: s.tech.noindex, tone: 'warn' },
          { label: 'Performance', value: s.perf.lcpFail, tone: 'bad' },
          { label: 'Links', value: s.links.broken, tone: 'bad' },
          { label: 'Schema', value: s.content.schemaErrors, tone: 'warn' },
        ]} />
        <TrendBlock title="Score (12 weeks)" values={s.history.scoreSeries} tone="info" />
        <BenchmarkBlock title="CTR vs industry" site={s.search.ctr * 100} benchmark={s.bench.ctr * 100} unit="%" higherIsBetter />
      </div>

      <TopListBlock title="Worst pages" items={
        s.worstPages.slice(0, 6).map(p => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `score ${Math.round(Number(p.qualityScore))}`,
          onClick: () => drill.toPage(p),
        }))
      } onSeeAll={() => drill.toCategory('quality', 'All')} />
      <SegmentBlock title="By template" headers={['Template', 'Total', '4xx', 'Thin']} rows={tplRows} />
      <CompareBlock title="This crawl vs last" rows={[
        { label: 'Indexable',  a: { v: s.tech.indexable, tag: 'now' }, b: { v: s.tech.indexablePrev, tag: 'prev' }, format: fmtPct },
        { label: 'Errors',     a: { v: s.issues.errors, tag: 'now' }, b: { v: s.issues.errorsPrev, tag: 'prev' } },
        { label: 'CWV pass',   a: { v: s.tech.cwvPass, tag: 'now' }, b: { v: s.tech.cwvPassPrev, tag: 'prev' }, format: fmtPct },
      ]} />

      <DrillFooter chips={[
        { label: 'Issues',         count: s.issues.errors + s.issues.warnings, onClick: () => drill.toCategory('status', 'All') },
        { label: 'Opportunities',  count: (s.oppRanks.striking || 0) + (s.oppRanks.lowCtr || 0) },
        { label: 'Actions',        count: s.actions.open },
      ]} />
    </div>
  )
}
