// services/right-sidebar/fullAudit.ts
import type { CrawledPage } from '../CrawlDatabase'
import type { RsModeBundle, RsDataDeps } from './types'
import type { FullAuditStats } from './fullAudit.types'
import {
  countWhere, isIndexable, hasTitle, hasMetaDescription, hasH1, isThin,
  pct, score100, topN, dedupCount, avg, histogram,
} from './_helpers'
import {
  FullOverviewTab, FullTechTab, FullContentTab, FullLinksTab, FullActionsTab,
} from '../../components/seo-crawler/right-sidebar/modes/fullAudit'

const STATUS_COLOR = { '2xx': '#34d399', '3xx': '#60a5fa', '4xx': '#fbbf24', '5xx': '#fb7185' } as const

function bucketStatus(s: number): '2xx'|'3xx'|'4xx'|'5xx'|null {
  if (s >= 200 && s < 300) return '2xx'
  if (s >= 300 && s < 400) return '3xx'
  if (s >= 400 && s < 500) return '4xx'
  if (s >= 500 && s < 600) return '5xx'
  return null
}

export function computeFullAuditStats(deps: RsDataDeps): FullAuditStats {
  const pages = deps.pages ?? []
  const n = pages.length
  const wqa = deps.wqaState ?? {}
  const conn = deps.integrationConnections ?? {}

  // ---------- Coverage / health primitives ----------
  const indexable = countWhere(pages, isIndexable)
  const withTitle = countWhere(pages, hasTitle)
  const withDesc  = countWhere(pages, hasMetaDescription)
  const withH1    = countWhere(pages, hasH1)
  const thin      = countWhere(pages, isThin)
  const https     = countWhere(pages, p => (p.url || '').startsWith('https://'))
  const broken    = countWhere(pages, p => (p.statusCode ?? p.status ?? 0) >= 400)
  const schemaOk  = countWhere(pages, p => (p.schemaTypes?.length ?? 0) > 0)
  const inSitemap = countWhere(pages, p => p.inSitemap === true)
  const respTimes = pages.map(p => p.loadTime ?? 0).filter(x => x > 0)
  const avgResp = respTimes.length ? Math.round(avg(respTimes)) : null
  const dupTitles = dedupCount(pages, p => p.title?.trim() || null)
  const dupDescs  = dedupCount(pages, p => p.metaDesc?.trim() || null)
  const wordSum = pages.reduce((s, p) => s + (p.wordCount ?? 0), 0)
  const avgWords = n ? Math.round(wordSum / n) : 0

  // Status mix
  const mix: Record<'2xx'|'3xx'|'4xx'|'5xx', number> = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 }
  for (const p of pages) {
    const code = bucketStatus(p.statusCode ?? p.status ?? 0)
    if (code) mix[code] += 1
  }
  const statusMix = (['2xx','3xx','4xx','5xx'] as const).map(c => ({ code: c, count: mix[c], color: STATUS_COLOR[c] }))

  // Crawl depth
  const depths = pages.map(p => Number(p.crawlDepth ?? 0)).filter(Number.isFinite)
  const avgDepth = depths.length ? Number((depths.reduce((s, d) => s + d, 0) / depths.length).toFixed(1)) : 0
  const depthHist = histogram(depths, [0, 1, 2, 3, 4, 5]).map((v, i) => ({
    label: i === 5 ? '5+' : String(i),
    value: v,
  }))

  // Links
  const internalSum = pages.reduce((s, p) => s + (p.internalLinks?.length ?? 0), 0)
  const externalSum = pages.reduce((s, p) => s + (p.externalLinks?.length ?? 0), 0)
  const orphans   = countWhere(pages, p => (p.inlinks ?? 0) === 0)
  const redirects = countWhere(pages, p => {
    const s = p.statusCode ?? p.status ?? 0
    return s >= 300 && s < 400
  })
  const brokenLnk = pages.reduce((s, p) => s + (p.brokenLinkCount ?? 0), 0)

  const inlinkSorted = pages
    .map(p => Number(p.inlinks ?? 0))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)
  const inlinkDistribution = inlinkSorted.slice(0, 60)

  const topHubs = pages
    .filter(p => (p.inlinks ?? 0) > 0)
    .sort((a, b) => (b.inlinks ?? 0) - (a.inlinks ?? 0))
    .slice(0, 5)
    .map(p => ({ url: p.url, inlinks: p.inlinks ?? 0 }))

  const topOrphans = pages
    .filter(p => (p.inlinks ?? 0) === 0)
    .sort((a, b) => (a.crawlDepth ?? 99) - (b.crawlDepth ?? 99))
    .slice(0, 5)
    .map(p => ({ url: p.url, depth: p.crawlDepth ?? 0 }))

  const externalCounts = new Map<string, number>()
  for (const p of pages) {
    for (const link of p.externalLinks ?? []) {
      try {
        const host = new URL(link).hostname.replace(/^www\./, '')
        externalCounts.set(host, (externalCounts.get(host) ?? 0) + 1)
      } catch { /* ignore */ }
    }
  }
  const externalDomains = [...externalCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }))

  // ---------- GSC search ----------
  const gscConnected = !!(conn.gsc?.connected || conn['google.gsc']?.connected)
  const search: FullAuditStats['search'] = gscConnected
    ? (() => {
        const totalClicks = pages.reduce((s, p) => s + (Number(p.gscClicks) || 0), 0)
        const totalImpressions = pages.reduce((s, p) => s + (Number(p.gscImpressions) || 0), 0)
        const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
        const positions = pages.map(p => Number(p.gscPosition || 0)).filter(v => v > 0)
        const avgPosition = positions.length ? Number(avg(positions).toFixed(1)) : null

        // Trend = sum of per-day clicks if available; fallback = sorted descending top-30 page clicks
        const trendKeys = pages[0]?.gscClicksTrend?.length
          ? pages[0].gscClicksTrend!.map((_: number, i: number) =>
              pages.reduce((s, p) => s + (Number(p.gscClicksTrend?.[i]) || 0), 0))
          : pages.map(p => Number(p.gscClicks) || 0).sort((a, b) => b - a).slice(0, 30)

        return {
          connected: true,
          totalClicks,
          totalImpressions,
          avgCtr,
          avgPosition,
          clicksTrend: trendKeys,
          pagesLosingTraffic: countWhere(pages, p => Number(p.sessionsDeltaPct ?? 0) < -0.1),
          pagesGainingTraffic: countWhere(pages, p => Number(p.sessionsDeltaPct ?? 0) > 0.1),
        }
      })()
    : null

  // ---------- Risk signals ----------
  const risk = {
    losingTraffic: search?.pagesLosingTraffic ?? countWhere(pages, p => p.isLosingTraffic === true),
    declining: countWhere(pages, p => Number(p.gscPositionDelta ?? 0) > 5), // worse position
    broken,
    orphans,
    redirectChains: redirects,
    duplicateTitles: dupTitles,
  }

  // ---------- Performance (PSI / CrUX) ----------
  const psiConnected = !!(conn.psi?.connected || conn['google.psi']?.connected || conn.crux?.connected)
  const lcps = pages.map(p => Number(p.lcp ?? p.fieldLcp ?? 0)).filter(v => v > 0)
  const clss = pages.map(p => Number(p.cls ?? p.fieldCls ?? 0)).filter(v => v >= 0)
  const inps = pages.map(p => Number(p.inp ?? p.fieldInp ?? 0)).filter(v => v > 0)
  const cwvPass = countWhere(pages, p => {
    const lcp = Number(p.lcp ?? p.fieldLcp ?? 0)
    const cls = Number(p.cls ?? p.fieldCls ?? 0)
    const inp = Number(p.inp ?? p.fieldInp ?? 0)
    return lcp > 0 && lcp <= 2500 && cls <= 0.1 && (inp === 0 || inp <= 200)
  })

  const cwv = {
    connected: psiConnected || lcps.length > 0,
    lcpMs: lcps.length ? Math.round(avg(lcps)) : null,
    cls: clss.length ? Number(avg(clss).toFixed(2)) : null,
    inpMs: inps.length ? Math.round(avg(inps)) : null,
    passRatePct: lcps.length ? pct(cwvPass, n) : null,
  }

  // ---------- Radar (5 axes) ----------
  const radar: FullAuditStats['radar'] = [
    { axis: 'Tech',    value: score100([
      { weight: 2, value: pct(https, n) },
      { weight: 1, value: avgResp == null ? 50 : Math.max(0, 100 - avgResp / 30) },
      { weight: 2, value: pct(indexable, n) },
      { weight: 1, value: 100 - pct(broken, n) },
    ])},
    { axis: 'Content', value: score100([
      { weight: 1, value: pct(withTitle, n) },
      { weight: 1, value: pct(withDesc, n) },
      { weight: 1, value: pct(withH1, n) },
      { weight: 1, value: 100 - pct(thin, n) },
    ])},
    { axis: 'Links',   value: score100([
      { weight: 1, value: 100 - pct(orphans, n) },
      { weight: 1, value: 100 - pct(redirects, n) },
      { weight: 1, value: brokenLnk === 0 ? 100 : Math.max(0, 100 - brokenLnk) },
    ])},
    { axis: 'Schema',  value: pct(schemaOk, n) },
    { axis: 'Speed',   value: cwv.passRatePct ?? 50 },
  ]
  const overallScore = Math.round(radar.reduce((s, r) => s + r.value, 0) / radar.length)

  // ---------- Hero chips ----------
  const heroChips: FullAuditStats['heroChips'] = [
    { label: 'Indexable', value: `${pct(indexable, n)}%`, tone: pct(indexable, n) >= 80 ? 'good' : 'warn' },
    { label: 'HTTPS',     value: `${pct(https, n)}%`,     tone: pct(https, n) >= 95 ? 'good' : 'bad' },
    { label: 'Broken',    value: `${broken}`,             tone: broken === 0 ? 'good' : 'bad' },
    { label: 'Schema',    value: `${pct(schemaOk, n)}%`,  tone: pct(schemaOk, n) >= 60 ? 'good' : 'warn' },
  ]
  if (wqa.detectedCms)      heroChips.push({ label: 'CMS',  value: wqa.detectedCms, tone: 'info' })
  if (wqa.detectedLanguage) heroChips.push({ label: 'Lang', value: wqa.detectedLanguage, tone: 'info' })

  // ---------- Readability ----------
  const reads = pages.map(p => Number(p.readability ?? 0)).filter(v => v > 0)
  const readabilityAvg = reads.length ? Math.round(avg(reads)) : null
  const readabilityHist = histogram(reads, [0, 30, 50, 60, 70, 80, 100])
    .map((v, i) => ({ label: ['<30','30-50','50-60','60-70','70-80','80+'][i], value: v }))

  // ---------- Topics ----------
  const topicCounts = new Map<string, number>()
  for (const p of pages) {
    const t = (p.topicCluster as string | undefined) || ''
    if (!t) continue
    topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1)
  }
  const topTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }))

  const authorOk = countWhere(pages, p => Boolean(p.author && String(p.author).trim()))
  const authorCoveragePct = pct(authorOk, n)

  // ---------- Actions ----------
  const actions: FullAuditStats['actions'] = [
    { id: 'add-titles',     label: `Add titles to ${n - withTitle} pages`,        effort: 'low',    impact: n - withTitle, band: 'content', filter: { missing: 'title' } },
    { id: 'add-desc',       label: `Add descriptions to ${n - withDesc} pages`,    effort: 'low',    impact: n - withDesc,  band: 'content', filter: { missing: 'description' } },
    { id: 'add-h1',         label: `Add H1 to ${n - withH1} pages`,                effort: 'low',    impact: n - withH1,    band: 'content', filter: { missing: 'h1' } },
    { id: 'expand-thin',    label: `Expand ${thin} thin pages (<300 words)`,       effort: 'medium', impact: thin,           band: 'content', filter: { thin: true } },
    { id: 'fix-dup-titles', label: `Resolve ${dupTitles} duplicate titles`,        effort: 'medium', impact: dupTitles,      band: 'content', filter: { dupTitles: true } },
    { id: 'fix-broken',     label: `Fix ${broken} broken pages (4xx/5xx)`,         effort: 'high',   impact: broken,         band: 'tech',    filter: { statusCodeBucket: ['4xx','5xx'] } },
    { id: 'fix-orphans',    label: `Internal-link ${orphans} orphan pages`,        effort: 'medium', impact: orphans,        band: 'links',   filter: { orphans: true } },
    { id: 'add-schema',     label: `Add schema to ${n - schemaOk} pages`,          effort: 'medium', impact: n - schemaOk,   band: 'schema',  filter: { missing: 'schema' } },
    { id: 'fix-redirects',  label: `Resolve ${redirects} redirect chains`,         effort: 'medium', impact: redirects,      band: 'links',   filter: { statusCodeBucket: ['3xx'] } },
    { id: 'cwv-lcp',        label: `Improve LCP on ${countWhere(pages, p => Number(p.lcp ?? 0) > 2500)} slow pages`, effort: 'high', impact: countWhere(pages, p => Number(p.lcp ?? 0) > 2500), band: 'tech', filter: { lcpOver: 2500 } },
  ].filter(a => a.impact > 0)

  return {
    overallScore, radar, heroChips,
    fingerprint: {
      domain: deps.domain ?? wqa.domain ?? '',
      cms: wqa.detectedCms ?? null,
      language: wqa.detectedLanguage ?? null,
      industry: deps.industry ?? null,
      isMultiLanguage: !!wqa.isMultiLanguage,
      jsFramework: wqa.jsFramework ?? null,
      pageCount: n,
    },
    search,
    risk,
    tech: {
      httpsPct: pct(https, n),
      avgResponseMs: avgResp,
      indexablePct: pct(indexable, n),
      nonIndexablePct: 100 - pct(indexable, n),
      brokenPages: broken,
      schemaCoveragePct: pct(schemaOk, n),
      statusMix,
      sitemapCoveragePct: pct(inSitemap, n),
      robotsPresent: !!wqa.robotsPresent,
      avgCrawlDepth: avgDepth,
      depthHistogram: depthHist,
      cwv,
    },
    content: {
      titleCoveragePct: pct(withTitle, n),
      descCoveragePct: pct(withDesc, n),
      h1CoveragePct: pct(withH1, n),
      thinPct: pct(thin, n),
      avgWords,
      dupTitles, dupDescriptions: dupDescs,
      readabilityAvg,
      readabilityHistogram: readabilityHist,
      topTopics,
      authorCoveragePct,
    },
    links: {
      avgInternalLinks: n ? Math.round(internalSum / n) : 0,
      avgExternalLinks: n ? Math.round(externalSum / n) : 0,
      orphanPages: orphans,
      redirectChains: redirects,
      brokenLinks: brokenLnk,
      inlinkDistribution,
      topHubs,
      topOrphans,
      externalDomains,
    },
    actions: topN(actions, 12, a => a.impact),
  }
}

export const fullAuditBundle: RsModeBundle<FullAuditStats> = {
  mode: 'fullAudit',
  accent: 'slate',
  defaultTabId: 'full_overview',
  tabs: [
    { id: 'full_overview', label: 'Overview', Component: FullOverviewTab },
    { id: 'full_tech',     label: 'Tech',     Component: FullTechTab },
    { id: 'full_content',  label: 'Content',  Component: FullContentTab },
    { id: 'full_links',    label: 'Links',    Component: FullLinksTab },
    { id: 'full_actions',  label: 'Actions',  Component: FullActionsTab },
  ],
  computeStats: computeFullAuditStats,
}
