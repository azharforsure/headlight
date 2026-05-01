import React from 'react'
import { Section, Card, KpiTile, RowItem, DeltaChip, compactNum } from '../_shared'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'

export function FullAuditHistory() {
    const { crawlHistory, currentSessionId } = useSeoCrawler() as any
    const sessions: Array<any> = Array.isArray(crawlHistory) ? crawlHistory : []
    const current = sessions.find((s) => s.id === currentSessionId) ?? sessions[0]
    const previous = current ? sessions.find((s: any, i: number) => i > sessions.indexOf(current)) : null

    const delta = (k: string) => {
        if (!current || !previous) return null
        const a = Number(current[k] || 0)
        const b = Number(previous[k] || 0)
        return a - b
    }

    return (
        <>
            <Section title="vs previous session">
                {!previous ? (
                    <Card>
                        <div className="text-[11px] text-[#888]">Run another crawl to compare against the previous session.</div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <KpiTile
                            label="Pages"
                            value={compactNum(current?.pagesCount)}
                            delta={(delta('pagesCount') ?? 0) !== 0 ? String(delta('pagesCount')) : ''}
                            deltaTone={(delta('pagesCount') ?? 0) >= 0 ? 'up' : 'down'}
                        />
                        <KpiTile
                            label="Errors"
                            value={compactNum(current?.errorsCount)}
                            delta={(delta('errorsCount') ?? 0) !== 0 ? String(delta('errorsCount')) : ''}
                            deltaTone={(delta('errorsCount') ?? 0) <= 0 ? 'up' : 'down'}
                        />
                        <KpiTile
                            label="Clicks"
                            value={compactNum(current?.gscClicks)}
                            delta={(delta('gscClicks') ?? 0) !== 0 ? String(delta('gscClicks')) : ''}
                            deltaTone={(delta('gscClicks') ?? 0) >= 0 ? 'up' : 'down'}
                        />
                        <KpiTile
                            label="Sessions"
                            value={compactNum(current?.ga4Sessions)}
                            delta={(delta('ga4Sessions') ?? 0) !== 0 ? String(delta('ga4Sessions')) : ''}
                            deltaTone={(delta('ga4Sessions') ?? 0) >= 0 ? 'up' : 'down'}
                        />
                    </div>
                )}
            </Section>

            <Section title="Session timeline">
                <Card padded={false}>
                    {sessions.length === 0 ? (
                        <div className="px-2 py-3 text-[11px] text-[#888]">No sessions yet.</div>
                    ) : sessions.map((s: any) => (
                        <RowItem
                            key={s.id}
                            active={s.id === currentSessionId}
                            title={s.label || (s.startedAt ? new Date(s.startedAt).toLocaleString() : s.id)}
                            meta={`${compactNum(s.pagesCount || 0)} pages · ${compactNum(s.errorsCount || 0)} errors`}
                            badge={<DeltaChip value={s.scoreDelta} />}
                        />
                    ))}
                </Card>
            </Section>
        </>
    )
}
