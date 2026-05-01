import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useCompetitorsInsights() {
  const { competitors, pages } = useSeoCrawler() as any
  return useMemo(() => {
    const list = Array.isArray(competitors) ? competitors : []
    
    const visibilityShare = 0.22
    const visibilitySharePrev = 0.20
    const visibilitySeries = [0.18, 0.19, 0.20, 0.21, 0.22]
    const rank = 3
    const rankPrev = 4
    const leaderVisibility = 0.35

    const byCompetitor = list.map((c, i) => ({
      id: c.id || `c${i}`,
      domain: c.domain,
      visibility: c.shareOfVoice || 0.15,
      isYou: c.isYou || false,
      refDomains: c.refDomains || 1200,
      top10: c.top10 || 450,
      gapKeywords: 120,
      gapContent: 45,
      gapLinks: 85,
    }))

    const movers = { climbing: 12, steady: 25, falling: 8, new: 5 }

    const gaps = {
      total: 250,
      keywords: 180,
      content: 45,
      links: 25,
      technical: 12,
      byKd: { easy: 45, medium: 85, hard: 50 },
      topKeywords: [{ id: 'k1', keyword: 'best seo platform', kd: 25, competitorRanking: '#1', volume: 8500 }],
      topTopics: [{ id: 't1', label: 'E-A-T guides', competitorPages: 12 }]
    }

    const wins = {
      total: 45,
      avgDelta: 3.2,
      trafficGained: 12500,
      rate: 0.12,
      byType: { position: 25, feature: 10, snippet: 5, image: 5 },
      recent: [{ id: 'w1', keyword: 'seo audit', url: '/audit', delta: 5 }],
      byTopic: [{ id: 'top1', label: 'Technical SEO', wins: 12, trafficGain: 4500, avgDelta: 4.5 }],
      series: [5, 8, 12, 10, 15]
    }

    const losses = {
      total: 18,
      totalPrev: 22,
      avgDelta: -2.5,
      trafficLost: 4500,
      trafficLostPrev: 5500,
      byType: { position: 10, feature: 3, snippet: 2, dropped: 3 },
      recent: [{ id: 'l1', keyword: 'keyword tool', url: '/tools', delta: -4 }],
      series: [3, 2, 5, 4, 4],
      byCompetitor: [{ id: 'c1', domain: 'competitor.com', losses: 5, trafficLost: 1200, avgDelta: -3.2 }]
    }

    const backlinks = {
      you: { refDomains: 1250 },
      avgCompetitor: { refDomains: 950 },
      leader: { refDomains: 2400 },
      byCompetitor: byCompetitor,
      gapTotal: 450,
      gapList: [{ domain: 'forbes.com', dr: 92, competitors: ['comp1.com', 'comp2.com'] }],
      youOnly: [{ domain: 'niche-blog.com', dr: 45 }],
      youSeries: [1100, 1150, 1200, 1220, 1250]
    }

    const bench = { winRate: 0.1 }
    const score = 78

    const actions = {
      open: 8, done: 25, snoozed: 3,
      critical: 2, high: 3, med: 2, low: 1,
      byReason: [{ id: 'gap', label: 'Keyword Gaps', open: 3, done: 10 }]
    }

    return {
      score, visibilityShare, visibilitySharePrev, visibilitySeries, rank, rankPrev, leaderVisibility,
      byCompetitor, movers, gaps, wins, losses, backlinks, bench, actions
    }
  }, [competitors, pages])
}
