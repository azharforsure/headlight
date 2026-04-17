import React from 'react';
import { IndustryActionBlock, DataRow, SectionHeader, StatusBadge } from './_helpers';

export default function SaasView({ page }: { page: any }) {
  const sig = page?.industrySignals || {};
  return (
    <div>
      <IndustryActionBlock page={page} />
      <SectionHeader title="Funnel position" />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge status="info" label={`Stage: ${page?.funnelStage || 'unknown'}`} />
        <StatusBadge status={sig.hasPricingPage ? 'pass' : 'warn'} label="Pricing page linked" />
        <StatusBadge status={sig.hasComparisonPage ? 'pass' : 'info'} label="Comparison page" />
        <StatusBadge status={sig.hasIntegrationsPage ? 'pass' : 'info'} label="Integrations page" />
        <StatusBadge status={sig.hasTestimonials ? 'pass' : 'info'} label="Testimonials / case studies" />
      </div>
      <SectionHeader title="Page signals" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <DataRow label="Primary CTA" value={sig.primaryCta} />
        <DataRow label="Secondary CTA" value={sig.secondaryCta} />
        <DataRow label="Mentions free trial" value={sig.mentionsFreeTrial ? 'Yes' : 'No'} />
        <DataRow label="Demo link" value={sig.hasDemoLink ? 'Yes' : 'No'} />
        <DataRow label="Docs deep-link" value={sig.hasDocsLink ? 'Yes' : 'No'} />
        <DataRow label="Changelog linked" value={sig.hasChangelogLink ? 'Yes' : 'No'} />
      </div>
    </div>
  );
}
