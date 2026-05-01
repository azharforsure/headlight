import React, { useMemo } from 'react'
import { Section, Card, KpiTile, RowItem, fmtPct, compactNum } from '../_shared'
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext'

const BOTS = [
    'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'PerplexityBot', 'Claude-Web',
    'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider',
] as const

export function FullAuditAi() {
    const { pages, robotsTxt } = useSeoCrawler() as any

    const llmsTxtPresent = useMemo(
        () => pages.some((p: any) => p.url && p.url.endsWith('/llms.txt')),
        [pages]
    )

    const citationRate = useMemo(() => {
        const has = pages.filter((p: any) => Number(p.aiCitationRate || 0) > 0)
        if (!has.length) return null
        return has.reduce((s: number, p: any) => s + Number(p.aiCitationRate), 0) / has.length
    }, [pages])

    const extractability = useMemo(() => {
        const has = pages.filter((p: any) => Number(p.aiExtractability || 0) > 0)
        if (!has.length) return null
        return has.reduce((s: number, p: any) => s + Number(p.aiExtractability), 0) / has.length
    }, [pages])

    const botRules: Record<string, boolean> = useMemo(() => {
        const out: Record<string, boolean> = {}
        const txt = String(robotsTxt?.raw || robotsTxt || '').toLowerCase()
        for (const bot of BOTS) {
            const blocked = new RegExp(`user-agent:\\s*${bot.toLowerCase()}[\\s\\S]*?disallow:\\s*/`, 'm').test(txt)
            out[bot] = !blocked
        }
        return out
    }, [robotsTxt])

    const engineCites = useMemo(() => ({
        openAi: pages.reduce((s: number, p: any) => s + Number(p.aiCiteOpenAi || 0), 0),
        perplexity: pages.reduce((s: number, p: any) => s + Number(p.aiCitePerplexity || 0), 0),
        anthropic: pages.reduce((s: number, p: any) => s + Number(p.aiCiteAnthropic || 0), 0),
        gemini: pages.reduce((s: number, p: any) => s + Number(p.aiCiteGemini || 0), 0),
    }), [pages])

    return (
        <>
            <Section title="Snapshot">
                <div className="grid grid-cols-3 gap-2">
                    <KpiTile label="Citation rate" value={citationRate === null ? '—' : fmtPct(citationRate, 100, 0)} />
                    <KpiTile label="Extractable" value={extractability === null ? '—' : fmtPct(extractability, 100, 0)} />
                    <KpiTile label="llms.txt" value={llmsTxtPresent ? '✓' : '✗'} />
                </div>
            </Section>

            <Section title="Bot access">
                <Card padded={false}>
                    {BOTS.map((b) => (
                        <RowItem
                            key={b}
                            title={b}
                            badge={
                                <span className={`text-[10px] font-mono ${botRules[b] ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {botRules[b] ? 'allow' : 'block'}
                                </span>
                            }
                        />
                    ))}
                </Card>
            </Section>

            <Section title="Citation per engine">
                <Card>
                    <RowItem title="OpenAI" badge={<span className="text-[10px] font-mono text-[#888]">{compactNum(engineCites.openAi)}</span>} />
                    <RowItem title="Perplexity" badge={<span className="text-[10px] font-mono text-[#888]">{compactNum(engineCites.perplexity)}</span>} />
                    <RowItem title="Anthropic" badge={<span className="text-[10px] font-mono text-[#888]">{compactNum(engineCites.anthropic)}</span>} />
                    <RowItem title="Gemini" badge={<span className="text-[10px] font-mono text-[#888]">{compactNum(engineCites.gemini)}</span>} />
                </Card>
            </Section>
        </>
    )
}
