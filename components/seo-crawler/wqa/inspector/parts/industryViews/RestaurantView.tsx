import React from 'react';
import { IndustryActionBlock, DataRow, SectionHeader, StatusBadge } from './_helpers';

export default function RestaurantView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  const schemaTypes = page?.schemaTypes || [];
  return (
    <div>
      <IndustryActionBlock page={page} />
      <SectionHeader title="Restaurant signals" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={schemaTypes.includes('Menu') ? 'pass' : 'warn'} label="Menu schema" />
        <StatusBadge status={sig.hasReservationLink ? 'pass' : 'info'} label="Reservation link" />
        <StatusBadge status={sig.hasHoursMarkup ? 'pass' : 'warn'} label="Hours markup" />
        <StatusBadge status={sig.hasFoodImages ? 'pass' : 'info'} label="Food images present" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Cuisine" value={sig.cuisine} />
        <DataRow label="Price range" value={sig.priceRange} />
        <DataRow label="Reservation provider" value={sig.reservationProvider} />
        <DataRow label="Menu link" value={sig.menuUrl} />
      </div>
    </div>
  );
}
