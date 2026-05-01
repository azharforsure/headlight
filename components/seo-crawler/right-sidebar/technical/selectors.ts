// components/seo-crawler/right-sidebar/technical/selectors.ts
import { TECH } from '../_shared/constants'

type Page = Record<string, any>

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v))
const isHtml = (p: Page) => Boolean(p?.isHtmlPage || String(p?.contentType || '').includes('html'))
const isHttps = (p: Page) => String(p?.url || '').startsWith('https://')

export type TechSummary = ReturnType<typeof computeTechSummary>

export function computeTechSummary(pages: Page[]) {
  const total = pages.length
  const htmlPages = pages.filter(isHtml)
  const html = htmlPages.length

  // ---- Status ----
  const status = { ok: 0, redirect: 0, client: 0, server: 0, blocked: 0, other: 0 }
  for (const p of pages) {
    const c = num(p.statusCode)
    if (p.status === 'Blocked by Robots.txt') status.blocked++
    else if (c >= 200 && c < 300) status.ok++
    else if (c >= 300 && c < 400) status.redirect++
    else if (c >= 400 && c < 500) status.client++
    else if (c >= 500) status.server++
    else status.other++
  }

  // ---- Indexability ----
  const indexability = {
    indexable: 0, noindex: 0, blockedRobots: 0,
    canonicalSelf: 0, canonicalDifferent: 0, canonicalMissing: 0,
    inSitemap: 0, missingFromSitemap: 0, orphan: 0,
  }
  for (const p of pages) {
    const robots = String(p.metaRobots1 || p.metaRobots || '').toLowerCase()
    if (robots.includes('noindex')) indexability.noindex++
    if (p.status === 'Blocked by Robots.txt') indexability.blockedRobots++
    if (p.indexable !== false && !robots.includes('noindex') && p.status !== 'Blocked by Robots.txt') indexability.indexable++

    if (!p.canonical) indexability.canonicalMissing++
    else if (p.canonical === p.url) indexability.canonicalSelf++
    else indexability.canonicalDifferent++

    if (p.inSitemap === true) indexability.inSitemap++
    if (p.inSitemap === false && num(p.statusCode) === 200 && isHtml(p)) indexability.missingFromSitemap++
    if (num(p.inlinks) === 0 && num(p.crawlDepth) > 0) indexability.orphan++
  }

  // ---- Crawl ----
  const redirectChains = pages.filter((p) => num(p.redirectChainLength) > TECH.redirect.chainWarn).length
  const redirectLoops = pages.filter((p) => p.isRedirectLoop === true).length
  const depthBuckets = { d0_1: 0, d2_3: 0, d4_5: 0, d6: 0 }
  for (const p of pages) {
    const d = num(p.crawlDepth)
    if (!Number.isFinite(d)) continue
    if (d <= 1) depthBuckets.d0_1++
    else if (d <= 3) depthBuckets.d2_3++
    else if (d <= 5) depthBuckets.d4_5++
    else depthBuckets.d6++
  }
  const hreflangErrors = pages.filter((p) =>
    p.hreflangNoSelf === true || p.hreflangBroken === true || p.hreflangInvalid === true
  ).length

  // ---- Render ----
  const render = { static: 0, ssr: 0, csr: 0, hybrid: 0, unknown: 0 }
  for (const p of pages) {
    const r = String(p.renderingMode || p.tech?.rendering || '').toLowerCase()
    if (r === 'static') render.static++
    else if (r === 'ssr') render.ssr++
    else if (r === 'csr-blocked' || r === 'csr') render.csr++
    else if (r === 'hybrid') render.hybrid++
    else render.unknown++
  }

  // ---- Performance ----
  const cwv = {
    lcpGood: 0, lcpWarn: 0, lcpBad: 0,
    inpGood: 0, inpWarn: 0, inpBad: 0,
    clsGood: 0, clsWarn: 0, clsBad: 0,
    ttfbGood: 0, ttfbWarn: 0, ttfbBad: 0,
    n: 0,
  }
  let lcpSum = 0, lcpN = 0, inpSum = 0, inpN = 0, clsSum = 0, clsN = 0, ttfbSum = 0, ttfbN = 0
  for (const p of pages) {
    const lcp = num(p.lcp), inp = num(p.inp), cls = num(p.cls), ttfb = num(p.loadTime ?? p.ttfb)
    if (Number.isFinite(lcp)) { lcpSum += lcp; lcpN++; if (lcp <= TECH.cwv.lcpGood) cwv.lcpGood++; else if (lcp <= TECH.cwv.lcpWarn) cwv.lcpWarn++; else cwv.lcpBad++ }
    if (Number.isFinite(inp)) { inpSum += inp; inpN++; if (inp <= TECH.cwv.inpGood) cwv.inpGood++; else if (inp <= TECH.cwv.inpWarn) cwv.inpWarn++; else cwv.inpBad++ }
    if (Number.isFinite(cls)) { clsSum += cls; clsN++; if (cls <= TECH.cwv.clsGood) cwv.clsGood++; else if (cls <= TECH.cwv.clsWarn) cwv.clsWarn++; else cwv.clsBad++ }
    if (Number.isFinite(ttfb)){ ttfbSum += ttfb; ttfbN++; if (ttfb <= TECH.cwv.ttfbGood) cwv.ttfbGood++; else if (ttfb <= TECH.cwv.ttfbWarn) cwv.ttfbWarn++; else cwv.ttfbBad++ }
  }
  const cwvAvg = {
    lcp: lcpN ? lcpSum / lcpN : NaN,
    inp: inpN ? inpSum / inpN : NaN,
    cls: clsN ? clsSum / clsN : NaN,
    ttfb: ttfbN ? ttfbSum / ttfbN : NaN,
  }

  const blocking = {
    bigDom: pages.filter((p) => num(p.domNodeCount) > TECH.dom.warn).length,
    hugeDom: pages.filter((p) => num(p.domNodeCount) > TECH.dom.bad).length,
    blockingCss: pages.filter((p) => num(p.renderBlockingCss) > TECH.blocking.cssWarn).length,
    blockingJs: pages.filter((p) => num(p.renderBlockingJs) > TECH.blocking.jsWarn).length,
    manyThirdParty: pages.filter((p) => num(p.thirdPartyScriptCount) > TECH.thirdParty.warn).length,
  }

  // ---- Security ----
  const security = {
    httpsPages: pages.filter(isHttps).length,
    httpPages: pages.filter((p) => String(p?.url || '').startsWith('http://')).length,
    mixedContent: pages.filter((p) => p.hasMixedContent === true).length,
    sslInvalid: pages.filter((p) => p.sslValid === false).length,
    sslExpiringSoon: pages.filter((p) => p.sslIsExpiringSoon === true || (num(p.sslDaysUntilExpiry) > 0 && num(p.sslDaysUntilExpiry) <= TECH.ssl.expirySoonDays)).length,
    weakTls: pages.filter((p) => p.sslIsWeakProtocol === true).length,
    hstsMissing: pages.filter((p) => isHttps(p) && p.hstsMissing === true).length,
    cspMissing: pages.filter((p) => isHtml(p) && p.hasCsp === false).length,
    cspUnsafe: pages.filter((p) => p.cspHasUnsafeInline === true || p.cspHasUnsafeEval === true).length,
    xFrameMissing: pages.filter((p) => isHtml(p) && p.xFrameMissing === true).length,
    xContentMissing: pages.filter((p) => isHtml(p) && p.hasXContentTypeOptions === false).length,
    referrerMissing: pages.filter((p) => isHtml(p) && p.hasReferrerPolicy === false).length,
    permissionsMissing: pages.filter((p) => isHtml(p) && p.hasPermissionsPolicy === false).length,
    corsWildcard: pages.filter((p) => p.corsWildcard === true).length,
    insecureCookies: pages.filter((p) => num(p.insecureCookies) > 0).length,
    sameSiteMissing: pages.filter((p) => num(p.cookiesMissingSameSite) > 0).length,
    scriptsNoSri: pages.filter((p) => num(p.scriptsWithoutSri) > 0).length,
    exposedKeys: pages.filter((p) => num(p.exposedApiKeys) > 0).length,
  }

  // ---- Accessibility ----
  const a11y = {
    altMissing: sum(pages, 'missingAltImages'),
    formsNoLabel: sum(pages, 'formsWithoutLabels'),
    genericLinks: sum(pages, 'genericLinkTextCount'),
    invalidAria: sum(pages, 'invalidAriaCount'),
    tablesNoHeader: sum(pages, 'tablesWithoutHeaders'),
    skipLinkMissing: pages.filter((p) => isHtml(p) && p.hasSkipLink === false).length,
    mainLandmarkMissing: pages.filter((p) => isHtml(p) && p.hasMainLandmark === false).length,
    smallTap: sum(pages, 'smallTapTargets'),
    smallFonts: sum(pages, 'smallFontCount'),
    zoomDisabled: pages.filter((p) => p.viewportNoScale === true || p.viewportMaxScale1 === true).length,
  }

  // ---- Composite scores (0..100) ----
  const safeRate = (good: number, sample: number) => (sample > 0 ? (good / sample) * 100 : NaN)

  const crawlScore = compose([
    safeRate(status.ok, total),
    safeRate(html - indexability.missingFromSitemap, html),
    safeRate(html - redirectChains, html),
    safeRate(html - indexability.orphan, html),
  ])

  const indexScore = compose([
    safeRate(indexability.indexable, html),
    safeRate(indexability.canonicalSelf + indexability.canonicalDifferent, html),
    safeRate(html - indexability.noindex, html),
  ])

  const renderScore = compose([
    safeRate(render.static + render.ssr + render.hybrid, total),
    safeRate(total - render.csr, total),
  ])

  const perfScore = compose([
    safeRate(cwv.lcpGood, lcpN),
    safeRate(cwv.inpGood, inpN),
    safeRate(cwv.clsGood, clsN),
    safeRate(cwv.ttfbGood, ttfbN),
  ])

  const secScore = compose([
    safeRate(security.httpsPages, total),
    safeRate(html - security.cspMissing, html),
    safeRate(security.httpsPages - security.hstsMissing, security.httpsPages),
    safeRate(total - security.sslInvalid, total),
    safeRate(total - security.exposedKeys, total),
  ])

  const a11yPenalty =
    a11y.altMissing * 0.1 +
    a11y.formsNoLabel * 1 +
    a11y.invalidAria * 0.5 +
    a11y.tablesNoHeader * 0.5 +
    a11y.smallTap * 0.2 +
    a11y.mainLandmarkMissing * 0.5 +
    a11y.skipLinkMissing * 0.3
  const a11yScore = clamp(100 - a11yPenalty / Math.max(html, 1) * 100, 0, 100)

  const overall = avgFinite([crawlScore, indexScore, renderScore, perfScore, secScore, a11yScore])

  return {
    total, html,
    status,
    indexability,
    crawl: { redirectChains, redirectLoops, depthBuckets, hreflangErrors },
    render,
    cwv, cwvAvg,
    blocking,
    security,
    a11y,
    scores: { overall, crawl: crawlScore, index: indexScore, render: renderScore, perf: perfScore, security: secScore, a11y: a11yScore },
  }
}

function sum(pages: Page[], key: string) {
  let n = 0
  for (const p of pages) { const v = num(p[key]); if (Number.isFinite(v)) n += v }
  return n
}
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)) }
function avgFinite(arr: number[]) {
  const ok = arr.filter(Number.isFinite); return ok.length ? ok.reduce((s, x) => s + x, 0) / ok.length : NaN
}
function compose(arr: number[]) { return avgFinite(arr) }
