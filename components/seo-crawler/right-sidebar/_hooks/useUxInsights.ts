import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useUxInsights() {
  const crawler = useSeoCrawler()
  const { pages, crawlHistory } = crawler
  const compareSession = (crawler as any).compareSession
  const prevPages = compareSession?.pages || []

  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter(p => p.isHtmlPage)
    const total = html.length
    const num = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }

    const cvr = 0.024
    const cvrPrev = 0.022
    const bounceRate = 0.45
    const bounceRatePrev = 0.48
    const avgSessionSec = 145

    const frictionBands = { low: 850, medium: 120, high: 30 }
    const events = { form: 450, atc: 120, checkout: 45, signup: 80 }

    const friction = {
      rageClicks: 12, deadClicks: 45, errorClicks: 5, formAbandon: 80, scrollDepth: 150,
      aboveFold: 20, formFields: 35, cta: 15, nav: 10,
      byTemplate: [{ id: 'product', label: 'Product', pages: 450, avgFriction: 12, cvr: 0.035 }],
    }

    const funnels = {
      list: [{ id: '1', name: 'Purchase', steps: 4, completion: 0.05, worstStep: 'Checkout' }],
      primary: [{ label: 'Home', value: 1000 }, { label: 'Category', value: 800 }, { label: 'Product', value: 400 }, { label: 'Checkout', value: 50 }],
      secondary: [{ label: 'Sign up', value: 1000 }, { label: 'Verify', value: 600 }, { label: 'Welcome', value: 550 }],
      avgCompletion: 0.12, avgCompletionPrev: 0.10,
      completionSeries: [0.1, 0.11, 0.12, 0.11, 0.12],
      healthy: 2, dropping: 1, broken: 0, worstStep: { name: 'Checkout', dropPct: 0.85 },
    }

    const forms = {
      total: 12, submitRate: 0.15, errorsPerSubmit: 0.8,
      errors: { required: 45, format: 12, range: 5, server: 2 },
      fieldAbandon: 120, resubmit: 15, avgFillSec: 45, totalErrors: 64,
      worstFields: [{ id: 'phone', label: 'Phone Number', formName: 'Contact', errorRate: 0.35 }],
      byPage: [{ url: '/contact', title: 'Contact', submitRate: 0.12 }],
      list: [{ id: 'c1', name: 'Contact', views: 1200, submits: 150, submitRate: 0.125 }],
    }

    const cwv = {
      passPct: 78, lcpP75: 1850, inpP75: 120, clsP75: 0.045,
      lcpGood: 850, lcpMid: 120, lcpPoor: 30, clsBad: 15,
      mobilePass: 750, mobileFail: 150, desktopPass: 380, desktopFail: 20,
      lcpSeries: [2400, 2200, 1900, 1850],
    }

    const tests = {
      active: 4, won: 12, lost: 5, inconclusive: 3,
      byType: { ab: 15, mvt: 3, personalize: 2 },
      recentWins: [{ id: 't1', name: 'New CTA color', lift: 0.12 }],
      activeList: [{ id: 't2', name: 'Layout V2', targetUrl: '/', daysRunning: 12, confidence: 0.85 }],
      byPage: [{ url: '/', title: 'Home', tests: 5, wins: 2, avgLift: 0.08 }],
    }

    const actions = {
      open: 8, done: 24, snoozed: 3,
      critical: 1, high: 3, med: 3, low: 1,
      byReason: [{ id: 'friction', label: 'High friction', open: 3, done: 10 }],
    }

    const score = 84
    const cvrSeries = [0.02, 0.021, 0.022, 0.023, 0.024]
    const funnel = funnels.primary
    const funnelDrops = 2
    const bench = { lcpP75: 2500 }
    const byTemplate = [{ id: 'product', label: 'Product', pages: 450, cvr: 0.03, bounce: 0.42 }]

    return {
      score, cvr, cvrPrev, cvrSeries, bounceRate, bounceRatePrev, avgSessionSec,
      frictionBands, events, byTemplate, funnel, funnelDrops, friction, funnels, forms, cwv, tests, bench, actions
    }
  }, [pages, prevPages, crawlHistory])
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}
