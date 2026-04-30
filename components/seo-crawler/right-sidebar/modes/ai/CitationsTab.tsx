import React from 'react'
import { Card, Row, SourceChip, FreshnessChip } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { AiStats } from '@/services/right-sidebar/ai'

export function AiCitationsTab({ stats }: RsTabProps<AiStats>) {
  const c = stats.citations
  if (c.source === 'none') return <RsPartial title="Connect a citations source" reason="Perplexity, Bing, or SGE required." />
  const SRC = { tier: 'free-api', name: c.source } as const
  return (
    <div className="flex flex-col gap-3">
      <Card title="Citations" right={<><SourceChip source={SRC} /><FreshnessChip at={c.fetchedAt} /></>}>
        <Row label="Total" value={c.citationsCount?.toLocaleString() ?? '—'} />
      </Card>
      {c.topCitedPages.length > 0 && (
        <Card title="Top cited pages">
          {c.topCitedPages.slice(0, 8).map(p => <Row key={p.url} label={new URL(p.url).pathname} value={p.count} />)}
        </Card>
      )}
    </div>
  )
}
