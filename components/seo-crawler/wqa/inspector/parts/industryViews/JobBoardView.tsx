import React from 'react';
import { IndustryActionBlock, DataRow, SectionHeader, StatusBadge } from './_helpers';

export default function JobBoardView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  const schemaTypes = page?.schemaTypes || [];
  return (
    <div>
      <IndustryActionBlock page={page} />
      <SectionHeader title="Job posting signals" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={schemaTypes.includes('JobPosting') ? 'pass' : 'fail'} label="JobPosting schema" />
        <StatusBadge status={sig.hasSalary ? 'pass' : 'warn'} label="Salary present" />
        <StatusBadge status={sig.hasExpirationDate ? 'pass' : 'warn'} label="Expiration date" />
        <StatusBadge status={sig.hasApplyCta ? 'pass' : 'warn'} label="Apply CTA" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Employment type" value={sig.employmentType} />
        <DataRow label="Location" value={sig.jobLocation} />
        <DataRow label="Remote" value={sig.isRemote ? 'Yes' : 'No'} />
        <DataRow label="Salary" value={sig.salaryText} />
        <DataRow label="Posted" value={sig.datePosted} />
        <DataRow label="Expires" value={sig.validThrough} />
      </div>
    </div>
  );
}
