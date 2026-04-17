import React from 'react';
import { DataRow, MetricCard, SectionHeader, StatusBadge, formatNumber } from '../../../../inspector/shared';

export function IndustryActionBlock({ page }: { page: any }) {
  if (!page?.industryAction) return null;
  return (
    <div className="bg-amber-500/5 border border-amber-500/30 rounded p-3 mb-5">
      <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">Industry action</div>
      <div className="text-[13px] text-white font-semibold">{page.industryAction}</div>
      {page.industryActionReason && <div className="text-[12px] text-[#aaa] mt-1">{page.industryActionReason}</div>}
    </div>
  );
}

export { DataRow, MetricCard, SectionHeader, StatusBadge, formatNumber };
