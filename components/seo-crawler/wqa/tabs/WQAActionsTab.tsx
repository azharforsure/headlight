import React, { useMemo } from 'react';
import type { WqaSiteStats, WqaActionGroup } from '../../../../services/WebsiteQualityModeTypes';
import HorizontalBarChart from '../charts/HorizontalBarChart';

interface Props {
    stats: WqaSiteStats | null;
    actionGroups: WqaActionGroup[];
    onFilterByAction: (action: string) => void;
    onNavigateToPriorities: () => void;
}

export default function WQAActionsTab({ stats, actionGroups, onFilterByAction, onNavigateToPriorities }: Props) {
    if (!stats) {
        return <div className="p-4 text-[12px] text-[#555] text-center">No data yet.</div>;
    }

    const sorted = useMemo(
        () => [...actionGroups].filter((g) => g.totalEstimatedImpact > 0).sort((a, b) => b.totalEstimatedImpact - a.totalEstimatedImpact),
        [actionGroups]
    );

    const barData = useMemo(
        () => sorted.slice(0, 8).map((g) => ({
            label: g.action,
            value: g.totalEstimatedImpact,
            color: g.category === 'technical' ? '#6366f1' : g.category === 'content' ? '#22c55e' : '#f59e0b',
        })),
        [sorted]
    );

    const currentClicks = stats.totalClicks;
    const afterClicks = currentClicks + stats.totalEstimatedImpact;
    const liftPct = currentClicks > 0 ? Math.round((stats.totalEstimatedImpact / currentClicks) * 100) : 0;

    const timeline = useMemo(() => {
        const slots: Array<{ slot: string; actions: string[]; pageCount: number; team: string }> = [];
        const remaining = [...sorted];

        const techLow = remaining.filter((g) => g.category === 'technical' && g.effort === 'low');
        if (techLow.length > 0) {
            slots.push({
                slot: 'Week 1',
                actions: techLow.map((g) => g.action),
                pageCount: techLow.reduce((s, g) => s + g.pageCount, 0),
                team: 'Dev',
            });
        }

        const contentTop = remaining.find((g) => g.category === 'content');
        if (contentTop) {
            slots.push({
                slot: 'Week 2',
                actions: [contentTop.action],
                pageCount: contentTop.pageCount,
                team: 'Content',
            });
        }

        const contentSecond = remaining.filter((g) => g.category === 'content').slice(1, 2);
        if (contentSecond.length > 0) {
            slots.push({
                slot: 'Week 3',
                actions: contentSecond.map((g) => g.action),
                pageCount: contentSecond.reduce((s, g) => s + g.pageCount, 0),
                team: 'Content',
            });
        }

        const rest = remaining.filter(
            (g) => !techLow.includes(g) && g !== contentTop && !contentSecond.includes(g)
        );
        if (rest.length > 0) {
            slots.push({
                slot: 'Month 2',
                actions: rest.slice(0, 3).map((g) => g.action),
                pageCount: rest.reduce((s, g) => s + g.pageCount, 0),
                team: 'Dev + Content',
            });
        }

        return slots;
    }, [sorted]);

    return (
        <div className="p-3 space-y-4">
            <section>
                <SectionHeader title="Estimated Impact" />
                <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
                    <div className="flex justify-between text-[11px] mb-2">
                        <span className="text-[#888]">Current: <span className="text-white font-mono">{currentClicks.toLocaleString()}</span> clicks/mo</span>
                        <span className="text-green-400 font-mono">+{liftPct}%</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                        <span className="text-[#888]">After actions: <span className="text-white font-mono">{afterClicks.toLocaleString()}</span></span>
                        <span className="text-green-400 font-mono">+{stats.totalEstimatedImpact.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#3b82f6]"
                            style={{ width: `${Math.min(100, (afterClicks / Math.max(afterClicks, 1)) * 100)}%` }}
                        />
                    </div>
                </div>
            </section>

            <section>
                <SectionHeader title="Actions by Impact" />
                <HorizontalBarChart data={barData} formatValue={(v) => `+${v.toLocaleString()}`} onClick={(label) => onFilterByAction(label)} />
            </section>

            {timeline.length > 0 && (
                <section>
                    <SectionHeader title="Suggested Timeline" />
                    <div className="space-y-2">
                        {timeline.map((slot, i) => (
                            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded p-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[11px] font-bold text-white">{slot.slot}</span>
                                    <span className="text-[9px] text-[#555] uppercase">{slot.team}</span>
                                </div>
                                {slot.actions.map((a) => (
                                    <div key={a} className="text-[10px] text-[#888]">• {a}</div>
                                ))}
                                <div className="text-[9px] text-[#444] mt-1">{slot.pageCount} pages</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <SectionHeader title="Summary" />
                <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between text-[#888]">
                        <span>Technical actions</span>
                        <span className="text-white font-mono">{stats.pagesWithTechAction} pages</span>
                    </div>
                    <div className="flex justify-between text-[#888]">
                        <span>Content actions</span>
                        <span className="text-white font-mono">{stats.pagesWithContentAction} pages</span>
                    </div>
                    <div className="flex justify-between text-[#888]">
                        <span>No action needed</span>
                        <span className="text-white font-mono">{stats.pagesNoAction} pages</span>
                    </div>
                </div>
            </section>

            <div className="px-1 space-y-2">
                <button
                    onClick={onNavigateToPriorities}
                    className="w-full py-2 rounded bg-[#F5364E] text-white text-[11px] font-bold hover:bg-[#d42e44] transition-colors"
                >
                    View All in Priorities →
                </button>
            </div>
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1 mb-3">{title}</h4>;
}
