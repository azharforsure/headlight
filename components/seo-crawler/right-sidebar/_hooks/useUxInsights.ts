import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useUxInsights() {
  const { pages } = useSeoCrawler()
  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter(p => p.isHtmlPage)
    const total = html.length

    const cwv = {
      lcpGood: html.filter(p => Number(p.lcp) > 0 && Number(p.lcp) <= 2500).length,
      lcpBad:  html.filter(p => Number(p.lcp) > 4000).length,
      clsGood: html.filter(p => Number(p.cls) <= 0.1).length,
      clsBad:  html.filter(p => Number(p.cls) > 0.25).length,
      inpGood: html.filter(p => Number(p.inp) > 0 && Number(p.inp) <= 200).length,
      inpBad:  html.filter(p => Number(p.inp) > 500).length,
      passing: html.filter(p =>
        Number(p.lcp) > 0 && Number(p.lcp) <= 2500 &&
        Number(p.cls) <= 0.1 &&
        Number(p.inp) > 0 && Number(p.inp) <= 200
      ).length,
    }

    const friction = {
      rage:    safe.reduce((a, p) => a + Number(p.rageClicks || 0), 0),
      dead:    safe.reduce((a, p) => a + Number(p.deadClicks || 0), 0),
      uTurn:   safe.reduce((a, p) => a + Number(p.uTurns || 0), 0),
      formAbandon: safe.reduce((a, p) => a + Number(p.formAbandonCount || 0), 0),
    }

    const conv = {
      sessions:  safe.reduce((a, p) => a + Number(p.ga4Sessions || 0), 0),
      conversions: safe.reduce((a, p) => a + Number(p.ga4Conversions || 0), 0),
      revenue:   safe.reduce((a, p) => a + Number(p.ga4Revenue || 0), 0),
      cvr: (() => {
        const sess = safe.reduce((a, p) => a + Number(p.ga4Sessions || 0), 0)
        const c = safe.reduce((a, p) => a + Number(p.ga4Conversions || 0), 0)
        return sess > 0 ? (c / sess) * 100 : 0
      })(),
    }

    const tests = {
      running: safe.filter(p => p.experimentStatus === 'running').length,
      winning: safe.filter(p => p.experimentStatus === 'winning').length,
      losing:  safe.filter(p => p.experimentStatus === 'losing').length,
    }

    const a11y = {
      noLabels:    safe.reduce((a, p) => a + Number(p.formsWithoutLabels || 0), 0),
      contrast:    safe.reduce((a, p) => a + Number(p.contrastIssues || 0), 0),
      tapTargets:  safe.reduce((a, p) => a + Number(p.smallTapTargets || 0), 0),
    }

    return { total, cwv, friction, conv, tests, a11y, passingPct: safePct(cwv.passing, total) }
  }, [pages])
}
