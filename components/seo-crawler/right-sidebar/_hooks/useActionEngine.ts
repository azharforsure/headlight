import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import type { RsAction } from '../_shared/types'

type Pillar = 'tech' | 'content' | 'links' | 'search' | 'ux' | 'paid' | 'commerce' | 'social' | 'ai' | 'local' | 'competitors'

export function useActionEngine(pillar?: Pillar) {
  const { pages } = useSeoCrawler()
  return useMemo<RsAction[]>(() => {
    const safe = pages || []
    const all: RsAction[] = []

    // tech
    const slow = safe.filter(p => Number(p.lcp) > 4000)
    if (slow.length) all.push({
      id: 'fix-slow-lcp', title: 'Fix slow LCP pages',
      reason: 'LCP over 4s on key pages drags rankings.',
      forecast: '+12% sessions est', confidence: 0.7, effort: 'M',
      affected: slow.length, primary: true,
    })

    const noindex = safe.filter(p => p.indexable === false && p.statusCode === 200)
    if (noindex.length) all.push({
      id: 'unblock-indexable', title: 'Review noindex on key pages',
      reason: 'Important pages set to noindex.',
      forecast: '+5% indexed est', confidence: 0.6, effort: 'S',
      affected: noindex.length,
    })

    // content
    const thin = safe.filter(p => p.isHtmlPage && Number(p.wordCount) < 300)
    if (thin.length) all.push({
      id: 'expand-thin', title: 'Expand thin pages',
      reason: 'Pages under 300 words rarely rank.',
      forecast: '+8% impr est', confidence: 0.55, effort: 'M',
      affected: thin.length,
    })

    const decay = safe.filter(p => p.contentDecay === 'Possible Decay')
    if (decay.length) all.push({
      id: 'refresh-decay', title: 'Refresh decaying pages',
      reason: 'Traffic falling on these pages 90d.',
      forecast: '+15% recover est', confidence: 0.6, effort: 'S',
      affected: decay.length,
    })

    // links
    const orphans = safe.filter(p => Number(p.inlinks) === 0 && Number(p.crawlDepth) > 0)
    if (orphans.length) all.push({
      id: 'link-orphans', title: 'Link orphan pages',
      reason: 'Orphan pages can’t pass link equity.',
      forecast: '+6% rankings est', confidence: 0.5, effort: 'S',
      affected: orphans.length,
    })

    const broken = safe.filter(p => Number(p.brokenInternalLinks) > 0)
    if (broken.length) all.push({
      id: 'fix-broken', title: 'Fix broken internal links',
      reason: 'Dead links waste crawl budget.',
      forecast: '+2% crawled est', confidence: 0.7, effort: 'S',
      affected: broken.length,
    })

    // search
    const striking = safe.filter(p => Number(p.gscPosition) > 3 && Number(p.gscPosition) <= 20 && Number(p.gscImpressions) > 100)
    if (striking.length) all.push({
      id: 'striking-distance', title: 'Optimize striking-distance pages',
      reason: 'Pages on page 1 just below the fold.',
      forecast: '+18% clicks est', confidence: 0.65, effort: 'M',
      affected: striking.length, primary: true,
    })

    // schema
    const schemaErr = safe.filter(p => Number(p.schemaErrors) > 0)
    if (schemaErr.length) all.push({
      id: 'fix-schema', title: 'Fix schema errors',
      reason: 'Invalid schema blocks rich results.',
      forecast: '+4% rich snippets est', confidence: 0.75, effort: 'S',
      affected: schemaErr.length,
    })

    // ux
    const slowInp = safe.filter(p => Number(p.inp) > 500)
    if (slowInp.length) all.push({
      id: 'ux-inp', title: 'Improve INP responsiveness',
      reason: 'High interaction delay hurts conversion.',
      forecast: '+3% conversion est', confidence: 0.5, effort: 'L',
      affected: slowInp.length,
    })

    // paid
    const highCpa = safe.filter(p => Number(p.paidCpa) > 100) // Mock logic
    if (highCpa.length) all.push({
      id: 'paid-optimize', title: 'Optimize high CPA campaigns',
      reason: 'Spend exceeding target acquisition cost.',
      forecast: '-20% CPA est', confidence: 0.7, effort: 'M',
      affected: highCpa.length, primary: true,
    })

    // commerce
    const oos = safe.filter(p => p.availability === 'out_of_stock' && Number(p.ga4Sessions) > 0)
    if (oos.length) all.push({
      id: 'commerce-oos', title: 'Redirect OOS traffic',
      reason: 'Users landing on out-of-stock products.',
      forecast: '+15% revenue est', confidence: 0.85, effort: 'S',
      affected: oos.length, primary: true,
    })

    // social
    const missingOg = safe.filter(p => p.isHtmlPage && !p.ogImage)
    if (missingOg.length) all.push({
      id: 'social-og', title: 'Add missing OG tags',
      reason: 'Missing Open Graph tags reduce CTR on social.',
      forecast: '+10% social CTR', confidence: 0.6, effort: 'S',
      affected: missingOg.length,
    })

    // ai
    const noEntities = safe.filter(p => p.isHtmlPage && (!p.entities || p.entities.length === 0))
    if (noEntities.length) all.push({
      id: 'ai-entities', title: 'Enhance entity density',
      reason: 'Weak entity signals hinder AI engine citation.',
      forecast: '+25% AI visibility', confidence: 0.5, effort: 'M',
      affected: noEntities.length,
    })

    // local
    const napMismatch = safe.filter(p => p.isLocalPage && p.napConsistent === false)
    if (napMismatch.length) all.push({
      id: 'local-nap', title: 'Fix NAP inconsistencies',
      reason: 'Conflicting business data hurts local rankings.',
      forecast: '+12% local pack est', confidence: 0.8, effort: 'S',
      affected: napMismatch.length, primary: true,
    })

    // priority sort: forecast × confidence ÷ effort
    const effortMap = { S: 1, M: 2, L: 3 } as const
    return all.sort((a, b) => {
      const av = (parseFloat(a.forecast || '0') || 1) * (a.confidence || 0.5) / (effortMap[a.effort || 'M'])
      const bv = (parseFloat(b.forecast || '0') || 1) * (b.confidence || 0.5) / (effortMap[b.effort || 'M'])
      return bv - av
    }).filter(a => !pillar || a.id.startsWith(pillar) || true)
  }, [pages, pillar])
}
