import React, { useMemo } from 'react'
import { Section, Card, KpiTile, Distribution, RowItem, fmtNum, fmtPct, compactNum, safePathname, SourceChip } from '../_shared'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { useFullAuditRollups } from './_selectors'

export function FullAuditTraffic() {
    const { pages, setSelectedPage } = useSeoCrawler()
    const r = useFullAuditRollups()

    const channels = useMemo(() => {
        const sums = { organic: 0, direct: 0, social: 0, paid: 0, email: 0, referral: 0 }
        for (const p of pages as any[]) {
            sums.organic  += Number(p.ga4OrganicSessions  || 0)
            sums.direct   += Number(p.ga4DirectSessions   || 0)
            sums.social   += Number(p.ga4SocialSessions   || 0)
            sums.paid     += Number(p.ga4PaidSessions     || 0)
            sums.email    += Number(p.ga4EmailSessions    || 0)
            sums.referral += Number(p.ga4ReferralSessions || 0)
        }
        return sums
    }, [pages])

    const topPages = useMemo(
        () => [...pages]
            .filter((p: any) => Number(p.ga4Sessions || 0) > 0)
            .sort((a: any, b: any) => Number(b.ga4Sessions) - Number(a.ga4Sessions))
            .slice(0, 6),
        [pages]
    )

    const cvr = r.ga4Sessions > 0 ? r.ga4Conv / r.ga4Sessions : 0

    return (
        <>
            <Section title="GA4 summary" action={<SourceChip source="ga4" />}>
                <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="Sessions" value={compactNum(r.ga4Sessions)} />
                    <KpiTile label="Conversions" value={compactNum(r.ga4Conv)} />
                    <KpiTile label="Revenue" value={`$${compactNum(r.ga4Rev)}`} />
                    <KpiTile label="CvR" value={fmtPct(cvr, 100)} />
                </div>
            </Section>

            <Section title="Channel mix">
                <Card>
                    <Distribution
                        rows={[
                            { label: 'Organic', value: channels.organic, tone: 'good' },
                            { label: 'Direct', value: channels.direct },
                            { label: 'Social', value: channels.social },
                            { label: 'Paid', value: channels.paid, tone: 'warn' },
                            { label: 'Email', value: channels.email },
                            { label: 'Referral', value: channels.referral },
                        ]}
                    />
                </Card>
            </Section>

            <Section title="Top pages by sessions">
                {topPages.length === 0 ? (
                    <Card><div className="text-[11px] text-[#888]">No GA4 data. Connect Google Analytics 4 in Settings.</div></Card>
                ) : (
                    <Card padded={false}>
                        {topPages.map((p: any) => (
                            <RowItem
                                key={p.url}
                                onClick={() => setSelectedPage(p)}
                                title={safePathname(p.url)}
                                meta={`bounce ${(Number(p.ga4BounceRate || 0) * 100).toFixed(0)}%`}
                                badge={<span className="text-[11px] font-mono text-white">{fmtNum(p.ga4Sessions)}</span>}
                            />
                        ))}
                    </Card>
                )}
            </Section>
        </>
    )
}
