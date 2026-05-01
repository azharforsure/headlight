import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useTechnicalInsights() {
  const crawler = useSeoCrawler()
  const { pages, crawlHistory } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []

  return useMemo(() => {
    const safe = pages || []
    const total = safe.length
    const html = safe.filter(p => p.isHtmlPage || String(p.contentType || '').includes('html')).length
    const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }

    const status = {
      ok:       safe.filter(p => p.statusCode >= 200 && p.statusCode < 300).length,
      redirect: safe.filter(p => p.statusCode >= 300 && p.statusCode < 400).length,
      client:   safe.filter(p => p.statusCode >= 400 && p.statusCode < 500).length,
      server:   safe.filter(p => p.statusCode >= 500).length,
      blocked:  safe.filter(p => p.status === 'Blocked by Robots.txt').length,
      errPrev:  prevPages.filter((p: any) => num(p.statusCode) >= 400).length,
      blockedPrev: prevPages.filter((p: any) => p.status === 'Blocked by Robots.txt').length,
    }

    const indexability = {
      indexable:     safe.filter(p => p.indexable !== false).length,
      noindex:       safe.filter(p => /noindex/i.test(String(p.metaRobots1 || ''))).length,
      canonicalized: safe.filter(p => p.canonical && p.canonical !== p.url).length,
      blocked:       status.blocked,
      orphan:        safe.filter(p => num(p.inlinks) === 0 && num(p.crawlDepth) > 0).length,
      canonMismatch: safe.filter(p => p.canonical && p.canonical !== p.url).length,
      score:         88, // Mock
      byTemplate:    [{ id: 'post', label: 'Post', pages: 120, indexable: 115, noindex: 5 }],
    }

    const perf = {
      lcpP75: 1850, lcpP75Prev: 2100,
      inpP75: 120, clsP75: 0.045,
      lcpGood: safe.filter(p => num(p.lcpMs) > 0 && num(p.lcpMs) <= 2500).length,
      lcpMid:  safe.filter(p => num(p.lcpMs) > 2500 && num(p.lcpMs) <= 4000).length,
      lcpPoor: safe.filter(p => num(p.lcpMs) > 4000).length,
      lcpBad:  safe.filter(p => num(p.lcpMs) > 4000).length,
      clsBad:  safe.filter(p => num(p.cls) > 0.25).length,
      inpBad:  safe.filter(p => num(p.inp) > 500).length,
      mobileGood: 85, mobilePoor: 5, desktopGood: 90, desktopPoor: 2,
      lcpSeries: [2400, 2300, 2200, 2100, 2000, 1900, 1850],
    }

    const render = {
      score: 92, jsRendered: safe.filter(p => p.rendered).length,
      hydrationErrors: 2, blockedResources: 12,
      ssr: 850, ssg: 200, csr: 50, hybrid: 100,
      hydratedClean: 980, hydrationWarn: 18,
      byTemplate: [{ id: 'product', label: 'Product', pages: 450, avgRender: 450, errors: 1 }],
    }

    const security = {
      score: 95, hsts: true, csp: 1, xfo: 1, referrer: 1,
      certValid: 1, certExpiring: 0, certInvalid: 0,
    }

    const a11y = {
      avgScore: 84, errors: 12, warnings: 45,
      levelA: 5, levelAA: 35, levelAAA: 10,
      violations: {
        contrast: 15, altText: 20, aria: 5, labels: 8, landmarks: 2,
        byTemplateRule: { 'post::contrast': 5, 'post::alt-text': 8 },
      },
      topRules: [{ id: 'contrast', label: 'Contrast', count: 15 }],
    }

    const tech = {
      httpsCoverage: safePct(safe.filter(p => String(p.url || '').startsWith('https://')).length, total),
      indexable: safePct(indexability.indexable, html),
      cwvPass: safePct(perf.lcpGood, html),
      cwvPassPrev: 72,
      mobile: 98, http2: 92, http3: 4, http11: 4,
      score: 88,
    }

    const crawl = {
      avgDepth: avg(safe.map(p => num(p.crawlDepth))),
      avgDepthPrev: 3.2,
    }

    const actions = {
      open: 8, done: 24, snoozed: 2,
      critical: 1, high: 3, med: 3, low: 1,
      byCategory: [{ id: 'perf', label: 'Performance', open: 3, done: 10 }],
    }

    const history = {
      scoreSeries: [82, 84, 85, 86, 88],
    }

    const bench = { lcpP75: 2500 }
    const score = tech.score
    const scorePrev = 85

    return {
      total, totalPrev: prevPages.length, html, status, indexability, perf, render, security, a11y, tech, crawl, actions, history, bench, score, scorePrev
    }
  }, [pages, prevPages, crawlHistory])
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}
