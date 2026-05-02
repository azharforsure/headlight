import React from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { useFullAuditInsights } from '../_hooks/useFullAuditInsights'
import { useDrill } from '../_shared/drill'
import {
  CrawlHeaderCard, HeroStrip, PillarCard, AlertsBlock, RecommendedActionsBlock,
  ConnectorStatusBlock, TrendBlock, EmptyState, SingleCrawlNotice,
  compactNum, fmtPct, scoreToTone,
} from '../_shared'

export function FullAuditOverview() {
  const { pages, setRsTab, openSettings } = useSeoCrawler() as any
  const s = useFullAuditInsights()
  const drill = useDrill()

  if (!pages?.length) return <EmptyState title="No crawl yet" hint="Run a crawl to populate the audit." />

  const alerts = [
    s.issues.errors > 0 && { id: 'err', text: `${compactNum(s.issues.errors)} pages with 4xx or 5xx`, tone: 'bad' as const, onClick: () => drill.toCategory('codes', '404 Not Found') },
    s.issues.notIndexable > 0 && { id: 'idx', text: `${compactNum(s.issues.notIndexable)} pages not indexable`, tone: 'warn' as const, onClick: () => drill.toCategory('indexability', 'Non-Indexable') },
    s.tech.cwvPass < 70 && { id: 'cwv', text: `Only ${fmtPct(s.tech.cwvPass)} of pages pass Core Web Vitals`, tone: 'warn' as const, onClick: () => drill.toCategory('performance', 'Poor LCP') },
    s.links.broken > 0 && { id: 'bln', text: `${compactNum(s.links.broken)} broken internal links`, tone: 'warn' as const, onClick: () => drill.toCategory('links', 'Broken Internal') },
    !s.connectors.gsc.connected && { id: 'gsc', text: 'Search Console not connected — search insights are limited', tone: 'info' as const, onClick: () => openSettings?.('connectors') },
  ].filter(Boolean) as any[]

  const anyConnectorMissing =
    !s.connectors.gsc.connected || !s.connectors.ga4.connected ||
    !s.connectors.crux.connected || !s.connectors.ahrefs.connected ||
    !s.connectors.bingWmt.connected

  const pillarSubTab: Record<string, string> = {
    tech: 'tech', links: 'links', search: 'search', ai: 'ai', content: 'fixes',
  }

  return (
    <div className="flex flex-col gap-3 p-3 pb-8">
      {!s.hasPrior && <SingleCrawlNotice />}

      <CrawlHeaderCard
        scope={s.scope}
        industry={s.fingerprint.industry}
        cms={s.fingerprint.cms}
        language={s.fingerprint.language}
        country={s.fingerprint.country}
        lastCrawlAt={s.crawl.lastAt}
        durationMs={s.crawl.durationMs}
        pagesCrawled={s.crawl.pagesCrawled}
      />

      <HeroStrip
        ring="gauge"
        score={s.score}
        scoreLabel="Site score"
        scoreDelta={s.hasPrior ? (s.score - s.scorePrev) : undefined}
        kpis={[
          { label: 'CWV pass', value: fmtPct(s.tech.cwvPass), tone: scoreToTone(s.tech.cwvPass) },
          { label: 'Indexable', value: fmtPct(s.tech.indexable), tone: scoreToTone(s.tech.indexable) },
          { label: 'Top fixes', value: compactNum(s.actions.open), tone: s.actions.open > 0 ? 'warn' : 'good' },
        ]}
      />

      <PillarCard
        pillars={s.pillars.map((p: any) => ({
          ...p,
          onClick: () => setRsTab?.('fullAudit', pillarSubTab[p.id] ?? 'fixes'),
        }))}
      />

      {alerts.length > 0 && <AlertsBlock title="Top priorities" items={alerts.slice(0, 4)} />}

      {s.topRecommendations.length > 0 && (
        <RecommendedActionsBlock
          items={s.topRecommendations}
          onSeeAll={() => setRsTab?.('fullAudit', 'fixes')}
          seeAllLabel={`See all ${s.recommendations.length}`}
        />
      )}

      {s.hasPrior && (
        <TrendBlock
          title="Score history"
          values={s.history.scoreSeries}
          tone={scoreToTone(s.score)}
          hint={`Current ${s.score} · Avg ${s.history.score30dAvg}`}
        />
      )}

      {anyConnectorMissing && (
        <ConnectorStatusBlock
          connectors={s.connectors}
          onConnect={(id) => openSettings?.('connectors', id)}
        />
      )}
    </div>
  )
}
