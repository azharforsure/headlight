import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, DistBlock, DistRowsBlock, TrendBlock,
  TopListBlock, SegmentBlock, BenchmarkBlock, CompareBlock, DrillFooter,
  EmptyState, RankBucketsBlock, SplitListBlock, compactNum, fmtPct,
} from '../_shared'

function num(v: any) { return Number.isFinite(Number(v)) ? Number(v) : 0 }

export function FullAuditSearch() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  const urlBuckets = useMemo(() => {
    if (!pages?.length) return []
    const m = new Map<string, { clicks: number; impr: number; pos: number; n: number }>()
    for (const p of pages) {
      const seg = (p.url || '').split('/').slice(0, 4).join('/') || '/'
      const cur = m.get(seg) || { clicks: 0, impr: 0, pos: 0, n: 0 }
      cur.clicks += num(p.gscClicks); cur.impr += num(p.gscImpressions); cur.pos += num(p.gscPosition); cur.n++
      m.set(seg, cur)
    }
    return [...m.entries()].sort((a, b) => b[1].clicks - a[1].clicks).slice(0, 6)
      .map(([id, v]) => ({ id, label: id, values: [compactNum(v.clicks), compactNum(v.impr), (v.pos / Math.max(1, v.n)).toFixed(1)] }))
  }, [pages])

  const striking = useMemo(() => pages
    .filter((p: any) => num(p.gscPosition) > 10 && num(p.gscPosition) <= 20 && num(p.gscImpressions) > 0)
    .sort((a: any, b: any) => num(b.gscImpressions) - num(a.gscImpressions))
    .slice(0, 6), [pages])

  const lowCtr = useMemo(() => pages
    .filter((p: any) => num(p.gscPosition) > 0 && num(p.gscPosition) <= 10 && num(p.gscCtr) > 0 && num(p.gscCtr) < 0.02)
    .sort((a: any, b: any) => num(b.gscImpressions) - num(a.gscImpressions))
    .slice(0, 6), [pages])

  const topPages = useMemo(() => [...pages].sort((a: any, b: any) => num(b.gscClicks) - num(a.gscClicks)).slice(0, 6), [pages])

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <Section title="Search performance" dense>
          <KpiRow>
            <KpiTile label="Clicks"       value={compactNum(s.search.clicksTotal)} />
            <KpiTile label="Impressions"  value={compactNum(s.search.imprTotal)} />
            <KpiTile label="CTR"          value={fmtPct(s.search.ctr * 100)} />
            <KpiTile label="Avg position" value={s.search.avgPosition.toFixed(1)} />
          </KpiRow>
        </Section>
      </Card>

      {s.hasPrior && (
        <TrendBlock title="Clicks (12 weeks)" values={s.search.clicksSeries} tone="good" />
      )}

      <RankBucketsBlock title="Rank distribution" buckets={[
        { label: '1-3',   value: s.search.rankBuckets.top3,    tone: 'good' },
        { label: '4-10',  value: s.search.rankBuckets.top10,   tone: 'good' },
        { label: '11-20', value: s.search.rankBuckets.striking,tone: 'warn' },
        { label: '21-50', value: s.search.rankBuckets.tail,    tone: 'info' },
        { label: '51+',   value: s.search.rankBuckets.deep,    tone: 'neutral' },
      ]} hint="Striking distance lives in 11-20." />

      <DistBlock title="Brand vs non-brand" segments={[
        { value: s.search.brandClicks,    tone: 'good', label: 'Brand' },
        { value: s.search.nonBrandClicks, tone: 'info', label: 'Non-brand' },
      ]} />

      <TopListBlock
        title="Striking distance (rank 11-20)"
        items={striking.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `pos ${num(p.gscPosition).toFixed(1)} · ${compactNum(num(p.gscImpressions))} impr`,
          onClick: () => drill.toPage(p),
        }))}
        onSeeAll={() => drill.toCategory('search', 'Striking distance')}
      />

      <TopListBlock
        title="Low CTR on page 1"
        items={lowCtr.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${fmtPct(num(p.gscCtr) * 100)} · pos ${num(p.gscPosition).toFixed(1)}`,
          onClick: () => drill.toPage(p),
        }))}
      />

      <TopListBlock
        title="Top queries"
        items={s.search.topQueries.slice(0, 8).map((q: any) => ({
          id: q.query, primary: q.query, tail: compactNum(num(q.clicks)),
          onClick: () => drill.toCategory('search', q.query),
        }))}
      />

      <TopListBlock
        title="Top pages by clicks"
        items={topPages.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: compactNum(num(p.gscClicks)),
          onClick: () => drill.toPage(p),
        }))}
      />

      {s.hasPrior && (
        <SplitListBlock
          title="Movers (28 days)"
          leftLabel="Winners" rightLabel="Losers"
          left={s.search.winners.slice(0, 5).map((p: any) => ({ id: p.url, primary: p.title || p.url, tail: `+${num(p.gscClicksDelta)}`, onClick: () => drill.toPage(p) }))}
          right={s.search.losers.slice(0, 5).map((p: any) => ({ id: p.url, primary: p.title || p.url, tail: `${num(p.gscClicksDelta)}`,  onClick: () => drill.toPage(p) }))}
        />
      )}

      {s.hasPrior && (
        <TopListBlock
          title="Lost queries (28d)"
          items={(s.search.lostQueries ?? []).slice(0, 6).map((q: any) => ({
            id: q.query, primary: q.query, tail: `${num(q.clicksDelta)} clicks`,
          }))}
          emptyText="No queries lost"
        />
      )}

      {s.hasPrior && (
        <TopListBlock
          title="Growing queries (28d)"
          items={(s.search.growingQueries ?? []).slice(0, 6).map((q: any) => ({
            id: q.query, primary: q.query, tail: `+${num(q.clicksDelta)} · pos ${num(q.pos).toFixed(1)}`,
          }))}
          emptyText="No risers yet"
        />
      )}

      <DistRowsBlock
        title="SERP feature presence"
        rows={[
          { label: 'Featured snippet', value: s.search.serpFeatures?.featured ?? 0, tone: 'good' },
          { label: 'People also ask',  value: s.search.serpFeatures?.paa      ?? 0, tone: 'info' },
          { label: 'Image pack',       value: s.search.serpFeatures?.image    ?? 0, tone: 'info' },
          { label: 'Video pack',       value: s.search.serpFeatures?.video    ?? 0, tone: 'info' },
          { label: 'Sitelinks',        value: s.search.serpFeatures?.sitelinks?? 0, tone: 'info' },
        ]}
      />

      <TopListBlock
        title="Cannibalisation"
        items={(s.search.cannibal ?? []).slice(0, 6).map((c: any) => ({
          id: c.query, primary: c.query,
          secondary: c.pages.map((p: any) => p.url).slice(0, 2).join(' · '),
          tail: `${c.pages.length} pages`,
          onClick: () => drill.toCategory('search', `cannibal:${c.query}`),
        }))}
        emptyText="No cannibalisation found"
      />

      <SegmentBlock title="By URL bucket" headers={['Path', 'Clicks', 'Impr', 'Pos']} rows={urlBuckets} />

      <TopListBlock title="Top countries" items={s.search.countryMix.map((c: any) => ({ id: c.id, primary: c.id, tail: compactNum(c.value) }))} emptyText="No country data" />

      <BenchmarkBlock title="CTR vs industry" site={s.search.ctr * 100} benchmark={s.bench.ctr * 100} unit="%" higherIsBetter />

      {s.hasPrior && (
        <CompareBlock title="vs last 28 days" rows={[
          { label: 'Clicks',        a: { v: s.search.clicksTotal,    tag: 'now' }, b: { v: s.search.clicksPrev,      tag: 'prev' }, format: compactNum },
          { label: 'Impressions',   a: { v: s.search.imprTotal,      tag: 'now' }, b: { v: s.search.imprPrev,        tag: 'prev' }, format: compactNum },
          { label: 'Avg position',  a: { v: s.search.avgPosition,    tag: 'now' }, b: { v: s.search.avgPositionPrev,  tag: 'prev' }, format: (v) => v.toFixed(1) },
        ]} />
      )}

      <DrillFooter chips={[
        { label: 'Striking',  count: s.oppRanks.striking,           onClick: () => drill.toCategory('search', 'Striking distance') },
        { label: 'Low CTR',   count: s.oppRanks.lowCtr },
        { label: 'Brand',     count: compactNum(s.search.brandClicks) },
        { label: 'Non-brand', count: compactNum(s.search.nonBrandClicks) },
      ]} />
    </div>
  )
}
