import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  Card, Section, KpiRow, KpiTile, BotMatrixBlock, DistRowsBlock,
  TrendBlock, TopListBlock, Trendable,
  EmptyState, compactNum, fmtPct
} from '../_shared'

export function FullAuditAi() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl yet" />

  return (
    <div className="flex flex-col gap-3 p-3 pb-8">
      <Card>
        <Section title="AI readiness">
          <KpiRow>
            <KpiTile label="Readiness" value={`${s.ai.readiness}%`} tone={s.ai.readiness > 70 ? 'good' : 'warn'} />
            <KpiTile label="Schema cov" value={fmtPct(s.ai.schemaCoverage)} />
            <KpiTile label="Extractable" value={`${s.ai.extractability}%`} />
            <KpiTile label="llms.txt" value={s.connectors.llmsTxt.connected ? 'FOUND' : 'MISSING'} tone={s.connectors.llmsTxt.connected ? 'good' : 'warn'} />
          </KpiRow>
        </Section>
      </Card>

      <BotMatrixBlock
        bots={s.ai.bots}
        onBotClick={(id) => drill.toCategory('ai', `bot:${id}`)}
      />

      <Trendable hasPrior={s.hasPrior}>
        <TrendBlock title="AI citations trend" values={s.ai.citationsSeries} tone="info" hint="Monthly visibility" />
      </Trendable>

      <DistRowsBlock
        title="Entity coverage by type"
        rows={s.ai.entitySegments.map(e => ({
          label: e.label,
          value: e.schema,
          tone: e.schema > 80 ? 'good' : 'info',
          hint: `${e.pages} pages`,
        }))}
      />

      <TopListBlock
        title="Most cited pages in AI"
        items={s.ai.citedPages.slice(0, 5).map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${num(p.aiCitations)} cites`,
          onClick: () => drill.toPage(p),
        }))}
      />

      <Card>
        <Section title="Top entity mentions">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(s.ai.entities).map(([type, count]) => (
              <div key={type} className="px-2 py-1 rounded bg-[#141414] border border-[#222] text-[10px] uppercase tracking-wider text-[#888]">
                {type} <span className="text-white font-mono ml-1">{num(count)}</span>
              </div>
            ))}
          </div>
        </Section>
      </Card>
    </div>
  )
}

function num(v: any) { return Number.isFinite(Number(v)) ? Number(v) : 0 }
