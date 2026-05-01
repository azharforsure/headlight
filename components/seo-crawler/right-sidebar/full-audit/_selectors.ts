import { useMemo } from 'react'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'

export function useFullAuditRollups() {
    const { pages, filteredIssuePages } = useSeoCrawler()

    return useMemo(() => {
        const total = pages.length
        const indexable = pages.filter((p: any) => p.indexable !== false && p.statusCode === 200).length
        const noindex = pages.filter((p: any) => String(p.metaRobots1 || '').toLowerCase().includes('noindex')).length
        const blocked = pages.filter((p: any) => p.status === 'Blocked by Robots.txt').length

        const status = {
            ok: pages.filter((p: any) => p.statusCode === 200).length,
            redirect: pages.filter((p: any) => p.statusCode >= 300 && p.statusCode < 400).length,
            client: pages.filter((p: any) => p.statusCode >= 400 && p.statusCode < 500).length,
            server: pages.filter((p: any) => p.statusCode >= 500).length,
        }

        const cwvGood = pages.filter((p: any) =>
            Number(p.lcp || 0) > 0 && Number(p.lcp) <= 2.5 &&
            Number(p.cls || 0) <= 0.1 &&
            Number(p.inp || 0) <= 200
        ).length

        const orphans = pages.filter((p: any) => Number(p.inlinks || 0) === 0 && Number(p.crawlDepth || 0) > 0).length

        const issues = (filteredIssuePages || []).reduce(
            (acc: { error: number; warning: number; notice: number }, group: any) => {
                for (const issue of group.issues || []) {
                    if (issue.type === 'error') acc.error += 1
                    else if (issue.type === 'warning') acc.warning += 1
                    else acc.notice += 1
                }
                return acc
            },
            { error: 0, warning: 0, notice: 0 }
        )

        const gscClicks = pages.reduce((s: number, p: any) => s + Number(p.gscClicks || 0), 0)
        const gscImpr = pages.reduce((s: number, p: any) => s + Number(p.gscImpressions || 0), 0)
        const gscPos = (() => {
            const valid = pages.filter((p: any) => Number(p.gscPosition || 0) > 0)
            if (!valid.length) return null
            return valid.reduce((s: number, p: any) => s + Number(p.gscPosition), 0) / valid.length
        })()
        const ga4Sessions = pages.reduce((s: number, p: any) => s + Number(p.ga4Sessions || 0), 0)
        const ga4Conv = pages.reduce((s: number, p: any) => s + Number(p.ga4Conversions || 0), 0)
        const ga4Rev = pages.reduce((s: number, p: any) => s + Number(p.ga4Revenue || 0), 0)

        const decay = pages.filter((p: any) => p.contentDecay && String(p.contentDecay).toLowerCase().includes('decay')).length
        const stale = pages.filter((p: any) => Number(p.daysSinceUpdate || 0) > 365).length

        const overallScore = (() => {
            const idx = total ? indexable / total : 0
            const stat = total ? status.ok / total : 0
            const cwv = total ? cwvGood / total : 0
            const noErr = total ? 1 - Math.min(1, issues.error / Math.max(1, total)) : 1
            const score = Math.round((idx * 0.25 + stat * 0.25 + cwv * 0.2 + noErr * 0.3) * 100)
            return Number.isFinite(score) ? score : null
        })()

        return {
            total, indexable, noindex, blocked, orphans,
            status, cwvGood, issues,
            gscClicks, gscImpr, gscPos, ga4Sessions, ga4Conv, ga4Rev,
            decay, stale, overallScore,
        }
    }, [pages, filteredIssuePages])
}
