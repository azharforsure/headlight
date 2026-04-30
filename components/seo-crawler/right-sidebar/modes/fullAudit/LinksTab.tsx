import React from 'react'
import {
  Card, Row, Sparkline, Bar, SourceChip, SectionTitle, Chip,
} from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { FullAuditStats } from '@/services/right-sidebar/fullAudit.types'

const SRC = { tier: 'scrape', name: 'Crawler' } as const
const trim = (u: string, n = 36) => (u.length > n ? `…${u.slice(-(n - 1))}` : u)

export function FullLinksTab({ stats }: RsTabProps<FullAuditStats>) {
  const l = stats.links

  return (
    <div className="flex flex-col gap-3">
      <Card title="Link graph" right={<SourceChip source={SRC} />}>
        <Row label="Avg internal / page" value={l.avgInternalLinks} />
        <Row label="Avg external / page" value={l.avgExternalLinks} />
        <Row label="Orphan pages"        value={l.orphanPages}    tone={l.orphanPages === 0 ? 'good' : 'warn'} />
        <Row label="Redirect chains"     value={l.redirectChains} tone={l.redirectChains === 0 ? 'good' : 'warn'} />
        <Row label="Broken links"        value={l.brokenLinks}    tone={l.brokenLinks === 0 ? 'good' : 'bad'} />
      </Card>

      {l.inlinkDistribution.length > 1 && (
        <Card title="Inlink distribution" right={<SourceChip source={SRC} />}>
          <Sparkline data={l.inlinkDistribution} width={240} height={36} />
          <div className="mt-1 text-[10px] text-[#666]">Top {l.inlinkDistribution.length} pages, sorted by inbound internal links.</div>
        </Card>
      )}

      {l.topHubs.length > 0 && (
        <Card title="Top hub pages" right={<SourceChip source={SRC} />}>
          {l.topHubs.map(h => (
            <Row key={h.url} label={trim(h.url)}
              value={<Chip tone="info">{h.inlinks} in</Chip>} />
          ))}
        </Card>
      )}

      {l.topOrphans.length > 0 && (
        <Card title="Orphan examples" right={<SourceChip source={SRC} />}>
          {l.topOrphans.map(o => (
            <Row key={o.url} label={trim(o.url)}
              value={<Chip tone="warn">depth {o.depth}</Chip>} />
          ))}
        </Card>
      )}

      {l.externalDomains.length > 0 && (
        <Card title="Top external domains" right={<SourceChip source={SRC} />}>
          <Bar data={l.externalDomains.map(d => ({ label: d.domain.slice(0, 14), value: d.count }))} />
        </Card>
      )}
    </div>
  )
}
