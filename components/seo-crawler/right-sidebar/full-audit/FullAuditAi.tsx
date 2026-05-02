import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  DistRowsBlock, TopListBlock, SegmentBlock, TrendBlock,
  ChecklistBlock, DrillFooter, EmptyState, KpiRow, KpiTile,
  Card, Section, compactNum, fmtPct, scoreToTone,
} from '../_shared'

function num(v: any) { return Number.isFinite(Number(v)) ? Number(v) : 0 }

export function FullAuditAi() {
  const { pages } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" />

  const botList = [
    { id: 'gptbot',       label: 'GPTBot' },
    { id: 'oai-search',   label: 'OAI-SearchBot' },
    { id: 'chatgpt-user', label: 'ChatGPT-User' },
    { id: 'claude',       label: 'ClaudeBot' },
    { id: 'gemini',       label: 'Google-Extended' },
    { id: 'perplexity',   label: 'PerplexityBot' },
    { id: 'bingbot',      label: 'Bingbot' },
    { id: 'applebot',     label: 'Applebot-Extended' },
    { id: 'ccbot',        label: 'CCBot' },
  ]

  const engineRows = [
    { id: 'gpt5',       label: 'GPT-5',      value: num(s.ai.citationByEngine.gpt5),       tone: 'info' as const },
    { id: 'sonnet',     label: 'Sonnet',     value: num(s.ai.citationByEngine.sonnet),     tone: 'info' as const },
    { id: 'gemini',     label: 'Gemini',     value: num(s.ai.citationByEngine.gemini),     tone: 'info' as const },
    { id: 'perplexity', label: 'Perplexity', value: num(s.ai.citationByEngine.perplexity), tone: 'info' as const },
    { id: 'bing',       label: 'Bing AI',    value: num(s.ai.citationByEngine.bing),       tone: 'info' as const },
  ]

  return (
    <div className="flex flex-col gap-3 p-3">
      <Card>
        <Section title="AI readiness" dense>
          <KpiRow>
            <KpiTile label="Readiness"       value={s.ai.readiness ? `${Math.round(s.ai.readiness)}` : '—'} tone={scoreToTone(s.ai.readiness)} />
            <KpiTile label="Extractable"     value={fmtPct(s.ai.extractability)} tone={scoreToTone(s.ai.extractability)} />
            <KpiTile label="Schema coverage" value={fmtPct(s.ai.schemaCoverage)} tone={scoreToTone(s.ai.schemaCoverage)} />
            <KpiTile label="Cited pages"     value={compactNum(s.ai.citedPages.length)} />
          </KpiRow>
        </Section>
      </Card>

      <ChecklistBlock title="AI access files" cols={2} items={[
        { id: 'llms',     label: 'llms.txt',                state: s.ai.llmsTxt     ? 'pass' : 'warn' },
        { id: 'llmsfull', label: 'llms-full.txt',           state: s.ai.llmsFullTxt ? 'pass' : 'skip' },
        { id: 'aitxt',    label: 'ai.txt',                  state: s.ai.aiTxt       ? 'pass' : 'skip' },
        { id: 'robots',   label: 'robots.txt published',    state: 'pass' },
      ]} />

      <ChecklistBlock title="Bot access" cols={2} items={botList.map((b) => ({
        id: b.id,
        label: b.label,
        state: s.ai.bots?.[b.id] === false ? 'fail' : s.ai.bots?.[b.id] === true ? 'pass' : 'skip',
      }))} />

      <DistRowsBlock title="Citations per engine" rows={engineRows} />

      {s.hasPrior && (
        <TrendBlock title="Citations (12 weeks)" values={s.ai.citationsSeries ?? []} tone="good" />
      )}

      <TopListBlock
        title="Most cited pages"
        items={s.ai.citedPages.slice(0, 8).map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: `${compactNum(num(p.aiCitations))} cites`,
          onClick: () => drill.toPage(p),
        }))}
        emptyText="No citations tracked yet"
      />

      <DistRowsBlock title="Entity coverage" rows={[
        { label: 'Person',       value: s.ai.entities.person,  tone: 'info' },
        { label: 'Organization', value: s.ai.entities.org,     tone: 'info' },
        { label: 'Place',        value: s.ai.entities.place,   tone: 'info' },
        { label: 'Product',      value: s.ai.entities.product, tone: 'info' },
      ]} />

      <SegmentBlock title="By entity" headers={['Entity', 'Pages', 'Schema', 'Cites']} rows={
        s.ai.entitySegments.slice(0, 6).map((e: any) => ({
          id: e.id, label: e.label, values: [num(e.pages), num(e.schema), num(e.citations)],
        }))
      } />

      <SegmentBlock title="Rich-result eligibility" headers={['Type', 'Eligible', 'Pages']} rows={
        (s.ai.richResultElig ?? []).slice(0, 6).map((r: any) => ({
          id: r.type, label: r.type, values: [num(r.eligible), num(r.pages)],
        }))
      } />

      <Card>
        <Section title="Answer-box fitness" dense>
          <KpiRow>
            <KpiTile label="Score" value={fmtPct(num(s.ai.answerBoxFit))} tone={scoreToTone(num(s.ai.answerBoxFit))} />
            <KpiTile label="Pages with Q&A" value={compactNum((s.ai.entitySegments ?? []).reduce((a: number, e: any) => a + (e.qa ?? 0), 0))} />
          </KpiRow>
        </Section>
      </Card>

      <TopListBlock
        title="Cited by competitor, not us"
        items={(s.ai.competitorOnlyCites ?? []).slice(0, 6).map((p: any) => ({
          id: p.url, primary: p.title || p.url, secondary: p.url,
          tail: (p.competitorEngines ?? []).join(' · '),
          onClick: () => drill.toPage(p),
        }))}
        emptyText="No competitor-only citations"
      />

      <TopListBlock
        title="Missed prompts"
        items={s.ai.missedPrompts.slice(0, 6).map((m: any) => ({
          id: m.id || m.prompt, primary: m.prompt || m.label, tail: m.engine || '',
        }))}
        emptyText="No prompt harness data"
      />

      <DrillFooter chips={[
        { label: 'Cited pages', count: s.ai.citedPages.length },
        { label: 'No schema',   count: s.html - Math.round((s.ai.schemaCoverage / 100) * s.html) },
        { label: 'Missed',      count: s.ai.missedPrompts.length },
      ]} />
    </div>
  )
}
