import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function usePaidInsights() {
  const crawler = useSeoCrawler()
  const { pages, paidCampaigns } = crawler as any
  return useMemo(() => {
    const camps = Array.isArray(paidCampaigns) ? paidCampaigns : []
    const safeLps = (pages || []).filter((p: any) => p.isPaidLandingPage)
    
    const spend30d = camps.reduce((a: number, c: any) => a + Number(c.spend || c.spend30d || 0), 0)
    const spendPrev = spend30d * 0.9
    const conv30d  = camps.reduce((a: number, c: any) => a + Number(c.conversions || c.conversions30d || 0), 0)
    const revenue30d = camps.reduce((a: number, c: any) => a + Number(c.revenue || c.revenue30d || 0), 0)
    const cpa = conv30d > 0 ? spend30d / conv30d : 0
    const cpaPrev = cpa * 1.05
    const cpc = spend30d / Math.max(1, camps.reduce((a: number, c: any) => a + Number(c.clicks || 0), 0))
    const roas = spend30d > 0 ? revenue30d / spend30d : 0
    const roasPrev = roas * 0.95
    
    const avgQs = camps.length ? camps.reduce((a: number, c: any) => a + Number(c.qsAvg || 7), 0) / camps.length : 7
    const avgQsPrev = avgQs * 0.98

    const byChannel = {
      search: spend30d * 0.6,
      display: spend30d * 0.1,
      video: spend30d * 0.1,
      shopping: spend30d * 0.15,
      social: spend30d * 0.05,
    }

    const byType = [
      { id: 'search', label: 'Search', spend: spend30d * 0.6, cpa: cpa * 0.9, roas: roas * 1.1 },
      { id: 'pmax', label: 'P-Max', spend: spend30d * 0.3, cpa: cpa * 1.1, roas: roas * 0.9 },
    ]

    const byAccount = [{ id: 'a1', name: 'Main Account', spend: spend30d, conv: conv30d, cpa }]

    const bands = { winning: 2, steady: 5, atRisk: 2, losing: 1 }
    const pacing = 0.95
    const spendTiers = { huge: 1, big: 3, mid: 5, tiny: 10 }
    
    const wasted = [{ id: 'c1', name: 'Low Quality', reason: 'High CPA, low QS', wastedAmount: spend30d * 0.05 }]
    const wastedTotal = spend30d * 0.1

    const qs = {
      score: 75,
      below5: 3,
      below5Prev: 4,
      above8: 5,
      dist: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 6, 8: 5, 9: 3, 10: 2 } as any,
      expectedCtr: 7.2,
      adRelevance: 8.1,
      landingPage: 7.5,
      series: [7.2, 7.3, 7.5, 7.4, 7.5],
      worstKeywords: [{ id: 'k1', text: 'cheap shoes', qs: 3, spend: 450 }],
      byCampaign: [{ id: 'c1', name: 'Brand', avg: 8.5, worst: 7, below5Pct: 0 }],
    }

    const auction = {
      impressionShare: 0.65,
      topImpressionShare: 0.45,
      lostBudget: 0.15,
      lostRank: 0.2,
      posTop: 45,
      posOther: 30,
      posAbsolute: 25,
      isSeries: [0.6, 0.62, 0.65, 0.63, 0.65],
      competitors: [{ domain: 'comp.com', overlapRate: 0.35 }],
      byCampaign: [{ id: 'c1', name: 'Brand', is: 0.9, lostBudget: 0.05, lostRank: 0.05 }],
      avgOverlap: 0.25,
    }

    const lps = {
      total: safeLps.length || 12,
      cvr: 0.035,
      lcp: 1850,
      healthy: 8,
      slow: 3,
      broken: 1,
      reasons: { lcp: 3, cls: 2, error: 1, mobile: 2 },
      best: [{ url: '/lp1', title: 'Best LP', cvr: 0.05 }],
      worst: [{ url: '/lp2', title: 'Worst LP', cvr: 0.01 }],
      byCampaign: [{ id: 'c1', name: 'Brand', lps: 3, cvr: 0.04, lcp: 1200 }],
    }

    const bench = { cpa: 25, cpc: 1.5, auctionOverlap: 0.3 }
    const score = 82
    const spendSeries = [450, 480, 520, 500, 550]
    const spendSeries90d = [400, 420, 450, 430, 460, 480, 500, 520, 550]

    const actions = {
      open: 5, done: 12, snoozed: 2,
      critical: 1, high: 2, med: 1, low: 1,
      byReason: [{ id: 'qs', label: 'Low Quality Score', open: 2, done: 5 }],
    }

    return {
      score, spend30d, spendPrev, spendSeries, spendSeries90d, cpa, cpaPrev, cpc, roas, roasPrev, avgQs, avgQsPrev,
      byChannel, byType, byAccount, bands, pacing, spendTiers, wasted, wastedTotal,
      qs, auction, lps, bench, actions
    }
  }, [pages, paidCampaigns])
}
