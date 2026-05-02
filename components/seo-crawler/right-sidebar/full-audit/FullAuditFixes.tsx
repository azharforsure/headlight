import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, KpiRow, KpiTile, TrendBlock, ImpactForecastCard, 
  WhatBlocksScoreCard, RecommendedActionsBlock, OwnerLoadBlock,
  EmptyState, compactNum, scoreToTone, Trendable
} from '../_shared'

export function FullAuditFixes() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()

  if (!pages?.length) return <EmptyState title="No crawl yet" />

  return (
    <div className="flex flex-col gap-3 p-3 pb-8">
      <Card>
        <Section title="Fixes summary">
          <KpiRow>
            <KpiTile label="Open" value={compactNum(s.actions.open)} tone={s.actions.open > 0 ? 'warn' : 'good'} />
            <KpiTile label="Critical" value={s.actions.critical} tone={s.actions.critical > 0 ? 'bad' : 'neutral'} />
            <KpiTile label="High" value={s.actions.high} tone={s.actions.high > 0 ? 'warn' : 'neutral'} />
            <KpiTile label="Avg age" value="4d" />
          </KpiRow>
        </Section>
      </Card>

      <Trendable hasPrior={s.hasPrior}>
        <TrendBlock title="Closed fixes (30d)" values={s.actions.doneSeries} tone="good" />
      </Trendable>

      <ImpactForecastCard
        deltaScore={s.actions.forecast.deltaScore}
        deltaClicks={s.actions.forecast.deltaClicks}
        horizonDays={s.actions.forecast.horizonDays}
        confidence={s.actions.forecast.confidence}
      />

      <WhatBlocksScoreCard deductions={s.deductions.items} totalLost={s.deductions.totalLost} />

      <RecommendedActionsBlock
        title="Recommended actions"
        items={s.recommendations}
        max={15}
      />

      <OwnerLoadBlock rows={s.actions.ownerLoad} />
    </div>
  )
}
