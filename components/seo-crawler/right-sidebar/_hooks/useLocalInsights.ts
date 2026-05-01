import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useLocalInsights() {
  const { pages, locations, gbpProfiles, reviewSources } = useSeoCrawler() as any
  return useMemo(() => {
    const safe = pages || []
    const locs = Array.isArray(locations) ? locations : []
    const gbps = Array.isArray(gbpProfiles) ? gbpProfiles : []
    
    const score = 82
    const bands = { healthy: 12, atRisk: 3, broken: 1 }

    const byLocation = locs.map((l, i) => ({
      id: l.id || `l${i}`,
      name: l.name || 'Main St Store',
      address: l.address || '123 Main St',
      localVisibility: 0.45,
      gbpScore: 88,
      napConsistency: 0.92,
      reviewCount: 150,
      avgRating: 4.6,
      citations: 45,
      napMismatches: 2,
      photos: 45,
      posts30d: 4,
      responseRate: 0.85,
      localPackShare: 0.35,
      top3: 12,
      avgPos: 2.1
    }))

    const nap = {
      consistency: 0.92,
      issues: 5,
      name: 0.98,
      address: 0.95,
      phone: 0.92,
      website: 0.95,
      hours: 0.85,
      citationCount: 125,
      mismatches: 8,
      missing: 15,
      matched: 102,
      partial: 15,
      mismatched: 8,
      worstDirectories: [{ id: 'd1', name: 'Yelp', consistency: 0.75 }],
      mismatchedList: [{ id: 'm1', directory: 'YellowPages', location: 'London', field: 'Phone' }]
    }

    const gbp = {
      avgScore: 88,
      completeness: 0.95,
      unansweredQA: 2,
      issues: 3,
      fields: { hours: 1, categories: 1, description: 0.9, photos: 0.8, services: 0.85 },
      fieldGaps: 5,
      postCadence: { weekly: 8, monthly: 4, quarterly: 2, never: 1 },
      viewsSeries: [450, 480, 520, 500, 550],
      worstProfiles: [{ id: 'p1', name: 'West Side', address: '456 West St', score: 72 }],
      bestProfiles: [{ id: 'p2', name: 'Downtown', score: 98 }]
    }

    const reviews = {
      avg: 4.62,
      new30d: 45,
      new30dPrev: 38,
      responseRate: 0.82,
      total: 1250,
      dist: { 5: 850, 4: 250, 3: 100, 2: 30, 1: 20 } as any,
      velocitySeries: [5, 8, 12, 10, 15],
      recentLow: [{ id: 'r1', author: 'John D.', text: 'Bad service', rating: 2, location: 'London' }],
      unanswered: [{ id: 'u1', author: 'Sarah K.', text: 'Great place!', rating: 5 }],
      lowStarTotal: 50
    }

    const localPack = {
      share: 0.35,
      sharePrev: 0.32,
      shareSeries: [0.3, 0.31, 0.33, 0.32, 0.35],
      shareSeries90d: [0.28, 0.3, 0.32, 0.31, 0.33, 0.35],
      avgPos: 2.3,
      top3: 25,
      pos1: 10,
      pos2: 8,
      pos3: 7,
      pos4plus: 15,
      notRanking: 20,
      topKeywords: [{ id: 'k1', keyword: 'seo near me', volume: 1200, position: 2 }],
      lost: [{ id: 'k2', keyword: 'digital agency', posPrev: 3, posNow: 5 }]
    }

    const bench = { localPackShare: 0.25, reviewAvg: 4.2 }

    const actions = {
      open: 6, done: 20, snoozed: 2,
      critical: 1, high: 2, med: 2, low: 1,
      byReason: [{ id: 'nap', label: 'NAP Mismatch', open: 2, done: 8 }]
    }

    return {
      score, bands, byLocation, nap, gbp, reviews, localPack, bench, actions
    }
  }, [pages, locations, gbpProfiles, reviewSources])
}
