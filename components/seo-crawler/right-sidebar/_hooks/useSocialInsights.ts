import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useSocialInsights() {
  const { pages, socialProfiles, socialMentions } = useSeoCrawler() as any
  return useMemo(() => {
    const safe = pages || []
    const html = safe.filter((p: any) => p.isHtmlPage)
    const profiles = Array.isArray(socialProfiles) ? socialProfiles : []
    const mentions = Array.isArray(socialMentions) ? socialMentions : []

    const og = {
      ok:      html.filter((p: any) => p.ogTitle && p.ogImage && p.twitterCard).length,
      missing: html.filter((p: any) => !p.ogTitle || !p.ogImage || !p.twitterCard).length,
      noImage: html.filter((p: any) => !p.ogImage).length,
      noCard:  html.filter((p: any) => !p.twitterCard).length,
    }

    const followers = profiles.reduce((a: number, p: any) => a + Number(p.followers || 0), 0)
    const growth = profiles.reduce((a: number, p: any) => a + Number(p.growth30d || 0), 0)

    const sentiment = {
      pos: mentions.filter((m: any) => m.sentiment > 0.1).length,
      neu: mentions.filter((m: any) => m.sentiment > -0.1 && m.sentiment <= 0.1).length,
      neg: mentions.filter((m: any) => m.sentiment <= -0.1).length,
      avg: mentions.length ? mentions.reduce((a: number, m: any) => a + Number(m.sentiment || 0), 0) / mentions.length : 0,
    }

    const traffic = {
      socialSessions: safe.reduce((a: number, p: any) => a + Number(p.socialSessions || 0), 0),
      cvr: (() => {
        const sess = safe.reduce((a: number, p: any) => a + Number(p.socialSessions || 0), 0)
        const conv = safe.reduce((a: number, p: any) => a + Number(p.socialConversions || 0), 0)
        return sess > 0 ? (conv / sess) * 100 : 0
      })(),
    }

    const topMentioners = mentions
      .slice()
      .sort((a: any, b: any) => Number(b.reach || 0) - Number(a.reach || 0))
      .slice(0, 6)

    return { profiles, mentions, og, followers, growth, sentiment, traffic, topMentioners, ogCoverage: safePct(og.ok, og.ok + og.missing) }
  }, [pages, socialProfiles, socialMentions])
}
