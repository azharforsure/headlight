import React from 'react';
import { IndustryActionBlock, DataRow, MetricCard, SectionHeader, StatusBadge, formatNumber } from './_helpers';

export default function LocalView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  const nap = sig.napSnapshot || {};
  const schemaTypes = page?.schemaTypes || [];
  return (
    <div>
      <IndustryActionBlock page={page} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard label="NAP present" value={nap.phones?.length || nap.address ? 'Yes' : 'No'} color={nap.phones?.length || nap.address ? 'text-green-400' : 'text-red-400'} />
        <MetricCard label="Embedded map" value={nap.hasMap ? 'Yes' : 'No'} color={nap.hasMap ? 'text-green-400' : 'text-orange-400'} />
        <MetricCard label="Hours markup" value={sig.hasHoursMarkup ? 'Yes' : 'No'} />
        <MetricCard label="Matches GMB" value={sig.napMatchGmb ? 'Yes' : sig.napMatchGmb === false ? 'No' : '—'} color={sig.napMatchGmb === false ? 'text-red-400' : undefined} />
      </div>
      <SectionHeader title="NAP block" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mb-5">
        <DataRow label="Business name" value={sig.businessName} />
        <DataRow label="Address" value={nap.address} />
        <DataRow label="Phone" value={Array.isArray(nap.phones) ? nap.phones.join(', ') : nap.phones} />
        <DataRow label="Service area" value={sig.serviceArea} />
        <DataRow label="Distance from primary" value={sig.distanceFromPrimaryM ? `${formatNumber(sig.distanceFromPrimaryM)} m` : '—'} />
        <DataRow label="Distinct from HQ" value={sig.napDistinctFromHomepage ? 'Yes' : 'No'} />
      </div>
      <SectionHeader title="Schema" />
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={schemaTypes.includes('LocalBusiness') ? 'pass' : 'fail'} label="LocalBusiness schema" />
        <StatusBadge status={schemaTypes.includes('GeoCoordinates') ? 'pass' : 'info'} label="GeoCoordinates" />
        <StatusBadge status={schemaTypes.includes('OpeningHoursSpecification') ? 'pass' : 'info'} label="OpeningHours" />
      </div>
    </div>
  );
}
