import React, { useMemo } from 'react'
import { Section, Card, Distribution, KpiTile, RowItem, fmtNum, compactNum } from '../_shared'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'
import { useFullAuditRollups } from './_selectors'

export function FullAuditTech() {
    const { pages, sitemapData } = useSeoCrawler() as any
    const r = useFullAuditRollups()

    const cwv = useMemo(() => {
        const lcpPoor = pages.filter((p: any) => Number(p.lcp || 0) > 4).length
        const clsPoor = pages.filter((p: any) => Number(p.cls || 0) > 0.25).length
        const inpPoor = pages.filter((p: any) => Number(p.inp || 0) > 500).length
        return { lcpPoor, clsPoor, inpPoor }
    }, [pages])

    const security = useMemo(() => {
        const total = pages.length || 1
        const httpsCount = pages.filter((p: any) => String(p.url || '').startsWith('https://')).length
        const httpsShare = httpsCount / total
        const hsts = pages.filter((p: any) => p.hasHsts).length
        const csp = pages.filter((p: any) => p.hasCsp).length
        return { httpsShare, httpsCount, hsts, csp }
    }, [pages])

    const sitemapCrawled = useMemo(() => pages.filter((p: any) => p.inSitemap).length, [pages])

    const renderCounts = useMemo(() => ({
        static: pages.filter((p: any) => p.renderMode === 'static').length,
        ssr: pages.filter((p: any) => p.renderMode === 'ssr').length,
        csr: pages.filter((p: any) => p.renderMode === 'csr').length,
    }), [pages])

    return (
        <>
            <Section title="Indexability">
                <Card>
                    <Distribution
                        rows={[
                            { label: 'Indexable', value: r.indexable, tone: 'good' },
                            { label: 'Noindex', value: r.noindex, tone: 'warn' },
                            { label: 'Blocked', value: r.blocked, tone: 'bad' },
                        ]}
                        total={r.total}
                    />
                </Card>
            </Section>

            <Section title="Status codes">
                <Card>
                    <Distribution
                        rows={[
                            { label: '200', value: r.status.ok, tone: 'good' },
                            { label: '3xx', value: r.status.redirect, tone: 'warn' },
                            { label: '4xx', value: r.status.client, tone: 'bad' },
                            { label: '5xx', value: r.status.server, tone: 'bad' },
                        ]}
                    />
                </Card>
            </Section>

            <Section title="Core Web Vitals">
                <div className="grid grid-cols-3 gap-2">
                    <KpiTile label="Pass" value={compactNum(r.cwvGood)} sub="all 3 good" />
                    <KpiTile label="LCP poor" value={compactNum(cwv.lcpPoor)} />
                    <KpiTile label="INP poor" value={compactNum(cwv.inpPoor)} />
                </div>
            </Section>

            <Section title="Security">
                <Card>
                    <Distribution
                        rows={[
                            { label: 'HTTPS', value: security.httpsCount, tone: 'good' },
                            { label: 'HSTS', value: security.hsts },
                            { label: 'CSP', value: security.csp, tone: security.csp === 0 ? 'warn' : 'good' },
                        ]}
                        total={r.total || 1}
                    />
                </Card>
            </Section>

            <Section title="Sitemap parity">
                <Card>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                            <div className="text-[9px] text-[#666] uppercase tracking-widest">In sitemap</div>
                            <div className="text-white font-mono">{fmtNum(sitemapData?.totalUrls)}</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-[#666] uppercase tracking-widest">Crawled</div>
                            <div className="text-white font-mono">{fmtNum(sitemapCrawled)}</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-[#666] uppercase tracking-widest">Sources</div>
                            <div className="text-white font-mono">{fmtNum(sitemapData?.sources?.length ?? 0)}</div>
                        </div>
                    </div>
                </Card>
            </Section>

            <Section title="Render health">
                <Card>
                    <RowItem title="Static" badge={<span className="text-[10px] font-mono text-[#888]">{fmtNum(renderCounts.static)}</span>} />
                    <RowItem title="SSR" badge={<span className="text-[10px] font-mono text-[#888]">{fmtNum(renderCounts.ssr)}</span>} />
                    <RowItem title="CSR" badge={<span className="text-[10px] font-mono text-orange-400">{fmtNum(renderCounts.csr)}</span>} />
                </Card>
            </Section>
        </>
    )
}
