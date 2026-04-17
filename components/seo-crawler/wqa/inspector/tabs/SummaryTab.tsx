import React from 'react';
import {
  MetricCard, SectionHeader, StatusBadge, DataRow, TruncatedUrl, IssuesList,
  formatNumber, formatPercent, getPageIssues,
} from '../../../inspector/shared';
import ActionCard from '../parts/ActionCard';
import Sparkline from '../parts/Sparkline';
import { formatCat } from '../../wqaUtils';

function trend28d(page: any, key: string): number[] {
  const s = page?.[`${key}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function SummaryTab({ page }: { page: any }) {
  const issues = getPageIssues(page) || [];
  const tier = page?.pageValueTier || '☆';
  const pri = Number(page?.actionPriority || 0);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr_1fr] gap-4 mb-5">
        {/* Hero */}
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 min-w-0 overflow-hidden flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-[#555] mb-1">Page</div>
          <div className="text-[13px] text-white font-semibold truncate"><TruncatedUrl url={page?.url || ''} /></div>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status="info" label={formatCat(page?.pageCategory)} />
            {Number(page?.wordCount || 0) > 0 && (
              <StatusBadge status="info" label={`${formatNumber(page?.wordCount)} words`} />
            )}
            {page?.visibleDate && <StatusBadge status="info" label={`Pub ${String(page.visibleDate).slice(0, 10)}`} />}
            {page?.lastModified && <StatusBadge status="info" label={`Upd ${String(page.lastModified).slice(0, 10)}`} />}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-3 gap-y-2 mt-3 pt-3 border-t border-[#1a1a1a]">
            <PageField label="Author" value={page?.author || page?.wpAuthorName} />
            <PageField label="Topic" value={page?.topicCluster} />
            <PageField label="Section" value={page?.wpCategory || page?.section} />
            <PageField label="Intent" value={page?.searchIntent} />
          </div>
        </div>

        {/* Primary actions */}
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 min-w-0">
          <SectionHeader title="Primary actions" />
          <div className="space-y-2">
            {page?.technicalAction && page.technicalAction !== 'Monitor' && (
              <ActionCard
                title={page.technicalAction}
                reason={page.technicalActionReason}
                priority={pri}
                estimatedImpact={page.estimatedImpact}
                effort={page.technicalEffort}
                category="technical"
                factors={page.recommendedActionFactors}
                primary
              />
            )}
            {page?.contentAction && page.contentAction !== 'No Action' && (
              <ActionCard
                title={page.contentAction}
                reason={page.contentActionReason}
                priority={pri}
                estimatedImpact={page.estimatedImpact}
                effort={page.contentEffort}
                category="content"
                factors={page.recommendedActionFactors}
              />
            )}
            {page?.industryAction && (
              <ActionCard
                title={page.industryAction}
                reason={page.industryActionReason}
                category="industry"
              />
            )}
            {!page?.technicalAction && !page?.contentAction && !page?.industryAction && (
              <div className="text-[12px] text-[#666] italic">No actions assigned. Page is healthy.</div>
            )}
          </div>
        </div>

        {/* Key numbers */}
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 min-w-0">
          <SectionHeader title="Key numbers" />
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Tier" value={tier} />
            <MetricCard label="Value" value={formatNumber(page?.pageValue)} />
            <MetricCard label="Health" value={formatNumber(page?.healthScore)} />
            <MetricCard label="Speed" value={page?.speedScore || '—'} />
            <MetricCard label="Issues" value={formatNumber(issues.length)} />
            <MetricCard
              label="Traffic Δ"
              value={`${formatNumber(page?.sessionsDeltaPct)}%`}
              color={Number(page?.sessionsDeltaPct || 0) < 0 ? 'text-red-400' : 'text-green-400'}
            />
            <MetricCard label="Position" value={formatNumber(page?.gscPosition, { maximumFractionDigits: 1 })} />
            <MetricCard label="CTR" value={formatPercent(page?.gscCtr, 100)} />
          </div>
        </div>
      </div>

      <IssuesList issues={issues as any} page={page} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <TrendCard label="Clicks 28d" values={trend28d(page, 'gscClicks')} />
        <TrendCard label="Impressions 28d" values={trend28d(page, 'gscImpressions')} />
        <TrendCard label="CTR 28d" values={trend28d(page, 'gscCtr')} />
      </div>

      {Array.isArray(page?.secondaryActions) && page.secondaryActions.length > 0 && (
        <div>
          <SectionHeader title="Other suggested fixes" />
          <div className="space-y-2">
            {page.secondaryActions.map((a: any, i: number) => (
              <ActionCard
                key={`${a.action}-${i}`}
                title={a.action}
                reason={a.reason}
                priority={a.priority}
                estimatedImpact={a.estimatedImpact}
                effort={a.effort}
                category={a.category}
                factors={a.factors}
                confidence={a.confidence}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrendCard({ label, values }: { label: string; values: number[] }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded p-3">
      <div className="text-[10px] uppercase tracking-widest text-[#666] mb-2">{label}</div>
      <Sparkline values={values} width={200} height={36} />
    </div>
  );
}

function PageField({ label, value }: { label: string; value: any }) {
  const val = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-[#555] mb-0.5">{label}</div>
      <div className="text-[11px] text-[#ccc] truncate" title={val}>{val}</div>
    </div>
  );
}
