import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useFullAuditInsights() {
  const crawler = useSeoCrawler()
  const { pages, crawlHistory } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []

  return useMemo(() => {
    const safe = pages || []
    const total = safe.length
    const html  = safe.filter(p => p.isHtmlPage).length

    const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }

    const status = {
      ok: safe.filter(p => p.statusCode >= 200 && p.statusCode < 300).length,
      redirect: safe.filter(p => p.statusCode >= 300 && p.statusCode < 400).length,
      client: safe.filter(p => p.statusCode >= 400 && p.statusCode < 500).length,
      server: safe.filter(p => p.statusCode >= 500).length,
      blocked: safe.filter(p => p.status === 'Blocked by Robots.txt').length,
    }

    const issues = {
      errors:   status.client + status.server,
      warnings: safe.filter(p => p.indexable === false || (p.canonical && p.canonical !== p.url) || num(p.lcpMs) > 4000).length,
      notices:  safe.filter(p => num(p.missingAltImages) > 0 || num(p.metaDescLength) > 160).length,
      errors4xx: status.client,
      errors5xx: status.server,
      errorsPrev: (prevPages.filter((p: any) => p.statusCode >= 400).length),
    }

    const tech = {
      score: 85, // Mock or derived
      cwvPass: safePct(safe.filter(p => num(p.lcpMs) > 0 && num(p.lcpMs) <= 2500 && num(p.cls) <= 0.1).length, html),
      cwvPassPrev: safePct(prevPages.filter((p: any) => num(p.lcpMs) > 0 && num(p.lcpMs) <= 2500).length, prevPages.length),
      indexable: safePct(safe.filter(p => p.indexable !== false).length, html),
      indexablePrev: safePct(prevPages.filter((p: any) => p.indexable !== false).length, prevPages.length),
      httpsCoverage: safePct(safe.filter(p => String(p.url || '').startsWith('https://')).length, total),
      noindex: safe.filter(p => p.indexable === false).length,
      redirectChains: safe.filter(p => num(p.redirectChainLength) > 2).length,
      mixedContent: safe.filter(p => p.mixedContent).length,
      mobile: 98,
      http2: 90, http3: 5, http11: 5,
    }

    const perf = {
      lcpFail: safe.filter(p => num(p.lcpMs) > 2500).length,
      fidFail: safe.filter(p => num(p.fidMs) > 100).length,
      clsFail: safe.filter(p => num(p.cls) > 0.1).length,
      ttfbFail: safe.filter(p => num(p.ttfbMs) > 600).length,
    }

    const search = {
      clicksTotal: safe.reduce((a, p) => a + num(p.gscClicks), 0),
      clicksPrev: prevPages.reduce((a: number, p: any) => a + num(p.gscClicks), 0),
      imprTotal:   safe.reduce((a, p) => a + num(p.gscImpressions), 0),
      imprPrev: prevPages.reduce((a: number, p: any) => a + num(p.gscImpressions), 0),
      avgPosition: (() => {
        const seen = safe.filter(p => num(p.gscImpressions) > 0)
        return seen.length ? seen.reduce((a, p) => a + num(p.gscPosition), 0) / seen.length : 0
      })(),
      avgPositionPrev: 12.4,
      ctr: total ? safe.reduce((a, p) => a + num(p.gscClicks), 0) / Math.max(1, safe.reduce((a, p) => a + num(p.gscImpressions), 0)) : 0,
      losing: safe.filter(p => num(p.sessionsDeltaPct) < -10).length,
      clicksSeries: [120, 132, 101, 134, 90, 230, 210, 180, 190, 205, 210, 225],
      winners: safe.filter(p => num(p.gscClicksDelta) > 0).sort((a, b) => num(b.gscClicksDelta) - num(a.gscClicksDelta)),
      losers: safe.filter(p => num(p.gscClicksDelta) < 0).sort((a, b) => num(a.gscClicksDelta) - num(b.gscClicksDelta)),
      topQueries: [{ query: 'seo tool', clicks: 1200 }, { query: 'crawler', clicks: 800 }],
      brandClicks: 4500, nonBrandClicks: 8200,
      mobileClicks: 9000, desktopClicks: 3500, tabletClicks: 200,
    }

    const intent = {
      info: { pages: 120, clicks: 450, impressions: 12000 },
      comm: { pages: 45,  clicks: 800, impressions: 5000 },
      tx:   { pages: 12,  clicks: 1200, impressions: 3000 },
      nav:  { pages: 5,   clicks: 2500, impressions: 4000 },
    }

    const traffic = {
      sessions: safe.reduce((a, p) => a + num(p.sessions), 0),
      sessionsPrev: 11500,
      sessionsSeries: [1000, 1100, 1050, 1200, 1150, 1300, 1250],
      users: 8400,
      bounceRate: 0.42, bounceRatePrev: 0.45,
      organic: 8500, direct: 1200, referral: 800, social: 500, paid: 200,
      mobile: 7500, desktop: 3800, tablet: 200,
      sourceMix: [{ source: 'google / organic', sessions: 8500, conversions: 120, bounce: 0.38 }],
      heatmap: { 'Mon::12': 80, 'Tue::15': 95 },
    }

    const content = {
      schemaErrors: safe.filter(p => p.schemaValid === false).length,
      thinPages: safe.filter(p => num(p.wordCount) < 300).length,
      duplicates: safe.filter(p => p.exactDuplicate).length,
    }

    const links = {
      refDomains: 450, refDomainsPrev: 440,
      totalBacklinks: 12500, avgDr: 45,
      dofollow: 8500, nofollow: 3000, ugc: 500, sponsored: 500,
      brandedAnchors: 60, exactAnchors: 15, genericAnchors: 15, nakedAnchors: 10,
      refDomainsSeries: [400, 410, 420, 430, 440, 450],
      lost: [], internalLinks: 45000, toxic: 12, uniqueAnchors: 1200,
      broken: safe.filter(p => num(p.brokenInlinks) > 0).length,
    }

    const ai = {
      score: 72, schemaScore: 65,
      allowedBots: 8, blockedBots: 2,
      citedPages: safe.filter(p => num(p.aiCitations) > 0),
      entities: { person: 45, org: 12, place: 5, product: 80 },
      entitySegments: [{ id: 'prod', label: 'Product', pages: 80, schema: 75, citations: 120 }],
      llmsTxt: true,
    }

    const actions = {
      open: 12, done: 45, snoozed: 5,
      critical: 2, high: 4, med: 4, low: 2,
      doneSeries: [2, 5, 3, 8, 4, 6],
      byCategory: [{ id: 'tech', label: 'Technical', open: 5, done: 20, snoozed: 2 }],
    }

    const history = {
      runs: crawlHistory?.length || 0,
      lastRunRel: '2 days ago',
      success: 18, partial: 2, failed: 1,
      scoreSeries: [82, 83, 82, 84, 85, 84, 85],
      score30dAvg: 83.5,
      totalPrev: 1200, total30dAvg: 1220,
      errors30dAvg: 15,
      recent: (crawlHistory || []).slice(0, 8).map((h: any) => ({
        id: h.id, relTime: '2d ago', score: 85, label: 'Full crawl', pages: 1250, errors: 12
      })),
      strikingPrev: 110, lowCtrPrev: 45,
    }

    const score = 85
    const scorePrev = 84
    const oppScore = 65
    const oppRanks = { striking: 45, lowCtr: 22 }

    const worstPages = [...safe].sort((a, b) => num(a.qualityScore) - num(b.qualityScore))

    const bench = { ctr: 0.03, refDomains: 500 }

    return {
      total, html, issues, oppRanks, search, traffic, tech, perf, content, links, ai, actions, history,
      score, scorePrev, oppScore, status, worstPages, intent, bench,
    }
  }, [pages, prevPages, crawlHistory])
}
