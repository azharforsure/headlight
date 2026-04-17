import React from 'react';
import { IndustryActionBlock, DataRow, MetricCard, SectionHeader, StatusBadge, formatNumber } from './_helpers';

export default function NewsView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  const schemaTypes = page?.schemaTypes || [];
  return (
    <div>
      <IndustryActionBlock page={page} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Byline" value={sig.hasAuthorAttribution ? 'Yes' : 'No'} color={sig.hasAuthorAttribution ? 'text-green-400' : 'text-red-400'} />
        <MetricCard label="Pub date" value={page?.visibleDate || page?.wpPublishDate || '—'} />
        <MetricCard label="Updated" value={page?.lastModified || '—'} />
        <MetricCard label="News sitemap" value={page?.inNewsSitemap ? 'Yes' : 'No'} color={page?.inNewsSitemap ? 'text-green-400' : 'text-red-400'} />
      </div>
      <SectionHeader title="Article structure" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={schemaTypes.includes('NewsArticle') || schemaTypes.includes('Article') ? 'pass' : 'fail'} label="Article schema" />
        <StatusBadge status={sig.hasPublishDateMarkup ? 'pass' : 'warn'} label="Publish date markup" />
        <StatusBadge status={sig.hasUpdateDateMarkup ? 'pass' : 'info'} label="Update date markup" />
        <StatusBadge status={page?.amphtml ? 'pass' : 'info'} label={page?.amphtml ? 'Has AMP' : 'No AMP'} />
      </div>
      <SectionHeader title="Editorial" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Author" value={sig.authorName || page?.wpAuthorName} />
        <DataRow label="Section" value={page?.wpCategory || sig.section} />
        <DataRow label="Tags" value={Array.isArray(sig.tags) ? sig.tags.join(', ') : sig.tags} />
        <DataRow label="Word count" value={formatNumber(page?.wordCount)} />
        <DataRow label="Images" value={formatNumber(page?.totalImages)} />
        <DataRow label="Has video" value={sig.hasVideo ? 'Yes' : 'No'} />
      </div>
    </div>
  );
}
