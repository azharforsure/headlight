// components/seo-crawler/right-sidebar/technical/TechnicalPerformance.tsx
import React, { useMemo } from 'react'
import { Zap } from 'lucide-react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { Card, Section } from '../primitives'
import {
  BarStack, MetricRow, EmptyState,
  fmtNum, fmtMs, safePct, lcpTone, inpTone, clsTone, ttfbTone, scoreToTone,
} from '../_shared'
import { computeTechSummary } from './selectors'

export function TechnicalPerformance() {
  const { pages } = useSeoCrawler()
  const s = useMemo(() => computeTechSummary(pages || []), [pages])
  if (!pages?.length) return <EmptyState title="No crawl data yet" icon={<Zap size={20} />} />

  const lcpSample = s.cwv.lcpGood + s.cwv.lcpWarn + s.cwv.lcpBad
  const inpSample = s.cwv.inpGood + s.cwv.inpWarn + s.cwv.inpBad
  const clsSample = s.cwv.clsGood + s.cwv.clsWarn + s.cwv.clsBad
  const ttfbSample = s.cwv.ttfbGood + s.cwv.ttfbWarn + s.cwv.ttfbBad

  return (
    <>
      <Card>
        <Section title="Core Web Vitals" dense>
          <div className="space-y-2">
            <div>
              <BarStack segments={[
                { value: s.cwv.lcpGood, tone: 'good' },
                { value: s.cwv.lcpWarn, tone: 'warn' },
                { value: s.cwv.lcpBad,  tone: 'bad' },
              ]}/>
              <MetricRow label={`LCP avg`} value={fmtMs(s.cwvAvg.lcp)} tone={lcpTone(s.cwvAvg.lcp)} />
              <div className="text-[10px] text-[#666] px-2">{`Good ${fmtNum(s.cwv.lcpGood)} · Needs ${fmtNum(s.cwv.lcpWarn)} · Poor ${fmtNum(s.cwv.lcpBad)} of ${fmtNum(lcpSample)}`}</div>
            </div>

            <div>
              <BarStack segments={[
                { value: s.cwv.inpGood, tone: 'good' },
                { value: s.cwv.inpWarn, tone: 'warn' },
                { value: s.cwv.inpBad,  tone: 'bad' },
              ]}/>
              <MetricRow label="INP avg" value={fmtMs(s.cwvAvg.inp)} tone={inpTone(s.cwvAvg.inp)} />
              <div className="text-[10px] text-[#666] px-2">{`Good ${fmtNum(s.cwv.inpGood)} · Needs ${fmtNum(s.cwv.inpWarn)} · Poor ${fmtNum(s.cwv.inpBad)} of ${fmtNum(inpSample)}`}</div>
            </div>

            <div>
              <BarStack segments={[
                { value: s.cwv.clsGood, tone: 'good' },
                { value: s.cwv.clsWarn, tone: 'warn' },
                { value: s.cwv.clsBad,  tone: 'bad' },
              ]}/>
              <MetricRow label="CLS avg" value={Number.isFinite(s.cwvAvg.cls) ? s.cwvAvg.cls.toFixed(3) : '—'} tone={clsTone(s.cwvAvg.cls)} />
              <div className="text-[10px] text-[#666] px-2">{`Good ${fmtNum(s.cwv.clsGood)} · Needs ${fmtNum(s.cwv.clsWarn)} · Poor ${fmtNum(s.cwv.clsBad)} of ${fmtNum(clsSample)}`}</div>
            </div>

            <div>
              <BarStack segments={[
                { value: s.cwv.ttfbGood, tone: 'good' },
                { value: s.cwv.ttfbWarn, tone: 'warn' },
                { value: s.cwv.ttfbBad,  tone: 'bad' },
              ]}/>
              <MetricRow label="TTFB avg" value={fmtMs(s.cwvAvg.ttfb)} tone={ttfbTone(s.cwvAvg.ttfb)} />
              <div className="text-[10px] text-[#666] px-2">{`Good ${fmtNum(s.cwv.ttfbGood)} · Needs ${fmtNum(s.cwv.ttfbWarn)} · Poor ${fmtNum(s.cwv.ttfbBad)} of ${fmtNum(ttfbSample)}`}</div>
            </div>
          </div>
        </Section>
      </Card>

      <Card>
        <Section title="Bottlenecks" dense>
          <MetricRow label="Render-blocking CSS pages" value={fmtNum(s.blocking.blockingCss)} tone={s.blocking.blockingCss ? 'warn' : 'good'} />
          <MetricRow label="Render-blocking JS pages" value={fmtNum(s.blocking.blockingJs)} tone={s.blocking.blockingJs ? 'warn' : 'good'} />
          <MetricRow label="Big DOM (>1500)" value={fmtNum(s.blocking.bigDom)} tone={s.blocking.bigDom ? 'warn' : 'good'} />
          <MetricRow label="Huge DOM (>3000)" value={fmtNum(s.blocking.hugeDom)} tone={s.blocking.hugeDom ? 'bad' : 'good'} />
          <MetricRow label="Many 3rd-party scripts" value={fmtNum(s.blocking.manyThirdParty)} tone={s.blocking.manyThirdParty ? 'warn' : 'good'} />
        </Section>
      </Card>

      <Card>
        <Section title="Performance score" dense>
          <MetricRow label="Score" value={Math.round(s.scores.perf || 0)} tone={scoreToTone(s.scores.perf)} />
          <div className="text-[10px] text-[#666] px-2">Average of LCP, INP, CLS and TTFB pass rates.</div>
        </Section>
      </Card>
    </>
  )
}
