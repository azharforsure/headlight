import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { ALL_COLUMNS, AI_INSIGHTS_CATEGORY, CATEGORIES, SMART_PRESETS, matchesCategoryFilter } from './constants';

type CategoryMenuState = {
    x: number;
    y: number;
    group: string;
    sub: string;
};

export default function SiteExplorer() {
    const {
        categorySearch, setCategorySearch,
        leftSidebarPreset, setLeftSidebarPreset,
        leftSidebarWidth, setIsDraggingLeftSidebar,
        openCategories, setOpenCategories,
        setVisibleColumns, setActiveMacro,
        dynamicClusters, categoryCounts,
        pages, toggleCategory,
        activeCategories, setActiveCategories,
        prioritizedCategories, prioritizeByIssues, setPrioritizeByIssues,
        addLog
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
        return [
            ...baseCategories,
            ...(hasAiInsights ? [AI_INSIGHTS_CATEGORY] : []),
            ...(dynamicClusters.length > 0
                ? [{ id: 'ai-clusters', label: 'AI Topic Clusters', icon: <Wand2 size={14} />, sub: ['All', ...dynamicClusters] }]
                : [])
        ];
    }, [prioritizeByIssues, pages.length, prioritizedCategories, hasAiInsights, dynamicClusters]);

    const allCategoryIds = useMemo(() => allCategories.map((category) => category.id), [allCategories]);

    const filteredCategories = useMemo(() => {
        if (!categorySearch) return allCategories;
        const normalized = categorySearch.toLowerCase();
        return allCategories.filter((category) =>
            category.label.toLowerCase().includes(normalized) ||
            category.sub.some((item: string) => item.toLowerCase().includes(normalized))
        );
    }, [allCategories, categorySearch]);

    const exportSubset = useCallback((group: string, sub: string) => {
        const subset = pages.filter((page) => matchesCategoryFilter(group, sub, page, { rootHostname }));
        if (subset.length === 0) {
            addLog(`No pages found for ${group} → ${sub}.`, 'warn', { source: 'system' });
            return;
        }

        const headers = ALL_COLUMNS.map((column) => column.label).join(',');
        const rows = subset.map((page) =>
            ALL_COLUMNS.map((column) => {
                const value = page[column.key];
                const normalizedValue = value === null || value === undefined ? '' : value;
                const output = typeof normalizedValue === 'object' ? JSON.stringify(normalizedValue) : String(normalizedValue);
                return `"${output.replace(/"/g, '""')}"`;
            }).join(',')
        );

        const blob = new Blob([headers + '\n', ...rows.map((row) => row + '\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `headlight_subset_${group}_${sub.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        addLog(`Exported ${subset.length} rows for ${group} → ${sub}.`, 'success', { source: 'system' });
    }, [pages, rootHostname, addLog]);

    useEffect(() => {
        if (!contextMenu) return;

        const handleClose = () => setContextMenu(null);
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setContextMenu(null);
        };

        window.addEventListener('click', handleClose);
        window.addEventListener('contextmenu', handleClose);
        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('click', handleClose);
            window.removeEventListener('contextmenu', handleClose);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [contextMenu]);

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
        <aside style={{ width: leftSidebarWidth }} className="border-r border-[#222] bg-[#111] flex flex-col shrink-0 overflow-hidden relative">
            <div
                onMouseDown={() => setIsDraggingLeftSidebar(true)}
                className="absolute top-0 bottom-0 right-0 w-1.5 -mr-0.5 cursor-ew-resize z-50 transition-colors hover:bg-[#F5364E]"
            ></div>
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
                    {/* AI priority toggle */}
                    <button
                        onClick={() => setPrioritizeByIssues(!prioritizeByIssues)}
                        title={prioritizeByIssues ? "Categories sorted by issue count" : "Categories in default order"}
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
                                if (leftSidebarPreset === preset.id) {
                                    setLeftSidebarPreset(null);
                                    setOpenCategories(allCategoryIds);
                                } else {
                                    setLeftSidebarPreset(preset.id);
                                    setOpenCategories(preset.categories);
                                    setVisibleColumns(preset.columns);
                                    setActiveMacro(null);
                                    setActiveCategories([{ group: 'internal', sub: 'All' }]);
                                }
                            }}
                            title={preset.desc}
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
                        <button
                            onClick={() => setOpenCategories(allCategoryIds)}
                            className="text-[#666] hover:text-[#ccc] transition-colors"
                        >
                            Expand All
                        </button>
                        <span className="text-[#333]">|</span>
                        <button
                            onClick={() => setOpenCategories([])}
                            className="text-[#666] hover:text-[#ccc] transition-colors"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Tree */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1 px-1">
                {filteredCategories.map((category) => {
                        const isOpen = openCategories.includes(category.id);
                        const catCounts = (categoryCounts[category.id] || {}) as Record<string, number>;
                        const totalCatCount = typeof catCounts.All === 'number'
                            ? catCounts.All
                            : (Object.entries(catCounts)
                                .filter(([sub]) => sub !== 'All')
                                .reduce((sum, [, value]) => sum + Number(value || 0), 0));

                        // Filter subs
                        const visibleSubs = categorySearch
                            ? category.sub.filter((s: string) => s.toLowerCase().includes(categorySearch.toLowerCase()) || category.label.toLowerCase().includes(categorySearch.toLowerCase()))
                            : category.sub;

                        // Auto-hide empty subs
                        const displaySubs = pages.length > 0
                            ? visibleSubs.filter((s: string) => s === 'All' || (catCounts[s] || 0) > 0)
                            : visibleSubs;

                        if (displaySubs.length === 0 && pages.length > 0 && !categorySearch) return null;

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
                                        {pages.length > 0 && totalCatCount > 0 && (
                                            <span className="text-[10px] font-mono text-[#555]">{totalCatCount}</span>
                                        )}
                                        {isOpen ? <ChevronDown size={12} className="text-[#555]"/> : <ChevronRight size={12} className="text-[#555]"/>}
                                    </div>
                                </button>

                                <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${isOpen || categorySearch ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                    <div className="overflow-hidden">
                                        <div className="ml-[18px] pl-3 my-1 space-y-0.5 border-l border-[#222]">
                                            {displaySubs.map((subItem: string) => {
                                                const isActive = activeCategories.some((selection) => selection.group === category.id && selection.sub === subItem);
                                                const subCount = catCounts[subItem] || 0;
                                                const isWarning = subCount > 0 && /(missing|broken|error|poor|no |noindex|non-indexable|insecure|http pages|timeout|blocked|orphan|deep|thin|duplicate|decay|exposed|small|large dom|render blocking|session id|soft 404|viewport issue|tap too small)/i.test(subItem);
                                                return (
                                                    <button
                                                        key={subItem}
                                                        onClick={(event) => handleCategorySelect(event, category.id, subItem)}
                                                        onContextMenu={(event) => {
                                                            event.preventDefault();
                                                            setContextMenu({
                                                                x: event.clientX,
                                                                y: event.clientY,
                                                                group: category.id,
                                                                sub: subItem
                                                            });
                                                        }}
                                                        className={`w-full text-left px-2.5 py-1 text-[12px] rounded-sm transition-all flex items-center justify-between gap-1 relative group ${
                                                            isActive 
                                                                ? 'bg-gradient-to-r from-[#F5364E]/10 to-transparent text-[#F5364E] font-medium' 
                                                                : 'text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1a]'
                                                        }`}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[2px] h-3.5 bg-[#F5364E] rounded-r-sm shadow-[0_0_8px_rgba(245,54,78,0.5)]"></div>
                                                        )}
                                                        <span className="truncate">{subItem}</span>
                                                        {pages.length > 0 && (
                                                            <span className={`text-[10px] font-mono shrink-0 px-1 py-0 rounded ${
                                                                isWarning ? 'text-[#888] bg-[#222]' :
                                                                subCount > 0 ? (isActive ? 'text-[#F5364E]' : 'text-[#666]') : 'text-[#333]'
                                                            }`}>
                                                                {subCount}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {contextMenu && (
                <div
                    style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 90 }}
                    className="min-w-[180px] bg-[#161616] border border-[#333] rounded-lg shadow-xl overflow-hidden"
                    onClick={(event) => event.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            exportSubset(contextMenu.group, contextMenu.sub);
                            setContextMenu(null);
                        }}
                        className="w-full px-3 py-2 text-[11px] text-left text-[#ddd] hover:bg-[#222] transition-colors"
                    >
                        Export this subset
                    </button>
                    <button
                        onClick={() => {
                            addLog(`Task stub created for ${contextMenu.group} → ${contextMenu.sub}.`, 'info', { source: 'system' });
                            setContextMenu(null);
                        }}
                        className="w-full px-3 py-2 text-[11px] text-left text-[#ddd] hover:bg-[#222] transition-colors"
                    >
                        Create task for all
                    </button>
                    <button
                        onClick={() => {
                            addLog(`Bulk AI analysis queued for ${contextMenu.group} → ${contextMenu.sub}.`, 'info', { source: 'system' });
                            setContextMenu(null);
                        }}
                        className="w-full px-3 py-2 text-[11px] text-left text-[#ddd] hover:bg-[#222] transition-colors"
                    >
                        Bulk AI analyze
                    </button>
                </div>
            )}
        </aside>
    );
}
