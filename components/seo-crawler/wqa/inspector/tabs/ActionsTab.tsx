import React from 'react';
import { SectionHeader } from '../../../inspector/shared';
import ActionCard from '../parts/ActionCard';

export default function ActionsTab({ page }: { page: any }) {
  const primaries = [
    page?.technicalAction && page.technicalAction !== 'Monitor' && {
      action: page.technicalAction,
      reason: page.technicalActionReason,
      category: 'technical',
      priority: page.actionPriority,
      estimatedImpact: page.estimatedImpact,
      effort: page.technicalEffort,
      factors: page.recommendedActionFactors,
      confidence: page.technicalActionConfidence,
    },
    page?.contentAction && page.contentAction !== 'No Action' && {
      action: page.contentAction,
      reason: page.contentActionReason,
      category: 'content',
      priority: page.actionPriority,
      estimatedImpact: page.estimatedImpact,
      effort: page.contentEffort,
      factors: page.recommendedActionFactors,
      confidence: page.contentActionConfidence,
    },
    page?.industryAction && {
      action: page.industryAction,
      reason: page.industryActionReason,
      category: 'industry',
      priority: page.industryPriority,
      estimatedImpact: page.industryImpact,
      effort: page.industryEffort,
      confidence: page.industryActionConfidence,
    },
  ].filter(Boolean) as any[];

  const secondaries: any[] = Array.isArray(page?.secondaryActions) ? page.secondaryActions : [];

  return (
    <div>
      <SectionHeader title="Primary actions" />
      <div className="space-y-2 mb-5">
        {primaries.length === 0 && (
          <div className="bg-[#0a0a0a] border border-[#222] rounded p-4 text-[12px] text-[#666] text-center">
            No actions assigned. Page is healthy.
          </div>
        )}
        {primaries.map((a, i) => (
          <ActionCard
            key={`${a.category}-${i}`}
            title={a.action}
            reason={a.reason}
            category={a.category}
            priority={a.priority}
            estimatedImpact={a.estimatedImpact}
            effort={a.effort}
            factors={a.factors}
            confidence={a.confidence}
            primary={i === 0}
          />
        ))}
      </div>

      {secondaries.length > 0 && (
        <>
          <SectionHeader title="Other matched rules" />
          <div className="space-y-2 mb-5">
            {secondaries.map((a, i) => (
              <ActionCard
                key={`sec-${i}`}
                title={a.action}
                reason={a.reason}
                category={a.category}
                priority={a.priority}
                estimatedImpact={a.estimatedImpact}
                effort={a.effort}
                factors={a.factors}
                confidence={a.confidence}
              />
            ))}
          </div>
        </>
      )}

      <SectionHeader title="Manage" />
      <div className="flex flex-wrap gap-2">
        <ManageButton label="Mark as done" />
        <ManageButton label="Snooze 30d" />
        <ManageButton label="Assign" />
        <ManageButton label="Create task" />
        <ManageButton label="Ignore" />
      </div>
    </div>
  );
}

function ManageButton({ label }: { label: string }) {
  return (
    <button className="px-3 py-1.5 rounded border border-[#262626] bg-[#0f0f0f] text-[11px] text-[#ccc] hover:border-[#F5364E]/40 hover:text-white transition-colors">
      {label}
    </button>
  );
}
