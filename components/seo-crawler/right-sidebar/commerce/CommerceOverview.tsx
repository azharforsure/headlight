import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useCommerceInsights } from '../_hooks/useCommerceInsights'
import { useDrill } from '../_shared/drill'
import {
  HeroStrip, HealthBlock, DistBlock, DonutBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, HeatmapBlock, BenchmarkBlock, FunnelBlock,
  CompareBlock, KvBlock, TimelineBlock, DrillFooter,
  AlertsBlock, ActionsBlock,
  EmptyState, fmtNum, fmtPct, fmtMs, compactNum, scoreToTone, fmtCurrency,
} from '../_shared'

export function CommerceOverview() {
  const { pages } = useSeoCrawler()
  const s = useCommerceInsights()
  const drill = useDrill()
  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <HeroStrip ring="gauge" score={s.score} scoreLabel="Commerce"
        kpis={[
          { label: 'Products', value: compactNum(s.products.total) },
          { label: 'Conv. rate', value: fmtPct(s.cvr * 100), tone: scoreToTone(s.cvr * 100) },
          { label: 'Avg order', value: fmtCurrency(s.aov) },
        ]} />
      <DistBlock title="Product status" segments={[
        { value: s.products.inStock, tone: 'good', label: 'In stock' },
        { value: s.products.lowStock, tone: 'warn', label: 'Low stock' },
        { value: s.products.outOfStock, tone: 'bad', label: 'OOS' },
        { value: s.products.discontinued, tone: 'neutral', label: 'Discontinued' },
      ]} />
      <DistRowsBlock title="Schema coverage" rows={[
        { label: 'Product schema', value: s.schema.product, tone: scoreToTone(s.schema.product) },
        { label: 'Offer / price', value: s.schema.offer, tone: scoreToTone(s.schema.offer) },
        { label: 'Aggregate rating', value: s.schema.rating, tone: scoreToTone(s.schema.rating) },
        { label: 'Availability', value: s.schema.availability, tone: scoreToTone(s.schema.availability) },
      ]} />
      <TrendBlock title="Conv. rate (30d)" values={s.cvrSeries} tone="info" />
      <TopListBlock title="Top revenue products" items={s.products.topRevenue.slice(0, 6).map((p: any) => ({
        id: p.url, primary: p.title || p.url, secondary: p.url,
        tail: fmtCurrency(p.revenue30d), onClick: () => drill.toPage(p),
      }))} />
      <SegmentBlock title="By category" headers={['Category','Products','OOS','Avg conv']} rows={s.byCategory.slice(0, 6).map((c: any) => ({
        id: c.id, label: c.label, values: [c.products, c.outOfStock, fmtPct(c.cvr * 100)],
      }))} />
      <FunnelBlock title="Checkout funnel" steps={s.funnel.slice(0, 6)} />
      <BenchmarkBlock title="Conv. rate vs vertical" site={s.cvr * 100} benchmark={s.bench.cvr * 100} unit="%" higherIsBetter />
      <CompareBlock title="vs last 30d" rows={[
        { label: 'Conv. rate', a: { v: s.cvr * 100, tag: 'now' }, b: { v: s.cvrPrev * 100, tag: 'prev' }, format: fmtPct },
        { label: 'AOV', a: { v: s.aov, tag: 'now' }, b: { v: s.aovPrev, tag: 'prev' }, format: fmtCurrency },
        { label: 'Revenue', a: { v: s.revenue30d, tag: 'now' }, b: { v: s.revenuePrev, tag: 'prev' }, format: fmtCurrency },
      ]} />

      <DrillFooter chips={[
        { label: 'OOS', count: s.products.outOfStock },
        { label: 'Schema gaps', count: s.schema.gaps },
        { label: 'Funnel drops', count: s.funnelDrops },
      ]} />
    </div>
  )
}
