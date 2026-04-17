import React from 'react';
import { IndustryActionBlock, DataRow, MetricCard, SectionHeader, StatusBadge, formatNumber } from './_helpers';

export default function EcommerceView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  return (
    <div>
      <IndustryActionBlock page={page} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Price visible" value={sig.priceVisible ? 'Yes' : 'No'} color={sig.priceVisible ? 'text-green-400' : 'text-red-400'} />
        <MetricCard label="Stock" value={sig.outOfStock ? 'Out' : sig.hasStockStatus ? 'In' : '—'} color={sig.outOfStock ? 'text-red-400' : 'text-green-400'} />
        <MetricCard label="Reviews" value={formatNumber(sig.reviewCount)} sub={sig.aggregateRating ? `★ ${sig.aggregateRating}` : ''} />
        <MetricCard label="Variants" value={formatNumber(sig.variantCount)} />
      </div>
      <SectionHeader title="Schema & feeds" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status={(page?.schemaTypes || []).includes('Product') ? 'pass' : 'fail'} label="Product schema" />
        <StatusBadge status={(page?.schemaTypes || []).includes('Offer') ? 'pass' : 'warn'} label="Offer schema" />
        <StatusBadge status={(page?.schemaTypes || []).includes('AggregateRating') ? 'pass' : 'info'} label="Reviews schema" />
        <StatusBadge status={sig.inProductFeed ? 'pass' : 'warn'} label={sig.inProductFeed ? 'In product feed' : 'Missing from feed'} />
      </div>
      <SectionHeader title="Commerce data" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Product type" value={page?.shopifyProductType} />
        <DataRow label="Vendor" value={page?.shopifyVendor} />
        <DataRow label="SKU" value={sig.sku} />
        <DataRow label="Currency" value={sig.currency} />
        <DataRow label="GA4 revenue" value={formatNumber(page?.ga4Revenue)} />
        <DataRow label="GA4 conversions" value={formatNumber(page?.ga4Conversions)} />
        <DataRow label="Add to cart" value={formatNumber(page?.ga4AddtoCart)} />
        <DataRow label="Checkouts" value={formatNumber(page?.ga4Checkouts)} />
      </div>
    </div>
  );
}
