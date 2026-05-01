// components/seo-crawler/right-sidebar/technical/TechnicalRender.tsx
import React, { useMemo } from 'react'
import { Code2 } from 'lucide-react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { Card, Section } from '../primitives'
import { BarStack, MetricRow, EmptyState, fmtNum, safePct, scoreToTone } from '../_shared'
import { computeTechSummary } from './selectors'

export function TechnicalRender() {
  const { pages } = useSeoCrawler()
  const s = useMemo(() => computeTechSummary(pages || []), [pages])
  if (!pages?.length) return <EmptyState title="No crawl data yet" icon={<Code2 size={20} />} />

  return (
    <>
      <Card>
        <Section title="Render mode mix" dense>
          <BarStack segments={[
            { value: s.render.static, tone: 'good', label: 'Static' },
            { value: s.render.ssr, tone: 'good', label: 'SSR' },
            { value: s.render.hybrid, tone: 'info', label: 'Hybrid' },
            { value: s.render.csr, tone: 'bad', label: 'CSR' },
            { value: s.render.unknown, tone: 'neutral', label: 'Unknown' },
          ]}/>
          <div className="grid grid-cols-2 gap-x-3 mt-2">
            <MetricRow label="Static" value={fmtNum(s.render.static)} tone="good" />
            <MetricRow label="SSR" value={fmtNum(s.render.ssr)} tone="good" />
            <MetricRow label="Hybrid" value={fmtNum(s.render.hybrid)} tone="info" />
            <MetricRow label="CSR" value={fmtNum(s.render.csr)} tone={s.render.csr ? 'bad' : 'good'} />
          </div>
        </Section>
      </Card>

      <Card>
        <Section title="Asset budgets" dense>
          <MetricRow label="DOM > 1.5k nodes" value={fmtNum(s.blocking.bigDom)} tone={s.blocking.bigDom ? 'warn' : 'good'} />
          <MetricRow label="DOM > 3k nodes" value={fmtNum(s.blocking.hugeDom)} tone={s.blocking.hugeDom ? 'bad' : 'good'} />
          <MetricRow label="Render-blocking CSS > 3" value={fmtNum(s.blocking.blockingCss)} tone={s.blocking.blockingCss ? 'warn' : 'good'} />
          <MetricRow label="Render-blocking JS > 2" value={fmtNum(s.blocking.blockingJs)} tone={s.blocking.blockingJs ? 'warn' : 'good'} />
          <MetricRow label="Many 3rd-party scripts" value={fmtNum(s.blocking.manyThirdParty)} tone={s.blocking.manyThirdParty ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Render score" dense>
          <MetricRow label="Score" value={Math.round(s.scores.render || 0)} tone={scoreToTone(s.scores.render)} />
          <div className="text-[10px] text-[#666] px-2">
            Penalises CSR-only pages and unidentified render mode.
          </div>
        </Section>
      </Card>
    </>
  )
}
