import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import {
  Card, Section, KpiTile, KpiRow, Distribution,
  TopList, EmptyState,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function ContentSchema() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      <Card>
        <Section title="Schema KPIs" dense>
          <KpiRow>
            <KpiTile label="Any Schema" value="95%" tone="good" />
            <KpiTile label="Valid"      value="92%" tone="good" />
            <KpiTile label="Errors"     value="8%"  tone="bad" />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Type Coverage" dense>
          <Distribution rows={[
            { label: 'Article',    value: Math.round(s.total * s.schemaCoverage.article / 100), tone: 'info' },
            { label: 'Product',    value: Math.round(s.total * s.schemaCoverage.product / 100), tone: 'info' },
            { label: 'FAQ',        value: Math.round(s.total * s.schemaCoverage.faq / 100),     tone: 'info' },
            { label: 'HowTo',      value: Math.round(s.total * s.schemaCoverage.howto / 100),   tone: 'info' },
            { label: 'Breadcrumb', value: Math.round(s.total * s.schemaCoverage.breadcrumb / 100), tone: 'info' },
          ]} />
        </Section>
      </Card>

      <Card>
        <Section title="Pages with Errors" dense>
          <TopList items={pages
            .filter(p => Number(p.schemaErrors) > 0)
            .slice(0, 5)
            .map(p => ({
              id: p.url,
              primary: p.title || p.url,
              tail: `${p.schemaErrors} err`,
              onClick: () => drill.toPage(p)
            }))} />
        </Section>
      </Card>
    </div>
  )
}
