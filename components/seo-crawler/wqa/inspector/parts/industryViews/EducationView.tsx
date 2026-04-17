import React from 'react';
import { IndustryActionBlock, DataRow, SectionHeader, StatusBadge } from './_helpers';

export default function EducationView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  const schemaTypes = page?.schemaTypes || [];
  return (
    <div>
      <IndustryActionBlock page={page} />
      <SectionHeader title="Course signals" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={schemaTypes.includes('Course') ? 'pass' : 'warn'} label="Course schema" />
        <StatusBadge status={sig.hasInstructor ? 'pass' : 'info'} label="Instructor" />
        <StatusBadge status={sig.hasSyllabus ? 'pass' : 'info'} label="Syllabus" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Instructor" value={sig.instructorName} />
        <DataRow label="Duration" value={sig.duration} />
        <DataRow label="Level" value={sig.level} />
        <DataRow label="Price" value={sig.priceText} />
      </div>
    </div>
  );
}
