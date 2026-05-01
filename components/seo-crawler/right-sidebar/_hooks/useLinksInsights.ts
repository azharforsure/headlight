import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useLinksInsights() {
  const { pages } = useSeoCrawler()
  return useMemo(() => {
    const safe = pages || []
    const total = safe.length

    const inlinksTotal      = safe.reduce((a, p) => a + Number(p.inlinks || 0), 0)
    const outlinksTotal     = safe.reduce((a, p) => a + Number(p.outlinks || 0), 0)
    const externalTotal     = safe.reduce((a, p) => a + Number(p.externalOutlinks || 0), 0)
    const refDomainsTotal   = safe.reduce((a, p) => a + Number(p.referringDomains || 0), 0)
    const backlinksTotal    = safe.reduce((a, p) => a + Number(p.backlinks || 0), 0)

    const internal = {
      orphans:   safe.filter(p => Number(p.inlinks) === 0 && Number(p.crawlDepth) > 0).length,
      brokenIn:  safe.filter(p => Number(p.brokenInternalLinks) > 0).length,
      brokenOut: safe.filter(p => Number(p.brokenExternalLinks) > 0).length,
      nofollow:  safe.filter(p => Number(p.nofollowInternalLinks) > 0).length,
      redirects: safe.filter(p => Number(p.redirectChainLength) > 1).length,
    }

    const anchorMix = (() => {
      let brand = 0, exact = 0, partial = 0, generic = 0, urlA = 0, image = 0
      for (const p of safe) {
        brand   += Number(p.anchorBrandedShare || 0)
        exact   += Number(p.anchorExactShare || 0)
        partial += Number(p.anchorPartialShare || 0)
        generic += Number(p.anchorGenericShare || 0)
        urlA    += Number(p.anchorUrlShare || 0)
        image   += Number(p.anchorImageShare || 0)
      }
      const n = safe.length || 1
      return { brand: brand/n, exact: exact/n, partial: partial/n, generic: generic/n, url: urlA/n, image: image/n }
    })()

    const toxic = {
      domains: safe.filter(p => Number(p.toxicDomainCount) > 0).length,
      total:   safe.reduce((a, p) => a + Number(p.toxicDomainCount || 0), 0),
    }

    const velocity = {
      newRefDomains:  safe.reduce((a, p) => a + Number(p.newRefDomains30d || 0), 0),
      lostRefDomains: safe.reduce((a, p) => a + Number(p.lostRefDomains30d || 0), 0),
      newBacklinks:   safe.reduce((a, p) => a + Number(p.newBacklinks30d || 0), 0),
      lostBacklinks:  safe.reduce((a, p) => a + Number(p.lostBacklinks30d || 0), 0),
    }

    const topReferrers = (() => {
      const m: Record<string, number> = {}
      for (const p of safe) {
        const list = Array.isArray(p.topReferrers) ? p.topReferrers : []
        for (const r of list) m[r] = (m[r] || 0) + 1
      }
      return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8)
    })()

    const score = Math.round(
      safePct(
        total - internal.orphans - internal.brokenIn - toxic.domains,
        total
      )
    )

    return { total, inlinksTotal, outlinksTotal, externalTotal, refDomainsTotal, backlinksTotal, internal, anchorMix, toxic, velocity, topReferrers, score }
  }, [pages])
}
