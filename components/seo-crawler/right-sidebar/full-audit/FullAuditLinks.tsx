import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  DistBlock, DistRowsBlock, TrendBlock, TopListBlock, SegmentBlock,
  CompareBlock, DrillFooter, EmptyState, KpiRow, KpiTile, Card, Section,
  compactNum,
} from '../_shared'

function num(v: any) { return Number.isFinite(Number(v)) ? Number(v) : 0 }

export function FullAuditLinks() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const anchorTotal = (s.links.anchorMix.brand   ?? 0)
                    + (s.links.anchorMix.exact   ?? 0)
                    + (s.links.anchorMix.partial ?? 0)
                    + (s.links.anchorMix.generic ?? 0)
                    + (s.links.anchorMix.naked   ?? 0)
                    + (s.links.anchorMix.image   ?? 0)

  const pct = (n: number) => anchorTotal ? Math.round((n / anchorTotal) * 100) : 0

  const pagerankRows = (s.links.pagerankHistogram ?? []).map((r: any) => ({
    id: r.bucket, label: r.bucket, values: [num(r.count)],
  }))

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <Section title="Internal links" dense>
          <KpiRow>
            <KpiTile label="Total internal" value={compactNum(s.links.internalLinks)} />
            <KpiTile label="External"        value={compactNum(s.links.externalLinks)} />
            <KpiTile label="Orphans"         value={compactNum(s.links.orphans)} tone={s.links.orphans > 0 ? 'warn' : 'neutral'} />
            <KpiTile label="Broken"          value={compactNum(s.links.broken)}  tone={s.links.broken > 0  ? 'bad'  : 'neutral'} />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Backlinks" dense>
          <KpiRow>
            <KpiTile label="Ref domains"    value={compactNum(s.links.refDomains)} />
            <KpiTile label="Total backlinks"value={compactNum(s.links.totalBacklinks)} />
            <KpiTile label="Avg DR"         value={s.links.avgDr ? s.links.avgDr.toFixed(0) : '—'} />
            <KpiTile label="Toxic"          value={compactNum(s.links.toxic)} tone={s.links.toxic > 0 ? 'warn' : 'neutral'} />
          </KpiRow>
        </Section>
      </Card>

      {s.hasPrior && (
        <TrendBlock title="Ref domains (12 weeks)" values={s.links.refDomainsSeries} tone="info" />
      )}

      <DistBlock title="Follow mix" segments={[
        { value: s.links.dofollow,  tone: 'good',    label: 'dofollow' },
        { value: s.links.nofollow,  tone: 'info',    label: 'nofollow' },
        { value: s.links.ugc,       tone: 'neutral', label: 'ugc' },
        { value: s.links.sponsored, tone: 'warn',    label: 'sponsored' },
      ]} />

      <DistRowsBlock title="Anchor mix" rows={[
        { label: 'Brand',     value: pct(s.links.anchorMix.brand),   tone: 'good' },
        { label: 'Exact',     value: pct(s.links.anchorMix.exact),   tone: pct(s.links.anchorMix.exact) > 30 ? 'warn' : 'good' },
        { label: 'Partial',   value: pct(s.links.anchorMix.partial), tone: 'info' },
        { label: 'Generic',   value: pct(s.links.anchorMix.generic), tone: 'warn' },
        { label: 'Naked URL', value: pct(s.links.anchorMix.naked),   tone: 'info' },
        { label: 'Image',     value: pct(s.links.anchorMix.image),   tone: 'neutral' },
      ]} />

      {s.hasPrior && (
        <DistBlock title="New vs lost (90 days)" segments={[
          { value: s.links.new90d,  tone: 'good', label: 'New' },
          { value: s.links.lost90d, tone: 'bad',  label: 'Lost' },
        ]} />
      )}

      <TopListBlock
        title="Top referring domains"
        items={s.links.topRefDomains.slice(0, 8).map((d: any) => ({
          id: d.domain, primary: d.domain, tail: `DR ${d.dr || '—'} · ${compactNum(d.backlinks || 0)}`,
        }))}
        emptyText="No backlink data"
      />

      <TopListBlock
        title="Top anchors"
        items={s.links.topAnchors.slice(0, 8).map((a: any) => ({
          id: a.anchor, primary: a.anchor, tail: compactNum(a.count || 0),
        }))}
        emptyText="No anchor data"
      />

      <TopListBlock
        title="Internal hubs (most inlinks)"
        items={s.links.hubs.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${compactNum(num(p.inlinks))} inlinks`,
          onClick: () => drill.toPage(p),
        }))}
      />

      <TopListBlock
        title="Pages with most outlinks"
        items={(s.links.outlinksTopPages ?? []).slice(0, 6).map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${compactNum(num(p.outlinks))} outlinks`,
          onClick: () => drill.toPage(p),
        }))}
        emptyText="No outlink data"
      />

      <TopListBlock
        title="Anchor over-optimisation"
        items={(s.links.anchorOverOpt ?? []).slice(0, 6).map((r: any) => ({
          id: r.url, primary: r.url, secondary: `“${r.anchor}”`,
          tail: `${num(r.pct).toFixed(0)}%`,
          onClick: () => drill.toCategory('links', `over-opt:${r.url}`),
        }))}
        emptyText="No over-optimised anchors"
      />

      <TopListBlock
        title="Toxic backlinks"
        items={(s.links.toxicList ?? []).slice(0, 6).map((t: any) => ({
          id: t.domain, primary: t.domain,
          tail: `score ${num(t.score).toFixed(0)} · ${compactNum(num(t.backlinks))}`,
        }))}
        emptyText="No toxic links flagged"
      />

      {s.hasPrior && (
        <TopListBlock
          title="Lost backlinks"
          items={(s.links.lostList ?? []).slice(0, 6).map((l: any) => ({
            id: l.domain, primary: l.domain, tail: l.date,
          }))}
          emptyText="No backlinks lost"
        />
      )}

      <SegmentBlock
        title="Internal pagerank distribution"
        headers={['Bucket', 'Pages']}
        rows={pagerankRows.length > 0 ? pagerankRows : [{ id: 'na', label: 'No data', values: ['—'] }]}
      />

      {s.hasPrior && (
        <CompareBlock title="This crawl vs last" rows={[
          { label: 'Ref domains', a: { v: s.links.refDomains, tag: 'now' }, b: { v: s.links.refDomainsPrev, tag: 'prev' }, format: compactNum },
          { label: 'Orphans',     a: { v: s.links.orphans,    tag: 'now' }, b: { v: 0,                      tag: 'prev' } },
        ]} />
      )}

      <DrillFooter chips={[
        { label: 'Orphans', count: s.links.orphans, onClick: () => drill.toCategory('links', 'Orphan Pages') },
        { label: 'Broken',  count: s.links.broken,  onClick: () => drill.toCategory('links', 'Broken Internal') },
        { label: 'Toxic',   count: s.links.toxic },
        { label: 'New 90d', count: s.links.new90d },
      ]} />
    </div>
  )
}
