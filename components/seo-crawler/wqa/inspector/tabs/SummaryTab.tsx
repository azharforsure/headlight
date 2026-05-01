import React from 'react';
import {
  MetricCard, SectionHeader, StatusBadge, DataRow, TruncatedUrl, IssuesList,
  formatNumber, formatPercent, getPageIssues, getMetric, getActions
} from '../../../inspector/shared';
import ActionCard from '../parts/ActionCard';
import { Sparkline } from '@/components/seo-crawler/right-sidebar/_shared';
import { formatCat } from '../../wqaUtils';

function trend28d(page: any, key: string): number[] {
  const s = page?.[`${key}Series28d`];
  return Array.isArray(s) ? s.map(Number) : [];
}

export default function SummaryTab({ page }: { page: any }) {
  const issues = getActions(page);
  const tier = getMetric(page, 'pageValueTier') || '☆';
  const pri = Number(getMetric(page, 'actionPriority') || 0);

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
            <PageField label="Author" value={getMetric(page, 'author') || getMetric(page, 'wpAuthorName')} />
            <PageField label="Topic" value={getMetric(page, 'topicCluster')} />
            <PageField label="Industry" value={getMetric(page, 'industryCategory')} />
            <PageField label="Intent" value={getMetric(page, 'searchIntent')} />
          </div>
          {page?.industrySignals && (
            <div className="mt-3 p-2 bg-[#1a1a1a] rounded text-[10px] text-[#888]">
              <span className="text-[#F5364E] font-bold mr-1">INDUSTRY:</span>
              {Object.entries(page.industrySignals).map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </div>
          )}
        </div>

        {/* Primary actions */}
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 min-w-0">
          <SectionHeader title="Primary actions" />
          <div className="space-y-2">
            {issues.slice(0, 3).map((a, i) => (
              <ActionCard
                key={`${a.id}-${i}`}
                title={a.label}
                reason={a.description || a.reason}
                priority={a.priority || (a.severity === 'CRITICAL' ? 1 : a.severity === 'HIGH' ? 3 : a.severity === 'MEDIUM' ? 6 : 9)}
                estimatedImpact={a.estimatedImpact || (a.impactHint === 'high' ? 100 : a.impactHint === 'medium' ? 50 : 10)}
                effort={a.effort || (a.effortMinutes < 60 ? 'low' : a.effortMinutes < 240 ? 'medium' : 'high')}
                category={a.category || (a.id.startsWith('C') ? 'content' : a.id.startsWith('T') ? 'technical' : 'industry')}
                primary={i === 0 && (a.type === 'error' || a.severity === 'HIGH' || a.severity === 'CRITICAL')}
              />
            ))}
            {issues.length === 0 && (
              <div className="text-[12px] text-[#666] italic">No actions assigned. Page is healthy.</div>
            )}
          </div>
        </div>

        {/* Key numbers */}
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-3 min-w-0">
          <SectionHeader title="Key numbers" />
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Tier" value={tier} />
            <MetricCard label="Value" value={formatNumber(getMetric(page, 'pageValue'))} />
            <MetricCard label="Health" value={formatNumber(getMetric(page, 'healthScore'))} />
            <MetricCard label="Speed" value={getMetric(page, 'speedScore') || '—'} />
            <MetricCard label="Issues" value={formatNumber(issues.length)} />
            <MetricCard
              label="Traffic Δ"
              value={`${formatNumber(getMetric(page, 'sessionsDeltaPct'))}%`}
              color={Number(getMetric(page, 'sessionsDeltaPct') || 0) < 0 ? 'text-red-400' : 'text-green-400'}
            />
            <MetricCard label="Position" value={formatNumber(getMetric(page, 'gscPosition'), { maximumFractionDigits: 1 })} />
            <MetricCard label="CTR" value={formatPercent(getMetric(page, 'gscCtr'), 100)} />
          </div>
        </div>
      </div>

      <IssuesList issues={issues as any} page={page} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <TrendCard label="Clicks 28d" values={trend28d(page, 'gscClicks')} />
        <TrendCard label="Impressions 28d" values={trend28d(page, 'gscImpressions')} />
        <TrendCard label="CTR 28d" values={trend28d(page, 'gscCtr')} />
      </div>

      {issues.length > 3 && (
        <div>
          <SectionHeader title="Other suggested fixes" />
          <div className="space-y-2">
            {issues.slice(3).map((a, i) => (
              <ActionCard
                key={`${a.id}-${i}`}
                title={a.label}
                reason={a.description || a.reason}
                priority={a.priority || (a.severity === 'CRITICAL' ? 1 : a.severity === 'HIGH' ? 3 : a.severity === 'MEDIUM' ? 6 : 9)}
                estimatedImpact={a.estimatedImpact || (a.impactHint === 'high' ? 100 : a.impactHint === 'medium' ? 50 : 10)}
                effort={a.effort || (a.effortMinutes < 60 ? 'low' : a.effortMinutes < 240 ? 'medium' : 'high')}
                category={a.category || (a.id.startsWith('C') ? 'content' : a.id.startsWith('T') ? 'technical' : 'industry')}
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
      <Sparkline points={values} width={200} height={36} />
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
