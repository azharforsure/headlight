import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useContentInsights() {
  const { pages } = useSeoCrawler()
  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter(p => p.isHtmlPage)
    const total = html.length

    const wordsBuckets = {
      thin:    html.filter(p => Number(p.wordCount) < 300).length,
      light:   html.filter(p => Number(p.wordCount) >= 300 && Number(p.wordCount) < 800).length,
      med:     html.filter(p => Number(p.wordCount) >= 800 && Number(p.wordCount) < 1500).length,
      long:    html.filter(p => Number(p.wordCount) >= 1500 && Number(p.wordCount) < 3000).length,
      xlong:   html.filter(p => Number(p.wordCount) >= 3000).length,
    }

    const dup = {
      exact:    html.filter(p => p.duplicate === true).length,
      near:     html.filter(p => Number(p.nearDuplicateScore) > 0.85).length,
      cannibal: html.filter(p => p.isCannibalized === true).length,
    }

    const fresh = {
      lt7d:   html.filter(p => Number(p.daysSinceUpdated) < 7).length,
      lt30d:  html.filter(p => Number(p.daysSinceUpdated) < 30).length,
      lt90d:  html.filter(p => Number(p.daysSinceUpdated) < 90).length,
      lt365d: html.filter(p => Number(p.daysSinceUpdated) < 365).length,
      stale:  html.filter(p => Number(p.daysSinceUpdated) >= 365).length,
    }

    const schemaCoverage = {
      article:  safePct(html.filter(p => Array.isArray(p.schemaTypes) && p.schemaTypes.some(t => /Article|BlogPosting|NewsArticle/i.test(t))).length, total),
      product:  safePct(html.filter(p => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('Product')).length, total),
      faq:      safePct(html.filter(p => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('FAQPage')).length, total),
      howto:    safePct(html.filter(p => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('HowTo')).length, total),
      breadcrumb: safePct(html.filter(p => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('BreadcrumbList')).length, total),
    }

    const eeat = {
      withByline: safePct(html.filter(p => Boolean(p.author)).length, total),
      withBio:    safePct(html.filter(p => p.authorBioPresent === true).length, total),
      cited:      safePct(html.filter(p => Number(p.externalCitationCount) > 0).length, total),
    }

    const topics = (() => {
      const counts: Record<string, number> = {}
      for (const p of html) if (p.topicCluster) counts[p.topicCluster] = (counts[p.topicCluster] || 0) + 1
      return Object.entries(counts).sort((a,b) => b[1]-a[1])
    })()

    return { total, wordsBuckets, dup, fresh, schemaCoverage, eeat, topics }
  }, [pages])
}
