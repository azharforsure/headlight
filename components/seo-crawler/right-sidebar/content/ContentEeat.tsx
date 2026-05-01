import React from 'react'
import { useContentInsights } from '../_hooks/useContentInsights'
import { Section, Card, KpiTile, EmptyState, fmtNum, fmtPct, RsBar } from '../_shared'

export function ContentEeat() {
    const c = useContentInsights()
    if (c.total === 0) return <EmptyState title="No E-E-A-T data yet" hint="Author signals appear after the crawl." />

    const rows: Array<{ key: string; label: string; v: number }> = [
        { key: 'bylines',   label: 'Bylines',         v: c.eeat.bylines },
        { key: 'bios',      label: 'Author bios',     v: c.eeat.bios },
        { key: 'citations', label: 'External citations', v: c.eeat.citations },
        { key: 'updated',   label: 'Visible updated date', v: c.eeat.updated },
    ]

    return (
        <div className="space-y-3">
            <Section title="Trust signals coverage">
                <Card padded>
                    {rows.map(r => (
                        <div key={r.key} className="mb-2 last:mb-0">
                            <RsBar
                                label={r.label}
                                value={Math.round(r.v)}
                                total={100}
                                tone={r.v >= 70 ? 'good' : r.v >= 40 ? 'warn' : 'bad'}
                                suffix="%"
                            />
                        </div>
                    ))}
                </Card>
            </Section>

            <div className="grid grid-cols-2 gap-2">
                <KpiTile label="Avg E-E-A-T"   value={c.eeat.avgScore ? fmtNum(c.eeat.avgScore, { maximumFractionDigits: 0 }) : '—'} sub="0-100" />
                <KpiTile label="Schema author" value={fmtPct(c.schemaCoverage.author, 1, 0)} tone={c.schemaCoverage.author >= 50 ? 'good' : 'warn'} />
            </div>

            <Section title="Schema coverage">
                <Card padded>
                    <RsBar label="Article"     value={Math.round(c.schemaCoverage.article)}    total={100} tone={c.schemaCoverage.article >= 50 ? 'good' : 'warn'} suffix="%" />
                    <div className="h-1" />
                    <RsBar label="Product"     value={Math.round(c.schemaCoverage.product)}    total={100} suffix="%" />
                    <div className="h-1" />
                    <RsBar label="FAQ"         value={Math.round(c.schemaCoverage.faq)}        total={100} suffix="%" />
                    <div className="h-1" />
                    <RsBar label="HowTo"       value={Math.round(c.schemaCoverage.howto)}      total={100} suffix="%" />
                    <div className="h-1" />
                    <RsBar label="BreadcrumbList" value={Math.round(c.schemaCoverage.breadcrumb)} total={100} suffix="%" />
                </Card>
            </Section>
        </div>
    )
}
