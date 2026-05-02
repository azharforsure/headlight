import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  CrawlHeaderCard, HeroStrip, PillarCard, AlertsBlock, RecommendedActionsBlock,
  ConnectorStatusBlock, CompareBlock, DrillFooter, EmptyState,
  compactNum, fmtPct, scoreToTone,
} from '../_shared'

export function FullAuditOverview() {
  const { pages, setRsTab, openSettings } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl data yet" hint="Start a crawl to see this tab." />

  const alerts = [
    s.issues.errors > 0
      ? { id: 'err', label: `${compactNum(s.issues.errors)} pages with 4xx or 5xx`, tone: 'bad' as const, onClick: () => drill.toCategory('codes', '404 Not Found') }
      : null,
    s.issues.notIndexable > 0
      ? { id: 'idx', label: `${compactNum(s.issues.notIndexable)} pages not indexable`, tone: 'warn' as const, onClick: () => drill.toCategory('indexability', 'Non-Indexable') }
      : null,
    s.tech.cwvPass < 70
      ? { id: 'cwv', label: `Only ${fmtPct(s.tech.cwvPass)} of pages pass Core Web Vitals`, tone: 'warn' as const, onClick: () => drill.toCategory('performance', 'Poor LCP') }
      : null,
    s.links.broken > 0
      ? { id: 'bln', label: `${compactNum(s.links.broken)} broken internal links`, tone: 'warn' as const, onClick: () => drill.toCategory('links', 'Broken Internal') }
      : null,
    !s.connectors.gsc.connected
      ? { id: 'gsc', label: 'Search Console not connected — search insights are limited', tone: 'info' as const, onClick: () => openSettings?.('connectors') }
      : null,
  ].filter(Boolean) as any[]

  return (
    <div className="flex flex-col gap-3 p-3">
      <CrawlHeaderCard
        scope={s.scope}
        industry={s.fingerprint.industry}
        cms={s.fingerprint.cms}
        language={s.fingerprint.language}
        country={s.fingerprint.country}
        lastCrawlAt={s.crawl.lastAt}
        durationMs={s.crawl.durationMs}
        pagesCrawled={s.total}
      />

      <HeroStrip
        title="Site snapshot"
        ring="gauge"
        score={s.score}
        scoreLabel="Site score"
        scoreDelta={s.hasPrior ? s.score - s.scorePrev : undefined}
        kpis={[
          { label: 'Pages',      value: compactNum(s.total) },
          { label: 'Indexable',  value: fmtPct(s.tech.indexable),  tone: scoreToTone(s.tech.indexable) },
          { label: 'CWV pass',   value: fmtPct(s.tech.cwvPass),    tone: scoreToTone(s.tech.cwvPass) },
          { label: 'Open fixes', value: compactNum(s.recommendations.length), tone: s.recommendations.length > 0 ? 'warn' : 'good' },
        ]}
      />

      <PillarCard pillars={s.pillars.map(p => ({
        ...p,
        onClick: () => setRsTab?.('fullAudit',
          p.id === 'tech'   ? 'tech'
        : p.id === 'links'  ? 'links'
        : p.id === 'search' ? 'search'
        : p.id === 'ai'     ? 'ai'
        : 'fixes'),
      }))} />

      {alerts.length > 0 ? <AlertsBlock title="Top alerts" items={alerts.slice(0, 5)} /> : null}

      <RecommendedActionsBlock
        title="Top fixes"
        items={s.topRecommendations.slice(0, 3)}
        onSeeAll={() => setRsTab?.('fullAudit', 'fixes')}
        seeAllLabel={`See all ${s.recommendations.length}`}
      />

      <ConnectorStatusBlock
        connectors={s.connectors}
        onConnect={(id) => openSettings?.('connectors', id)}
      />

      {s.hasPrior && (
        <CompareBlock title="This crawl vs last" rows={[
          { label: 'Score',      a: { v: s.score,             tag: 'now' }, b: { v: s.scorePrev,             tag: 'prev' } },
          { label: 'Indexable',  a: { v: s.tech.indexable,    tag: 'now' }, b: { v: s.tech.indexablePrev,    tag: 'prev' }, format: fmtPct },
          { label: 'Errors',     a: { v: s.issues.errors,     tag: 'now' }, b: { v: s.issues.errorsPrev,     tag: 'prev' } },
          { label: 'Clicks',     a: { v: s.search.clicksTotal,tag: 'now' }, b: { v: s.search.clicksPrev,     tag: 'prev' }, format: compactNum },
          { label: 'Sessions',   a: { v: s.traffic.sessions,  tag: 'now' }, b: { v: s.traffic.sessionsPrev,  tag: 'prev' }, format: compactNum },
        ]} />
      )}

      <DrillFooter chips={[
        { label: 'Fixes',   count: s.recommendations.length,         onClick: () => setRsTab?.('fullAudit', 'fixes') },
        { label: 'Search',  count: compactNum(s.search.clicksTotal), onClick: () => setRsTab?.('fullAudit', 'search') },
        { label: 'Traffic', count: compactNum(s.traffic.sessions),   onClick: () => setRsTab?.('fullAudit', 'traffic') },
        { label: 'Tech',    count: fmtPct(s.tech.cwvPass),           onClick: () => setRsTab?.('fullAudit', 'tech') },
      ]} />
    </div>
  )
}
