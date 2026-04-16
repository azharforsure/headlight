import React from 'react';
import { 
    AlignLeft, Search, Download, CheckCircle2,
    Tag, List, Map as MapIcon, BarChart3, ChevronDown, Sparkles, Plus, RefreshCw, GitCompare
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { ALL_COLUMNS } from './constants';
import { INDUSTRY_FILTERS, AUDIT_MODES_LIST } from '../../services/AuditModeConfig';

import type { AuditMode, IndustryFilter } from '../../services/CheckRegistry';

export default function CrawlerSubHeader() {
    const {
        stats, activeMacro, setActiveMacro,
        showColumnPicker, setShowColumnPicker,
        visibleColumns, setVisibleColumns,
        viewMode, setViewMode,
        searchQuery, setSearchQuery,
        crawlRuntime, pages,
        auditFilter, applyAuditMode,
        setAutoFixItems, setShowAutoFixModal,
        setShowExportDialog,
        activeViewType,
        setShowAddCompetitorInput, refreshAllCompetitors, crawlingCompetitorDomain,
        competitiveState, setActiveCompetitors, competitiveViewMode, setCompetitiveViewMode,
        wqaState, setWqaState,
        isWqaMode,
        urlInput, isCrawling, crawlHistory, currentSessionId,
        handleStartPause, setShowComparisonView
    } = useSeoCrawler();
    const { competitorProfiles, activeCompetitorDomains } = competitiveState;

    const pickerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (showColumnPicker && pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowColumnPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnPicker, setShowColumnPicker]);

    const isGridView = activeViewType === 'grid';
    const isCompetitiveMode = activeViewType === 'competitor_matrix';
    const activeCompetitors = React.useMemo(
        () => activeCompetitorDomains.map((domain) => competitorProfiles.get(domain)).filter(Boolean),
        [activeCompetitorDomains, competitorProfiles]
    );

    const lastCrawlTime = React.useMemo(() => {
        if (!currentSessionId || crawlHistory.length === 0) return null;
        const session = crawlHistory.find((s) => s.id === currentSessionId);
        if (!session?.completedAt) return null;
        const completedAt = Number(session.completedAt);
        if (!Number.isFinite(completedAt) || completedAt <= 0) return null;
        const d = new Date(completedAt);
        const diff = Math.floor((Date.now() - d.getTime()) / 60000);
        if (diff < 60) return `${Math.max(0, diff)}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return d.toLocaleDateString();
    }, [currentSessionId, crawlHistory]);

    return (
        <>
        <div className="h-[44px] border-b border-[#222] bg-[#111] flex items-center justify-between px-4 shrink-0 transition-colors w-full z-[30]">
            <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar-hidden mr-4">
                {/* Audit Mode & Industry Filters */}
                <div className="hidden md:flex items-center gap-2 mr-2">
                    <div className="relative">
                        <select
                            value={auditFilter.modes.includes('full') ? 'full' : auditFilter.modes[0] || 'full'}
                            onChange={(e) => {
                                const val = e.target.value as AuditMode;
                                applyAuditMode(val === 'full' ? ['full'] : [val], auditFilter.industry);
                            }}
                            className="h-[26px] pl-2 pr-7 bg-[#0a0a0a] border border-[#222] rounded text-[11px] text-[#ccc] focus:outline-none focus:border-[#555] appearance-none cursor-pointer hover:border-[#333] transition-colors"
                            title="Audit Mode"
                        >
                            {AUDIT_MODES_LIST.map(m => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={auditFilter.industry}
                            onChange={(e) => {
                                applyAuditMode(auditFilter.modes, e.target.value as IndustryFilter);
                            }}
                            className="h-[26px] pl-2 pr-7 bg-[#0a0a0a] border border-[#222] rounded text-[11px] text-[#ccc] focus:outline-none focus:border-[#555] appearance-none cursor-pointer hover:border-[#333] transition-colors"
                            title="Industry Focus"
                        >
                            {INDUSTRY_FILTERS.map(f => (
                                <option key={f.id} value={f.id}>{f.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
                    </div>
                </div>



                {!isCompetitiveMode && (
                    <>
                        <button onClick={() => setActiveMacro('all')} className={`px-2.5 py-1 rounded text-[12px] font-bold transition-colors shrink-0 ${activeMacro === 'all' ? 'bg-[#F5364E]/10 text-[#F5364E]' : 'bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>
                            All Pages ({Math.max(pages.length, crawlRuntime.crawled || 0)})
                        </button>
                        {stats.broken > 0 && (
                            <button onClick={() => setActiveMacro('broken')} className={`px-2.5 py-1 rounded text-[12px] transition-colors shrink-0 ${activeMacro === 'broken' ? 'bg-red-950/40 text-red-400 border border-red-500/20' : 'bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>
                                Errors 4xx/5xx ({stats.broken})
                            </button>
                        )}
                        {stats.redirects > 0 && (
                            <button onClick={() => setActiveMacro('redirects')} className={`px-2.5 py-1 rounded text-[12px] transition-colors shrink-0 ${activeMacro === 'redirects' ? 'bg-orange-950/40 text-orange-400' : 'bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>
                                Redirects 3xx ({stats.redirects})
                            </button>
                        )}
                        {stats.missingMetaDesc > 0 && (
                            <button onClick={() => setActiveMacro('missingMetaDesc')} className={`px-2.5 py-1 rounded text-[12px] transition-colors shrink-0 ${activeMacro === 'missingMetaDesc' ? 'bg-[#F5364E]/10 text-[#F5364E]' : 'bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>
                                Missing Meta ({stats.missingMetaDesc})
                            </button>
                        )}
                        {stats.slowPages > 0 && (
                            <button onClick={() => setActiveMacro('slow')} className={`px-2.5 py-1 rounded text-[12px] transition-colors shrink-0 ${activeMacro === 'slow' ? 'bg-orange-950/40 text-orange-400' : 'bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>
                                Slow Pages ({stats.slowPages})
                            </button>
                        )}
                        {stats.nonIndexable > 0 && (
                            <button onClick={() => setActiveMacro('nonIndexable')} className={`px-2.5 py-1 rounded text-[12px] transition-colors shrink-0 ${activeMacro === 'nonIndexable' ? 'bg-blue-950/40 text-blue-400' : 'bg-transparent text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]'}`}>
                                Non-Indexable ({stats.nonIndexable})
                            </button>
                        )}
                    </>
                )}

                {isCompetitiveMode && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-hidden max-w-[430px]">
                            {activeCompetitors.map((comp: any) => {
                                const active = activeCompetitorDomains.includes(comp.domain);
                                return (
                                    <button
                                        key={comp.domain}
                                        onClick={() => {
                                            const next = active
                                                ? activeCompetitorDomains.filter((domain) => domain !== comp.domain)
                                                : [...activeCompetitorDomains, comp.domain];
                                            setActiveCompetitors(next);
                                        }}
                                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                                            active
                                                ? 'border-[#F5364E]/30 bg-[#F5364E]/10 text-[#F5364E]'
                                                : 'border-[#222] bg-[#0a0a0a] text-[#888] hover:text-[#ccc]'
                                        }`}
                                    >
                                        {comp.domain}
                                    </button>
                                );
                            })}
                        </div>

                        <button 
                          onClick={() => setShowAddCompetitorInput(true)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#F5364E]/10 text-[#F5364E] text-[11px] font-bold rounded-lg border border-[#F5364E]/20 hover:bg-[#F5364E]/20 transition-colors"
                        >
                          <Plus size={12} /> Add Competitor
                        </button>
                        
                        <button
                          onClick={refreshAllCompetitors}
                          disabled={crawlingCompetitorDomain !== null}
                          className="flex items-center gap-1.5 px-3 py-1 text-[11px] text-[#888] hover:text-white transition-colors disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={crawlingCompetitorDomain ? 'animate-spin' : ''} />
                          {crawlingCompetitorDomain ? `Crawling ${crawlingCompetitorDomain}...` : 'Refresh All'}
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex items-center shrink-0 gap-3">
                {isGridView && (
                    <div className="relative z-50" ref={pickerRef}>
                        <button 
                            onClick={() => setShowColumnPicker(!showColumnPicker)}
                            className={`flex items-center gap-1.5 px-3 py-1 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#222] rounded text-[11px] font-medium transition-colors ${showColumnPicker ? 'text-[#F5364E] border-[#F5364E]/50 bg-[#F5364E]/5' : 'text-[#888]'}`}
                        >
                            <AlignLeft size={12} /> Columns
                        </button>
                        
                        {showColumnPicker && (
                            <div className="absolute right-0 top-full mt-2 w-[500px] bg-[#111] border border-[#333] rounded-lg shadow-2xl z-[1000] p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#222]">
                                    <h4 className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Show/Hide Columns</h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.key))} className="text-[10px] text-blue-400 hover:underline">Select All</button>
                                        <button onClick={() => setVisibleColumns(ALL_COLUMNS.slice(0, 10).map(c => c.key))} className="text-[10px] text-[#555] hover:underline">Reset</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {['General', 'Technical', 'Metrics', 'Links', 'Advanced', 'Security', 'Accessibility', 'Cache', 'Mobile', 'URL Structure', 'Search Console', 'Analytics', 'Authority', 'Strategic', 'AI Insights', 'Business', 'AI Discoverability', 'Performance', 'Log Analysis', 'Collaboration'].map(group => (
                                        <div key={group} className="col-span-2 mb-2">
                                            <h5 className="text-[10px] text-[#444] font-black uppercase tracking-widest mb-2 border-l-2 border-[#F5364E] pl-2">{group}</h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                {ALL_COLUMNS.filter(c => c.group === group).map(col => (
                                                    <label key={col.key} className="flex items-center gap-2 cursor-pointer group">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={visibleColumns.includes(col.key)}
                                                            onChange={() => {
                                                                setVisibleColumns(prev => 
                                                                    prev.includes(col.key) ? prev.filter(k => k !== col.key) : [...prev, col.key]
                                                                );
                                                            }}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-3.5 h-3.5 rounded-sm border transition-colors flex items-center justify-center ${visibleColumns.includes(col.key) ? 'bg-[#F5364E] border-[#F5364E]' : 'bg-[#0a0a0a] border-[#333] group-hover:border-[#555]'}`}>
                                                            {visibleColumns.includes(col.key) && <CheckCircle2 size={10} className="text-white" />}
                                                        </div>
                                                        <span className={`text-[11px] truncate ${visibleColumns.includes(col.key) ? 'text-[#eee]' : 'text-[#666] group-hover:text-[#aaa]'}`}>{col.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isGridView && (
                    <div className="flex bg-[#0a0a0a] rounded border border-[#222] p-0.5">
                        {wqaState.isActive ? (
                            <>
                                <button
                                    onClick={() => setWqaState((prev) => ({ ...prev, viewMode: 'grid' }))}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${wqaState.viewMode === 'grid' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'}`}
                                >
                                    <List size={12} /> Grid
                                </button>
                                <button
                                    onClick={() => setWqaState((prev) => ({ ...prev, viewMode: 'overview' }))}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${wqaState.viewMode === 'overview' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'}`}
                                >
                                    <BarChart3 size={12} /> Overview
                                </button>
                                <button
                                    onClick={() => setWqaState((prev) => ({ ...prev, viewMode: 'actions' }))}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${wqaState.viewMode === 'actions' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'}`}
                                >
                                    <Sparkles size={12} /> Actions
                                </button>
                                <button
                                    onClick={() => setWqaState((prev) => ({ ...prev, viewMode: 'structure' }))}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${wqaState.viewMode === 'structure' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'}`}
                                >
                                    <AlignLeft size={12} /> Structure
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${viewMode === 'grid' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'}`}
                                >
                                    <List size={12} /> Grid
                                </button>
                                <button 
                                    onClick={() => setViewMode('map')}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${viewMode === 'map' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'}`}
                                >
                                    <MapIcon size={12} /> Map
                                </button>
                                <button 
                                    onClick={() => setViewMode('charts')}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${viewMode === 'charts' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'}`}
                                >
                                    <BarChart3 size={12} /> Charts
                                </button>
                            </>
                        )}
                    </div>
                )}

                {isCompetitiveMode && (
                    <div className="flex bg-[#0a0a0a] rounded border border-[#222] p-0.5">
                        <button
                            onClick={() => setCompetitiveViewMode('matrix')}
                            className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${
                                competitiveViewMode === 'matrix' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'
                            }`}
                        >
                            <List size={12} /> Table
                        </button>
                        <button
                            onClick={() => setCompetitiveViewMode('charts')}
                            className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${
                                competitiveViewMode === 'charts' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'
                            }`}
                        >
                            <BarChart3 size={12} /> Charts
                        </button>
                        <button
                            onClick={() => setCompetitiveViewMode('landscape')}
                            className={`px-3 py-1 text-[11px] font-medium rounded-sm flex items-center gap-1.5 transition-colors ${
                                competitiveViewMode === 'landscape' ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#ccc]'
                            }`}
                        >
                            <Search size={12} /> Keywords
                        </button>
                    </div>
                )}

                {isGridView && (
                    <button 
                        disabled={pages.length === 0}
                        onClick={() => {
                            const missingMeta = pages.filter((p: any) => !p.metaDesc || p.metaDesc.trim() === '');
                            setAutoFixItems(missingMeta.map((p: any) => ({ ...p, fixStatus: 'pending', generatedMeta: '' })));
                            setShowAutoFixModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#0a0a0a] hover:bg-[#F5364E]/10 hover:text-[#F5364E] border border-[#222] hover:border-[#F5364E]/30 rounded text-[11px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed group"
                        title="AI Auto-Fix Issues"
                    >
                        <Tag size={12} className="group-hover:text-[#F5364E] text-[#888]"/> Auto-Fix
                    </button>
                )}



                <button
                    onClick={() => setShowExportDialog(true)}
                    disabled={pages.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#0a0a0a] hover:bg-[#F5364E]/10 hover:text-[#F5364E] border border-[#222] hover:border-[#F5364E]/30 rounded text-[11px] font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed group"
                    title="Export crawl data"
                >
                    <Download size={12} className="group-hover:text-[#F5364E] text-[#888]"/> Export
                </button>

                <div className="relative w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" size={12} />
                    <input id="headlight-grid-search" type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search... (⌘F)" className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded pl-7 pr-3 py-1 text-[12px] text-[#e0e0e0] focus:border-[#F5364E] focus:outline-none transition-colors" />
                </div>
            </div>
        </div>
        </>
    );
}
