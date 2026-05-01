import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function usePaidInsights() {
  const { pages, paidCampaigns } = useSeoCrawler() as any
  return useMemo(() => {
    const camps = Array.isArray(paidCampaigns) ? paidCampaigns : []
    const lps = (pages || []).filter((p: any) => p.isPaidLandingPage)
    const total = camps.length

    const spend30d = camps.reduce((a: number, c: any) => a + Number(c.spend30d || 0), 0)
    const conv30d  = camps.reduce((a: number, c: any) => a + Number(c.conversions30d || 0), 0)
    const revenue30d = camps.reduce((a: number, c: any) => a + Number(c.revenue30d || 0), 0)
    const cpa = conv30d > 0 ? spend30d / conv30d : 0
    const roas = spend30d > 0 ? revenue30d / spend30d : 0

    const qsBucket = {
      ten:    camps.filter((c: any) => Number(c.qsAvg) === 10).length,
      nine:   camps.filter((c: any) => Number(c.qsAvg) === 9).length,
      eight:  camps.filter((c: any) => Number(c.qsAvg) === 8).length,
      seven:  camps.filter((c: any) => Number(c.qsAvg) === 7).length,
      six:    camps.filter((c: any) => Number(c.qsAvg) === 6).length,
      lt6:    camps.filter((c: any) => Number(c.qsAvg) > 0 && Number(c.qsAvg) < 6).length,
    }

    const imprShare = {
      avg:        camps.length ? camps.reduce((a: number, c: any) => a + Number(c.imprShare || 0), 0) / camps.length : 0,
      lostRank:   camps.reduce((a: number, c: any) => a + Number(c.imprShareLostRank || 0), 0),
      lostBudget: camps.reduce((a: number, c: any) => a + Number(c.imprShareLostBudget || 0), 0),
    }

    const lpAlerts = {
      slow:        lps.filter((p: any) => Number(p.lcp) > 4000).length,
      missMatch:   lps.filter((p: any) => Number(p.adIntentMatchScore) < 0.6).length,
      poorMobile:  lps.filter((p: any) => p.viewportWidth === false || Number(p.smallTapTargets) > 0).length,
    }

    const auctions = camps[0]?.auctionInsights || []

    return { total, spend30d, conv30d, revenue30d, cpa, roas, qsBucket, imprShare, lpAlerts, auctions, lps }
  }, [pages, paidCampaigns])
}
