import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, TrendBlock, PositionBucketsBlock,
  QueryIntentSplitBlock, TopListBlock, NotConnected, Trendable,
  EmptyState, compactNum, fmtPct, DeltaChip
} from '../_shared'

export function FullAuditSearch() {
  const { pages, openSettings } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl yet" />

  if (!s.connectors.gsc.connected) {
    return (
      <div className="p-3">
        <NotConnected
          source="Google Search Console"
          reason="Connect to see keywords, rankings, and impressions."
          onConnect={() => openSettings?.('connectors', 'gsc')}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3 pb-8">
      <Card>
        <Section title="GSC performance (30d)">
          <KpiRow>
            <KpiTile label="Clicks" value={compactNum(s.search.clicksTotal)} delta={s.hasPrior ? "+12%" : undefined} />
            <KpiTile label="Impressions" value={compactNum(s.search.imprTotal)} />
            <KpiTile label="Avg CTR" value={fmtPct(s.search.ctr * 100, 1)} tone={s.search.ctr > 0.03 ? 'good' : 'warn'} />
            <KpiTile label="Avg Pos" value={s.search.avgPosition.toFixed(1)} />
          </KpiRow>
        </Section>
      </Card>

      <Trendable hasPrior={s.hasPrior}>
        <TrendBlock title="Clicks trend" values={s.search.clicksSeries} tone="good" hint="Daily trend" />
      </Trendable>

      <PositionBucketsBlock
        buckets={s.search.rankBuckets}
        onBucketClick={(id) => drill.toCategory('search', `pos:${id}`)}
      />

      <QueryIntentSplitBlock split={s.search.intentSplit} />

      <TopListBlock
        title="Top performing queries"
        items={s.search.topQueries.slice(0, 8).map((q: any) => ({
          id: q.query,
          primary: q.query,
          tail: `${compactNum(q.clicks)} clicks`,
          onClick: () => drill.toCategory('search', `q:${q.query}`),
        }))}
      />

      <Card>
        <Section title="Brand split">
          <KpiRow>
            <KpiTile label="Brand" value={compactNum(s.search.brandClicks)} sub={`${fmtPct((s.search.brandClicks / (s.search.clicksTotal || 1)) * 100)} of total`} />
            <KpiTile label="Non-brand" value={compactNum(s.search.nonBrandClicks)} sub={`${fmtPct((s.search.nonBrandClicks / (s.search.clicksTotal || 1)) * 100)} of total`} />
          </KpiRow>
        </Section>
      </Card>
    </div>
  )
}
