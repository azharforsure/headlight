import React from 'react';
import { formatNumber, StatusBadge } from '../../../inspector/shared';
import FactorChips from './FactorChips';

type Props = {
  title: string;
  reason?: string;
  priority?: number;            // 1-9
  estimatedImpact?: number;     // clicks
  effort?: 'low' | 'medium' | 'high';
  category?: 'technical' | 'content' | 'industry';
  confidence?: number;          // 0-100
  factors?: unknown;
  primary?: boolean;
};

const CAT_COLOR: Record<string, string> = {
  technical: 'border-red-500/30 bg-red-500/5',
  content:   'border-blue-500/30 bg-blue-500/5',
  industry:  'border-amber-500/30 bg-amber-500/5',
};

export default function ActionCard({
  title, reason, priority, estimatedImpact, effort, category, confidence, factors, primary,
}: Props) {
  const priBucket = !priority ? undefined
    : priority <= 3 ? 'High' : priority <= 6 ? 'Mid' : 'Low';
  const priTone = priBucket === 'High' ? 'fail' : priBucket === 'Mid' ? 'warn' : 'info';

  return (
    <div
      className={`rounded border px-3 py-2.5 ${
        primary ? 'border-[#F5364E]/40 bg-[#F5364E]/5' : (CAT_COLOR[category || ''] || 'border-[#222] bg-[#0a0a0a]')
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] text-white font-semibold truncate">{title}</div>
          {reason && <div className="text-[11px] text-[#aaa] mt-0.5">{reason}</div>}
          <FactorChips factors={factors} />
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {priBucket && <StatusBadge status={priTone as any} label={`P-${priBucket}`} />}
          {effort && <span className="text-[10px] text-[#666] uppercase tracking-widest">Effort {effort}</span>}
          {Number.isFinite(Number(estimatedImpact)) && Number(estimatedImpact) > 0 && (
            <span className="text-[10px] text-[#8ad]">+{formatNumber(estimatedImpact)} cl/mo</span>
          )}
          {Number.isFinite(Number(confidence)) && (
            <span className="text-[10px] text-[#666]">Conf {formatNumber(confidence)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
