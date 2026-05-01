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
    const total = html.length

    const botRules = parseRobotsForBots(robotsTxt, KNOWN_BOTS)
    const blockedBotsCount = Object.values(botRules).filter(Boolean).length

    const llmsTxt = {
      hasLlmsTxt:    safe.some((p: any) => p.hasLlmsTxt === true),
      hasLlmsFull:   safe.some((p: any) => p.hasLlmsFullTxt === true),
      hasAiTxt:      safe.some((p: any) => p.hasAiTxt === true),
    }

    const extractability = {
      avgScore:    avg(html, (p: any) => Number(p.aiExtractabilityScore || 0)),
      answerable:  safePct(html.filter((p: any) => Number(p.answerBoxFitScore || 0) >= 0.7).length, total),
      hasFaq:      safePct(html.filter((p: any) => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('FAQPage')).length, total),
      hasHowto:    safePct(html.filter((p: any) => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('HowTo')).length, total),
    }

    const citations = {
      total: safe.reduce((a: number, p: any) => a + Number(p.aiCitationCount || 0), 0),
      perEngine: aggregatePerEngine(safe),
    }

    const entities = {
      hasOrg:        safePct(html.filter((p: any) => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('Organization')).length, total),
      hasWebsite:    safePct(html.filter((p: any) => Array.isArray(p.schemaTypes) && p.schemaTypes.includes('WebSite')).length, total),
      avgEntityDensity: avg(html, (p: any) => Number(p.entityDensity || 0)),
    }

    const score = Math.round(
      (extractability.avgScore * 100 + (extractability.answerable || 0) + (extractability.hasFaq || 0) + (entities.hasOrg || 0)) / 4
    )

    return { total, botRules, blockedBotsCount, llmsTxt, extractability, citations, entities, score }
  }, [pages, robotsTxt])
}

function parseRobotsForBots(robotsTxt: string, bots: string[]): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  if (!robotsTxt) return out
  const lines = String(robotsTxt).split('\n').map(s => s.trim())
  let active: string | null = null
  for (const line of lines) {
    const m = /^User-agent:\s*(.+)$/i.exec(line)
    if (m) {
      active = m[1].trim()
      continue
    }
    const d = /^Disallow:\s*(.*)$/i.exec(line)
    if (d && active && bots.includes(active)) {
      const path = d[1].trim()
      if (path === '/' || path === '*') out[active] = true
    }
  }
  return out
}

function avg<T>(arr: T[], pick: (x: T) => number): number {
  if (!arr.length) return 0
  return arr.reduce((a, x) => a + (Number(pick(x)) || 0), 0) / arr.length
}

function aggregatePerEngine(pages: any[]): Record<string, number> {
  const acc: Record<string, number> = {}
  for (const p of pages) {
    if (Array.isArray(p.aiCitations)) {
      for (const c of p.aiCitations) {
        const eng = String(c.engine || 'unknown')
        acc[eng] = (acc[eng] || 0) + 1
      }
    }
  }
  return acc
}
