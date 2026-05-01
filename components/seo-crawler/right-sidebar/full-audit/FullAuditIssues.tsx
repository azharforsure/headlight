import React, { useMemo } from 'react'
import { Section, Card, Distribution, RowItem, fmtNum } from '../_shared'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'

export function FullAuditIssues() {
    const { filteredIssuePages, setActiveMacro } = useSeoCrawler()

    const grouped = useMemo(() => {
        const error: any[] = []
        const warning: any[] = []
        const notice: any[] = []
        for (const g of filteredIssuePages || []) {
            for (const i of g.issues || []) {
                const bucket = i.type === 'error' ? error : i.type === 'warning' ? warning : notice
                bucket.push(i)
            }
        }
        return { error, warning, notice }
    }, [filteredIssuePages])

    const top = useMemo(() => {
        const all = [...grouped.error, ...grouped.warning, ...grouped.notice]
        return all.slice(0, 8)
    }, [grouped])

    return (
        <>
            <Section title="Severity">
                <Card>
                    <Distribution
                        rows={[
                            { label: 'Errors', value: grouped.error.length, tone: 'bad' },
                            { label: 'Warnings', value: grouped.warning.length, tone: 'warn' },
                            { label: 'Notices', value: grouped.notice.length },
                        ]}
                    />
                </Card>
            </Section>

            <Section title={`Top issues (${fmtNum(top.length)})`}>
                {top.length === 0 ? (
                    <Card><div className="text-[11px] text-[#888]">No issues match the current filter.</div></Card>
                ) : (
                    <Card padded={false}>
                        {top.map((i: any) => (
                            <RowItem
                                key={i.id}
                                onClick={() => setActiveMacro(i.id)}
                                title={i.label}
                                badge={
                                    <span className={`text-[10px] font-bold uppercase ${
                                        i.type === 'error' ? 'text-red-400'
                                        : i.type === 'warning' ? 'text-orange-400'
                                        : 'text-[#888]'
                                    }`}>{i.type}</span>
                                }
                            />
                        ))}
                    </Card>
                )}
            </Section>

            <Section title="Categories">
                <Card padded={false}>
                    {(filteredIssuePages || []).length === 0 ? (
                        <div className="px-2 py-3 text-[11px] text-[#888]">No categories detected.</div>
                    ) : (filteredIssuePages || []).map((g: any) => (
                        <RowItem
                            key={g.category}
                            title={g.category}
                            badge={<span className="text-[10px] font-mono text-[#888]">{fmtNum(g.issues.length)}</span>}
                        />
                    ))}
                </Card>
            </Section>
        </>
    )
}
