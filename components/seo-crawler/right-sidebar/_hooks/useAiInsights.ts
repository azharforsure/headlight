import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

const KNOWN_BOTS = [
  'GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot',
  'CCBot', 'Bytespider', 'OAI-SearchBot', 'Applebot-Extended',
  'Amazonbot', 'anthropic-ai', 'cohere-ai', 'YouBot', 'Diffbot',
  'MistralAI-User', 'Meta-ExternalAgent', 'DuckAssistBot',
]

export function useAiInsights() {
  const { pages, robotsTxt } = useSeoCrawler() as any
  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter((p: any) => p.isHtmlPage)
    
    const llmsTxt = true
    const llmsTxtAllowCount = 12
    const llmsTxtDisallowCount = 2
    const llmsTxtUpdated = '2024-05-01'

    const bots = {
      allowed: 12,
      partial: 3,
      blocked: 1,
      list: [
        { name: 'GPTBot', status: 'Allowed' },
        { name: 'ClaudeBot', status: 'Allowed' },
        { name: 'Google-Extended', status: 'Blocked' },
        { name: 'PerplexityBot', status: 'Allowed' },
      ]
    }

    const crawlability = {
      score: 85,
      blockedPages: safe.slice(0, 5).map(p => ({ ...p, url: p.url })),
      byTemplate: [{ id: 'p', label: 'Product', pages: 450, allowed: 440, blocked: 10 }]
    }

    const citations = {
      total: 1250,
      totalPrev: 1100,
      uniquePages: 145,
      uniquePagesPrev: 130,
      shareVsCompetitors: 0.35,
      topPages: safe.slice(0, 10).map(p => ({ ...p, citations: 45 })),
      topQueries: [{ query: 'best seo tool', engine: 'ChatGPT', count: 120 }],
      topEngine: 'ChatGPT',
      series: [45, 48, 52, 50, 55],
      byEngine: { chatgpt: 450, gemini: 300, perplexity: 250, claude: 150, bing: 100 },
      byIntent: { info: 450, comm: 400, tx: 300, nav: 100 }
    }

    const entities = {
      score: 82,
      list: [{ id: 'e1', label: 'Headlight', type: 'Organization', pages: 850, citations: 450 }],
      withSchema: 14,
      gaps: 4,
      gapList: [{ id: 'e2', label: 'Pricing', type: 'Topic' }],
      types: { person: 12, org: 5, place: 2, product: 45, event: 3 },
      sources: { schema: 14, wikipedia: 8, wikidata: 5, kg: 10 },
      byCluster: [{ id: 'c1', label: 'Core', entities: 12, schema: 10, gaps: 2 }]
    }

    const schema = {
      score: 88,
      scorePrev: 85,
      coverage: 0.92,
      errors: 5,
      warnings: 12,
      types: [{ type: 'Product', count: 450 }, { type: 'FAQPage', count: 120 }],
      fields: { about: 0.85, sameAs: 0.75, author: 0.9, datePublished: 0.95 },
      missingPages: [{ url: '/missing', title: 'Missing Schema' }],
      errorPages: [{ url: '/error', title: 'Error Schema', error: 'Missing brand' }],
      byTemplate: [{ id: 'p', label: 'Product', coverage: 0.95, errors: 2, warnings: 5 }],
      gaps: 8
    }

    const bench = { schemaScore: 75, citations: 850 }
    const score = 84

    const actions = {
      open: 5, done: 15, snoozed: 2,
      critical: 1, high: 2, med: 1, low: 1,
      byReason: [{ id: 'bot', label: 'AI Bot Blocked', open: 1, done: 5 }]
    }

    return {
      score, llmsTxt, llmsTxtAllowCount, llmsTxtDisallowCount, llmsTxtUpdated,
      bots, crawlability, citations, entities, schema, bench, actions
    }
  }, [pages, robotsTxt])
}
