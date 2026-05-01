// components/seo-crawler/right-sidebar/technical/TechnicalActions.tsx
import React, { useMemo } from 'react'
import { ArrowRight, Wrench } from 'lucide-react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { Card, Section } from '../primitives'
import { MetricRow, EmptyState, fmtNum, type Tone } from '../_shared'
import { computeTechSummary } from './selectors'

type Action = {
  id: string
  label: string
  count: number
  tone: Tone
  band: 'blocking' | 'highLeverage' | 'hygiene'
  hint?: string
}

export function TechnicalActions() {
  const { pages, setActiveMacro } = useSeoCrawler() as any
  const s = useMemo(() => computeTechSummary(pages || []), [pages])

  const actions = useMemo<Action[]>(() => {
    const a: Action[] = []
    // Blocking
    if (s.status.server) a.push({ id: '500', label: 'Fix 5xx server errors', count: s.status.server, tone: 'bad', band: 'blocking' })
    if (s.security.sslInvalid) a.push({ id: 'ssl_invalid', label: 'Fix invalid SSL certificates', count: s.security.sslInvalid, tone: 'bad', band: 'blocking' })
    if (s.security.exposedKeys) a.push({ id: 'exposed_api_keys', label: 'Remove exposed API keys', count: s.security.exposedKeys, tone: 'bad', band: 'blocking' })
    if (s.indexability.blockedRobots) a.push({ id: 'blocked_robots', label: 'Unblock pages in robots.txt', count: s.indexability.blockedRobots, tone: 'bad', band: 'blocking' })

    // High leverage
    if (s.status.client) a.push({ id: '404', label: 'Fix 4xx client errors', count: s.status.client, tone: 'bad', band: 'highLeverage' })
    if (s.cwv.lcpBad) a.push({ id: 'poor_lcp', label: 'Improve LCP on poor pages', count: s.cwv.lcpBad, tone: 'bad', band: 'highLeverage' })
    if (s.cwv.inpBad) a.push({ id: 'poor_inp', label: 'Reduce INP on poor pages', count: s.cwv.inpBad, tone: 'bad', band: 'highLeverage' })
    if (s.cwv.clsBad) a.push({ id: 'poor_cls', label: 'Reduce CLS on poor pages', count: s.cwv.clsBad, tone: 'bad', band: 'highLeverage' })
    if (s.indexability.missingFromSitemap) a.push({ id: 'not_in_sitemap', label: 'Add indexable pages to sitemap', count: s.indexability.missingFromSitemap, tone: 'warn', band: 'highLeverage' })
    if (s.indexability.canonicalMissing) a.push({ id: 'canonical_missing', label: 'Add canonical tags', count: s.indexability.canonicalMissing, tone: 'warn', band: 'highLeverage' })
    if (s.crawl.redirectChains) a.push({ id: 'redirect_chain', label: 'Shorten redirect chains', count: s.crawl.redirectChains, tone: 'warn', band: 'highLeverage' })
    if (s.security.cspMissing) a.push({ id: 'missing_csp', label: 'Add Content-Security-Policy', count: s.security.cspMissing, tone: 'warn', band: 'highLeverage' })
    if (s.security.hstsMissing) a.push({ id: 'missing_hsts', label: 'Add HSTS header', count: s.security.hstsMissing, tone: 'warn', band: 'highLeverage' })

    // Hygiene
    if (s.blocking.blockingJs) a.push({ id: 'render_blocking_js', label: 'Defer render-blocking JS', count: s.blocking.blockingJs, tone: 'warn', band: 'hygiene' })
    if (s.blocking.blockingCss) a.push({ id: 'render_blocking_css', label: 'Inline critical CSS', count: s.blocking.blockingCss, tone: 'warn', band: 'hygiene' })
    if (s.blocking.hugeDom) a.push({ id: 'huge_dom', label: 'Reduce DOM size on heavy pages', count: s.blocking.hugeDom, tone: 'warn', band: 'hygiene' })
    if (s.security.insecureCookies) a.push({ id: 'insecure_cookies', label: 'Set Secure on cookies', count: s.security.insecureCookies, tone: 'warn', band: 'hygiene' })
    if (s.a11y.altMissing) a.push({ id: 'img_missing_alt', label: 'Add alt text to images', count: s.a11y.altMissing, tone: 'warn', band: 'hygiene' })
    if (s.crawl.hreflangErrors) a.push({ id: 'hreflang_invalid', label: 'Fix hreflang errors', count: s.crawl.hreflangErrors, tone: 'warn', band: 'hygiene' })

    return a
  }, [s])

  if (!pages?.length) return <EmptyState title="No crawl data yet" icon={<Wrench size={20} />} />
  if (!actions.length) {
    return <EmptyState title="No technical actions" hint="No issues detected from this crawl." icon={<Wrench size={20} />} />
  }

  const groups: Array<['blocking' | 'highLeverage' | 'hygiene', string]> = [
    ['blocking', 'Blocking'],
    ['highLeverage', 'High leverage'],
    ['hygiene', 'Hygiene'],
  ]

  return (
    <>
      {groups.map(([band, title]) => {
        const items = actions.filter((a) => a.band === band).sort((x, y) => y.count - x.count)
        if (!items.length) return null
        return (
          <Card key={band}>
            <Section title={title} dense>
              {items.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActiveMacro?.(a.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-[#141414] transition-colors group">
                    <span className="text-[11px] text-[#ddd] truncate">{a.label}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[11px] font-mono tabular-nums ${a.tone === 'bad' ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>{fmtNum(a.count)}</span>
                      <ArrowRight size={11} className="text-[#444] group-hover:text-[#bbb] transition-colors" />
                    </span>
                  </div>
                </button>
              ))}
            </Section>
          </Card>
        )
      })}
    </>
  )
}
