import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import WQAQualityTab from './tabs/WQAQualityTab';
import WQAActionsTab from './tabs/WQAActionsTab';
import WQASearchTab from './tabs/WQASearchTab';
import WQAContentTab from './tabs/WQAContentTab';
import WQAHistoryTab from './tabs/WQAHistoryTab';
import type { WebsiteQualityState } from '../../../services/WebsiteQualityModeTypes';
import type { CrawlSession } from '../../../services/CrawlHistoryService';
import { computeWqaActionGroups, computeWqaSiteStats, deriveWqaScore } from '../../../services/WqaSidebarData';

export type WqaSidebarTab = 'quality' | 'actions' | 'search' | 'content' | 'history';

interface WQARightSidebarProps {
    wqaState: WebsiteQualityState;
    pages: any[];
    filteredPages: any[];
    crawlHistory: CrawlSession[];
    currentSessionId: string | null;
    aiNarrative: string;
    onCompare: (id1: string, id2: string) => void;
    onFilterByAction: (action: string) => void;
    onNavigateToPriorities: () => void;
    embedded?: boolean;
    onClose?: () => void;
}

const TABS: Array<{ id: WqaSidebarTab; label: string }> = [
    { id: 'quality', label: 'Quality' },
    { id: 'actions', label: 'Actions' },
    { id: 'search', label: 'Search' },
    { id: 'content', label: 'Content' },
    { id: 'history', label: 'History' },
];

export default function WQARightSidebar({
    wqaState,
    pages,
    filteredPages,
    crawlHistory,
    currentSessionId,
    aiNarrative,
    onCompare,
    onFilterByAction,
    onNavigateToPriorities,
    embedded = false,
    onClose,
}: WQARightSidebarProps) {
    const [activeTab, setActiveTab] = useState<WqaSidebarTab>('quality');

    const industry = wqaState.industryOverride ?? wqaState.detectedIndustry;

    const computedStats = useMemo(() => {
        if (wqaState.siteStats) return wqaState.siteStats;
        if (pages.length === 0) return null;
        return computeWqaSiteStats(pages, industry);
    }, [wqaState.siteStats, pages, industry]);

    const computedActionGroups = useMemo(() => {
        if (wqaState.actionGroups.length > 0) return wqaState.actionGroups;
        return computeWqaActionGroups(pages);
    }, [wqaState.actionGroups, pages]);

    const uiWqaState = useMemo(() => {
        if (!computedStats) return wqaState;
        if (wqaState.siteGrade !== 'N/A' && wqaState.siteScore > 0) return wqaState;
        const { score, grade } = deriveWqaScore(computedStats);
        return {
            ...wqaState,
            siteScore: score,
            siteGrade: grade,
        };
    }, [wqaState, computedStats]);

    return (
        <div className="h-full flex flex-col bg-[#111]">
            <div className="flex flex-col shrink-0 bg-[#141414] border-b border-[#222]">
                <div className="h-[40px] px-4 flex items-center justify-between">
                    <h3 className="text-[12px] font-semibold text-[#ccc] uppercase tracking-wider">Audit</h3>
                    {!embedded && onClose && (
                        <button onClick={onClose} className="text-[#666] hover:text-white p-1 rounded hover:bg-[#222] transition-colors">
                            <ChevronRight size={14} />
                        </button>
                    )}
                </div>
                <div className="flex px-2 pb-0 overflow-x-auto custom-scrollbar-hidden">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 text-[11px] font-medium border-b-2 whitespace-nowrap transition-colors ${
                                activeTab === tab.id ? 'border-[#F5364E] text-white' : 'border-transparent text-[#888] hover:text-[#ccc]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#111] p-4">
                {activeTab === 'quality' && (
                    <WQAQualityTab
                        stats={computedStats}
                        wqaState={uiWqaState}
                        aiNarrative={aiNarrative}
                        industry={industry}
                    />
                )}
                {activeTab === 'actions' && (
                    <WQAActionsTab
                        stats={computedStats}
                        actionGroups={computedActionGroups}
                        onFilterByAction={onFilterByAction}
                        onNavigateToPriorities={onNavigateToPriorities}
                    />
                )}
                {activeTab === 'search' && (
                    <WQASearchTab
                        pages={pages}
                        filteredPages={filteredPages}
                        stats={computedStats}
                        industry={industry}
                    />
                )}
                {activeTab === 'content' && (
                    <WQAContentTab
                        pages={pages}
                        filteredPages={filteredPages}
                        stats={computedStats}
                        industry={industry}
                    />
                )}
                {activeTab === 'history' && (
                    <WQAHistoryTab
                        stats={computedStats}
                        wqaState={uiWqaState}
                        crawlHistory={crawlHistory}
                        currentSessionId={currentSessionId}
                        onCompare={onCompare}
                    />
                )}
            </div>
        </div>
    );
}
