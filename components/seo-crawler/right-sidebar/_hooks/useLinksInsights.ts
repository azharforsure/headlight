import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useLinksInsights() {
  const crawler = useSeoCrawler()
  const { pages, crawlHistory } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []

  return useMemo(() => {
    const safe = pages || []
    const total = safe.length
    const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }

    const refDomains = 450
    const refDomainsPrev = 430
    const totalBacklinks = 12500
    const totalBacklinksPrev = 12000
    const avgDr = 45
    const avgDrPrev = 44

    const internal = {
      score: 82, total: 45000, avgPerPage: 35, orphans: 120, broken: 15, redirected: 45,
      bucket0: 120, bucket12: 450, bucket310: 1200, bucket1150: 800, bucket50: 200,
      anchorBranded: 60, anchorExact: 15, anchorGeneric: 15, anchorNaked: 10,
      byTemplate: [{ id: 'post', label: 'Post', pages: 120, avgInlinks: 15, orphans: 2 }],
    }

    const external = {
      score: 88, refDomains, refDomainsPrev, gained30d: 12, lost30d: 2,
      dr80plus: 5, dr5079: 45, dr2049: 150, dr019: 250,
      tldMix: [{ tld: '.com', count: 350 }, { tld: '.org', count: 45 }, { tld: '.edu', count: 5 }],
      topRefDomains: [{ domain: 'example.com', dr: 85, backlinks: 1200 }],
      lost: [{ domain: 'lost.com', relTime: '2d ago' }],
      byPage: [{ url: '/', title: 'Home', refDomains: 120, gained30d: 2, lost30d: 0 }],
    }

    const anchors = {
      branded: 60, exact: 15, partial: 10, generic: 10, naked: 4, image: 1,
      len1: 20, len23: 50, len46: 25, len7: 5,
      brandedShare: 0.6, brandedSharePrev: 0.58,
      exactShare: 0.15, exactSharePrev: 0.16,
      top: [{ text: 'Headlight', count: 120, type: 'branded' }],
      exactRisk: [], byPage: [], empty: 5,
    }

    const toxicCount = 12
    const toxicScore = 92
    const toxicSpamAvg = 15
    const disavowed = 5
    const toxicLinks = [{ domain: 'spam.com', spamScore: 85, backlinks: 12 }]
    const toxicBands = { high: 2, medium: 5, low: 5 }
    const toxicReasons = { tld: 5, pbn: 2, lang: 3, sitewide: 2 }

    const velocity = {
      gained30d: 12, lost30d: 2, net30d: 10, gainedPrev: 10, lostPrev: 3,
      daily: 0.4, weekly: 3, monthly: 12, spikes: 1,
      gainedSeries: [1, 2, 0, 3, 2, 4], lostSeries: [0, 1, 0, 0, 1, 0],
      recentGains: [{ domain: 'new.com', targetUrl: '/', relTime: '1d ago' }],
      recentLosses: [],
    }

    const actions = {
      open: 5, done: 15, snoozed: 2,
      critical: 1, high: 2, med: 1, low: 1,
      doneSeries: [1, 2, 1, 3, 2],
      byReason: [{ id: 'orphans', label: 'Orphan pages', open: 2, done: 5 }],
    }

    const score = 85
    const refDomainsSeries = [400, 410, 420, 430, 440, 450]
    const byTemplate = [{ id: 'post', label: 'Post', pages: 120, inlinks: 1500, outlinks: 800 }]
    const bench = { refDomains: 500 }

    return {
      score, refDomains, refDomainsPrev, refDomainsSeries, totalBacklinks, totalBacklinksPrev, avgDr, avgDrPrev,
      dofollow: 8500, nofollow: 3000, ugc: 500, sponsored: 500, uniqueAnchors: 1200, toxicCount, toxicScore, toxicSpamAvg, disavowed,
      internal, external, anchors, toxicLinks, toxicBands, toxicReasons, velocity, byTemplate, bench, actions,
      toxicPages: { byPage: [] } as any,
    }
  }, [pages, prevPages, crawlHistory])
}
