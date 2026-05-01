// components/seo-crawler/right-sidebar/technical/TechnicalAccessibility.tsx
import React, { useMemo } from 'react'
import { Accessibility } from 'lucide-react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { Card, Section } from '../primitives'
import { MetricRow, EmptyState, fmtNum, scoreToTone } from '../_shared'
import { computeTechSummary } from './selectors'

export function TechnicalAccessibility() {
  const { pages } = useSeoCrawler()
  const s = useMemo(() => computeTechSummary(pages || []), [pages])
  if (!pages?.length) return <EmptyState title="No crawl data yet" icon={<Accessibility size={20} />} />

  return (
    <>
      <Card>
        <Section title="Accessibility violations" dense>
          <MetricRow label="Images missing alt" value={fmtNum(s.a11y.altMissing)} tone={s.a11y.altMissing ? 'warn' : 'good'} />
          <MetricRow label="Forms without labels" value={fmtNum(s.a11y.formsNoLabel)} tone={s.a11y.formsNoLabel ? 'bad' : 'good'} />
          <MetricRow label="Generic link text" value={fmtNum(s.a11y.genericLinks)} tone={s.a11y.genericLinks ? 'warn' : 'good'} />
          <MetricRow label="Invalid ARIA roles" value={fmtNum(s.a11y.invalidAria)} tone={s.a11y.invalidAria ? 'warn' : 'good'} />
          <MetricRow label="Tables without headers" value={fmtNum(s.a11y.tablesNoHeader)} tone={s.a11y.tablesNoHeader ? 'warn' : 'good'} />
          <MetricRow label="Skip-link missing" value={fmtNum(s.a11y.skipLinkMissing)} tone={s.a11y.skipLinkMissing ? 'warn' : 'good'} />
          <MetricRow label="Main landmark missing" value={fmtNum(s.a11y.mainLandmarkMissing)} tone={s.a11y.mainLandmarkMissing ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Mobile readiness" dense>
          <MetricRow label="Small tap targets" value={fmtNum(s.a11y.smallTap)} tone={s.a11y.smallTap ? 'warn' : 'good'} />
          <MetricRow label="Small fonts" value={fmtNum(s.a11y.smallFonts)} tone={s.a11y.smallFonts ? 'warn' : 'good'} />
          <MetricRow label="Pinch-zoom disabled" value={fmtNum(s.a11y.zoomDisabled)} tone={s.a11y.zoomDisabled ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Accessibility score" dense>
          <MetricRow label="Score" value={Math.round(s.scores.a11y || 0)} tone={scoreToTone(s.scores.a11y)} />
          <div className="text-[10px] text-[#666] px-2">Penalty-based score across alt text, labels, ARIA, landmarks and tap targets.</div>
        </Section>
      </Card>
    </>
  )
}
