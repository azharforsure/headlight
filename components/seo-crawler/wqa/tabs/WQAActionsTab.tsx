import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { WqaSiteStats, WqaActionGroup } from '../../../../services/WebsiteQualityModeTypes';
import { formatCompact } from '../wqaUtils';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';

interface Props {
    stats: WqaSiteStats | null;
    actionGroups: WqaActionGroup[];
    onFilterByAction: (action: string) => void;
    onNavigateToPriorities: () => void;
}

type CategoryTab = 'all' | 'technical' | 'content' | 'industry';

const EFFORT_DOTS: Record<string, string> = {
    low:    '●●○○○',
    medium: '●●●○○',
    high:   '●●●●○',
};

const CATEGORY_COLOR: Record<string, string> = {
    technical: '#6366f1',
    content:   '#22c55e',
    industry:  '#f59e0b',
};

const CATEGORY_LABEL: Record<string, string> = {
    technical: 'Tech',
    content:   'Content',
    industry:  'Industry',
};

export default function WQAActionsTab({ stats, actionGroups, onFilterByAction, onNavigateToPriorities }: Props) {
    const { setWqaState } = useSeoCrawler();
    const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
    const [expandedAction, setExpandedAction] = useState<string | null>(null);

    if (!stats) {
        return <div className="p-4 text-[12px] text-[#555] text-center">No data yet.</div>;
    }

    const filteredGroups = useMemo(() => {
        const withImpact = actionGroups.filter((g) => g.pageCount > 0);
        const sorted = [...withImpact].sort((a, b) => b.totalEstimatedImpact - a.totalEstimatedImpact || b.pageCount - a.pageCount);
        if (activeCategory === 'all') return sorted;
        return sorted.filter((g) => g.category === activeCategory);
    }, [actionGroups, activeCategory]);

    const categoryCounts = useMemo(() => ({
        all:       actionGroups.filter((g) => g.pageCount > 0).length,
        technical: actionGroups.filter((g) => g.category === 'technical' && g.pageCount > 0).length,
        content:   actionGroups.filter((g) => g.category === 'content'   && g.pageCount > 0).length,
        industry:  actionGroups.filter((g) => g.category === 'industry'  && g.pageCount > 0).length,
    }), [actionGroups]);

    const currentClicks = stats.totalClicks;
    const liftPct = currentClicks > 0 ? Math.round((stats.totalEstimatedImpact / currentClicks) * 100) : 0;

    const timeline = useMemo(() => {
        const sorted = [...actionGroups]
            .filter((g) => g.pageCount > 0)
            .sort((a, b) => b.totalEstimatedImpact - a.totalEstimatedImpact);

        const techLow    = sorted.filter((g) => g.category === 'technical' && g.effort === 'low');
        const contentTop = sorted.filter((g) => g.category === 'content').slice(0, 1);
        const rest       = sorted.filter(
            (g) => !techLow.includes(g) && !contentTop.includes(g)
        );

        const slots: Array<{ slot: string; actions: string[]; pageCount: number; team: string }> = [];
        if (techLow.length > 0)
            slots.push({ slot: 'Week 1', actions: techLow.map((g) => g.action), pageCount: techLow.reduce((s, g) => s + g.pageCount, 0), team: 'Dev' });
        if (contentTop.length > 0)
            slots.push({ slot: 'Week 2', actions: contentTop.map((g) => g.action), pageCount: contentTop[0].pageCount, team: 'Content' });
        if (rest.length > 0)
            slots.push({ slot: 'Month 2', actions: rest.slice(0, 3).map((g) => g.action), pageCount: rest.reduce((s, g) => s + g.pageCount, 0), team: 'Dev + Content' });

        return slots;
    }, [actionGroups]);

    const TABS: Array<{ id: CategoryTab; label: string }> = [
        { id: 'all',       label: `All (${categoryCounts.all})` },
        { id: 'technical', label: `Tech (${categoryCounts.technical})` },
        { id: 'content',   label: `Content (${categoryCounts.content})` },
        { id: 'industry',  label: `Industry (${categoryCounts.industry})` },
    ];

    return (
        <div className="p-3 space-y-4">

            {/* Impact summary */}
            <section>
                <SectionHeader title="Estimated Impact" />
                <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div>
                            <div className="text-[13px] font-bold text-white font-mono">{formatCompact(currentClicks)}</div>
                            <div className="text-[9px] text-[#555] uppercase">Current clicks</div>
                        </div>
                        <div>
                            <div className="text-[13px] font-bold text-green-400 font-mono">+{formatCompact(stats.totalEstimatedImpact)}</div>
                            <div className="text-[9px] text-[#555] uppercase">Est. gain</div>
                        </div>
                        <div>
                            <div className="text-[13px] font-bold text-blue-400 font-mono">{liftPct > 0 ? `+${liftPct}%` : '—'}</div>
                            <div className="text-[9px] text-[#555] uppercase">Lift</div>
                        </div>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                        <div className="flex justify-between text-[#888]">
                            <span>Pages with tech action</span>
                            <span className="text-white font-mono">{stats.pagesWithTechAction}</span>
                        </div>
                        <div className="flex justify-between text-[#888]">
                            <span>Pages with content action</span>
                            <span className="text-white font-mono">{stats.pagesWithContentAction}</span>
                        </div>
                        <div className="flex justify-between text-[#888]">
                            <span>No action needed</span>
                            <span className="text-[#555] font-mono">{stats.pagesNoAction}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Category tabs */}
            <section>
                <div className="flex gap-0.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-0.5 mb-3">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveCategory(tab.id)}
                            className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-colors ${
                                activeCategory === tab.id
                                    ? 'bg-[#1a1a1a] text-white'
                                    : 'text-[#555] hover:text-[#888]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {filteredGroups.length === 0 ? (
                    <div className="text-[11px] text-[#555] text-center py-6">
                        No {activeCategory !== 'all' ? activeCategory : ''} actions found.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredGroups.map((group) => (
                            <ActionCard
                                key={`${group.category}:${group.action}`}
                                group={group}
                                expanded={expandedAction === `${group.category}:${group.action}`}
                                onToggle={() =>
                                    setExpandedAction((prev) =>
                                        prev === `${group.category}:${group.action}`
                                            ? null
                                            : `${group.category}:${group.action}`
                                    )
                                }
                                onFilter={() => onFilterByAction(group.action)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Timeline */}
            {timeline.length > 0 && (
                <section>
                    <SectionHeader title="Suggested Timeline" />
                    <div className="relative pl-4">
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#1a1a1a]" />
                        {timeline.map((slot, i) => (
                            <div key={i} className="relative pb-3">
                                <div className="absolute left-[-11px] top-1.5 w-[7px] h-[7px] rounded-full bg-[#F5364E] border-2 border-[#0a0a0a]" />
                                <div className="ml-2 bg-[#111] border border-[#1a1a1a] rounded p-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[11px] font-semibold text-white">{slot.slot}</span>
                                        <span className="text-[9px] text-[#555]">·</span>
                                        <span className="text-[9px] text-[#666]">{slot.team}</span>
                                    </div>
                                    {slot.actions.map((a) => (
                                        <div key={a} className="text-[10px] text-[#888]">• {a}</div>
                                    ))}
                                    <div className="text-[9px] text-[#555] mt-0.5">{slot.pageCount} pages</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <button
                onClick={onNavigateToPriorities}
                className="w-full py-2 rounded bg-[#F5364E] text-white text-[11px] font-bold hover:bg-[#d42e44] transition-colors"
            >
                View All Actions in Grid →
            </button>

        </div>
    );
}

// ─── ActionCard ─────────────────────────────────────────────────────────────

function ActionCard({
    group,
    expanded,
    onToggle,
    onFilter,
}: {
    group: WqaActionGroup;
    expanded: boolean;
    onToggle: () => void;
    onFilter: () => void;
}) {
    const color = CATEGORY_COLOR[group.category] || '#888';
    const label = CATEGORY_LABEL[group.category] || group.category;
    const dots  = EFFORT_DOTS[group.effort] || '●●○○○';
    const topPages = group.pages.slice(0, 3);

    return (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg overflow-hidden">

            {/* Card header */}
            <button
                onClick={onToggle}
                className="w-full flex items-start justify-between p-3 text-left hover:bg-[#161616] transition-colors"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ color, background: `${color}18` }}
                        >
                            {label}
                        </span>
                        <span className="text-[9px] text-[#444] font-mono">{dots}</span>
                    </div>
                    <div className="text-[12px] font-semibold text-white truncate">{group.action}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[#555]">
                        <span>{group.pageCount} pages</span>
                        {group.totalEstimatedImpact > 0 && (
                            <span className="text-green-400">+{formatCompact(group.totalEstimatedImpact)} est. clicks</span>
                        )}
                    </div>
                </div>
                <div className="shrink-0 ml-2 mt-1">
                    {expanded ? <ChevronDown size={12} className="text-[#444]" /> : <ChevronRight size={12} className="text-[#444]" />}
                </div>
            </button>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-[#1a1a1a] px-3 pb-3">
                    {group.reason && (
                        <p className="text-[10px] text-[#666] mt-2 mb-2 leading-relaxed">{group.reason}</p>
                    )}

                    {topPages.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                            <div className="grid grid-cols-[1fr_48px_52px_52px] text-[9px] text-[#444] uppercase tracking-wider pb-0.5">
                                <span>Page</span>
                                <span className="text-right">Pos</span>
                                <span className="text-right">Impr</span>
                                <span className="text-right">Impact</span>
                            </div>
                            {topPages.map((p, i) => (
                                <div key={i} className="grid grid-cols-[1fr_48px_52px_52px] text-[10px]">
                                    <span className="text-[#888] truncate pr-2">{p.pagePath || p.url}</span>
                                    <span className="text-right text-[#555]">{p.position > 0 ? Math.round(p.position) : '—'}</span>
                                    <span className="text-right text-[#555]">{p.impressions > 0 ? formatCompact(p.impressions) : '—'}</span>
                                    <span className="text-right text-green-400 font-mono">{p.estimatedImpact > 0 ? `+${p.estimatedImpact}` : '—'}</span>
                                </div>
                            ))}
                            {group.pages.length > 3 && (
                                <div className="text-[9px] text-[#444] mt-0.5">
                                    +{group.pages.length - 3} more pages
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={onFilter}
                        className="text-[10px] text-[#F5364E] hover:text-[#ff6070] transition-colors flex items-center gap-1"
                    >
                        <ExternalLink size={9} />
                        Filter grid to these pages
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1 mb-3">
            {title}
        </h4>
    );
}
