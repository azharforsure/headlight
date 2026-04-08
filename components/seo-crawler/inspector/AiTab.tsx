import React from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { DataRow, formatNumber, MetricCard, SectionHeader, StatusBadge } from './shared';

const buildSuggestions = (page: any) => {
    const suggestions: string[] = [];
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
        page?.embeddings
    );

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <MetricCard label="Opportunity" value={formatNumber(page?.opportunityScore)} />
                <MetricCard label="Business Value" value={formatNumber(page?.businessValueScore)} />
                <MetricCard label="Tech Health" value={formatNumber(page?.techHealthScore)} />
                <MetricCard label="Content Quality" value={formatNumber(page?.contentQualityScore)} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="AI Classification" />
                    <DataRow label="Topic Cluster" value={page?.topicCluster} />
                    <DataRow label="Search Intent" value={page?.searchIntent} />
                    <DataRow label="Funnel Stage" value={page?.funnelStage} />
                    <DataRow label="Strategic Priority" value={page?.strategicPriority} />
                    <DataRow label="Recommended Action" value={page?.recommendedAction} status={page?.recommendedAction && page?.recommendedAction !== 'Monitor' ? 'info' : 'pass'} />
                    <DataRow label="Action Reason" value={page?.recommendedActionReason} />
                    <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge status={hasAiSignals ? 'pass' : 'info'} label={hasAiSignals ? 'AI signals present' : 'AI enrichment pending'} />
                        <StatusBadge status={Number(page?.opportunityScore || 0) >= 70 ? 'pass' : 'info'} label={`Opportunity ${formatNumber(page?.opportunityScore)}`} />
                    </div>
                </div>

                <div>
                    <SectionHeader title="Suggested Fixes" />
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
                                        <button className="px-2 py-1 text-[10px] font-semibold bg-[#1c2b1c] text-green-400 border border-green-500/30 rounded">Apply</button>
                                        <button className="px-2 py-1 text-[10px] font-semibold bg-[#202020] text-[#bbb] border border-[#333] rounded">Edit</button>
                                        <button className="px-2 py-1 text-[10px] font-semibold bg-[#202020] text-[#999] border border-[#333] rounded">Skip</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <SectionHeader title="Embedding Snapshot" />
                {Array.isArray(page?.embeddings) && page.embeddings.length > 0 ? (
                    <pre className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-[11px] text-[#bbb] font-mono overflow-x-auto custom-scrollbar">
                        [{page.embeddings.slice(0, 20).map((n: number) => Number(n).toFixed(4)).join(', ')} ...]
                    </pre>
                ) : (
                    <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-[12px] text-[#666]">
                        Embeddings not generated for this page yet.
                    </div>
                )}
            </div>
        </div>
    );
}
