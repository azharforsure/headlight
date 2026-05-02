import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, AnchorMixBlock, DistBlock,
  TrendBlock, TopListBlock, CompareBlock, Trendable,
  EmptyState, compactNum
} from '../_shared'

export function FullAuditLinks() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl yet" />

  return (
    <div className="flex flex-col gap-3 p-3 pb-8">
      <Card>
        <Section title="Backlink profile">
          <KpiRow>
            <KpiTile label="Ref domains" value={compactNum(s.links.refDomains)} delta={s.hasPrior ? "+12" : undefined} deltaTone="up" />
            <KpiTile label="Total links" value={compactNum(s.links.totalBacklinks)} />
            <KpiTile label="Avg DR" value={s.links.avgDr} tone={s.links.avgDr > 50 ? 'good' : 'neutral'} />
            <KpiTile label="Toxic" value={s.links.toxic} tone={s.links.toxic > 0 ? 'bad' : 'good'} />
          </KpiRow>
        </Section>
      </Card>

      <Trendable hasPrior={s.hasPrior}>
        <TrendBlock title="Ref domains trend" values={s.links.refDomainsSeries} tone="good" hint="Last 6 months" />
      </Trendable>

      <AnchorMixBlock mix={s.links.anchorMix} />

      <DistBlock
        title="Follow distribution"
        segments={[
          { label: 'dofollow', value: s.links.dofollow, tone: 'good' },
          { label: 'nofollow', value: s.links.nofollow, tone: 'info' },
          { label: 'ugc', value: s.links.ugc, tone: 'neutral' },
          { label: 'sponsored', value: s.links.sponsored, tone: 'warn' },
        ]}
      />

      <TopListBlock
        title="Top internal hubs"
        items={s.links.hubs.slice(0, 5).map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${compactNum(p.inlinks)} inlinks`,
          onClick: () => drill.toPage(p),
        }))}
      />

      <Card>
        <Section title="Crawl health">
          <KpiRow>
            <KpiTile label="Broken internal" value={s.links.broken} tone={s.links.broken > 0 ? 'bad' : 'good'} />
            <KpiTile label="Orphan pages" value={s.links.orphans} tone={s.links.orphans > 0 ? 'warn' : 'good'} />
            <KpiTile label="External out" value={compactNum(s.links.externalLinks)} />
          </KpiRow>
        </Section>
      </Card>

      {s.hasPrior && (
        <CompareBlock
          title="vs previous crawl"
          rows={[
            { label: 'Ref domains', a: { v: s.links.refDomains, tag: 'now' }, b: { v: s.links.refDomainsPrev, tag: 'prev' }, format: compactNum },
            { label: 'Internal links', a: { v: s.links.internalLinks, tag: 'now' }, b: { v: 0, tag: 'prev' }, format: compactNum },
          ]}
        />
      )}
    </div>
  )
}
