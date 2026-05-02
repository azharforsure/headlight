// components/seo-crawler/right-sidebar/full-audit/_selectors.ts
import type { Page } from '@headlight/types'
import { getAllActions } from '@headlight/actions'
import { getPageIssues } from '../../IssueTaxonomy'

export type StatusMix = { ok: number; redirect: number; clientError: number; serverError: number; total: number }
export type DepthBucket = { depth: number; count: number }
export type CategoryDonut = { name: string; value: number; color: string }
export type SeveritySplit = { critical: number; high: number; medium: number; low: number }
export type CategorySplit = Record<'content' | 'technical' | 'schema' | 'links' | 'a11y' | 'security' | 'performance' | 'ux', number>
export type IssueRow = { code: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low'; count: number; category: string }
export type Pillars = { content: number; technical: number; schema: number; links: number; a11y: number; security: number }
export type CrawlHealth = {
  startedAt: string | null
  finishedAt: string | null
  durationMs: number
  pagesCrawled: number
  avgMs: number
  p90Ms: number
  p99Ms: number
  errors: { timeouts: number; server: number; parse: number; dns: number }
  blocked: { robots: number; metaNoindex: number; auth: number }
  sitemap: { inSitemap: number; missingFromSitemap: number; orphanInSitemap: number }
  render: { staticHtml: number; ssr: number; csr: number }
}

const SEV_FROM_CODE: Record<string, IssueRow['severity']> = { S1: 'critical', S2: 'high', S3: 'medium', S4: 'low' }

export function selectStatusMix(pages: Page[]): StatusMix {
  let ok = 0, r = 0, c = 0, s = 0
  for (const p of pages) {
    const code = Number(p.statusCode ?? 0)
    if (code >= 200 && code < 300) ok++
    else if (code >= 300 && code < 400) r++
    else if (code >= 400 && code < 500) c++
    else if (code >= 500) s++
  }
  return { ok, redirect: r, clientError: c, serverError: s, total: pages.length }
}

export function selectDepthDistribution(pages: Page[], maxDepth = 6): DepthBucket[] {
  const map = new Map<number, number>()
  for (const p of pages) {
    const d = Math.min(Number(p.crawlDepth ?? 0), maxDepth)
    map.set(d, (map.get(d) ?? 0) + 1)
  }
  return Array.from({ length: maxDepth + 1 }, (_, i) => ({ depth: i, count: map.get(i) ?? 0 }))
}

export function selectCategoryDonut(pages: Page[]): CategoryDonut[] {
  let article = 0, doc = 0, product = 0, other = 0
  for (const p of pages) {
    const t = (p.pageType ?? '').toLowerCase()
    if (t === 'article' || t === 'blog' || t === 'news') article++
    else if (t === 'doc' || t === 'help' || t === 'kb') doc++
    else if (t === 'product' || t === 'collection' || t === 'pdp') product++
    else other++
  }
  return [
    { name: 'Article', value: article, color: '#3b82f6' },
    { name: 'Doc', value: doc, color: '#a78bfa' },
    { name: 'Product', value: product, color: '#10b981' },
    { name: 'Other', value: other, color: '#475569' },
  ]
}

export function selectIndexable(pages: Page[]): { indexable: number; notIndexable: number } {
  let i = 0, n = 0
  for (const p of pages) (p.indexable ? i++ : n++)
  return { indexable: i, notIndexable: n }
}

export function selectIssues(pages: Page[]): { rows: IssueRow[]; severity: SeveritySplit; category: CategorySplit; openTotal: number } {
  const counts = new Map<string, number>()
  for (const p of pages) {
    const list = getPageIssues(p) ?? []
    for (const code of list) counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  const cat: CategorySplit = { content: 0, technical: 0, schema: 0, links: 0, a11y: 0, security: 0, performance: 0, ux: 0 }
  const sev: SeveritySplit = { critical: 0, high: 0, medium: 0, low: 0 }
  const rows: IssueRow[] = []
  for (const a of getAllActions()) {
    const count = counts.get(a.code) ?? 0
    if (count === 0) continue
    const severity = SEV_FROM_CODE[a.severity] ?? 'low'
    const category = mapCategory(a.code)
    sev[severity] += count
    if (cat[category as keyof CategorySplit] !== undefined) cat[category as keyof CategorySplit] += count
    rows.push({ code: a.code, title: a.title, severity, count, category })
  }
  rows.sort((a, b) => b.count - a.count || severityRank(b.severity) - severityRank(a.severity))
  const openTotal = sev.critical + sev.high + sev.medium + sev.low
  return { rows, severity: sev, category: cat, openTotal }
}

export function selectPillars(pages: Page[]): Pillars {
  // pillar scores are precomputed by services/PostCrawlEnrichment.ts and stored on site summary
  const sum = (key: string, altKey?: string): number => {
    let n = 0, c = 0
    for (const p of pages) {
      const v = Number((p as any)[key] ?? (p as any)[altKey ?? '']);
      if (Number.isFinite(v)) { n += v; c++ }
    }
    return c ? Math.round(n / c) : 0
  }
  return {
    content: sum('contentQualityScore', 'contentScore'),
    technical: sum('techHealthScore', 'technicalScore'),
    schema: sum('schemaScore'),
    links: sum('authorityScore', 'linksScore'),
    a11y: sum('a11yScore'),
    security: sum('securityScore'),
  }
}

export function selectOverallScore(p: Pillars): number {
  const w = { content: 0.2, technical: 0.25, schema: 0.1, links: 0.15, a11y: 0.15, security: 0.15 }
  return Math.round(p.content * w.content + p.technical * w.technical + p.schema * w.schema + p.links * w.links + p.a11y * w.a11y + p.security * w.security)
}

export function selectScoreDistribution(pages: Page[]): { bucket: string; count: number }[] {
  const buckets = [0, 0, 0, 0, 0]
  for (const p of pages) {
    const s = Number((p as any).pageScore ?? 0)
    if (s < 50) buckets[0]++
    else if (s < 70) buckets[1]++
    else if (s < 80) buckets[2]++
    else if (s < 90) buckets[3]++
    else buckets[4]++
  }
  return [
    { bucket: '<50', count: buckets[0] },
    { bucket: '50-69', count: buckets[1] },
    { bucket: '70-79', count: buckets[2] },
    { bucket: '80-89', count: buckets[3] },
    { bucket: '90+', count: buckets[4] },
  ]
}

export function selectCrawlHealth(site: any): CrawlHealth {
  const s = site?.lastSession ?? {}
  return {
    startedAt: s.startedAt ?? null,
    finishedAt: s.finishedAt ?? null,
    durationMs: Number(s.durationMs ?? 0),
    pagesCrawled: Number(s.pagesCrawled ?? 0),
    avgMs: Number(s.responseAvgMs ?? 0),
    p90Ms: Number(s.responseP90Ms ?? 0),
    p99Ms: Number(s.responseP99Ms ?? 0),
    errors: {
      timeouts: Number(s.errors?.timeouts ?? 0),
      server: Number(s.errors?.server ?? 0),
      parse: Number(s.errors?.parse ?? 0),
      dns: Number(s.errors?.dns ?? 0),
    },
    blocked: {
      robots: Number(s.blocked?.robots ?? 0),
      metaNoindex: Number(s.blocked?.metaNoindex ?? 0),
      auth: Number(s.blocked?.auth ?? 0),
    },
    sitemap: {
      inSitemap: Number(s.sitemap?.inSitemap ?? 0),
      missingFromSitemap: Number(s.sitemap?.missingFromSitemap ?? 0),
      orphanInSitemap: Number(s.sitemap?.orphanInSitemap ?? 0),
    },
    render: {
      staticHtml: Number(s.render?.staticHtml ?? 0),
      ssr: Number(s.render?.ssr ?? 0),
      csr: Number(s.render?.csr ?? 0),
    },
  }
}

function mapCategory(code: string): keyof CategorySplit {
  if (code.startsWith('C')) return 'content'
  if (code.startsWith('T')) return 'technical'
  if (code.startsWith('S')) return 'schema'
  if (code.startsWith('L')) return 'links'
  if (code.startsWith('A11')) return 'a11y'
  if (code.startsWith('SE')) return 'security'
  if (code.startsWith('P')) return 'performance'
  if (code.startsWith('U')) return 'ux'
  return 'technical'
}

function severityRank(s: IssueRow['severity']) {
  return s === 'critical' ? 4 : s === 'high' ? 3 : s === 'medium' ? 2 : 1
}
