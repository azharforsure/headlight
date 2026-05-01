import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useContentInsights() {
  const crawler = useSeoCrawler()
  const { pages, crawlHistory } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []

  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter(p => p.isHtmlPage)
    const total = html.length
    const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }

    const scores = html.map(p => num(p.qualityScore) || 50)
    const avgQuality = avg(scores)
    const avgQualityPrev = avg(prevPages.map((p: any) => num(p.qualityScore) || 50))

    const bands = {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 75 && s < 90).length,
      fair: scores.filter(s => s >= 60 && s < 75).length,
      poor: scores.filter(s => s >= 40 && s < 60).length,
      critical: scores.filter(s => s < 40).length,
    }

    const lengthMix = {
      tiny: html.filter(p => num(p.wordCount) < 300).length,
      short: html.filter(p => num(p.wordCount) >= 300 && num(p.wordCount) < 800).length,
      medium: html.filter(p => num(p.wordCount) >= 800 && num(p.wordCount) < 2000).length,
      long: html.filter(p => num(p.wordCount) >= 2000).length,
    }

    const thin = lengthMix.tiny
    const thinPrev = prevPages.filter((p: any) => num(p.wordCount) < 300).length

    const dup = {
      exact: html.filter(p => p.exactDuplicate).length,
      near: html.filter(p => p.nearDuplicateMatch).length,
      canonMismatch: html.filter(p => p.canonicalMismatch).length,
      titleDup: html.filter(p => p.titleDuplicate).length,
      metaDup: html.filter(p => p.metaDuplicate).length,
    }

    const clusters = [{ id: '1', label: 'Guides', pages: 45, thin: 5, avgQuality: 82 }, { id: '2', label: 'Products', pages: 120, thin: 12, avgQuality: 75 }]

    const cluster = {
      fresh: 5, recent: 4, aging: 2, stale: 1,
    }

    const freshness = {
      avgDays: 45, stale: 12, fresh: 45, recent: 30, ok: 20, aging: 15,
      weekly: 10, monthly: 40, quarterly: 30, yearly: 15, never: 5,
      publishSeries: [2, 4, 3, 5, 8, 4],
      byCluster: clusters.map(c => ({ ...c, avgDays: 35 })),
    }

    const schema = {
      score: 78, withSchema: html.filter(p => p.hasSchema).length,
      valid: html.filter(p => p.hasSchema && !p.schemaError).length,
      errors: html.filter(p => p.schemaError).length,
      warnings: 12,
      types: [{ type: 'Product', count: 450 }, { type: 'Article', count: 120 }],
    }

    const reasons = {
      tinyWord: thin, shortWord: lengthMix.short, noH1: 5, boilerplate: 12, aiy: 8,
    }

    const actions = {
      open: 10, done: 30, snoozed: 5,
      critical: 2, high: 4, med: 3, low: 1,
      byReason: [{ id: 'thin', label: 'Thin content', open: 5, done: 10 }],
    }

    const score = 82
    const qualitySeries = [78, 79, 80, 81, 82]
    const aiy = 8
    const byTemplate = [{ id: 'post', label: 'Post', pages: 120, avgQuality: 85, thin: 5 }]

    return {
      score, total, clusters, avgQuality, avgQualityPrev, qualitySeries, bands, lengthMix, thin, thinPrev, dup, cluster, freshness, schema, aiy, byTemplate, reasons, actions
    }
  }, [pages, prevPages, crawlHistory])
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}
