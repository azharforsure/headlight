import { useMemo } from 'react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'

type Page = any

export type WqaInsights = ReturnType<typeof computeWqaInsights>

export function useWqaInsights() {
    const crawler = useSeoCrawler()
    const { pages, crawlHistory, currentSessionId } = crawler
    const compareSession = (crawler as any).compareSession
    const prevPages: Page[] = compareSession?.pages || []
    return useMemo(() => computeWqaInsights(pages || [], prevPages, crawlHistory, currentSessionId), [pages, prevPages, crawlHistory, currentSessionId])
}

function computeWqaInsights(pages: Page[], prev: Page[], history: any[], sessionId: string | null) {
    const total = pages.length
    if (total === 0) {
        return EMPTY_INSIGHTS
    }

    // ── Quality score (site-level) ──────────────────────────
    // Fallback logic: if pages don't have qualityScore (AI), compute a health score
    // based on technical signals (indexable, status, title, meta)
    const scores = pages.map(p => {
        if (num(p.qualityScore) > 0) return num(p.qualityScore)
        
        let s = 0
        if (p.statusCode >= 200 && p.statusCode < 300) s += 40
        if (p.indexable !== false) s += 20
        if (p.title && p.title.length > 10) s += 20
        if (p.metaDesc && p.metaDesc.length > 50) s += 20
        return s
    })
    
    const qOverall = avg(scores)
    const qPrev = avg(prev.map(p => {
        if (num(p.qualityScore) > 0) return num(p.qualityScore)
        let s = 0
        if (p.statusCode >= 200 && p.statusCode < 300) s += 40
        if (p.indexable !== false) s += 20
        if (p.title && p.title.length > 10) s += 20
        if (p.metaDesc && p.metaDesc.length > 50) s += 20
        return s
    }))

    const qBins = [
        { label: '0-20', count: scores.filter(s => s < 20).length, tone: 'bad' as const },
        { label: '20-40', count: scores.filter(s => s >= 20 && s < 40).length, tone: 'bad' as const },
        { label: '40-60', count: scores.filter(s => s >= 40 && s < 60).length, tone: 'warn' as const },
        { label: '60-80', count: scores.filter(s => s >= 60 && s < 80).length, tone: 'good' as const },
        { label: '80-100', count: scores.filter(s => s >= 80).length, tone: 'good' as const },
    ]

    // ── Pillar scores ───────────────────────────────────────
    const pillars = {
        content: avg(pages.map(p => num(p.contentQualityScore) || (num(p.wordCount) > 800 ? 90 : num(p.wordCount) > 300 ? 60 : 30))),
        search: avg(pages.map(p => num(p.searchVisibilityScore) || (num(p.gscImpressions) > 100 ? 80 : num(p.gscImpressions) > 0 ? 40 : 10))),
        tech: avg(pages.map(p => num(p.techHealthScore) || (p.statusCode < 300 ? 95 : p.statusCode < 400 ? 70 : 20))),
        engagement: avg(pages.map(p => num(p.engagementScore) || (num(p.ga4Sessions) > 0 ? 75 : 40))),
        authority: avg(pages.map(p => num(p.authorityScore || p.authorityComputedScore) || (num(p.inlinks) > 10 ? 60 : 30))),
        eeat: avg(pages.map(p => num(p.eeatScore) || (p.author ? 80 : 40))),
    }

    // ── Search ──────────────────────────────────────────────
    const clicks = sum(pages.map(p => num(p.gscClicks)))
    const clicksPrev = sum(prev.map(p => num(p.gscClicks)))
    const impr = sum(pages.map(p => num(p.gscImpressions)))
    const imprPrev = sum(prev.map(p => num(p.gscImpressions)))
    const ctr = impr > 0 ? clicks / impr : 0
    const ctrPrev = imprPrev > 0 ? clicksPrev / imprPrev : 0
    const positions = pages.map(p => num(p.gscPosition)).filter(n => n > 0)
    const avgPos = avg(positions)
    const posPrev = avg(prev.map(p => num(p.gscPosition)).filter(n => n > 0))

    const rankBuckets = {
        top3: positions.filter(p => p <= 3).length,
        top10: positions.filter(p => p > 3 && p <= 10).length,
        striking: positions.filter(p => p > 10 && p <= 20).length,
        tail: positions.filter(p => p > 20 && p <= 50).length,
        beyond: positions.filter(p => p > 50).length,
    }

    const winners = [...pages]
        .filter(p => num(p.gscClicks) > 0)
        .sort((a, b) => clicksDelta(b, prev) - clicksDelta(a, prev))
        .slice(0, 5)
    const losers = [...pages]
        .filter(p => num(p.gscClicks) >= 0)
        .sort((a, b) => clicksDelta(a, prev) - clicksDelta(b, prev))
        .slice(0, 5)

    // ── Content ─────────────────────────────────────────────
    const wcDist = [
        { label: '<300', count: pages.filter(p => num(p.wordCount) < 300).length, tone: 'bad' as const },
        { label: '300-800', count: pages.filter(p => num(p.wordCount) >= 300 && num(p.wordCount) < 800).length, tone: 'warn' as const },
        { label: '800-1500', count: pages.filter(p => num(p.wordCount) >= 800 && num(p.wordCount) < 1500).length, tone: 'good' as const },
        { label: '1500-3k', count: pages.filter(p => num(p.wordCount) >= 1500 && num(p.wordCount) < 3000).length, tone: 'good' as const },
        { label: '3k+', count: pages.filter(p => num(p.wordCount) >= 3000).length, tone: 'good' as const },
    ]
    const readability = avg(pages.map(p => num(p.readability)))
    const freshDays = pages.map(p => num(p.daysSinceUpdate)).filter(n => n > 0)
    const freshAvg = avg(freshDays)
    const stale = pages.filter(p => num(p.daysSinceUpdate) > 365).length
    const dupes = pages.filter(p => p.isDuplicate || p.duplicateGroupId).length
    const cannibal = pages.filter(p => p.cannibalizationFlag).length

    const eeat = {
        bylines: pct(pages.filter(p => p.author || p.byline).length, total),
        bios: pct(pages.filter(p => p.authorBioPresent).length, total),
        citations: pct(pages.filter(p => num(p.externalCitations) > 0).length, total),
        updated: pct(pages.filter(p => p.visibleDate).length, total),
    }

    const schemaCoverage = {
        article: pct(pages.filter(p => hasSchema(p, 'Article')).length, total),
        product: pct(pages.filter(p => hasSchema(p, 'Product')).length, total),
        faq: pct(pages.filter(p => hasSchema(p, 'FAQPage')).length, total),
        howto: pct(pages.filter(p => hasSchema(p, 'HowTo')).length, total),
    }

    // ── Tech ────────────────────────────────────────────────
    const status = {
        ok: pages.filter(p => p.statusCode >= 200 && p.statusCode < 300).length,
        redirect: pages.filter(p => p.statusCode >= 300 && p.statusCode < 400).length,
        client: pages.filter(p => p.statusCode >= 400 && p.statusCode < 500).length,
        server: pages.filter(p => p.statusCode >= 500).length,
    }
    const indexable = pages.filter(p => p.indexable !== false).length
    const noindex = pages.filter(p => (p.metaRobots1 || '').toLowerCase().includes('noindex')).length
    const blocked = pages.filter(p => p.status === 'Blocked by Robots.txt').length
    const canonMismatch = pages.filter(p => p.canonical && p.canonical !== p.url).length

    const cwv = {
        lcpGood: pages.filter(p => num(p.lcp) > 0 && num(p.lcp) <= 2500).length,
        lcpPoor: pages.filter(p => num(p.lcp) > 4000).length,
        clsGood: pages.filter(p => num(p.cls) >= 0 && num(p.cls) <= 0.1).length,
        clsPoor: pages.filter(p => num(p.cls) > 0.25).length,
        inpGood: pages.filter(p => num(p.inp) > 0 && num(p.inp) <= 200).length,
        inpPoor: pages.filter(p => num(p.inp) > 500).length,
    }
    const ttfb = avg(pages.map(p => num(p.loadTime)).filter(n => n > 0))
    const orphans = pages.filter(p => num(p.inlinks) === 0 && num(p.crawlDepth) > 0).length
    const deep = pages.filter(p => num(p.crawlDepth) > 5).length

    // ── Categories ──────────────────────────────────────────
    const categories = countBy(pages, p => p.category || p.pageCategory || 'general')

    // ── Actions ─────────────────────────────────────────────
    const actionBuckets = countBy(pages, p => p.recommendedAction || 'Monitor')
    const priorityCounts = {
        high: pages.filter(p => isHighPriority(p)).length,
        med: pages.filter(p => isMedPriority(p)).length,
        low: pages.filter(p => isLowPriority(p)).length,
    }
    const topActions = Object.entries(actionBuckets)
        .filter(([k]) => k !== 'Monitor')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([title, count]) => ({
            title,
            count,
            priority: count >= 30 ? 'high' as const : count >= 10 ? 'med' as const : 'low' as const,
            forecast: estForecast(title, count),
        }))

    // ── Alerts ──────────────────────────────────────────────
    const alerts: { tone: 'bad' | 'warn'; text: string }[] = []
    if (status.server > 0) alerts.push({ tone: 'bad', text: `${status.server} pages returning 5xx errors` })
    if (status.client > 0) alerts.push({ tone: 'bad', text: `${status.client} pages returning 4xx errors` })
    if (orphans > 0) alerts.push({ tone: 'warn', text: `${orphans} orphan pages with zero inlinks` })
    if (cwv.lcpPoor > 0) alerts.push({ tone: 'warn', text: `${cwv.lcpPoor} pages with poor LCP` })
    if (stale > 0) alerts.push({ tone: 'warn', text: `${stale} articles untouched in over a year` })
    if (priorityCounts.high > 0) alerts.push({ tone: 'bad', text: `${priorityCounts.high} pages need urgent action` })

    // ── History trend ───────────────────────────────────────
    const trend = (history || [])
        .filter(s => s?.completedAt)
        .slice(-12)
        .map(s => num(s.summary?.qOverall ?? s.qScore))

    return {
        total,
        qOverall,
        qPrev,
        qBins,
        pillars,
        clicks, clicksPrev, impr, imprPrev, ctr, ctrPrev, avgPos, posPrev,
        rankBuckets, winners, losers,
        wcDist, readability, freshAvg, stale, dupes, cannibal, eeat, schemaCoverage,
        status, indexable, noindex, blocked, canonMismatch, cwv, ttfb, orphans, deep,
        categories,
        actionBuckets, priorityCounts, topActions,
        alerts,
        trend,
        history,
        sessionId,
    }
}

const EMPTY_INSIGHTS = {
    total: 0,
    qOverall: 0, qPrev: 0,
    qBins: [], pillars: { content: 0, search: 0, tech: 0, engagement: 0, authority: 0, eeat: 0 },
    clicks: 0, clicksPrev: 0, impr: 0, imprPrev: 0, ctr: 0, ctrPrev: 0, avgPos: 0, posPrev: 0,
    rankBuckets: { top3: 0, top10: 0, striking: 0, tail: 0, beyond: 0 },
    winners: [] as any[], losers: [] as any[],
    wcDist: [], readability: 0, freshAvg: 0, stale: 0, dupes: 0, cannibal: 0,
    eeat: { bylines: 0, bios: 0, citations: 0, updated: 0 },
    schemaCoverage: { article: 0, product: 0, faq: 0, howto: 0 },
    status: { ok: 0, redirect: 0, client: 0, server: 0 },
    indexable: 0, noindex: 0, blocked: 0, canonMismatch: 0,
    cwv: { lcpGood: 0, lcpPoor: 0, clsGood: 0, clsPoor: 0, inpGood: 0, inpPoor: 0 },
    ttfb: 0, orphans: 0, deep: 0,
    categories: {} as Record<string, number>,
    actionBuckets: {} as Record<string, number>,
    priorityCounts: { high: 0, med: 0, low: 0 },
    topActions: [] as { title: string; count: number; priority: 'high' | 'med' | 'low'; forecast?: string }[],
    alerts: [] as { tone: 'bad' | 'warn'; text: string }[],
    trend: [] as number[],
    history: [] as any[],
    sessionId: null as string | null,
}

// ── helpers ─────────────────────────────────────────────────
function num(v: any): number { const n = Number(v); return Number.isFinite(n) ? n : 0 }
function sum(arr: number[]): number { return arr.reduce((a, b) => a + b, 0) }
function avg(arr: number[]): number { return arr.length ? sum(arr) / arr.length : 0 }
function pct(part: number, total: number): number { return total > 0 ? (part / total) * 100 : 0 }
function countBy<T>(arr: T[], key: (x: T) => string): Record<string, number> {
    const out: Record<string, number> = {}
    for (const item of arr) { const k = key(item); out[k] = (out[k] || 0) + 1 }
    return out
}
function clicksDelta(p: any, prev: any[]): number {
    const before = prev.find(x => x.url === p.url)?.gscClicks || 0
    return num(p.gscClicks) - num(before)
}
function hasSchema(p: any, type: string): boolean {
    const types = p.schemaTypes || p.structuredDataTypes || []
    if (Array.isArray(types)) return types.some((t: string) => (t || '').includes(type))
    if (typeof types === 'string') return types.includes(type)
    return false
}
function isHighPriority(p: any): boolean {
    if (p.statusCode >= 500) return true
    if (p.statusCode >= 400 && num(p.gscClicks) > 0) return true
    if (p.indexable === false && num(p.gscClicks) > 0) return true
    if (num(p.qualityScore) < 30 && num(p.gscClicks) > 100) return true
    return false
}
function isMedPriority(p: any): boolean {
    if (isHighPriority(p)) return false
    if (num(p.qualityScore) < 50) return true
    if (num(p.lcp) > 4000) return true
    if (p.isDuplicate || p.cannibalizationFlag) return true
    return false
}
function isLowPriority(p: any): boolean {
    return !isHighPriority(p) && !isMedPriority(p) && (num(p.missingAltImages) > 0 || num(p.schemaWarnings) > 0)
}
function estForecast(action: string, count: number): string {
    const map: Record<string, number> = {
        'Fix Errors': 0.5, 'Rewrite Title & Description': 0.15, 'Push to Page One': 0.6,
        'Add Internal Links': 0.2, 'Improve Content': 0.3, 'Reduce Bounce Rate': 0.2,
        'Merge or Remove': 0.1, 'Fix Technical Issues': 0.4, 'Protect High-Value Page': 0.05,
    }
    const factor = map[action] || 0.1
    const est = Math.round(count * factor * 10)
    return est > 0 ? `+${est} clicks/mo` : ''
}
