import React, { useCallback, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { AI_INSIGHTS_CATEGORY, CATEGORIES, matchesCategoryFilter } from './constants';
import CategoryTreeContextMenu from './CategoryTreeContextMenu';
import WqaLeftSidebar from './wqa/WqaLeftSidebar';
import { getEffectiveIndustry } from '../../services/WebsiteQualityModeTypes';

type CategoryMenuState = {
    x: number;
    y: number;
    group: string;
    sub: string;
    count: number;
};

interface SiteExplorerProps {
    embedded?: boolean;
}

export default function SiteExplorer({ embedded = false }: SiteExplorerProps) {
    const {
        categorySearch, setCategorySearch,
        leftSidebarWidth, setIsDraggingLeftSidebar,
        openCategories, setOpenCategories,
        setVisibleColumns, setActiveMacro,
        dynamicClusters, categoryCounts,
        pages, toggleCategory,
        activeCategories, setActiveCategories,
        activeCheckCategories,
        prioritizedCategories, prioritizeByIssues, setPrioritizeByIssues,
        auditFilter,
        wqaState, isWqaMode, wqaCategoryFilter, setWqaCategoryFilter, setWqaPageFilter,
        exportSubset, createTaskForCategory, bulkAIAnalyzeCategory
    } = useSeoCrawler();

    const [contextMenu, setContextMenu] = useState<CategoryMenuState | null>(null);

    const rootHostname = useMemo(() => {
        try {
            return pages[0]?.url ? new URL(pages[0].url).hostname : '';
        } catch {
            return '';
        }
    }, [pages]);

    const hasAiInsights = useMemo(() => {
        return pages.some((page) =>
            Boolean(
                page?.strategicPriority ||
                page?.opportunityScore ||
                page?.techHealthScore ||
                page?.isCannibalized ||
                page?.hasContentGap ||
                page?.contentDecay
            )
        );
    }, [pages]);

    const allCategories = useMemo(() => {
        const baseCategories = prioritizeByIssues && pages.length > 0 ? prioritizedCategories : CATEGORIES;
        const shouldScopeByAuditFilter = !(auditFilter.modes.includes('full') && auditFilter.industry === 'all');
        const scopedBaseCategories = shouldScopeByAuditFilter
            ? baseCategories.filter((category) => activeCheckCategories.has(category.id) || category.id === 'internal')
            : baseCategories;

        const showAiInsightsCategory = hasAiInsights && (!shouldScopeByAuditFilter || activeCheckCategories.has('ai-insights'));
        const showAiClusterCategory = dynamicClusters.length > 0 && (!shouldScopeByAuditFilter || activeCheckCategories.has('ai-clusters'));

        return [
            ...scopedBaseCategories,
            ...(showAiInsightsCategory ? [AI_INSIGHTS_CATEGORY] : []),
            ...(showAiClusterCategory
                ? [{ id: 'ai-clusters', label: 'AI Topic Clusters', icon: <Wand2 size={14} />, sub: ['All', ...dynamicClusters] }]
                : [])
        ];
    }, [prioritizeByIssues, pages.length, prioritizedCategories, hasAiInsights, dynamicClusters, activeCheckCategories, auditFilter.industry, auditFilter.modes]);

    const allCategoryIds = useMemo(() => allCategories.map((category) => category.id), [allCategories]);

    const filteredCategories = useMemo(() => {
        if (!categorySearch) return allCategories;
        const normalized = categorySearch.toLowerCase();
        return allCategories.filter((category) =>
            category.label.toLowerCase().includes(normalized) ||
            category.sub.some((item: string) => item.toLowerCase().includes(normalized))
        );
    }, [allCategories, categorySearch]);

    const handleCategorySelect = useCallback((event: React.MouseEvent, group: string, sub: string) => {
        setActiveMacro(null);

        if (event.shiftKey) {
            setActiveCategories((previous) => {
                const withoutDefault = previous.filter((entry) => !(entry.group === 'internal' && entry.sub === 'All'));
                const exists = withoutDefault.some((entry) => entry.group === group && entry.sub === sub);
                if (exists) {
                    const next = withoutDefault.filter((entry) => !(entry.group === group && entry.sub === sub));
                    return next.length > 0 ? next : [{ group: 'internal', sub: 'All' }];
                }
                return [...withoutDefault, { group, sub }];
            });
            return;
        }

        setActiveCategories([{ group, sub }]);
    }, [setActiveMacro, setActiveCategories]);

    if (isWqaMode) {
        return (
            <aside
                style={embedded ? undefined : { width: leftSidebarWidth }}
                className={`bg-[#0a0a0a] flex flex-col min-h-0 relative ${embedded ? 'w-full h-full overflow-hidden rounded-2xl border border-[#222]' : 'border-r border-[#1a1a1a] shrink-0'}`}
            >
                {!embedded && (
                    <div
                        onMouseDown={() => setIsDraggingLeftSidebar(true)}
                        className="absolute top-0 bottom-0 right-0 w-1.5 cursor-ew-resize z-50 transition-colors hover:bg-blue-500/50"
                    ></div>
                )}
                <WqaLeftSidebar />
            </aside>
        );
    }

    return (
        <aside
            style={embedded ? undefined : { width: leftSidebarWidth }}
            className={`bg-[#111] flex flex-col min-h-0 relative ${embedded ? 'w-full h-full overflow-hidden rounded-2xl border border-[#222]' : 'border-r border-[#222] shrink-0'}`}
        >
            {!embedded && (
                <div
                    onMouseDown={() => setIsDraggingLeftSidebar(true)}
                    className="absolute top-0 bottom-0 right-0 w-1.5 cursor-ew-resize z-50 transition-colors hover:bg-[#F5364E]"
                ></div>
            )}

            <div className="px-2 py-2 border-b border-[#1a1a1a] shrink-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] text-[#555] uppercase tracking-widest font-bold">Categories</span>
                    <button
                        onClick={() => setPrioritizeByIssues(!prioritizeByIssues)}
                        className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-colors ${
                            prioritizeByIssues ? 'bg-[#F5364E]/15 text-[#F5364E]' : 'text-[#555] hover:text-[#888]'
                        }`}
                    >
                        Sort by Issues
                    </button>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#444]" size={11} />
                    <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search... (⌘K)"
                        className="w-full bg-[#0a0a0a]/50 border border-[#222] rounded pl-6 pr-2 py-1 text-[11px] text-[#e0e0e0] placeholder-[#444] focus:border-[#F5364E]/50 focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Category Tree */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1 px-1">
                {filteredCategories.map((category) => {
                    const isOpen = openCategories.includes(category.id);
                    const catCounts = (categoryCounts[category.id] || {}) as Record<string, number>;
                    const totalCatCount = catCounts.All ?? Object.values(catCounts).reduce((a, b) => a + b, 0);

                    return (
                        <div key={category.id} className="mb-0.5">
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] font-semibold rounded-sm transition-colors ${isOpen ? 'text-[#eee]' : 'text-[#aaa] hover:bg-[#1a1a1a]'}`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[#666] shrink-0">{category.icon}</span>
                                    <span className="truncate">{category.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {totalCatCount > 0 && <span className="text-[10px] font-mono text-[#555]">{totalCatCount}</span>}
                                    {isOpen ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                                </div>
                            </button>

                            {isOpen && (
                                <div className="ml-[18px] pl-3 my-1 space-y-0.5 border-l border-[#222]">
                                    {category.sub.map((subItem: string) => {
                                        const isActive = activeCategories.some((s) => s.group === category.id && s.sub === subItem);
                                        const subCount = catCounts[subItem] || 0;
                                        return (
                                            <button
                                                key={subItem}
                                                onClick={(e) => handleCategorySelect(e, category.id, subItem)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setContextMenu({ x: e.clientX, y: e.clientY, group: category.id, sub: subItem, count: subCount });
                                                }}
                                                className={`w-full text-left px-2.5 py-1 text-[11px] rounded-sm transition-all flex items-center justify-between gap-1 ${
                                                    isActive ? 'bg-[#F5364E]/10 text-[#F5364E] font-medium' : 'text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                                                }`}
                                            >
                                                <span className="truncate">{subItem}</span>
                                                {subCount > 0 && <span className="text-[10px] font-mono shrink-0">{subCount}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {contextMenu && (
                <CategoryTreeContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    category={{ group: contextMenu.group, sub: contextMenu.sub, count: contextMenu.count }}
                    onClose={() => setContextMenu(null)}
                    onExportSubset={exportSubset}
                    onCreateTaskForAll={createTaskForCategory}
                    onBulkAIAnalyze={bulkAIAnalyzeCategory}
                />
            )}
        </aside>
    );
}
