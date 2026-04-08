import React from 'react';
import { DataRow, formatNumber, IssuesList, getPageIssues, MetricCard, SectionHeader, StatusBadge } from './shared';

export default function ContentTab({ page }: { page: any }) {
    const issues = getPageIssues(page).filter((issue) =>
        /content|duplicate|readability|word|title|meta|h1|grammar|spelling|lorem|decay/i.test(issue.label)
    );

    return (
        <div>
            <IssuesList issues={issues} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <MetricCard label="Word Count" value={formatNumber(page?.wordCount)} />
                <MetricCard label="Readability" value={page?.readability || '—'} sub={`Flesch ${formatNumber(page?.fleschScore)}`} />
                <MetricCard label="Sentences" value={formatNumber(page?.sentenceCount)} sub={`Avg words/sentence ${formatNumber(page?.avgWordsPerSentence, { maximumFractionDigits: 1 })}`} />
                <MetricCard label="Text Ratio" value={page?.textRatio ? `${formatNumber(page.textRatio, { maximumFractionDigits: 1 })}%` : '—'} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8">
                <div>
                    <SectionHeader title="Quality Signals" />
                    <DataRow label="Duplicate (Exact)" value={page?.exactDuplicate ? 'Yes' : 'No'} status={page?.exactDuplicate ? 'fail' : 'pass'} />
                    <DataRow label="Near Duplicate" value={formatNumber(page?.noNearDuplicates)} status={Number(page?.noNearDuplicates || 0) > 0 ? 'warn' : 'pass'} />
                    <DataRow label="Near Match URL" value={page?.nearDuplicateMatch || page?.closestSemanticAddress} />
                    <DataRow label="Similarity Score" value={formatNumber(page?.semanticSimilarityScore, { maximumFractionDigits: 2 })} mono />
                    <DataRow label="Spelling Errors" value={formatNumber(page?.spellingErrors)} status={Number(page?.spellingErrors || 0) > 0 ? 'warn' : 'pass'} />
                    <DataRow label="Grammar Errors" value={formatNumber(page?.grammarErrors)} status={Number(page?.grammarErrors || 0) > 0 ? 'warn' : 'pass'} />
                    <DataRow label="Lorem Ipsum" value={page?.containsLoremIpsum ? 'Detected' : 'Not detected'} status={page?.containsLoremIpsum ? 'warn' : 'pass'} />
                    <DataRow label="Content Decay" value={page?.contentDecay || '—'} status={String(page?.contentDecay || '').toLowerCase().includes('decay') ? 'warn' : 'pass'} />
                </div>

                <div>
                    <SectionHeader title="AI Context" />
                    <DataRow label="Topic Cluster" value={page?.topicCluster} />
                    <DataRow label="Search Intent" value={page?.searchIntent} />
                    <DataRow label="Funnel Stage" value={page?.funnelStage} />
                    <DataRow label="Strategic Priority" value={page?.strategicPriority} />
                    <DataRow label="Content Quality Score" value={formatNumber(page?.contentQualityScore)} mono />
                    <DataRow label="Engagement Score" value={formatNumber(page?.engagementScore)} mono />
                    <DataRow label="Recommended Action" value={page?.recommendedAction} status={page?.recommendedAction && page?.recommendedAction !== 'Monitor' ? 'info' : 'pass'} />
                </div>
            </div>

            <div className="mt-6">
                <SectionHeader title="Extracted Content Preview" />
                {page?.textContent ? (
                    <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-[12px] text-[#ccc] whitespace-pre-wrap max-h-[260px] overflow-y-auto custom-scrollbar">
                        {String(page.textContent).slice(0, 1200)}
                    </div>
                ) : (
                    <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 text-[12px] text-[#666]">
                        No extracted text content available for this page.
                    </div>
                )}
            </div>
        </div>
    );
}
