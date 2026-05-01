import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useLinksInsights } from '../_hooks/useLinksInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, RingGauge, Distribution,
  AlertRow, DrillChip, EmptyState, fmtNum,
} from '../_shared'

export function LinksOverview() {
  const { pages } = useSeoCrawler()
  const s = useLinksInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <div className="flex flex-col items-center py-5">
          <RingGauge value={s.score} size={92} label="Authority" />
        </div>
      </Card>

      <Card><Section title="Link rollup" dense>
        <KpiRow>
          <KpiTile label="Ref. domains" value={fmtNum(s.refDomainsTotal)} />
          <KpiTile label="Backlinks"    value={fmtNum(s.backlinksTotal)} />
          <KpiTile label="Internal"     value={fmtNum(s.inlinksTotal)} />
        </KpiRow>
      </Section></Card>

      <Card><Section title="Anchor mix" dense>
        <Distribution rows={[
          { label: 'Brand',   value: Math.round(s.anchorMix.brand) },
          { label: 'Exact',   value: Math.round(s.anchorMix.exact),   tone: s.anchorMix.exact > 30 ? 'warn' : 'neutral' },
          { label: 'Partial', value: Math.round(s.anchorMix.partial) },
          { label: 'Generic', value: Math.round(s.anchorMix.generic), tone: 'warn' },
          { label: 'URL',     value: Math.round(s.anchorMix.url) },
          { label: 'Image',   value: Math.round(s.anchorMix.image) },
        ]} />
      </Section></Card>

      <Card><Section title="Alerts" dense>
        {s.internal.orphans > 0 && (
          <AlertRow alert={{ id: 'o', tone: 'warn', title: 'Orphan pages', count: s.internal.orphans }} 
                    onClick={() => drill.toCategory('links', 'Orphan Pages')} />
        )}
        {s.internal.brokenIn > 0 && (
          <AlertRow alert={{ id: 'b', tone: 'bad', title: 'Pages with broken internal links', count: s.internal.brokenIn }} 
                    onClick={() => drill.toCategory('links', 'Broken Internal')} />
        )}
        {s.toxic.domains > 0 && (
          <AlertRow alert={{ id: 't', tone: 'bad', title: 'Pages linking to toxic domains', count: s.toxic.domains }} />
        )}
      </Section></Card>

      <div className="flex flex-wrap gap-1">
        <DrillChip label="Internal" count={s.inlinksTotal} />
        <DrillChip label="External" count={s.externalTotal} />
        <DrillChip label="Anchors" />
      </div>
    </div>
  )
}
