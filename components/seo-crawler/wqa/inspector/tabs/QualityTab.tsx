import React from 'react';
import {
  DataRow, MetricCard, SectionHeader, StatusBadge,
  formatNumber, getMetric
} from '../../../inspector/shared';
import { Sparkline } from '@/components/seo-crawler/right-sidebar/_shared';
import CollapseGroup from '../parts/CollapseGroup';

export default function QualityTab({ page }: { page: any }) {
  const healthSeries = Array.isArray(page?.healthScoreSeries30d) ? page.healthScoreSeries30d.map(Number) : [];
  
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Quality Score" value={formatNumber(getMetric(page, 'healthScore'))} />
        <MetricCard label="Peer Percentile" value={`${getMetric(page, 'peerPercentile') || 0}%`} />
        <MetricCard label="Value Tier" value={getMetric(page, 'pageValueTier') || '☆'} />
        <MetricCard label="Decay Risk" value={page?.isLosingTraffic ? 'High' : 'Low'} color={page?.isLosingTraffic ? 'text-red-400' : 'text-green-400'} />
      </div>

      <CollapseGroup title="Health Trend (30d)">
        <div className="bg-[#0a0a0a] border border-[#222] rounded p-4">
          <div className="h-24">
            <Sparkline points={healthSeries} height={90} />
          </div>
          <div className="flex justify-between text-[10px] text-[#555] mt-2 font-mono">
            <span>30 DAYS AGO</span>
            <span>TODAY</span>
          </div>
        </div>
      </CollapseGroup>

      <CollapseGroup title="Content Signals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 min-w-0">
          <DataRow label="Word count" value={formatNumber(page?.wordCount)} mono />
          <DataRow label="Readability" value={getMetric(page, 'readabilityScore')} />
          <DataRow label="Sentiment" value={getMetric(page, 'sentiment')} />
          <DataRow label="AI Generated %" value={`${getMetric(page, 'aiGeneratedPct') || 0}%`} status={Number(getMetric(page, 'aiGeneratedPct') || 0) > 20 ? 'warn' : 'pass'} />
          <DataRow label="Uniqueness" value={getMetric(page, 'uniquenessScore')} />
          <DataRow label="Internal competition" value={page?.cannibalizationCount || 0} status={Number(page?.cannibalizationCount || 0) > 0 ? 'fail' : 'pass'} />
        </div>
      </CollapseGroup>

      <CollapseGroup title="E-E-A-T Signals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 min-w-0">
          <DataRow label="Author identified" value={page?.author ? 'Yes' : 'No'} status={page?.author ? 'pass' : 'warn'} />
          <DataRow label="Fact-check score" value={getMetric(page, 'factCheckScore')} />
          <DataRow label="External citations" value={formatNumber(page?.externalCitations)} />
          <DataRow label="Co-citations" value={formatNumber(page?.coCitations)} />
        </div>
      </CollapseGroup>
    </div>
  );
}
