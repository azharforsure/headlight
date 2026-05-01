import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'

export type AlertTone = 'bad' | 'warn' | 'info' | 'neutral'

export type RsAlert = {
  id: string
  tabId: string
  tone: AlertTone
  title: string
  count?: number
  detail?: string
  drill?: { type: 'page'; url: string } | { type: 'category'; macro: string; cat: string }
}

type Rule = {
  id: string
  tabId: string
  tone: AlertTone
  build: (pages: any[], ctx: any) => Omit<RsAlert, 'id' | 'tabId' | 'tone'> | null
}

const RULES: Rule[] = [
  { id: 'errors-5xx',    tabId: 'technical',     tone: 'bad',  build: (pgs) => { const n = pgs.filter(p => Number(p.statusCode) >= 500).length; return n ? { title: '5xx errors detected', count: n, drill: { type: 'category', macro: 'technical', cat: 'status:5xx' } } : null } },
  { id: 'errors-4xx',    tabId: 'fullAudit',     tone: 'bad',  build: (pgs) => { const n = pgs.filter(p => Number(p.statusCode) >= 400 && Number(p.statusCode) < 500).length; return n ? { title: '4xx broken links', count: n, drill: { type: 'category', macro: 'fullAudit', cat: 'status:4xx' } } : null } },
  { id: 'noindex-traffic', tabId: 'technical',   tone: 'bad',  build: (pgs) => { const n = pgs.filter(p => p.indexable === false && Number(p.gscClicks) > 0).length; return n ? { title: 'Noindex pages with traffic', count: n, drill: { type: 'category', macro: 'technical', cat: 'indexability:noindex' } } : null } },
  { id: 'orphans',       tabId: 'linksAuthority',tone: 'warn', build: (pgs) => { const n = pgs.filter(p => Number(p.inlinks) === 0 && Number(p.crawlDepth) > 0).length; return n ? { title: 'Orphan pages', count: n, drill: { type: 'category', macro: 'linksAuthority', cat: 'orphans' } } : null } },
  { id: 'thin',          tabId: 'content',       tone: 'warn', build: (pgs) => { const n = pgs.filter(p => Number(p.wordCount) < 300 && p.isHtmlPage).length; return n ? { title: 'Thin content pages', count: n, drill: { type: 'category', macro: 'content', cat: 'quality:thin' } } : null } },
  { id: 'duplicates',    tabId: 'content',       tone: 'warn', build: (pgs) => { const n = pgs.filter(p => p.exactDuplicate || p.nearDuplicateMatch).length; return n ? { title: 'Duplicate or near-duplicate', count: n, drill: { type: 'category', macro: 'content', cat: 'duplication' } } : null } },
  { id: 'lcp-fail',      tabId: 'uxConversion',  tone: 'bad',  build: (pgs) => { const n = pgs.filter(p => Number(p.lcpMs) > 2500).length; return n ? { title: 'LCP fails (>2.5s)', count: n, drill: { type: 'category', macro: 'uxConversion', cat: 'cwv:lcp' } } : null } },
  { id: 'cls-fail',      tabId: 'uxConversion',  tone: 'warn', build: (pgs) => { const n = pgs.filter(p => Number(p.cls) > 0.1).length; return n ? { title: 'CLS fails (>0.1)', count: n, drill: { type: 'category', macro: 'uxConversion', cat: 'cwv:cls' } } : null } },
  { id: 'stale',         tabId: 'content',       tone: 'info', build: (pgs) => { const n = pgs.filter(p => Number(p.daysSinceUpdate) > 365).length; return n ? { title: 'Stale (>1 year)', count: n } : null } },
  { id: 'redirect-chains', tabId: 'technical',   tone: 'warn', build: (pgs) => { const n = pgs.filter(p => Number(p.redirectChainLength) > 2).length; return n ? { title: 'Redirect chains (3+ hops)', count: n } : null } },
  { id: 'mixed-content', tabId: 'technical',     tone: 'warn', build: (pgs) => { const n = pgs.filter(p => p.mixedContent).length; return n ? { title: 'Mixed-content warnings', count: n } : null } },
  { id: 'broken-images', tabId: 'fullAudit',     tone: 'warn', build: (pgs) => { const n = pgs.reduce((s, p) => s + Number(p.brokenImages || 0), 0); return n ? { title: 'Broken images', count: n } : null } },
  { id: 'ai-blocked',    tabId: 'ai',            tone: 'warn', build: (_, ctx) => { const n = ctx.robots?.blockedAiBots?.length || 0; return n ? { title: `${n} AI bots blocked in robots.txt`, count: n } : null } },
  { id: 'gbp-low-score', tabId: 'local',         tone: 'warn', build: (_, ctx) => { const low = (ctx.gbpProfiles || []).filter((g: any) => Number(g.completeness) < 80).length; return low ? { title: 'GBP profiles below 80% complete', count: low } : null } },
  { id: 'paid-low-roas', tabId: 'paid',          tone: 'bad',  build: (_, ctx) => { const low = (ctx.paidCampaigns || []).filter((c: any) => Number(c.roas) < 1).length; return low ? { title: 'Campaigns under 1.0 ROAS', count: low } : null } },
  { id: 'reviews-fresh', tabId: 'local',         tone: 'info', build: (_, ctx) => { const n = (ctx.reviewSources || []).reduce((s: number, r: any) => s + Number(r.last30 || 0), 0); return n ? { title: `${n} new reviews in 30d` } : null } },
  { id: 'social-mentions', tabId: 'socialBrand', tone: 'info', build: (_, ctx) => { const n = (ctx.socialMentions || []).length; return n ? { title: `${n} brand mentions tracked` } : null } },
  { id: 'gap-keywords',  tabId: 'competitors',   tone: 'info', build: (_, ctx) => { const gaps = (ctx.competitors || []).reduce((s: number, c: any) => s + Number(c.gapCount || 0), 0); return gaps ? { title: `${gaps} gap keywords across competitors` } : null } },
  { id: 'feed-errors',   tabId: 'commerce',      tone: 'warn', build: (pgs) => { const n = pgs.filter(p => p.merchantFeedError).length; return n ? { title: 'Merchant feed errors', count: n } : null } },
  { id: 'oos-products',  tabId: 'commerce',      tone: 'warn', build: (pgs) => { const n = pgs.filter(p => p.productAvailability === 'OutOfStock').length; return n ? { title: 'Out-of-stock products indexed', count: n } : null } },
]

const TONE_RANK: Record<AlertTone, number> = { bad: 0, warn: 1, info: 2, neutral: 3 }

export function useAlerts(tabFilter?: string): RsAlert[] {
  const ctx = useSeoCrawler() as any
  return useMemo(() => {
    const out: RsAlert[] = []
    for (const r of RULES) {
      if (tabFilter && r.tabId !== tabFilter) continue
      const built = r.build(ctx.pages || [], ctx)
      if (built) out.push({ id: r.id, tabId: r.tabId, tone: r.tone, ...built })
    }
    return out.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone] || (b.count || 0) - (a.count || 0))
  }, [ctx, tabFilter])
}
