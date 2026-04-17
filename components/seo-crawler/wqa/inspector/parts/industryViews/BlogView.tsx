import React from 'react';
import { IndustryActionBlock, DataRow, SectionHeader, StatusBadge, formatNumber } from './_helpers';

export default function BlogView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  return (
    <div>
      <IndustryActionBlock page={page} />
      <SectionHeader title="Editorial signals" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={sig.hasAuthorAttribution ? 'pass' : 'warn'} label="Byline" />
        <StatusBadge status={sig.hasPublishDateMarkup ? 'pass' : 'warn'} label="Publish date markup" />
        <StatusBadge status={sig.hasUpdateDateMarkup ? 'pass' : 'info'} label="Update date markup" />
        <StatusBadge status={(page?.schemaTypes || []).includes('BlogPosting') ? 'pass' : 'info'} label="BlogPosting schema" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Author" value={sig.authorName || page?.wpAuthorName} />
        <DataRow label="Topic cluster" value={page?.topicCluster} />
        <DataRow label="Tags" value={Array.isArray(sig.tags) ? sig.tags.join(', ') : sig.tags} />
        <DataRow label="Word count" value={formatNumber(page?.wordCount)} />
        <DataRow label="Reading time" value={sig.readingTime ? `${sig.readingTime} min` : '—'} />
      </div>
    </div>
  );
}
