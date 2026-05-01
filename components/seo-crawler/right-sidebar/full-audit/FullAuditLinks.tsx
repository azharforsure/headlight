import React, { useMemo } from 'react'
import { Section, Card, KpiTile, Distribution, fmtNum, compactNum } from '../_shared'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'

export function FullAuditLinks() {
    const { pages } = useSeoCrawler()

    const stats = useMemo(() => {
        let inlinks = 0, outlinks = 0, ext = 0, broken = 0, redirChain = 0, orphans = 0
        for (const p of pages as any[]) {
            inlinks += Number(p.inlinks || 0)
            outlinks += Number(p.outlinks || 0)
            ext += Number(p.externalOutlinks || 0)
            broken += Number(p.brokenInternalLinks || 0) + Number(p.brokenExternalLinks || 0)
            if (Number(p.redirectChainLength || 0) > 1) redirChain += 1
            if (Number(p.inlinks || 0) === 0 && Number(p.crawlDepth || 0) > 0) orphans += 1
        }
        const referringDomains = pages.reduce((s: number, p: any) => s + Number(p.referringDomains || 0), 0)
        return { inlinks, outlinks, ext, broken, redirChain, orphans, referringDomains }
    }, [pages])

    const anchorMix = useMemo(() => {
        let brand = 0, exact = 0, partial = 0, generic = 0, urlAnchor = 0
        for (const p of pages as any[]) {
            brand     += Number(p.anchorBrandPct    || 0)
            exact     += Number(p.anchorExactPct    || 0)
            partial   += Number(p.anchorPartialPct  || 0)
            generic   += Number(p.anchorGenericPct  || 0)
            urlAnchor += Number(p.anchorUrlPct      || 0)
        }
        const n = pages.length || 1
        return { brand: brand / n, exact: exact / n, partial: partial / n, generic: generic / n, urlAnchor: urlAnchor / n }
    }, [pages])

    return (
        <>
            <Section title="Link rollup">
                <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="Internal links" value={compactNum(stats.inlinks)} />
                    <KpiTile label="External links" value={compactNum(stats.ext)} />
                    <KpiTile label="Orphans" value={compactNum(stats.orphans)} />
                    <KpiTile label="Broken" value={compactNum(stats.broken)} />
                </div>
            </Section>

            <Section title="Backlink summary">
                <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="Ref. domains" value={compactNum(stats.referringDomains)} />
                    <KpiTile label="Redirect chains" value={compactNum(stats.redirChain)} />
                </div>
            </Section>

            <Section title="Anchor mix (avg)">
                <Card>
                    <Distribution
                        rows={[
                            { label: 'Brand', value: Math.round(anchorMix.brand) },
                            { label: 'Exact', value: Math.round(anchorMix.exact), tone: anchorMix.exact > 30 ? 'warn' : 'good' },
                            { label: 'Partial', value: Math.round(anchorMix.partial) },
                            { label: 'Generic', value: Math.round(anchorMix.generic), tone: 'warn' },
                            { label: 'URL', value: Math.round(anchorMix.urlAnchor) },
                        ]}
                    />
                </Card>
            </Section>
        </>
    )
}
