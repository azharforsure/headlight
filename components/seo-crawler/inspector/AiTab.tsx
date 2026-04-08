import React from 'react';
import { Lightbulb, Sparkles, Target, Zap, ShieldCheck, Tag } from 'lucide-react';
import { DataRow, formatNumber, MetricCard, SectionHeader, StatusBadge } from './shared';

const buildSuggestions = (page: any) => {
    const suggestions: string[] = [];
    if (page?.fixSuggestions && Array.isArray(page.fixSuggestions)) {
        return page.fixSuggestions.map((s: any) => s.fix);
    }
    
    if (!page?.title) suggestions.push('Add a descriptive title tag.');
    if (!page?.metaDesc) suggestions.push('Add a meta description with target intent.');
    if (!page?.h1_1) suggestions.push('Add a single, descriptive H1.');
    if (Number(page?.wordCount || 0) > 0 && Number(page?.wordCount || 0) < 300) suggestions.push('Expand thin content with topic-complete sections.');
    if (Number(page?.loadTime || 0) > 1500) suggestions.push('Improve response time and remove render-blocking assets.');
    if (Number(page?.inlinks || 0) < 3 && Number(page?.statusCode || 0) === 200) suggestions.push('Increase internal links from related pages.');
    if (Number(page?.gscImpressions || 0) > 1000 && Number(page?.gscCtr || 0) < 0.01) suggestions.push('Rewrite title/meta to improve CTR.');
    if (Number(page?.schemaErrors || 0) > 0) suggestions.push('Fix structured data validation errors.');
    return suggestions;
};

export default function AiTab({ page }: { page: any }) {
    const suggestions = buildSuggestions(page);
    const hasAiSignals = Boolean(
        page?.topicCluster ||
        page?.searchIntent ||
        page?.funnelStage ||
        page?.strategicPriority ||
        page?.recommendedAction ||
        page?.aiSummary
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Opportunity" value={formatNumber(page?.opportunityScore)} />
                <MetricCard label="Business Value" value={formatNumber(page?.businessValueScore)} />
                <MetricCard label="Content Quality" value={formatNumber(page?.contentQualityScore)} />
                <MetricCard label="Strategic Priority" value={page?.strategicPriority || 'Low'} />
            </div>

            {page?.aiSummary && (
                <div className="bg-[#1a1a1a]/50 border border-indigo-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-[13px]">
                        <Sparkles size={14} /> AI Content Summary
                    </div>
                    <p className="text-[13px] text-gray-300 leading-relaxed italic">
                        "{page.aiSummary}"
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div>
                        <SectionHeader title="AI Classification" icon={<Target size={14} className="text-blue-400" />} />
                        <div className="space-y-1">
                            <DataRow label="Topic Cluster" value={page?.topicCluster} />
                            <DataRow label="Search Intent" value={page?.searchIntent} />
                            <DataRow label="Funnel Stage" value={page?.funnelStage} />
                            <DataRow label="Action" value={page?.recommendedAction} status={page?.recommendedAction && page?.recommendedAction !== 'Monitor' ? 'info' : 'pass'} />
                            <DataRow label="Reason" value={page?.recommendedActionReason} />
                        </div>
                    </div>

                    {page?.extractedKeywords && Array.isArray(page.extractedKeywords) && page.extractedKeywords.length > 0 && (
                        <div>
                            <SectionHeader title="Extracted Keywords" icon={<Tag size={14} className="text-purple-400" />} />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {page.extractedKeywords.slice(0, 10).map((kw: any, i: number) => (
                                    <div key={i} className="px-2 py-1 bg-[#222] border border-[#333] rounded text-[11px] text-[#bbb] flex items-center gap-1.5">
                                        <span>{kw.phrase}</span>
                                        <span className="text-[9px] text-gray-500 uppercase tracking-tighter bg-black px-1 rounded">{kw.intent}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div>
                        <SectionHeader title="Suggested Fixes" icon={<Zap size={14} className="text-yellow-400" />} />
                        {suggestions.length === 0 ? (
                            <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-[12px] text-green-400 flex items-center gap-2">
                                <Sparkles size={14} /> No critical AI suggestions right now.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {suggestions.map((suggestion, index) => (
                                    <div key={`suggestion-${index}`} className="bg-[#0a0a0a] border border-[#222] rounded p-3">
                                        <div className="text-[12px] text-[#ddd] flex items-start gap-2">
                                            <Lightbulb size={13} className="text-yellow-400 mt-0.5 shrink-0" />
                                            <span>{suggestion}</span>
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            <button className="px-2 py-1 text-[10px] font-semibold bg-[#1c2b1c] text-green-400 border border-green-500/30 rounded">Apply Fix</button>
                                            <button className="px-2 py-1 text-[10px] font-semibold bg-[#202020] text-[#999] border border-[#333] rounded">Ignore</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {(page?.contentStrengths || page?.contentWeaknesses) && (
                        <div>
                            <SectionHeader title="Content Quality Breakdown" icon={<ShieldCheck size={14} className="text-green-400" />} />
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest px-1">Strengths</div>
                                    {page?.contentStrengths?.map((s: string, i: number) => (
                                        <div key={i} className="text-[11px] text-gray-400 border-l-2 border-green-500/30 pl-2 py-0.5">{s}</div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-1">Weaknesses</div>
                                    {page?.contentWeaknesses?.map((w: string, i: number) => (
                                        <div key={i} className="text-[11px] text-gray-400 border-l-2 border-red-500/30 pl-2 py-0.5">{w}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#222]">
                <StatusBadge status={hasAiSignals ? 'pass' : 'info'} label={hasAiSignals ? 'AI analysis complete' : 'AI analysis pending'} />
                {page?.intentConfidence != null && (
                    <StatusBadge status="info" label={`Intent Confidence: ${Math.round(page.intentConfidence * 100)}%`} />
                )}
            </div>
        </div>
    );
}
