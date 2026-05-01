import React, { useMemo } from 'react'
import { Section, Card, RowItem, KpiTile, fmtNum, compactNum, safePathname } from '../_shared'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'

export function FullAuditOpportunities() {
    const { pages, setSelectedPage } = useSeoCrawler()

    const striking = useMemo(
        () => pages
            .filter((p: any) => Number(p.gscPosition || 0) > 10 && Number(p.gscPosition) <= 20 && Number(p.gscImpressions || 0) > 50)
            .sort((a: any, b: any) => Number(b.gscImpressions) - Number(a.gscImpressions))
            .slice(0, 8),
        [pages]
    )

    const lowCtr = useMemo(
        () => pages
            .filter((p: any) => Number(p.gscPosition || 0) > 0 && Number(p.gscPosition) <= 10 && Number(p.gscCtr || 0) < 0.02)
            .sort((a: any, b: any) => Number(b.gscImpressions) - Number(a.gscImpressions))
            .slice(0, 6),
        [pages]
    )

    const decaying = useMemo(
        () => pages
            .filter((p: any) => p.contentDecay && Number(p.gscClicks || 0) > 0)
            .slice(0, 6),
        [pages]
    )

    return (
        <>
            <Section title="Snapshot">
                <div className="grid grid-cols-3 gap-2">
                    <KpiTile label="Striking" value={compactNum(striking.length)} sub="pos 11-20" />
                    <KpiTile label="Low CTR" value={compactNum(lowCtr.length)} sub="top-10" />
                    <KpiTile label="Decaying" value={compactNum(decaying.length)} sub="losing clicks" />
                </div>
            </Section>

            <Section title="Striking distance">
                {striking.length === 0 ? (
                    <Card><div className="text-[11px] text-[#888]">No keywords in striking distance yet.</div></Card>
                ) : (
                    <Card padded={false}>
                        {striking.map((p: any) => (
                            <RowItem
                                key={p.url}
                                onClick={() => setSelectedPage(p)}
                                title={safePathname(p.url)}
                                meta={`${p.mainKeyword || '—'} · pos ${Number(p.gscPosition).toFixed(1)} · ${fmtNum(p.gscImpressions)} impr`}
                                badge={<span className="text-[10px] font-mono text-emerald-400">push</span>}
                            />
                        ))}
                    </Card>
                )}
            </Section>

            <Section title="Low CTR in top 10">
                {lowCtr.length === 0 ? (
                    <Card><div className="text-[11px] text-[#888]">CTR looks healthy across top-10 pages.</div></Card>
                ) : (
                    <Card padded={false}>
                        {lowCtr.map((p: any) => (
                            <RowItem
                                key={p.url}
                                onClick={() => setSelectedPage(p)}
                                title={safePathname(p.url)}
                                meta={`pos ${Number(p.gscPosition).toFixed(1)} · CTR ${(Number(p.gscCtr) * 100).toFixed(1)}%`}
                                badge={<span className="text-[10px] font-mono text-orange-400">title/meta</span>}
                            />
                        ))}
                    </Card>
                )}
            </Section>

            <Section title="Decaying pages">
                {decaying.length === 0 ? (
                    <Card><div className="text-[11px] text-[#888]">No decay detected.</div></Card>
                ) : (
                    <Card padded={false}>
                        {decaying.map((p: any) => (
                            <RowItem
                                key={p.url}
                                onClick={() => setSelectedPage(p)}
                                title={safePathname(p.url)}
                                meta={`${fmtNum(p.gscClicks)} clicks · ${p.contentDecay}`}
                                badge={<span className="text-[10px] font-mono text-red-400">refresh</span>}
                            />
                        ))}
                    </Card>
                )}
            </Section>
        </>
    )
}
