import React from 'react';
import { Copy, FileText, RefreshCw } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import EmptyState from './shared/EmptyState';
import { CARD, CARD_HIGHLIGHT, SECTION_HEADER_WITH_MARGIN, SIDEBAR_SCROLL } from './shared/styles';
import { useCompetitiveMetrics } from './hooks/useCompetitiveMetrics';

const PRIORITY_STYLES: Record<string, string> = {
    P0: 'text-red-400 bg-red-400/10',
    P1: 'text-yellow-400 bg-yellow-400/10',
    P2: 'text-green-400 bg-green-400/10',
};

export default function CompBriefTab() {
    const { competitiveState, generateCompetitiveBrief } = useSeoCrawler();
    const { brief, isGeneratingBrief, competitorProfiles } = competitiveState;
    const { activeComps, advantages, vulnerabilities } = useCompetitiveMetrics();

    const hasBrief = Boolean(brief && brief.executiveSummary && !brief.executiveSummary.includes('Unable to generate'));

    return (
        <div className={SIDEBAR_SCROLL}>
            <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#555]">AI Competitive Brief</div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={generateCompetitiveBrief}
                        disabled={isGeneratingBrief || competitorProfiles.size === 0}
                        className="flex items-center gap-1 rounded-lg bg-[#F5364E]/10 px-2 py-1 text-[10px] font-bold text-[#F5364E] transition-all hover:bg-[#F5364E]/20 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                        <RefreshCw size={10} className={isGeneratingBrief ? 'animate-spin' : ''} />
                        {isGeneratingBrief ? 'Generating...' : hasBrief ? 'Regenerate' : 'Generate Brief'}
                    </button>
                    {hasBrief && (
                        <button
                            onClick={() => {
                                const analyses = (brief as any)?.perCompetitor || (brief as any)?.competitorAnalyses || [];
                                const actions = (brief as any)?.recommendedActions || [];
                                const text = [
                                    brief?.executiveSummary || '',
                                    ...analyses.map(
                                        (c: any) =>
                                            `\n${c.domain}:\nStrengths: ${Array.isArray(c.strengths) ? c.strengths.join(', ') : c.strengths}\nWeaknesses: ${Array.isArray(c.weaknesses) ? c.weaknesses.join(', ') : c.weaknesses}\nStrategy: ${c.strategy}`
                                    ),
                                    ...actions.map((a: any) => {
                                        const timeline = a.timeline || a.estimatedEffort || '';
                                        return `\n[${a.priority}] ${a.action}${timeline ? ` (${timeline})` : ''}`;
                                    }),
                                ].join('\n');
                                navigator.clipboard.writeText(text);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-[#222] px-2 py-1 text-[10px] font-bold text-[#888] transition-all hover:bg-[#333] hover:text-white"
                        >
                            <Copy size={10} />
                            Copy
                        </button>
                    )}
                </div>
            </div>

            {isGeneratingBrief && (
                <div className="rounded-xl border border-[#1a1a1e] bg-[#0d0d0f] p-6 text-center">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-[#F5364E]" />
                    <div className="text-[11px] text-[#888]">AI is analyzing your competitive landscape...</div>
                    <div className="mt-1 text-[10px] text-[#555]">This may take 15-30 seconds</div>
                </div>
            )}

            {!isGeneratingBrief && !hasBrief && (
                <EmptyState
                    message="No brief generated yet."
                    submessage={`Click "Generate Brief" to create an AI-powered competitive analysis.${competitorProfiles.size === 0 ? ' Add competitors first.' : ''}`}
                />
            )}

            {!isGeneratingBrief && hasBrief && brief && (
                <>
                    <div className={CARD_HIGHLIGHT}>
                        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#F5364E]">
                            <FileText size={10} />
                            Executive Summary
                        </div>
                        <p className="text-[12px] leading-relaxed text-[#ccc]">{brief.executiveSummary}</p>
                    </div>

                    {brief.perCompetitor?.length > 0 && (
                        <div className="space-y-2">
                            <div className={SECTION_HEADER_WITH_MARGIN}>Per-Competitor</div>
                            {brief.perCompetitor.map((comp, i) => (
                                <div key={`${comp.domain}-${i}`} className={CARD}>
                                    <div className="mb-2 text-[11px] font-bold text-white">{comp.domain}</div>
                                    <div className="space-y-1.5 text-[11px]">
                                        <div>
                                            <span className="text-[9px] font-bold uppercase text-green-400">Strengths: </span>
                                            <span className="text-[#aaa]">{comp.strengths}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-bold uppercase text-red-400">Weaknesses: </span>
                                            <span className="text-[#aaa]">{comp.weaknesses}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-bold uppercase text-blue-400">Strategy: </span>
                                            <span className="text-[#aaa]">{comp.strategy}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {brief.recommendedActions?.length > 0 && (
                        <div className={CARD}>
                            <div className={SECTION_HEADER_WITH_MARGIN}>Recommended Actions</div>
                            <div className="space-y-2">
                                {brief.recommendedActions.map((action, i) => (
                                    <div key={`${action.action}-${i}`} className="flex items-start gap-2 border-b border-[#111] py-1.5 last:border-0">
                                        <span
                                            className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                                                PRIORITY_STYLES[action.priority] || 'bg-[#111] text-[#666]'
                                            }`}
                                        >
                                            {action.priority}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[11px] text-[#ccc]">{action.action}</div>
                                            <div className="mt-0.5 text-[9px] text-[#555]">Timeline: {action.timeline}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasBrief && brief && (
                        <div className={CARD}>
                            <div className={SECTION_HEADER_WITH_MARGIN}>SWOT Summary</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-lg border border-green-500/10 bg-green-500/5 p-3">
                                    <div className="mb-1.5 text-[9px] font-bold uppercase text-green-400">Strengths</div>
                                    <div className="space-y-1">
                                        {advantages.slice(0, 3).map((a, i) => (
                                            <div key={`${a.label}-${i}`} className="text-[10px] text-[#ccc]">
                                                • {a.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-3">
                                    <div className="mb-1.5 text-[9px] font-bold uppercase text-red-400">Weaknesses</div>
                                    <div className="space-y-1">
                                        {vulnerabilities.slice(0, 3).map((v, i) => (
                                            <div key={`${v.label}-${i}`} className="text-[10px] text-[#ccc]">
                                                • {v.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-blue-500/10 bg-blue-500/5 p-3">
                                    <div className="mb-1.5 text-[9px] font-bold uppercase text-blue-400">Opportunities</div>
                                    <div className="space-y-1 text-[10px] text-[#ccc]">
                                        {activeComps.filter((c) => Number(c.techHealthScore || 0) < 60).length > 0 && (
                                            <div>• Competitors have weak tech health</div>
                                        )}
                                        {activeComps.filter((c) => !c.hasLlmsTxt).length > 0 && (
                                            <div>• No competitor has llms.txt</div>
                                        )}
                                        {activeComps.filter((c) => Number(c.avgGeoScore || 0) < 50).length > 0 && (
                                            <div>• Competitors lag on AI readiness</div>
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-lg border border-orange-500/10 bg-orange-500/5 p-3">
                                    <div className="mb-1.5 text-[9px] font-bold uppercase text-orange-400">Threats</div>
                                    <div className="space-y-1 text-[10px] text-[#ccc]">
                                        {activeComps
                                            .filter((c) => c.threatLevel === 'Critical' || c.threatLevel === 'High')
                                            .map((c, i) => (
                                                <div key={`${c.domain}-${i}`}>
                                                    • {c.domain} ({c.threatLevel})
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {brief.generatedAt && (
                        <div className="text-center text-[9px] text-[#444]">
                            Generated {new Date(brief.generatedAt).toLocaleString()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
