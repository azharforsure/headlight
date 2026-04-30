import React from 'react'
import { Card, Row, SourceChip, ago } from '@/components/seo-crawler/right-sidebar/shared'
import { RsPartial as Partial } from '@/components/seo-crawler/right-sidebar/shared'
import type { RsTabProps } from '@/services/right-sidebar/types'
import type { ContentStats } from '@/services/right-sidebar/content'

const SRC = { tier: 'scrape', name: 'Crawler (author meta)' } as const

export function ContentAuthorsTab({ stats }: RsTabProps<ContentStats>) {
  if (stats.authors.length === 0) {
    return <Partial title="No author metadata detected" reason="Pages don't expose `author` schema or byline. Add author schema to enable E-E-A-T scoring." />
  }
  return (
    <Card title="Top authors" right={<SourceChip source={SRC} />}>
      {stats.authors.map(a => (
        <Row key={a.author}
          label={a.author}
          hint={a.lastPublishedAt ? `last: ${ago(a.lastPublishedAt)}` : undefined}
          value={a.count} />
      ))}
    </Card>
  )
}
