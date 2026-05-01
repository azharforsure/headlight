import { useMemo } from 'react'
import { useSeoCrawler } from '@/contexts/SeoCrawlerContext'
import { safePct } from '../_shared/format'

export function useCompetitorsInsights() {
  const { competitors, competitorPages, pages } = useSeoCrawler() as any
  return useMemo(() => {
    const list = Array.isArray(competitors) ? competitors : []
    const compPages = Array.isArray(competitorPages) ? competitorPages : []
    const ourPages = pages || []

    // Aggregate gap signals from competitorPages.
    const gaps   = compPages.filter((cp: any) => cp.matchedOurUrl == null && Number(cp.organicValue || 0) > 0)
    const wins   = ourPages.filter((p: any) => Array.isArray(p.outrankedCompetitors) && p.outrankedCompetitors.length > 0)
    const losses = ourPages.filter((p: any) => Array.isArray(p.lostToCompetitors) && p.lostToCompetitors.length > 0)

    const overlap = list.map((c: any) => {
      const ourKw = new Set(ourPages.flatMap((p: any) => Array.isArray(p.gscQueries) ? p.gscQueries : []))
      const theirKw = new Set((c.keywords || []) as string[])
      let inter = 0
      ourKw.forEach((k: string) => { if (theirKw.has(k)) inter++ })
      return {
        domain: c.domain,
        overlapPct: ourKw.size ? Math.round((inter / ourKw.size) * 100) : 0,
        sov: Number(c.shareOfVoice || 0),
        dr:  Number(c.domainRating || 0),
      }
    }).sort((a: any, b: any) => b.overlapPct - a.overlapPct)

    const backlinks = list.map((c: any) => ({
      domain: c.domain,
      shared:  Number(c.sharedBacklinks || 0),
      onlyTheirs: Number(c.uniqueBacklinks || 0),
    }))

    const ourSov = (() => {
      const totalSov = list.reduce((a: number, c: any) => a + Number(c.shareOfVoice || 0), 0)
      return Math.max(0, 100 - totalSov)
    })()

    return { competitors: list, overlap, backlinks, gaps, wins, losses, ourSov }
  }, [competitors, competitorPages, pages])
}
