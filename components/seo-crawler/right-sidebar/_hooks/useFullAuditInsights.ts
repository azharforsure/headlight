import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useFullAuditInsights() {
  const { pages } = useSeoCrawler()
  return useMemo(() => {
    const safe = pages || []
    const total = safe.length
    const html  = safe.filter(p => p.isHtmlPage).length

    const issues = {
      errors:   safe.filter(p => p.statusCode >= 400 || p.statusCode >= 500).length,
      warnings: safe.filter(p => p.indexable === false || p.canonical && p.canonical !== p.url || Number(p.lcp) > 4000).length,
      notices:  safe.filter(p => Number(p.missingAltImages) > 0 || Number(p.metaDescLength || 0) > 160).length,
    }

    const oppRanks = safe
      .filter(p => Number(p.gscPosition) > 3 && Number(p.gscPosition) <= 20 && Number(p.gscImpressions) > 100)
      .sort((a, b) => Number(b.gscImpressions) - Number(a.gscImpressions))

    const search = {
      clicksTotal: safe.reduce((a, p) => a + Number(p.gscClicks || 0), 0),
      imprTotal:   safe.reduce((a, p) => a + Number(p.gscImpressions || 0), 0),
      avgPos:      (() => {
        const seen = safe.filter(p => Number(p.gscImpressions) > 0)
        if (!seen.length) return 0
        return seen.reduce((a, p) => a + Number(p.gscPosition || 0), 0) / seen.length
      })(),
      losing: safe.filter(p => Number(p.sessionsDeltaPct) < -10).length,
      gaining: safe.filter(p => Number(p.sessionsDeltaPct) > 10).length,
    }

    const traffic = {
      sessions: safe.reduce((a, p) => a + Number(p.ga4Sessions || 0), 0),
      revenue:  safe.reduce((a, p) => a + Number(p.ga4Revenue || 0), 0),
      conv:     safe.reduce((a, p) => a + Number(p.ga4Conversions || 0), 0),
      bounce:   (() => {
        const seen = safe.filter(p => Number(p.ga4Sessions) > 0)
        if (!seen.length) return 0
        return seen.reduce((a, p) => a + Number(p.ga4BounceRate || 0), 0) / seen.length
      })(),
    }

    const tech = {
      cwvPass: safePct(safe.filter(p => Number(p.lcp) > 0 && Number(p.lcp) <= 2500 && Number(p.cls) <= 0.1 && Number(p.inp) <= 200).length, html),
      indexable: safePct(safe.filter(p => p.indexable !== false).length, html),
      httpsCoverage: safePct(safe.filter(p => String(p.url || '').startsWith('https://')).length, total),
    }

    const links = {
      orphans:  safe.filter(p => Number(p.inlinks) === 0 && Number(p.crawlDepth) > 0).length,
      broken:   safe.filter(p => Number(p.brokenInternalLinks) > 0).length,
      external: safe.reduce((a, p) => a + Number(p.externalOutlinks || 0), 0),
      refDomains: safe.reduce((a, p) => a + Number(p.referringDomains || 0), 0),
    }

    const ai = {
      llmsTxt:    safe.some(p => p.hasLlmsTxt === true),
      blockedAi:  safe.filter(p => Array.isArray(p.aiBlockedBots) && p.aiBlockedBots.length > 0).length,
      citations:  safe.reduce((a, p) => a + Number(p.aiCitationCount || 0), 0),
    }

    const score = Math.round(
      (tech.cwvPass + tech.indexable + tech.httpsCoverage) / 3
    )

    return { total, html, issues, oppRanks, search, traffic, tech, links, ai, score }
  }, [pages])
}
