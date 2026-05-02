import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import {
  Card, Section, KpiRow, KpiTile, TrendBlock, ChannelMixBlock,
  HeatmapBlock, NotConnected, Trendable,
  EmptyState, compactNum, fmtPct
} from '../_shared'

export function FullAuditTraffic() {
  const { pages, openSettings } = useSeoCrawler() as any
  const s = useFullAuditInsights()

  if (!pages?.length) return <EmptyState title="No crawl yet" />

  if (!s.connectors.ga4.connected) {
    return (
      <div className="p-3">
        <NotConnected
          source="Google Analytics 4"
          reason="Connect to see sessions, conversions, and user behavior."
          onConnect={() => openSettings?.('connectors', 'ga4')}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3 pb-8">
      <Card>
        <Section title="GA4 traffic summary">
          <KpiRow>
            <KpiTile label="Sessions" value={compactNum(s.traffic.sessions)} />
            <KpiTile label="Users" value={compactNum(s.traffic.users)} />
            <KpiTile label="Conversions" value={compactNum(s.traffic.conversions)} tone="good" />
            <KpiTile label="CVR" value={fmtPct(s.traffic.cvr * 100, 1)} />
          </KpiRow>
        </Section>
      </Card>

      <Trendable hasPrior={s.hasPrior}>
        <TrendBlock title="Sessions trend" values={s.traffic.sessionsSeries} tone="info" />
      </Trendable>

      <ChannelMixBlock channels={s.traffic.channels} />

      <Card>
        <Section title="User engagement">
          <KpiRow>
            <KpiTile label="Eng. rate" value={fmtPct(s.traffic.engagedRate * 100, 0)} tone={s.traffic.engagedRate > 0.6 ? 'good' : 'warn'} />
            <KpiTile label="Time / sess" value={`${s.traffic.engagementTime}s`} />
            <KpiTile label="Pages / sess" value={s.traffic.pagesPerSession.toFixed(1)} />
          </KpiRow>
        </Section>
      </Card>

      <HeatmapBlock
        title="Session activity by hour"
        data={s.traffic.heatmap}
        xLabels={['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm']}
        yLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
      />
    </div>
  )
}
