import React from 'react';
import {
  DataRow, MetricCard, SectionHeader, StatusBadge,
  formatNumber, formatPercent,
} from '../../../inspector/shared';
import SuggestedRewriteBlock from '../parts/SuggestedRewriteBlock';
import CollapseGroup from '../parts/CollapseGroup';

export default function ContentTab({ page }: { page: any }) {
  const age = Number(page?.contentAge || 0);
  const freshTone = age < 90 ? 'pass' : age < 365 ? 'info' : age < 730 ? 'warn' : 'fail';
  const freshLabel = age < 90 ? 'Fresh' : age < 365 ? 'Recent' : age < 730 ? 'Stale' : 'Decaying';
  const qualityAxes = [
    { label: 'Depth',    value: Number(page?.contentQualityDepth     ?? page?.contentQualityScore ?? 0) },
    { label: 'Clarity',  value: Number(page?.contentQualityClarity   ?? 0) },
    { label: 'Intent',   value: Number(page?.intentMatch === 'aligned' ? 100 : page?.intentMatch === 'misaligned' ? 20 : 50) },
    { label: 'Freshness', value: Math.max(0, 100 - age / 10) },
    { label: 'E-E-A-T',  value: Number(page?.eeatScore || 0) },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Word count" value={formatNumber(page?.wordCount)} />
        <MetricCard label="Quality" value={formatNumber(page?.contentQualityScore)} />
        <MetricCard label="E-E-A-T" value={formatNumber(page?.eeatScore)} />
        <MetricCard label="Readability" value={page?.readability || '—'} sub={`Flesch ${formatNumber(page?.fleschScore)}`} />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={freshTone as any} label={`${freshLabel} · ${formatNumber(age)}d old`} />
        {page?.contentDecayRisk && (
          <StatusBadge status={page.contentDecayRisk === 'high' ? 'fail' : 'warn'} label={`Decay ${page.contentDecayRisk}`} />
        )}
        {page?.isCannibalized && <StatusBadge status="fail" label="Cannibalized" />}
        {Number(page?.spellingErrors || 0) > 0 && <StatusBadge status="warn" label={`Spelling ${formatNumber(page.spellingErrors)}`} />}
        {Number(page?.grammarErrors || 0) > 0 && <StatusBadge status="warn" label={`Grammar ${formatNumber(page.grammarErrors)}`} />}
        {page?.containsLoremIpsum && <StatusBadge status="fail" label="Lorem ipsum" />}
        {page?.exactDuplicate && <StatusBadge status="fail" label="Exact duplicate" />}
      </div>

      <SuggestedRewriteBlock
        label="Title"
        current={page?.title}
        suggestion={page?.suggestedTitle}
        limit={60}
      />
      <SuggestedRewriteBlock
        label="Meta description"
        current={page?.metaDesc}
        suggestion={page?.suggestedMetaDesc}
        limit={155}
      />
      <SuggestedRewriteBlock
        label="H1"
        current={page?.h1_1}
        suggestion={page?.suggestedH1}
        limit={70}
      />

      <CollapseGroup title="Quality breakdown">
        <div className="space-y-2">
          {qualityAxes.map((a) => (
            <div key={a.label} className="flex items-center gap-3">
              <div className="text-[11px] text-[#888] w-[90px] shrink-0">{a.label}</div>
              <div className="flex-1 h-[6px] bg-[#151515] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, a.value))}%`,
                    background: a.value >= 70 ? '#22c55e' : a.value >= 40 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="text-[11px] font-mono text-[#aaa] w-[40px] text-right">{formatNumber(a.value)}</div>
            </div>
          ))}
        </div>
      </CollapseGroup>

      <CollapseGroup title="Freshness">
        <DataRow label="Publish date" value={page?.visibleDate || page?.wpPublishDate} />
        <DataRow label="Last modified" value={page?.lastModified} />
        <DataRow label="Content age" value={`${formatNumber(age)} days`} status={freshTone as any} />
        <DataRow label="Decay risk" value={page?.contentDecayRisk || '—'} />
      </CollapseGroup>

      <CollapseGroup title="Duplication & clusters" defaultOpen={false}>
        <DataRow label="Content hash" value={page?.hash ? String(page.hash).slice(0, 24) : '—'} mono />
        <DataRow label="Exact duplicate" value={page?.exactDuplicate ? 'Yes' : 'No'} status={page?.exactDuplicate ? 'fail' : 'pass'} />
        <DataRow label="Near-duplicate match" value={page?.nearDuplicateMatch || '—'} />
        <DataRow label="Topic cluster" value={page?.topicCluster} />
      </CollapseGroup>

      <CollapseGroup title="Headings" defaultOpen={false}>
        <DataRow label="H1" value={page?.h1_1} />
        {page?.h1_2 && <DataRow label="H1 (2)" value={page.h1_2} status="warn" />}
        <DataRow label="H2 (1)" value={page?.h2_1} />
        <DataRow label="H2 (2)" value={page?.h2_2} />
        <DataRow label="Heading order" value={page?.incorrectHeadingOrder ? 'Incorrect' : 'OK'} status={page?.incorrectHeadingOrder ? 'warn' : 'pass'} />
      </CollapseGroup>
    </div>
  );
}
