import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'

export type ActionTone = 'critical' | 'high' | 'med' | 'low' | 'hygiene'

export type RsAction = {
  id: string
  tabId: string
  title: string
  detail?: string
  url?: string
  tone: ActionTone
  effortMinutes: number
  forecastClicks?: number
  forecastRevenue?: number
  confidence: number
  category: string
  drill?: { type: 'page'; url: string } | { type: 'category'; macro: string; cat: string }
}

type Predicate = {
  id: string
  tabId: string
  category: string
  tone: ActionTone
  effortMinutes: number
  confidence: number
  test: (p: any, ctx: any) => boolean
  build: (p: any, ctx: any) => Omit<RsAction, 'id' | 'tabId' | 'category' | 'tone' | 'effortMinutes' | 'confidence'>
}

const PREDICATES: Predicate[] = [
  {
    id: 'missing-h1', tabId: 'content', category: 'quality', tone: 'high',
    effortMinutes: 10, confidence: 0.9,
    test: (p) => !p.h1 && p.isHtmlPage,
    build: (p) => ({ title: 'Add missing H1 tag', url: p.url, drill: { type: 'page', url: p.url } }),
  },
  {
    id: 'weak-title', tabId: 'content', category: 'quality', tone: 'med',
    effortMinutes: 15, confidence: 0.8,
    test: (p) => p.title?.length < 10 && p.isHtmlPage,
    build: (p) => ({ title: 'Improve weak title tag', detail: p.title, url: p.url, drill: { type: 'page', url: p.url } }),
  },
  {
    id: 'thin-content', tabId: 'content', category: 'quality', tone: 'high',
    effortMinutes: 60, confidence: 0.7,
    test: (p) => Number(p.wordCount) < 300 && p.isHtmlPage,
    build: (p) => ({ title: 'Expand thin content', detail: `${p.wordCount} words`, url: p.url, drill: { type: 'page', url: p.url } }),
  },
  {
    id: 'missing-meta', tabId: 'content', category: 'quality', tone: 'med',
    effortMinutes: 10, confidence: 0.85,
    test: (p) => !p.metaDescription && p.isHtmlPage,
    build: (p) => ({ title: 'Add missing meta description', url: p.url, drill: { type: 'page', url: p.url } }),
  },
  {
    id: 'slow-lcp', tabId: 'uxConversion', category: 'cwv', tone: 'high',
    effortMinutes: 120, confidence: 0.75,
    test: (p) => Number(p.lcpMs) > 2500,
    build: (p) => ({ title: 'Fix slow LCP (>2.5s)', detail: `${p.lcpMs}ms`, url: p.url, drill: { type: 'page', url: p.url } }),
  },
  {
    id: 'layout-shift', tabId: 'uxConversion', category: 'cwv', tone: 'med',
    effortMinutes: 60, confidence: 0.8,
    test: (p) => Number(p.cls) > 0.1,
    build: (p) => ({ title: 'Reduce cumulative layout shift', detail: `CLS ${p.cls}`, url: p.url, drill: { type: 'page', url: p.url } }),
  },
  {
    id: 'broken-link', tabId: 'technical', category: 'crawl', tone: 'critical',
    effortMinutes: 5, confidence: 0.95,
    test: (p) => Number(p.statusCode) >= 400,
    build: (p) => ({ title: 'Fix broken link (4xx)', detail: `Status ${p.statusCode}`, url: p.url, drill: { type: 'page', url: p.url } }),
  },
  {
    id: 'missing-canonical', tabId: 'technical', category: 'indexability', tone: 'med',
    effortMinutes: 10, confidence: 0.9,
    test: (p) => !p.canonicalUrl && p.isHtmlPage,
    build: (p) => ({ title: 'Set missing canonical URL', url: p.url, drill: { type: 'page', url: p.url } }),
  },
  {
    id: 'missing-alt', tabId: 'uxConversion', category: 'accessibility', tone: 'low',
    effortMinutes: 5, confidence: 0.6,
    test: (p) => Number(p.imagesMissingAlt) > 0,
    build: (p) => ({ title: 'Add missing alt text', detail: `${p.imagesMissingAlt} images`, url: p.url, drill: { type: 'page', url: p.url } }),
  },
  {
    id: 'blocked-bot', tabId: 'technical', category: 'crawl', tone: 'high',
    effortMinutes: 10, confidence: 0.95,
    test: (p) => p.blockedByRobots === true,
    build: (p) => ({ title: 'Unblock page in robots.txt', url: p.url, drill: { type: 'page', url: p.url } }),
  },
]

export function useActions(tabFilter?: string): RsAction[] {
  const ctx = useSeoCrawler() as any
  return useMemo(() => {
    const out: RsAction[] = []
    const seen = new Set<string>()
    for (const pred of PREDICATES) {
      if (tabFilter && pred.tabId !== tabFilter && tabFilter !== 'fullAudit') continue
      for (const p of (ctx.pages || [])) {
        if (!pred.test(p, ctx)) continue
        const built = pred.build(p, ctx)
        const id = `${pred.id}::${built.url || pred.id}`
        if (seen.has(id)) continue
        seen.add(id)
        out.push({
          id, tabId: pred.tabId, category: pred.category,
          tone: pred.tone, effortMinutes: pred.effortMinutes, confidence: pred.confidence,
          ...built,
        })
      }
    }
    return out.sort((a, b) => score(b) - score(a)).slice(0, 50)
  }, [ctx, tabFilter])
}

function score(a: RsAction): number {
  const impact = (a.forecastClicks || 1) * a.confidence
  const effort = Math.max(5, a.effortMinutes)
  return impact / effort
}
