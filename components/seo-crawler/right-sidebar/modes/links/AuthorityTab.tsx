import React from 'react'
import { Card, Row, SourceChip, FreshnessChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial as Partial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { LinksAuthorityStats } from '@/services/right-sidebar/linksAuthority'

export function LinksAuthorityTab({ stats }: RsTabProps<LinksAuthorityStats>) {
  const a = stats.authority
  if (a.source === 'none') {
    return <Partial title="Connect a backlinks source" reason="Backlinks, referring domains, and DR require Ahrefs, Majestic, or Moz." cta={{ label: 'Open Sources', onClick: () => {} }} />
  }
  const tier = a.source === 'gsc' ? 'authoritative' : 'free-api'
  return (
    <Card title={`Authority · ${a.source}`} right={<><SourceChip source={ { tier, name: a.source } } /><FreshnessChip at={a.fetchedAt} /></>}>
      <Row label="Backlinks"        value={a.backlinks?.toLocaleString() ?? '—'} />
      <Row label="Referring domains" value={a.referringDomains?.toLocaleString() ?? '—'} />
      <Row label="Domain Rating"     value={a.domainRating ?? '—'} />
    </Card>
  )
}
