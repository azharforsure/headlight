import React from 'react';
import { IndustryActionBlock, DataRow, SectionHeader, StatusBadge } from './_helpers';

export default function FinanceView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  return (
    <div>
      <IndustryActionBlock page={page} />
      <SectionHeader title="YMYL trust signals" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={sig.hasAuthorCredentials ? 'pass' : 'fail'} label="Author credentials" />
        <StatusBadge status={sig.hasRiskDisclosure ? 'pass' : 'warn'} label="Risk disclosure" />
        <StatusBadge status={sig.hasRegulatoryLink ? 'pass' : 'info'} label="Regulatory link" />
        <StatusBadge status={sig.hasCitations ? 'pass' : 'info'} label="Sources cited" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Author" value={sig.authorName} />
        <DataRow label="Credentials" value={sig.authorCredentials} />
        <DataRow label="Last updated" value={page?.lastModified} />
      </div>
    </div>
  );
}
