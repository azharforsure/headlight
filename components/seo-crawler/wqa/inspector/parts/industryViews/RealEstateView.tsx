import React from 'react';
import { IndustryActionBlock, DataRow, SectionHeader, StatusBadge, formatNumber } from './_helpers';

export default function RealEstateView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  const schemaTypes = page?.schemaTypes || [];
  return (
    <div>
      <IndustryActionBlock page={page} />
      <SectionHeader title="Listing signals" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={schemaTypes.includes('RealEstateListing') || schemaTypes.includes('Residence') ? 'pass' : 'warn'} label="Listing schema" />
        <StatusBadge status={sig.hasMap ? 'pass' : 'info'} label="Map embed" />
        <StatusBadge status={sig.hasPrice ? 'pass' : 'warn'} label="Price visible" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Price" value={sig.priceText} />
        <DataRow label="Bedrooms" value={formatNumber(sig.bedrooms)} />
        <DataRow label="Bathrooms" value={formatNumber(sig.bathrooms)} />
        <DataRow label="Area" value={sig.areaText} />
        <DataRow label="Year built" value={sig.yearBuilt} />
        <DataRow label="Status" value={sig.listingStatus} />
      </div>
    </div>
  );
}
