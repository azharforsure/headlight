import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  DistBlock, DistRowsBlock, TrendBlock, BenchmarkBlock, CompareBlock, ChecklistBlock,
  TopListBlock, SegmentBlock, DrillFooter, EmptyState, RankBucketsBlock,
  KpiRow, KpiTile, Card, Section,
  compactNum, fmtPct, fmtMs, scoreToTone,
} from '../_shared'

function num(v: any) { return Number.isFinite(Number(v)) ? Number(v) : 0 }

export function FullAuditTech() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const cwvByDevice = s.tech.cwvByDevice ?? { mobile: { lcpPass: 0, inpPass: 0, clsPass: 0 }, desktop: { lcpPass: 0, inpPass: 0, clsPass: 0 } }
  const schemaRows = (s.tech.schemaCoverage ?? []).slice(0, 8).map((r: any) => ({
    id: r.type, label: r.type, values: [num(r.pages), `${num(r.coverage).toFixed(0)}%`],
  }))
  const imageOpt = s.tech.imageOpt ?? { webp: 0, lazy: 0, dimsMissing: 0, oversize: 0 }

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <Section title="Tech health" dense>
          <KpiRow>
            <KpiTile label="CWV pass"      value={fmtPct(s.tech.cwvPass)}       tone={scoreToTone(s.tech.cwvPass)} />
            <KpiTile label="Indexable"     value={fmtPct(s.tech.indexable)}     tone={scoreToTone(s.tech.indexable)} />
            <KpiTile label="HTTPS"         value={fmtPct(s.tech.httpsCoverage)} tone={scoreToTone(s.tech.httpsCoverage)} />
            <KpiTile label="Mobile-ready"  value={fmtPct(s.tech.mobile)}        tone={scoreToTone(s.tech.mobile)} />
          </KpiRow>
        </Section>
      </Card>

      <DistBlock title="Status mix" segments={[
        { value: s.status.ok,       tone: 'good',    label: '2xx' },
        { value: s.status.redirect, tone: 'info',    label: '3xx' },
        { value: s.status.client,   tone: 'warn',    label: '4xx' },
        { value: s.status.server,   tone: 'bad',     label: '5xx' },
        { value: s.status.blocked,  tone: 'neutral', label: 'Blocked' },
      ]} />

      <DistRowsBlock title="CWV failures" rows={[
        { label: 'LCP > 2.5s',  value: s.perf.lcpFail,  tone: 'bad'  },
        { label: 'INP > 200ms', value: s.perf.inpFail,  tone: 'warn' },
        { label: 'CLS > 0.1',   value: s.perf.clsFail,  tone: 'warn' },
        { label: 'TTFB > 600ms',value: s.perf.ttfbFail, tone: 'info' },
      ]} />

      <Card>
        <Section title="Performance percentiles" dense>
          <KpiRow>
            <KpiTile label="LCP p50"  value={`${s.tech.lcpP50.toFixed(1)}s`} />
            <KpiTile label="LCP p90"  value={`${s.tech.lcpP90.toFixed(1)}s`} />
            <KpiTile label="INP p50"  value={fmtMs(s.tech.inpP50)} />
            <KpiTile label="TTFB p50" value={fmtMs(s.tech.ttfbP50)} />
          </KpiRow>
        </Section>
      </Card>

      <DistRowsBlock title="CWV pass by device" rows={[
        { label: 'Mobile LCP',   value: cwvByDevice.mobile.lcpPass,  tone: scoreToTone(cwvByDevice.mobile.lcpPass) },
        { label: 'Mobile INP',   value: cwvByDevice.mobile.inpPass,  tone: scoreToTone(cwvByDevice.mobile.inpPass) },
        { label: 'Mobile CLS',   value: cwvByDevice.mobile.clsPass,  tone: scoreToTone(cwvByDevice.mobile.clsPass) },
        { label: 'Desktop LCP',  value: cwvByDevice.desktop.lcpPass, tone: scoreToTone(cwvByDevice.desktop.lcpPass) },
        { label: 'Desktop INP',  value: cwvByDevice.desktop.inpPass, tone: scoreToTone(cwvByDevice.desktop.inpPass) },
        { label: 'Desktop CLS',  value: cwvByDevice.desktop.clsPass, tone: scoreToTone(cwvByDevice.desktop.clsPass) },
      ]} />

      <RankBucketsBlock title="Render mix" buckets={[
        { label: 'Static', value: s.tech.renderStatic, tone: 'good' },
        { label: 'SSR',    value: s.tech.renderSsr,    tone: 'info' },
        { label: 'CSR',    value: s.tech.renderCsr,    tone: 'warn' },
      ]} />

      <RankBucketsBlock title="HTTP version" buckets={[
        { label: 'HTTP/2',   value: s.tech.http2,  tone: 'good' },
        { label: 'HTTP/3',   value: s.tech.http3,  tone: 'good' },
        { label: 'HTTP/1.1', value: s.tech.http11, tone: 'warn' },
      ]} />

      <ChecklistBlock title="Security and crawl health" cols={2} items={[
        { id: 'hsts',     label: 'HSTS',                       state: s.tech.hstsMissing > 0 ? 'fail' : 'pass' },
        { id: 'csp',      label: 'CSP',                        state: s.tech.cspMissing > 0 ? 'warn' : 'pass' },
        { id: 'tls',      label: 'TLS valid',                  state: s.tech.sslInvalid > 0 ? 'fail' : 'pass' },
        { id: 'mc',       label: 'No mixed content',           state: s.tech.mixedContent > 0 ? 'fail' : 'pass' },
        { id: 'rdr',      label: 'No deep redirect chains',    state: s.tech.redirectChains > 0 ? 'warn' : 'pass' },
        { id: 'idx',      label: 'All HTML indexable',         state: s.tech.noindex === 0 ? 'pass' : 'warn' },
        { id: 'sm',       label: 'Sitemap present',            state: s.tech.sitemap?.found ? 'pass' : 'fail' },
        { id: 'hl',       label: 'No hreflang issues',         state: (s.tech.hreflangIssues ?? 0) > 0 ? 'warn' : 'pass' },
      ]} />

      <SegmentBlock title="Schema coverage" headers={['Type', 'Pages', 'Coverage']} rows={schemaRows} />

      <ChecklistBlock title="Accessibility" cols={2} items={[
        { id: 'a11y-issues', label: `${compactNum(s.tech.a11y?.issues ?? 0)} violations`, state: (s.tech.a11y?.issues ?? 0) === 0 ? 'pass' : 'warn' },
        { id: 'a11y-pages',  label: `${compactNum(s.tech.a11y?.pages ?? 0)} pages affected`, state: (s.tech.a11y?.pages ?? 0) === 0 ? 'pass' : 'warn' },
        { id: 'a11y-rule',   label: s.tech.a11y?.topRule ? `Top: ${s.tech.a11y.topRule}` : 'No top rule', state: 'skip' },
        { id: 'a11y-skip',   label: 'Skip link present', state: 'skip' },
      ]} />

      <DistRowsBlock title="Images" rows={[
        { label: 'WebP',           value: imageOpt.webp,        tone: scoreToTone(imageOpt.webp) },
        { label: 'Lazy-loaded',    value: imageOpt.lazy,        tone: scoreToTone(imageOpt.lazy) },
        { label: 'Missing dims',   value: imageOpt.dimsMissing, tone: imageOpt.dimsMissing > 0 ? 'warn' : 'good' },
        { label: 'Oversize',       value: imageOpt.oversize,    tone: imageOpt.oversize > 0 ? 'warn' : 'good' },
      ]} />

      <TopListBlock
        title="Largest pages"
        items={(s.tech.largestPages ?? []).slice(0, 6).map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${(num(p.bytes) / 1024).toFixed(0)} KB`,
          onClick: () => drill.toPage(p),
        }))}
        emptyText="No large pages flagged"
      />

      <TopListBlock
        title="Slowest pages by LCP"
        items={(s.tech.slowestPages ?? []).slice(0, 6).map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${(num(p.lcpMs) / 1000).toFixed(1)}s`,
          onClick: () => drill.toPage(p),
        }))}
        emptyText="No slow LCP pages"
      />

      {s.hasPrior && (
        <TrendBlock title="CWV pass (12 weeks)" values={s.history.scoreSeries} tone="info" />
      )}

      <BenchmarkBlock title="CWV pass vs industry" site={s.tech.cwvPass} benchmark={s.bench.cwvPass} unit="%" higherIsBetter />

      {s.hasPrior && (
        <CompareBlock title="This crawl vs last" rows={[
          { label: 'CWV pass',  a: { v: s.tech.cwvPass,    tag: 'now' }, b: { v: s.tech.cwvPassPrev,    tag: 'prev' }, format: fmtPct },
          { label: 'Indexable', a: { v: s.tech.indexable,  tag: 'now' }, b: { v: s.tech.indexablePrev,  tag: 'prev' }, format: fmtPct },
        ]} />
      )}

      <DrillFooter chips={[
        { label: '4xx',           count: s.status.client,       onClick: () => drill.toCategory('codes', '404 Not Found') },
        { label: '5xx',           count: s.status.server,       onClick: () => drill.toCategory('codes', '500 Server Error') },
        { label: 'Slow LCP',      count: s.perf.lcpFail,        onClick: () => drill.toCategory('performance', 'Poor LCP') },
        { label: 'Mixed content', count: s.tech.mixedContent,   onClick: () => drill.toCategory('security', 'Mixed Content') },
      ]} />
    </div>
  )
}
