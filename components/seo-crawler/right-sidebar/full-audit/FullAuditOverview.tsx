import React from 'react'
import { Section, KpiTile, ScoreGauge, Card, Distribution, RowItem, fmtNum, compactNum } from '../_shared'
import { useFullAuditRollups } from './_selectors'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { AlertTriangle, ChevronRight } from 'lucide-react'

export function FullAuditOverview() {
    const r = useFullAuditRollups()
    const { setActiveMacro } = useSeoCrawler()

    const topAlerts = [
        r.issues.error > 0 && {
            label: `${r.issues.error} blocking errors`,
            tone: 'bad' as const,
            onClick: () => setActiveMacro('errors'),
        },
        r.orphans > 0 && {
            label: `${r.orphans} orphan pages (0 inlinks)`,
            tone: 'warn' as const,
            onClick: () => setActiveMacro('orphans'),
        },
        r.stale > 0 && {
            label: `${r.stale} pages older than 1 year`,
            tone: 'warn' as const,
            onClick: () => setActiveMacro('stale'),
        },
    ].filter(Boolean) as Array<{ label: string; tone: 'bad' | 'warn'; onClick: () => void }>

    return (
        <>
            <Section title="Site health" dense>
                <Card padded>
                    <ScoreGauge score={r.overallScore} label="Overall" delta={null} />
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-[#888]">
                        <div>
                            <div className="text-[#666] uppercase tracking-widest text-[9px]">Indexable</div>
                            <div className="text-white font-mono">{fmtNum(r.indexable)}/{fmtNum(r.total)}</div>
                        </div>
                        <div>
                            <div className="text-[#666] uppercase tracking-widest text-[9px]">CWV pass</div>
                            <div className="text-white font-mono">{fmtNum(r.cwvGood)}</div>
                        </div>
                        <div>
                            <div className="text-[#666] uppercase tracking-widest text-[9px]">Errors</div>
                            <div className="text-red-400 font-mono">{fmtNum(r.issues.error)}</div>
                        </div>
                    </div>
                </Card>
            </Section>

            <Section title="Snapshot">
                <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="Pages" value={compactNum(r.total)} />
                    <KpiTile label="Errors" value={compactNum(r.issues.error)} sub="errors" />
                    <KpiTile label="Warnings" value={compactNum(r.issues.warning)} sub="warnings" />
                    <KpiTile label="GSC clicks" value={compactNum(r.gscClicks)} />
                    <KpiTile label="GA4 sessions" value={compactNum(r.ga4Sessions)} />
                    <KpiTile label="Conversions" value={compactNum(r.ga4Conv)} />
                </div>
            </Section>

            <Section title="Status mix">
                <Card>
                    <Distribution
                        rows={[
                            { label: '200 OK', value: r.status.ok, tone: 'good' },
                            { label: '3xx', value: r.status.redirect, tone: 'warn' },
                            { label: '4xx', value: r.status.client, tone: 'bad' },
                            { label: '5xx', value: r.status.server, tone: 'bad' },
                        ]}
                    />
                </Card>
            </Section>

            <Section title="Top alerts">
                {topAlerts.length === 0 ? (
                    <Card><div className="text-[11px] text-[#888]">Nothing critical right now.</div></Card>
                ) : (
                    <Card padded={false}>
                        {topAlerts.map((a, i) => (
                            <RowItem
                                key={i}
                                onClick={a.onClick}
                                title={
                                    <span className="flex items-center gap-2">
                                        <AlertTriangle size={11} className={a.tone === 'bad' ? 'text-red-400' : 'text-orange-400'} />
                                        {a.label}
                                    </span>
                                }
                                badge={<ChevronRight size={12} className="text-[#666]" />}
                            />
                        ))}
                    </Card>
                )}
            </Section>
        </>
    )
}
