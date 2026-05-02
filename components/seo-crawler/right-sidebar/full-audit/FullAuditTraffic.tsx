import React, { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  DistBlock, DistRowsBlock, TrendBlock, TopListBlock, SegmentBlock, HeatmapBlock,
  CompareBlock, DrillFooter, EmptyState, KpiRow, KpiTile, Card, Section,
  compactNum, fmtPct,
} from '../_shared'

function num(v: any) { return Number.isFinite(Number(v)) ? Number(v) : 0 }

export function FullAuditTraffic() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  const heat = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const hours = ['0', '3', '6', '9', '12', '15', '18', '21']
    const cells: Array<{ x: string; y: string; value: number }> = []
    for (const d of days) for (const h of hours) {
      cells.push({ x: h, y: d, value: num(s.traffic.heatmap?.[`${d}::${h}`]) })
    }
    return { cells, xLabels: hours, yLabels: days }
  }, [s])

  const topPages   = useMemo(() => [...pages].sort((a: any, b: any) => num(b.sessions ?? b.ga4Sessions) - num(a.sessions ?? a.ga4Sessions)).slice(0, 6), [pages])
  const topByConv  = useMemo(() => [...pages].sort((a: any, b: any) => num(b.ga4Conversions ?? b.conversions) - num(a.ga4Conversions ?? a.conversions)).slice(0, 6), [pages])
  const highBounceLandings = useMemo(() => (s.traffic.landings ?? []).filter((l: any) => num(l.bounce) > 0.6).slice(0, 6), [s])
  const topExits = useMemo(() => (s.traffic.exits ?? []).slice(0, 6), [s])

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <Section title="Engagement" dense>
          <KpiRow>
            <KpiTile label="Sessions"       value={compactNum(s.traffic.sessions)} />
            <KpiTile label="Users"          value={compactNum(s.traffic.users)} />
            <KpiTile label="Bounce"         value={fmtPct(s.traffic.bounceRate * 100)} />
            <KpiTile label="Avg engagement" value={`${Math.round(s.traffic.engagementTime)}s`} />
          </KpiRow>
        </Section>
      </Card>

      <Card>
        <Section title="Conversion" dense>
          <KpiRow>
            <KpiTile label="Conv rate"      value={fmtPct((s.traffic.cvr ?? 0) * 100)} tone={(s.traffic.cvr ?? 0) > 0.02 ? 'good' : 'neutral'} />
            <KpiTile label="Pages/session"  value={(s.traffic.pagesPerSession ?? 0).toFixed(1)} />
            <KpiTile label="Engaged"        value={fmtPct((s.traffic.engagedRate ?? 0) * 100)} />
            <KpiTile label="Conversions"    value={compactNum(s.traffic.conversions)} />
          </KpiRow>
        </Section>
      </Card>

      {s.hasPrior && (
        <TrendBlock title="Sessions (30 days)" values={s.traffic.sessionsSeries} tone="info" />
      )}

      <DistBlock title="Channel mix" segments={[
        { value: s.traffic.organic,  tone: 'good',    label: 'Organic' },
        { value: s.traffic.direct,   tone: 'info',    label: 'Direct' },
        { value: s.traffic.referral, tone: 'info',    label: 'Referral' },
        { value: s.traffic.social,   tone: 'info',    label: 'Social' },
        { value: s.traffic.paid,     tone: 'warn',    label: 'Paid' },
        { value: s.traffic.email,    tone: 'neutral', label: 'Email' },
      ]} />

      <DistRowsBlock title="Device mix" rows={[
        { label: 'Mobile',  value: s.traffic.mobile,  tone: 'info' },
        { label: 'Desktop', value: s.traffic.desktop, tone: 'info' },
        { label: 'Tablet',  value: s.traffic.tablet,  tone: 'neutral' },
      ]} />

      <DistRowsBlock title="New vs returning" rows={[
        { label: 'New',       value: s.traffic.newVsReturning?.new       ?? 0, tone: 'info' },
        { label: 'Returning', value: s.traffic.newVsReturning?.returning ?? 0, tone: 'good' },
      ]} />

      <HeatmapBlock title="Hour x day" cells={heat.cells} xLabels={heat.xLabels} yLabels={heat.yLabels} />

      <TopListBlock
        title="Top traffic pages"
        items={topPages.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: compactNum(num(p.sessions ?? p.ga4Sessions)),
          onClick: () => drill.toPage(p),
        }))}
      />

      <TopListBlock
        title="Top by conversions"
        items={topByConv.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: compactNum(num(p.ga4Conversions ?? p.conversions)),
          onClick: () => drill.toPage(p),
        }))}
        emptyText="No conversion data"
      />

      <TopListBlock
        title="High-bounce landings"
        items={highBounceLandings.map((l: any) => ({
          id: l.url, primary: l.title || l.url, secondary: l.url,
          tail: `${fmtPct(num(l.bounce) * 100)} · ${compactNum(num(l.sessions))}`,
          onClick: () => drill.toCategory('traffic', `landing:${l.url}`),
        }))}
        emptyText="No high-bounce landings"
      />

      <TopListBlock
        title="Top exit pages"
        items={topExits.map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${compactNum(num(p.exits))} · ${fmtPct(num(p.rate) * 100)}`,
          onClick: () => drill.toCategory('traffic', `exit:${p.url}`),
        }))}
        emptyText="No exit data"
      />

      <SegmentBlock title="By source / medium" headers={['Source', 'Sessions', 'Conv', 'Bounce']} rows={
        s.traffic.sourceMix.slice(0, 6).map((m: any) => ({
          id: m.source, label: m.source,
          values: [compactNum(num(m.sessions)), num(m.conversions), fmtPct(num(m.bounce) * 100)],
        }))
      } />

      <TopListBlock
        title="Top countries"
        items={s.traffic.topByCountry.map((c: any) => ({
          id: c.id, primary: c.id, tail: compactNum(c.value),
        }))}
        emptyText="No country data"
      />

      {s.hasPrior && (
        <CompareBlock title="vs last 30 days" rows={[
          { label: 'Sessions',    a: { v: s.traffic.sessions,            tag: 'now' }, b: { v: s.traffic.sessionsPrev,      tag: 'prev' }, format: compactNum },
          { label: 'Conv rate',   a: { v: (s.traffic.cvr ?? 0) * 100,    tag: 'now' }, b: { v: (s.traffic.cvrPrev ?? 0) * 100, tag: 'prev' }, format: (v) => fmtPct(v) },
          { label: 'Bounce',      a: { v: s.traffic.bounceRate * 100,    tag: 'now' }, b: { v: s.traffic.bounceRatePrev * 100, tag: 'prev' }, format: (v) => fmtPct(v) },
          { label: 'Conversions', a: { v: s.traffic.conversions,         tag: 'now' }, b: { v: s.traffic.conversionsPrev,    tag: 'prev' }, format: compactNum },
        ]} />
      )}

      <DrillFooter chips={[
        { label: 'Organic',     count: compactNum(s.traffic.organic) },
        { label: 'Paid',        count: compactNum(s.traffic.paid) },
        { label: 'Social',      count: compactNum(s.traffic.social) },
        { label: 'Conversions', count: compactNum(s.traffic.conversions) },
      ]} />
    </div>
  )
}
