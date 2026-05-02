import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, CwvPassMatrixBlock, StatusMixBlock,
  DistBlock, SchemaCoverageBlock, DepthHistogramBlock, TopListBlock,
  ChecklistBlock, BenchmarkBlock, Trendable,
  EmptyState, compactNum, fmtPct, scoreToTone
} from '../_shared'

export function FullAuditTech() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl yet" />

  return (
    <div className="flex flex-col gap-3 p-3 pb-8">
      <Card>
        <Section title="Technical health">
          <KpiRow>
            <KpiTile label="CWV pass" value={fmtPct(s.tech.cwvPass)} tone={scoreToTone(s.tech.cwvPass)} />
            <KpiTile label="Indexable" value={fmtPct(s.tech.indexable)} tone={scoreToTone(s.tech.indexable)} />
            <KpiTile label="HTTPS" value={fmtPct(s.tech.httpsCoverage)} tone={s.tech.httpsCoverage > 95 ? 'good' : 'warn'} />
            <KpiTile label="Security" value={s.tech.sslInvalid > 0 ? 'FAIL' : 'PASS'} tone={s.tech.sslInvalid > 0 ? 'bad' : 'good'} />
          </KpiRow>
        </Section>
      </Card>

      <CwvPassMatrixBlock
        matrix={s.tech.cwvByDevice}
        onCellClick={(device, metric) => drill.toCategory('performance', `${device}:${metric}`)}
      />

      <StatusMixBlock
        mix={s.status}
        onSegmentClick={(id) => drill.toCategory('codes', id)}
      />

      <div className="grid grid-cols-2 gap-3">
        <DistBlock
          title="HTTP version"
          segments={[
            { label: 'h2', value: s.tech.http2, tone: 'good' },
            { label: 'h3', value: s.tech.http3, tone: 'good' },
            { label: 'h1.1', value: s.tech.http11, tone: 'warn' },
          ]}
        />
        <DistBlock
          title="Render path"
          segments={[
            { label: 'Static', value: s.tech.renderStatic, tone: 'good' },
            { label: 'SSR', value: s.tech.renderSsr, tone: 'info' },
            { label: 'CSR', value: s.tech.renderCsr, tone: 'warn' },
          ]}
        />
      </div>

      <SchemaCoverageBlock
        coveragePct={s.tech.schema.coveragePct}
        errors={s.tech.schema.errors}
        warnings={s.tech.schema.warnings}
        types={s.tech.schema.types}
        onTypeClick={(t) => drill.toCategory('content', `schema:${t}`)}
      />

      <DepthHistogramBlock
        depth={s.tech.depth}
        onBucketClick={(id) => drill.toCategory('technical', id)}
      />

      <TopListBlock
        title="Slowest LCP pages"
        items={s.tech.slowestPages.slice(0, 5).map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${(num(p.lcpMs) / 1000).toFixed(1)}s`,
          onClick: () => drill.toPage(p),
        }))}
      />

      <ChecklistBlock
        title="Infrastructure checklist"
        items={[
          { id: 'hsts', label: 'HSTS enabled', state: s.tech.hstsMissing > 0 ? 'fail' : 'pass' },
          { id: 'csp', label: 'CSP present', state: s.tech.cspMissing > 0 ? 'warn' : 'pass' },
          { id: 'tls', label: 'TLS 1.3+', state: s.tech.sslInvalid > 0 ? 'fail' : 'pass' },
          { id: 'mixed', label: 'No mixed content', state: s.tech.mixedContent > 0 ? 'fail' : 'pass' },
          { id: 'sitemap', label: 'Sitemap found', state: s.tech.sitemap.found ? 'pass' : 'fail' },
        ]}
      />

      <BenchmarkBlock title="CWV pass benchmark" site={s.tech.cwvPass} benchmark={s.bench.cwvPass} unit="%" higherIsBetter />
    </div>
  )
}

function num(v: any) { return Number.isFinite(Number(v)) ? Number(v) : 0 }
