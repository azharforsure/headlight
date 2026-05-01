import React, { useMemo } from 'react'
import { Section, Card, KpiTile, RowItem, Sparkline, fmtNum, fmtPct, compactNum, safePathname, SourceChip } from '../_shared'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { useFullAuditRollups } from './_selectors'

export function FullAuditSearch() {
    const { pages, setSelectedPage } = useSeoCrawler()
    const r = useFullAuditRollups()

    const topClicks = useMemo(
        () => [...pages]
            .filter((p: any) => Number(p.gscClicks || 0) > 0)
            .sort((a: any, b: any) => Number(b.gscClicks) - Number(a.gscClicks))
            .slice(0, 5),
        [pages]
    )

    const losers = useMemo(
        () => [...pages]
            .filter((p: any) => Number(p.sessionsDeltaPct || 0) < -10)
            .sort((a: any, b: any) => Number(a.sessionsDeltaPct) - Number(b.sessionsDeltaPct))
            .slice(0, 5),
        [pages]
    )

    const ctr = r.gscImpr > 0 ? r.gscClicks / r.gscImpr : 0

    // Try to get trend data from first page with it
    const clickTrend = useMemo(() => {
        const p = pages.find((p: any) => Array.isArray(p.gscClicksTrend))
        return (p?.gscClicksTrend || []) as number[]
    }, [pages])

    const imprTrend = useMemo(() => {
        const p = pages.find((p: any) => Array.isArray(p.gscImpressionsTrend))
        return (p?.gscImpressionsTrend || []) as number[]
    }, [pages])

    return (
        <>
            <Section title="GSC summary" action={<SourceChip source="gsc" />}>
                <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="Clicks" value={compactNum(r.gscClicks)} />
                    <KpiTile label="Impressions" value={compactNum(r.gscImpr)} />
                    <KpiTile label="CTR" value={fmtPct(ctr, 100)} />
                    <KpiTile label="Avg pos" value={r.gscPos === null ? '—' : r.gscPos.toFixed(1)} />
                </div>
            </Section>

            {(clickTrend.length >= 2 || imprTrend.length >= 2) && (
                <Section title="Trend (last 28d)">
                    <Card>
                        {clickTrend.length >= 2 && (
                            <>
                                <div className="text-[10px] text-[#666] uppercase tracking-widest mb-1">Clicks</div>
                                <Sparkline points={clickTrend} color="#F5364E" />
                            </>
                        )}
                        {imprTrend.length >= 2 && (
                            <>
                                <div className="text-[10px] text-[#666] uppercase tracking-widest mt-3 mb-1">Impressions</div>
                                <Sparkline points={imprTrend} color="#888" />
                            </>
                        )}
                    </Card>
                </Section>
            )}

            <Section title="Top pages by clicks">
                <Card padded={false}>
                    {topClicks.length === 0 ? (
                        <div className="px-2 py-3 text-[11px] text-[#888]">No GSC data. Connect Google Search Console in Settings.</div>
                    ) : topClicks.map((p: any) => (
                        <RowItem
                            key={p.url}
                            onClick={() => setSelectedPage(p)}
                            title={safePathname(p.url)}
                            meta={`pos ${Number(p.gscPosition || 0).toFixed(1)} · ${(Number(p.gscCtr || 0) * 100).toFixed(1)}% CTR`}
                            badge={<span className="text-[11px] font-mono text-white">{fmtNum(p.gscClicks)}</span>}
                        />
                    ))}
                </Card>
            </Section>

            <Section title="Losing pages">
                <Card padded={false}>
                    {losers.length === 0 ? (
                        <div className="px-2 py-3 text-[11px] text-[#888]">Nothing trending down significantly.</div>
                    ) : losers.map((p: any) => (
                        <RowItem
                            key={p.url}
                            onClick={() => setSelectedPage(p)}
                            title={safePathname(p.url)}
                            meta={`${fmtNum(p.gscClicks)} clicks`}
                            badge={<span className="text-[10px] font-mono text-red-400">{Number(p.sessionsDeltaPct).toFixed(0)}%</span>}
                        />
                    ))}
                </Card>
            </Section>
        </>
    )
}
