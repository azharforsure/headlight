import React, { useCallback, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../../contexts/CrawlerUIContext';
import { AI_INSIGHTS_CATEGORY, CATEGORIES, SMART_PRESETS, matchesCategoryFilter } from './constants';
import CategoryTreeContextMenu from './CategoryTreeContextMenu';

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
        dynamicClusters, categoryCounts,
        pages, toggleCategory,
        activeCategories, setActiveCategories,
        prioritizedCategories, prioritizeByIssues, setPrioritizeByIssues,
        activeCheckCategories,
        auditFilter,
        exportSubset, createTaskForCategory, bulkAIAnalyzeCategory
    } = useSeoCrawler();

    const {
        categorySearch, setCategorySearch,
        leftSidebarPreset, setLeftSidebarPreset,
        leftSidebarWidth, setIsDraggingLeftSidebar,
        openCategories, setOpenCategories,
        setActiveMacro,
    } = useCrawlerUI();

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

    return (
        <aside
            style={embedded ? undefined : { width: leftSidebarWidth }}
            className={`bg-[#111] flex flex-col overflow-hidden relative ${embedded ? 'w-full h-full rounded-2xl border border-[#222]' : 'border-r border-[#222] shrink-0'}`}
        >
            {!embedded && (
                <div
                    onMouseDown={() => setIsDraggingLeftSidebar(true)}
                    className="absolute top-0 bottom-0 right-0 w-1.5 -mr-0.5 cursor-ew-resize z-50 transition-colors hover:bg-[#F5364E]"
                ></div>
            )}
            
            {/* Sidebar Search */}
            <div className="px-2 pt-2 pb-1 shrink-0 border-b border-[#1a1a1a]">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#555]" size={11} />
                    <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search categories..."
                        className="w-full bg-[#0a0a0a] border border-[#222] rounded pl-6 pr-2 py-1 text-[11px] text-[#e0e0e0] placeholder-[#555] focus:border-[#F5364E] focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Smart Presets */}
            <div className="px-2 py-1.5 border-b border-[#1a1a1a] shrink-0">
                <div className="flex items-center justify-between mb-1 px-1">
                    <div className="text-[9px] text-[#555] uppercase tracking-widest font-bold">Quick Presets</div>
                    <button
                        onClick={() => setPrioritizeByIssues(!prioritizeByIssues)}
                        className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-colors ${
                            prioritizeByIssues ? 'bg-[#F5364E]/15 text-[#F5364E]' : 'text-[#555] hover:text-[#888]'
                        }`}
                    >
                        Sort by Issues
                    </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar-hidden whitespace-nowrap pb-1">
                    {SMART_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => {
                                setLeftSidebarPreset(preset.id);
                                setOpenCategories(preset.categories);
                                setVisibleColumns(preset.columns);
                                setActiveMacro(null);
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all shrink-0 ${
                                leftSidebarPreset === preset.id
                                    ? 'bg-[#F5364E]/15 text-[#F5364E] border border-[#F5364E]/30 shadow-[0_0_10px_rgba(245,54,78,0.1)]'
                                    : 'bg-[#1a1a1a] text-[#888] border border-[#222] hover:border-[#444] hover:text-[#ccc]'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-2 py-1 border-b border-[#1a1a1a] shrink-0">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] text-[#555] uppercase tracking-widest font-bold">Categories</span>
                    <div className="flex items-center gap-1 text-[9px]">
                        <button onClick={() => setOpenCategories(allCategoryIds)} className="text-[#666] hover:text-[#ccc]">Expand</button>
                        <span className="text-[#333]">|</span>
                        <button onClick={() => setOpenCategories([])} className="text-[#666] hover:text-[#ccc]">Collapse</button>
                    </div>
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
