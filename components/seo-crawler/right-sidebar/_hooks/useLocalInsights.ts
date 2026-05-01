import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useLocalInsights() {
  const { pages, locations, gbpProfiles, reviewSources } = useSeoCrawler() as any
  return useMemo(() => {
    const safe = pages || []
    const locs = Array.isArray(locations) ? locations : []
    const gbps = Array.isArray(gbpProfiles) ? gbpProfiles : []
    const reviews = Array.isArray(reviewSources) ? reviewSources : []

    const nap = {
      consistent: locs.filter((l: any) => l.napConsistencyScore >= 0.95).length,
      mismatch:   locs.filter((l: any) => l.napConsistencyScore < 0.95 && l.napConsistencyScore > 0).length,
      noData:     locs.filter((l: any) => !l.napConsistencyScore).length,
    }

    const gbp = {
      verified:   gbps.filter((g: any) => g.verified === true).length,
      unverified: gbps.filter((g: any) => g.verified === false).length,
      duplicates: gbps.filter((g: any) => g.duplicates > 0).length,
      avgComplete: gbps.length ? gbps.reduce((a: number, g: any) => a + Number(g.completeness || 0), 0) / gbps.length : 0,
    }

    const rev = {
      total: reviews.reduce((a: number, r: any) => a + Number(r.count || 0), 0),
      avg:   (() => {
        const seen = reviews.filter((r: any) => Number(r.count) > 0)
        if (!seen.length) return 0
        return seen.reduce((a: number, r: any) => a + Number(r.avgRating || 0) * Number(r.count || 0), 0)
             / seen.reduce((a: number, r: any) => a + Number(r.count || 0), 0)
      })(),
      negative30d: reviews.reduce((a: number, r: any) => a + Number(r.negative30d || 0), 0),
      responseRate: reviews.length ? reviews.reduce((a: number, r: any) => a + Number(r.responseRate || 0), 0) / reviews.length : 0,
    }

    const localPack = {
      avgPosition: locs.length ? locs.reduce((a: number, l: any) => a + Number(l.localPackPosition || 0), 0) / locs.length : 0,
      presencePct: safePct(locs.filter((l: any) => Number(l.localPackPosition) > 0 && Number(l.localPackPosition) <= 3).length, locs.length),
    }

    const score = Math.round(
      (safePct(nap.consistent, Math.max(1, locs.length)) + safePct(gbp.verified, Math.max(1, gbps.length)) + (rev.avg / 5) * 100 + localPack.presencePct) / 4
    )

    return { locations: locs, gbpProfiles: gbps, reviewSources: reviews, nap, gbp, rev, localPack, score }
  }, [pages, locations, gbpProfiles, reviewSources])
}
