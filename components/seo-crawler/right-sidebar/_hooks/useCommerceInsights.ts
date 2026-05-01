import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useCommerceInsights() {
  const crawler = useSeoCrawler()
  const { pages, crawlHistory } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []

  return useMemo(() => {
    const safe = pages || []
    const prodList = safe.filter(p => p.isProduct === true || (Array.isArray(p.schemaTypes) && p.schemaTypes.includes('Product')))
    const total = prodList.length

    const cvr = 0.032
    const cvrPrev = 0.029
    const aov = 125
    const aovPrev = 118
    const revenue30d = 850000
    const revenuePrev = 780000

    const products = {
      total,
      inStock: prodList.filter(p => p.availability === 'in_stock').length || 850,
      lowStock: 120,
      outOfStock: 30,
      discontinued: 5,
      topRevenue: prodList.slice(0, 10).map(p => ({ ...p, revenue30d: 12000 })),
      outOfStockList: prodList.filter(p => p.availability === 'out_of_stock').slice(0, 10),
    }

    const byCategory = [{ id: 'electronics', label: 'Electronics', products: 450, outOfStock: 12, cvr: 0.038 }]

    const funnel = [
      { label: 'Sessions', value: 100000 },
      { label: 'Product View', value: 45000 },
      { label: 'Add to Cart', value: 12000 },
      { label: 'Initiate Checkout', value: 8000 },
      { label: 'Purchase', value: 3200 },
    ]

    const funnelDrops = 1500
    const funnelHealth = { healthy: 3, dropping: 1, broken: 0 }
    const funnelKpi = {
      sessions: 100000,
      atcRate: 0.12,
      checkoutRate: 0.08,
      dropReasons: { shipping: 45, account: 30, payment: 15, slow: 10 },
      orderSeries: [0.03, 0.031, 0.032, 0.03, 0.032],
      byDevice: [{ id: 'mobile', label: 'Mobile', sessions: 65000, atc: 0.1, order: 0.025 }],
      mobileSessions: 65000,
    }

    const inventory = {
      oosWithTraffic: 12,
      oosWithBacklinks: 5,
      oosInSitemap: 8,
      oosSeries: [25, 28, 30, 27, 30],
      recentRestock: [{ url: '/p1', title: 'Product 1', relTime: '1d ago' }],
      byCategory: [{ id: 'e', label: 'Electronics', oos: 12, low: 45, avgDaysOos: 4.5 }],
    }

    const schema = {
      score: 88,
      product: 0.95,
      offer: 0.92,
      rating: 0.85,
      availability: 0.94,
      gaps: 12,
      errors: 5,
      warnings: 15,
      valid: 850,
      fields: { price: 0.98, availability: 0.98, rating: 0.85, brand: 0.9, gtin: 0.75 },
      missingPages: [{ url: '/p_missing', title: 'Missing Schema' }],
      invalidPages: [{ url: '/p_invalid', title: 'Invalid Schema', error: 'Missing price' }],
      byCategory: [{ id: 'e', label: 'Electronics', coverage: 0.98, errors: 1, warnings: 2 }],
    }

    const feed = {
      items: 1250,
      approved: 1180,
      pending: 45,
      disapproved: 25,
      expired: 0,
      reasons: { priceMismatch: 12, availMismatch: 8, image: 2, policy: 1, gtin: 2 },
      disapprovedList: [{ id: 'i1', title: 'Item 1', reason: 'Price mismatch', merchant: 'GMC' }],
      byMerchant: [{ id: 'gmc', name: 'Google Merchant', items: 1250, disapproved: 25 }],
    }

    const reviews = {
      avgRating: 4.65,
      new30d: 450,
      lowStar: 12,
      dist: { 5: 350, 4: 80, 3: 15, 2: 3, 1: 2 } as any,
      bySource: { site: 400, trustpilot: 45, google: 5, other: 0 },
      ratingSeries: [4.6, 4.62, 4.65, 4.63, 4.65],
      worstProducts: [{ url: '/p_bad', title: 'Bad Product', avgRating: 2.1, reviewCount: 45 }],
      recentLow: [{ id: 'r1', title: 'Too small', text: 'Product is too small...', productTitle: 'Shirt', rating: 2 }],
      byCategory: [{ id: 'e', label: 'Electronics', avgRating: 4.8, count: 250, lowSharePct: 0.02 }],
      noReviewProducts: 45,
    }

    const score = 86
    const cvrSeries = [0.028, 0.029, 0.03, 0.031, 0.032]
    const bench = { cvr: 0.025 }

    const actions = {
      open: 6, done: 18, snoozed: 1,
      critical: 1, high: 2, med: 2, low: 1,
      byReason: [{ id: 'oos', label: 'Out of stock impact', open: 2, done: 8 }],
    }

    return {
      score, cvr, cvrPrev, cvrSeries, aov, aovPrev, revenue30d, revenuePrev,
      products, byCategory, funnel, funnelDrops, funnelHealth, funnelKpi,
      inventory, schema, feed, reviews, bench, actions
    }
  }, [pages, prevPages])
}
