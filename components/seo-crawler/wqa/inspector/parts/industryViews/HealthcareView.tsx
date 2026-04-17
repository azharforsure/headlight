import React from 'react';
import { IndustryActionBlock, DataRow, SectionHeader, StatusBadge } from './_helpers';

export default function HealthcareView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  return (
    <div>
      <IndustryActionBlock page={page} />
      <SectionHeader title="YMYL trust signals" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={sig.hasMedicalAuthor ? 'pass' : 'fail'} label="Medical author" />
        <StatusBadge status={sig.hasMedicalReviewer ? 'pass' : 'warn'} label="Medical reviewer" />
        <StatusBadge status={sig.hasMedicalDisclaimer ? 'pass' : 'warn'} label="Medical disclaimer" />
        <StatusBadge status={sig.hasCitations ? 'pass' : 'info'} label={`Citations ${sig.citationCount ?? ''}`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Author name" value={sig.authorName} />
        <DataRow label="Author credentials" value={sig.authorCredentials} />
        <DataRow label="Reviewer" value={sig.reviewerName} />
        <DataRow label="Reviewer credentials" value={sig.reviewerCredentials} />
        <DataRow label="Last reviewed" value={sig.lastReviewedDate} />
      </div>
    </div>
  );
}
