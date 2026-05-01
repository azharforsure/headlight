import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useTechnicalInsights() {
  const { pages } = useSeoCrawler()
  return useMemo(() => {
    const safe = pages || []
    const total = safe.length
    const html = safe.filter(p => p.isHtmlPage || String(p.contentType || '').includes('html')).length

    const status = {
      ok:       safe.filter(p => p.statusCode >= 200 && p.statusCode < 300).length,
      redirect: safe.filter(p => p.statusCode >= 300 && p.statusCode < 400).length,
      client:   safe.filter(p => p.statusCode >= 400 && p.statusCode < 500).length,
      server:   safe.filter(p => p.statusCode >= 500).length,
      blocked:  safe.filter(p => p.status === 'Blocked by Robots.txt').length,
    }

    const indexability = {
      indexable:    safe.filter(p => p.indexable !== false).length,
      noindex:      safe.filter(p => /noindex/i.test(String(p.metaRobots1 || ''))).length,
      blocked:      safe.filter(p => p.status === 'Blocked by Robots.txt').length,
      canonMismatch:safe.filter(p => p.canonical && p.canonical !== p.url).length,
      orphan:       safe.filter(p => Number(p.inlinks) === 0 && Number(p.crawlDepth) > 0).length,
    }

    const cwv = {
      lcpGood: safe.filter(p => Number(p.lcp) > 0 && Number(p.lcp) <= 2500).length,
      lcpWarn: safe.filter(p => Number(p.lcp) > 2500 && Number(p.lcp) <= 4000).length,
      lcpBad:  safe.filter(p => Number(p.lcp) > 4000).length,
      clsGood: safe.filter(p => Number(p.cls) <= 0.1).length,
      clsWarn: safe.filter(p => Number(p.cls) > 0.1 && Number(p.cls) <= 0.25).length,
      clsBad:  safe.filter(p => Number(p.cls) > 0.25).length,
      inpGood: safe.filter(p => Number(p.inp) > 0 && Number(p.inp) <= 200).length,
      inpWarn: safe.filter(p => Number(p.inp) > 200 && Number(p.inp) <= 500).length,
      inpBad:  safe.filter(p => Number(p.inp) > 500).length,
    }

    const security = {
      httpsPages:   safe.filter(p => String(p.url || '').startsWith('https://')).length,
      sslInvalid:   safe.filter(p => p.sslValid === false).length,
      mixedContent: safe.filter(p => p.mixedContent === true).length,
      missingHsts:  safe.filter(p => p.hasHsts === false).length,
      missingCsp:   safe.filter(p => p.hasCsp === false).length,
      exposedKeys:  safe.filter(p => Number(p.exposedApiKeys) > 0).length,
    }

    const crawl = {
      redirectChains: safe.filter(p => Number(p.redirectChainLength) > 1).length,
      orphanPages:    indexability.orphan,
      depthOver5:     safe.filter(p => Number(p.crawlDepth) > 5).length,
    }

    const scores = {
      crawl:    safePct(status.ok + status.redirect, total),
      index:    safePct(indexability.indexable, html),
      render:   safePct(html - safe.filter(p => Number(p.renderBlockingJs) > 2).length, html),
      perf:     safePct(cwv.lcpGood, cwv.lcpGood + cwv.lcpWarn + cwv.lcpBad || 1),
      security: safePct(security.httpsPages - security.sslInvalid - security.exposedKeys, total),
      a11y:     safePct(html - safe.filter(p => Number(p.formsWithoutLabels) > 0 || Number(p.invalidAriaCount) > 0).length, html),
      get overall() {
        const n = (this.crawl + this.index + this.render + this.perf + this.security + this.a11y) / 6
        return Math.round(n)
      },
    }

    return { total, html, status, indexability, cwv, security, crawl, scores }
  }, [pages])
}
