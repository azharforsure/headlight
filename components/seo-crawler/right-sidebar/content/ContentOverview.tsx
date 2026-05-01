import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useContentInsights } from '../_hooks/useContentInsights'
import {
  Card, Section, KpiTile, KpiRow, BarStack, Distribution,
  RingGauge, AlertRow, EmptyState,
  fmtNum, fmtPct, scoreToTone,
} from '../_shared'
import { useDrill } from '../_shared/drill'

export function ContentOverview() {
  const { pages } = useSeoCrawler()
  const s = useContentInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="space-y-3 p-3">
      {/* HERO */}
      <Card>
        <Section title="Content Quality" dense>
          <div className="flex items-center gap-4 py-1">
            <RingGauge value={75} label="Quality" size={80} />
            <div className="flex-1">
              <KpiRow>
                <KpiTile label="HTML" value={fmtNum(s.total)} />
                <KpiTile label="Avg Words" value="940" />
                <KpiTile label="Schema" value={fmtPct(s.schemaCoverage.article)} />
              </KpiRow>
            </div>
          </div>
        </Section>
      </Card>

      {/* WORD COUNT DISTRIBUTION */}
      <Card>
        <Section title="Word Count Distribution" dense>
          <Distribution rows={[
            { label: 'Thin (<300)', value: s.wordsBuckets.thin, tone: 'bad' },
            { label: 'Light (3-800)', value: s.wordsBuckets.light, tone: 'warn' },
            { label: 'Med (800-1.5k)', value: s.wordsBuckets.med, tone: 'good' },
            { label: 'Long (>1.5k)', value: s.wordsBuckets.long + s.wordsBuckets.xlong, tone: 'good' },
          ]} />
        </Section>
      </Card>

      {/* ALERTS */}
      <Card>
        <Section title="Top Alerts" dense>
          {s.wordsBuckets.thin > 0 && (
            <AlertRow alert={{ id: 't', tone: 'bad', title: 'Thin content pages', count: s.wordsBuckets.thin }} 
                      onClick={() => drill.toCategory('content', 'Thin Content')} />
          )}
          {s.dup.exact > 0 && (
            <AlertRow alert={{ id: 'd', tone: 'bad', title: 'Exact duplicates found', count: s.dup.exact }} 
                      onClick={() => drill.toCategory('content', 'Duplicate Content')} />
          )}
        </Section>
      </Card>
    </div>
  )
}
