import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';

const PRIORITY_STYLES: Record<string, string> = {
    P0: 'text-red-400 bg-red-400/10',
    P1: 'text-yellow-400 bg-yellow-400/10',
    P2: 'text-green-400 bg-green-400/10',
};

export default function CompBriefTab() {
    const { competitiveState, generateCompetitiveBrief } = useSeoCrawler();
    const { brief, isGeneratingBrief, competitorProfiles } = competitiveState;

    const hasBrief = Boolean(brief && brief.executiveSummary && !brief.executiveSummary.includes('Unable to generate'));

    return (
        <div className="custom-scrollbar h-full space-y-4 overflow-y-auto p-3">
            <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#666]">AI Competitive Brief</div>
                <button
                    onClick={generateCompetitiveBrief}
                    disabled={isGeneratingBrief || competitorProfiles.size === 0}
                    className="flex items-center gap-1 rounded-lg bg-[#F5364E]/10 px-2 py-1 text-[10px] font-bold text-[#F5364E] transition-all hover:bg-[#F5364E]/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    <RefreshCw size={10} className={isGeneratingBrief ? 'animate-spin' : ''} />
                    {isGeneratingBrief ? 'Generating...' : hasBrief ? 'Regenerate' : 'Generate Brief'}
                </button>
            </div>

            {isGeneratingBrief && (
                <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-6 text-center">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-[#F5364E]" />
                    <div className="text-[11px] text-[#888]">AI is analyzing your competitive landscape...</div>
                    <div className="mt-1 text-[10px] text-[#555]">This may take 15-30 seconds</div>
                </div>
            )}

            {!isGeneratingBrief && !hasBrief && (
                <div className="rounded-xl border border-dashed border-[#333] bg-[#0a0a0a] p-6 text-center">
                    <div className="mb-2 text-[12px] text-[#666]">No brief generated yet.</div>
                    <div className="text-[10px] text-[#555]">
                        Click &quot;Generate Brief&quot; to create an AI-powered competitive analysis.
                        {competitorProfiles.size === 0 && ' Add competitors first.'}
                    </div>
                </div>
            )}

            {!isGeneratingBrief && hasBrief && brief && (
                <>
                    <div className="rounded-xl border border-[#F5364E]/20 bg-[#F5364E]/5 p-3">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#F5364E]">Executive Summary</div>
                        <p className="text-[12px] leading-relaxed text-[#ccc]">{brief.executiveSummary}</p>
                    </div>

                    {brief.perCompetitor?.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#666]">Per-Competitor</div>
                            {brief.perCompetitor.map((comp, i) => (
                                <div key={`${comp.domain}-${i}`} className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
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
                        <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#666]">Recommended Actions</div>
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
