import React, { useMemo } from 'react'
import { Section, Card, RowItem, KpiTile, compactNum, safePathname } from '../_shared'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'

const PRIORITY: Record<string, number> = {
    'Fix Errors': 1, 'Fix Technical Issues': 1,
    'Protect High-Value Page': 2, 'Push to Page One': 3,
    'Rewrite Title & Description': 4, 'Add Internal Links': 5,
    'Improve Content': 6, 'Reduce Bounce Rate': 7,
    'Merge or Remove': 8, 'Monitor': 9,
}

export function FullAuditActions() {
    const { pages, setSelectedPage } = useSeoCrawler()

    const grouped = useMemo(() => {
        const map: Record<string, any[]> = {}
        for (const p of pages as any[]) {
            const action = String(p.recommendedAction || '').trim()
            if (!action || action === 'Monitor') continue
            ;(map[action] ||= []).push(p)
        }
        return Object.entries(map).sort(
            (a, b) => (PRIORITY[a[0]] ?? 99) - (PRIORITY[b[0]] ?? 99)
        )
    }, [pages])

    const totalActioned = useMemo(
        () => pages.filter((p: any) => p.recommendedAction && p.recommendedAction !== 'Monitor').length,
        [pages]
    )

    const projected = useMemo(() => {
        let sum = 0
        for (const p of pages as any[]) {
            if (p.recommendedAction && p.recommendedAction !== 'Monitor') {
                sum += Number(p.opportunityScore || 0)
            }
        }
        return Math.round(sum)
    }, [pages])

    return (
        <>
            <Section title="Queue">
                <div className="grid grid-cols-2 gap-2">
                    <KpiTile label="Pages with action" value={compactNum(totalActioned)} />
                    <KpiTile label="Projected impact" value={compactNum(projected)} sub="opportunity sum" />
                </div>
            </Section>

            {grouped.length === 0 ? (
                <Card><div className="text-[11px] text-[#888]">No actions yet. Run the strategic audit to populate.</div></Card>
            ) : (
                grouped.slice(0, 6).map(([action, items]) => (
                    <Section key={action} title={`${action} (${items.length})`}>
                        <Card padded={false}>
                            {items.slice(0, 3).map((p: any) => (
                                <RowItem
                                    key={p.url}
                                    onClick={() => setSelectedPage(p)}
                                    title={safePathname(p.url)}
                                    meta={p.recommendedActionReason || ''}
                                    badge={<span className="text-[10px] font-mono text-[#888]">{compactNum(p.opportunityScore || 0)}</span>}
                                />
                            ))}
                            {items.length > 3 && (
                                <div className="px-2 py-1 text-[10px] text-[#666] text-center">+ {items.length - 3} more</div>
                            )}
                        </Card>
                    </Section>
                ))
            )}
        </>
    )
}
