import React, { useMemo, useState } from 'react';
import { 
    ChevronRight, CheckCircle2, AlertTriangle, ArrowRight,
    Search, PanelRightOpen, Clock, Trash2, GitCompare, ExternalLink,
    RefreshCw, BarChart3, FileText, Map as MapIcon, Globe, Sparkles,
    MessageSquare, CheckSquare, User, Upload, Radar, Route
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import LogFileAnalysisService from '../../services/LogFileAnalysisService';
import ChangeMonitorService from '../../services/ChangeMonitorService';
import MigrationPlannerService, { type MigrationMapping } from '../../services/MigrationPlannerService';
import OverviewTab from './audit-tabs/OverviewTab';
import CompSidebarRouter from './competitive/CompSidebarRouter';

interface AuditSidebarProps {
    embedded?: boolean;
}

export default function AuditSidebar({ embedded = false }: AuditSidebarProps) {
    const {
        showAuditSidebar, setShowAuditSidebar,
        auditSidebarWidth, setIsDraggingSidebar,
        activeAuditTab, setActiveAuditTab,
        stats, pages, healthScore,
        isCrawling, elapsedTime, crawlRate, crawlRuntime,
        setSearchQuery, setActiveMacro,
        logs, setLogs, logSearch, setLogSearch,
        logTypeFilter, setLogTypeFilter,
        // History
        crawlHistory, loadSession, resumeCrawlSession, deleteCrawlSession, compareSessions, 
        diffResult, isLoadingHistory, currentSessionId,
        crawlingMode,
        // Pill mode
        sidebarCollapsed, setSidebarCollapsed,
        auditInsights,
        strategicOpportunities,
        robotsTxt, sitemapData,
        filteredIssuePages,
        aiNarrative, isAnalyzingAI,
        tasks, setShowCollabOverlay, setCollabOverlayTarget,
        crawlDb, addLog,
        activeSidebarSections,
        activeViewType
    } = useSeoCrawler();

    // Reset active tab if it's no longer available in the current mode
    React.useEffect(() => {
        if (activeSidebarSections && activeSidebarSections.length > 0 && !activeSidebarSections.includes(activeAuditTab)) {
            setActiveAuditTab(activeSidebarSections[0] as any);
        }
    }, [activeSidebarSections, activeAuditTab, setActiveAuditTab]);


    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [logAnalysis, setLogAnalysis] = useState<{ fileName: string; totalBotRequests: number; googlebot: number; aiBots: number } | null>(null);
    const [monitorChanges, setMonitorChanges] = useState<Array<{ url: string; changes: string[] }>>([]);
    const [migrationTargets, setMigrationTargets] = useState('');
    const [migrationMappings, setMigrationMappings] = useState<MigrationMapping[]>([]);
    const sitemapCrawledCount = useMemo(
        () => pages.filter((p) => p.inSitemap).length,
        [pages]
    );

    const issueGroups = useMemo(() => {
        if (!filteredIssuePages) return [];
        return filteredIssuePages.map((group) => {
            const issues = group.issues
                .map((issue) => ({
                    ...issue,
                    count: pages.filter(issue.condition).length
                }))
                .filter((issue) => issue.count > 0);

            return { ...group, issues };
        }).filter((group) => group.issues.length > 0);
    }, [pages, filteredIssuePages]);

    const totalIssueCount = useMemo(() => {
        return issueGroups.reduce((sum, group) => {
            return sum + group.issues.reduce((groupSum, issue) => groupSum + issue.count, 0);
        }, 0);
    }, [issueGroups]);

    const allTabs = useMemo(() => [
        { id: 'overview', label: 'Overview' },
        { id: 'issues', label: 'Issues', count: totalIssueCount },
        { id: 'opportunities', label: 'Opportunities', count: strategicOpportunities.length },
        { id: 'geo', label: 'GEO', count: 0 },
        { id: 'tasks', label: 'Tasks', count: tasks.length },
        { id: 'ai', label: 'AI Strategy' },
        { id: 'comp_overview', label: 'Overview' },
        { id: 'comp_gaps', label: 'Gaps' },
        { id: 'comp_threats', label: 'Threats' },
        { id: 'comp_brief', label: 'AI Brief' },
        { id: 'comp_notes', label: 'Notes' },
        { id: 'monitor', label: 'Monitor', count: monitorChanges.length },
        { id: 'migration', label: 'Migration', count: migrationMappings.length },
        { id: 'robots', label: 'Robots' },
        { id: 'sitemap', label: 'Sitemap' },
        { id: 'history', label: 'History', count: crawlHistory?.length || 0 },
        { id: 'logs', label: 'Logs', count: logs?.length || 0 }
    ], [totalIssueCount, strategicOpportunities?.length, tasks?.length, monitorChanges?.length, migrationMappings?.length, crawlHistory?.length, logs?.length]);

    const visibleTabs = useMemo(() => {
        if (activeViewType === 'competitor_matrix') {
            return [
                { id: 'comp_overview', label: 'Overview' },
                { id: 'comp_gaps', label: 'Gaps' },
                { id: 'comp_threats', label: 'Threats' },
                { id: 'comp_brief', label: 'AI Brief' },
                { id: 'tasks', label: 'Tasks', count: tasks.length },
                { id: 'comp_notes', label: 'Notes' }
            ];
        }
        if (!activeSidebarSections || activeSidebarSections.length === 0) return allTabs;
        return allTabs.filter(tab => activeSidebarSections.includes(tab.id));
    }, [activeSidebarSections, allTabs, activeViewType, tasks.length, logs?.length]);


    const handleLogAnalysisUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const content = await file.text();
            const entries = LogFileAnalysisService.parse(content);
            const result = LogFileAnalysisService.applyToPages(pages, entries);
            await crawlDb.pages.bulkPut(result.pages);
            setLogAnalysis({
                fileName: file.name,
                totalBotRequests: result.totals.totalBotRequests,
                googlebot: result.totals.googlebot,
                aiBots: result.totals.aiBots
            });
            addLog(`Imported log file ${file.name} and applied bot crawl metrics to ${result.pages.length} pages.`, 'success', { source: 'analysis' });
        } catch (error: any) {
            addLog(`Log analysis failed: ${error.message}`, 'error', { source: 'analysis' });
        } finally {
            event.target.value = '';
        }
    };

    const createMonitorSnapshot = () => {
        const projectId = pages[0]?.projectId || pages[0]?.sessionId || 'default';
        ChangeMonitorService.saveSnapshots(projectId, pages);
        setMonitorChanges([]);
        addLog('Saved current crawl snapshot for change monitoring.', 'success', { source: 'analysis' });
    };

    const runMonitorDiff = () => {
        const projectId = pages[0]?.projectId || pages[0]?.sessionId || 'default';
        const changes = ChangeMonitorService.detectChanges(projectId, pages).map((item) => ({
            url: item.url,
            changes: item.changes
        }));
        setMonitorChanges(changes);
        addLog(`Detected ${changes.length} monitored page changes.`, changes.length ? 'warn' : 'success', { source: 'analysis' });
    };

    const generateMigrationPlan = async () => {
        const targets = migrationTargets
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean);
        
        // Use AI Mapping if we have more target URLs than source URLs (heuristic) or more than 5
        const mappings = await MigrationPlannerService.generateMappings(
            pages.map((page) => page.url),
            targets
        );
        
        // Pass 3: AI Semantic matching if we have unmapped pages
        const unmapped = mappings.filter(m => m.matchType === 'unmapped').map(m => m.sourceUrl);
        if (unmapped.length > 0) {
            const aiResults = await MigrationPlannerService.generateAIMappings(unmapped, targets);
            // Replace unmapped with AI results
            const finalMappings = mappings.map(m => {
                const aiMatch = aiResults.find(a => a.sourceUrl === m.sourceUrl);
                return (m.matchType === 'unmapped' && aiMatch) ? aiMatch : m;
            });
            setMigrationMappings(finalMappings);
        } else {
            setMigrationMappings(mappings);
        }
    };

    const downloadText = (filename: string, content: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!embedded && !showAuditSidebar) {
        return (
            <button 
                onClick={() => setShowAuditSidebar(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-r-0 border-[#333] pl-2 pr-1.5 py-3 rounded-l-md shadow-[-2px_0_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center text-[#888] hover:text-white hover:bg-[#222] transition-colors group"
                title="Show Audit"
            >
                <div className="flex flex-col items-center gap-2">
                    <PanelRightOpen size={14} className="mb-0.5" />
                    {stats?.broken > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#F5364E]" title={`${stats.broken} Broken Pages`} />}
                    {isCrawling && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" title="Crawling..." />}
                </div>
            </button>
        );
    }

    return (
        <aside
            style={embedded ? undefined : { width: auditSidebarWidth }}
            className={`bg-[#111] flex flex-col z-10 relative min-h-0 ${embedded ? 'w-full h-full overflow-hidden rounded-2xl border border-[#222]' : 'shrink-0 border-l border-[#222] shadow-[-4px_0_15px_rgba(0,0,0,0.2)]'}`}
        >
            {/* Resize Handle Area */}
            {!embedded && (
                <div 
                    onMouseDown={() => setIsDraggingSidebar(true)}
                    className="absolute top-0 bottom-0 left-0 w-1.5 cursor-ew-resize z-50 transition-colors hover:bg-[#F5364E]"
                ></div>
            )}

            {/* Header & Tabs */}
            <div className="flex flex-col shrink-0 bg-[#141414] border-b border-[#222]">
                <div className="h-[40px] px-4 flex items-center justify-between">
                    <h3 className="text-[12px] font-semibold text-[#ccc] uppercase tracking-wider flex items-center gap-2">
                        Audit
                    </h3>
                    {!embedded && <button onClick={() => setShowAuditSidebar(false)} className="text-[#666] hover:text-white p-1 rounded hover:bg-[#222] transition-colors"><ChevronRight size={14}/></button>}
                </div>
                <div className="flex px-2 pb-0 overflow-x-auto custom-scrollbar-hidden">
                    {visibleTabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveAuditTab(tab.id as any)}
                            className={`px-3 py-2 text-[11px] font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeAuditTab === tab.id ? 'border-[#F5364E] text-white' : 'border-transparent text-[#888] hover:text-[#ccc]'}`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${tab.id === 'issues' ? 'bg-red-500/20 text-red-400' : 'bg-[#222] text-[#888]'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#111] p-4">
                {/* OVERVIEW TAB */}
                {activeAuditTab === 'overview' && (
                    <OverviewTab
                        pages={pages}
                        isCrawling={isCrawling}
                        elapsedTime={elapsedTime}
                        crawlRate={crawlRate}
                        healthScore={healthScore}
                        stats={stats}
                        auditInsights={auditInsights}
                        setActiveMacro={setActiveMacro}
                    />
                )}

                {/* ISSUES TAB */}
                {activeAuditTab === 'issues' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-[11px] text-[#888] bg-[#1a1a1a] p-2 rounded border border-[#222]">
                            <span>All Issues</span>
                        </div>

                        {pages.length === 0 ? (
                            <div className="text-[11px] text-[#666] text-center py-8">Scan a website to view issues.</div>
                        ) : (
                            <div className="space-y-4">
                                {issueGroups.map((group) => {
                                    return (
                                        <div key={group.category} className="mb-4">
                                            <h4 className="text-[11px] font-bold text-[#888] mb-2 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#222] pb-1">
                                                {group.category}
                                            </h4>
                                            <div className="space-y-1">
                                                {group.issues.map(issue => (
                                                    <button 
                                                        key={issue.id}
                                                        onClick={() => setActiveMacro(issue.id)}
                                                        className="w-full flex justify-between items-center py-2 px-3 bg-[#141414] hover:bg-[#1a1a1a] rounded border border-[#222] transition-colors group"
                                                    >
                                                        <span className="text-[12px] text-[#ccc] group-hover:text-white flex items-center gap-2 text-left">
                                                            {issue.type === 'error' && <AlertTriangle size={12} className="text-red-400 shrink-0"/>}
                                                            {issue.type === 'warning' && <AlertTriangle size={12} className="text-orange-400 shrink-0"/>}
                                                            {issue.type === 'notice' && <AlertTriangle size={12} className="text-blue-400 shrink-0"/>}
                                                            <span className="truncate">{issue.label}</span>
                                                        </span>
                                                        <span className={`font-mono text-[11px] px-2 py-0.5 rounded shrink-0 ${
                                                            issue.type === 'error' ? 'bg-red-500/10 text-red-400' :
                                                            issue.type === 'warning' ? 'bg-orange-500/10 text-orange-400' :
                                                            'bg-blue-500/10 text-blue-400'
                                                        }`}>
                                                            {issue.count}
                                                        </span>
                                                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCollabOverlayTarget({ type: 'issue', id: issue.id, title: issue.label });
                                                                    setShowCollabOverlay(true);
                                                                }}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors text-gray-500 hover:text-white"
                                                            >
                                                                <MessageSquare size={12} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCollabOverlayTarget({ type: 'task', id: issue.id, title: `Fix: ${issue.label}` });
                                                                    setShowCollabOverlay(true);
                                                                }}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors text-gray-500 hover:text-white"
                                                            >
                                                                <FileText size={12} />
                                                            </button>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {issueGroups.length === 0 && (
                                    <div className="text-[11px] text-green-400 flex items-center gap-2 justify-center py-4">
                                        <CheckCircle2 size={16}/> No issues found across all categories!
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TASKS TAB */}
                {activeAuditTab === 'tasks' && activeViewType !== 'competitor_matrix' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-[#888] uppercase tracking-widest flex items-center gap-1.5">
                                Active Tasks
                            </h4>
                            <span className="text-[10px] text-[#555] font-mono">{tasks.length} Total</span>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-[#666] bg-[#141414] rounded border border-dashed border-[#222] gap-3">
                                <CheckSquare size={32} className="text-[#222]" />
                                <div className="text-center">
                                    <p className="text-[11px]">No active tasks.</p>
                                    <button 
                                        onClick={() => {
                                            setCollabOverlayTarget({ type: 'task', id: 'new-' + Math.random().toString(36).substr(2, 9), title: 'New Task' });
                                            setShowCollabOverlay(true);
                                        }}
                                        className="mt-3 text-[10px] font-bold text-brand-red hover:underline uppercase tracking-widest"
                                    >
                                        Create your first task
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => {
                                            setCollabOverlayTarget({ type: 'task', id: task.id, title: task.title });
                                            setShowCollabOverlay(true);
                                        }}
                                        className="w-full text-left p-3 rounded border border-[#222] bg-[#141414] hover:bg-[#1a1a1a] transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-bold text-white group-hover:text-brand-red transition-colors truncate">
                                                    {task.title}
                                                </div>
                                                <div className="text-[9px] text-gray-500 uppercase font-mono mt-0.5">
                                                    {task.priority} • {task.status}
                                                </div>
                                            </div>
                                            {task.assignee_id ? (
                                                <div className="w-5 h-5 rounded-full bg-brand-red/20 flex items-center justify-center text-[8px] font-bold text-brand-red">
                                                    {task.assignee_name?.[0] || 'U'}
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                                                    <User size={10} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-[9px] text-[#555]">
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 bg-black rounded border border-white/5">
                                                    {task.source}
                                                </span>
                                            </div>
                                            <span>{new Date(task.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}


                {activeAuditTab === 'opportunities' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {strategicOpportunities.length === 0 ? (
                            <div className="text-[11px] text-[#666] text-center py-8">Run a crawl with enriched data to surface prioritized opportunities.</div>
                        ) : (
                            strategicOpportunities.map((opportunity) => (
                                <button
                                    key={opportunity.url}
                                    onClick={() => {
                                        setSearchQuery(opportunity.url);
                                        setActiveMacro(null);
                                    }}
                                    className="w-full text-left p-3 rounded border border-[#222] bg-[#141414] hover:bg-[#1a1a1a] hover:border-[#333] transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-[11px] font-semibold text-white truncate">{opportunity.recommendedAction}</div>
                                            <div className="text-[10px] text-[#888] truncate mt-0.5">{opportunity.title}</div>
                                        </div>
                                        <div className="text-[10px] font-mono text-[#F5364E] shrink-0">{opportunity.opportunityScore}</div>
                                    </div>
                                    <div className="text-[10px] text-[#666] mt-2 leading-relaxed">{opportunity.recommendedActionReason}</div>
                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[#777]">
                                        <span>Business {opportunity.businessValueScore}</span>
                                        <span>Confidence {opportunity.insightConfidence}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {activeAuditTab === 'geo' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 border border-orange-500/30 rounded-lg p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl -mr-8 -mt-8" />
                            <h4 className="text-[11px] font-bold text-orange-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} fill="currentColor" /> GEO Optimization
                            </h4>
                            <p className="text-[12px] text-gray-300 leading-relaxed">
                                Generative Engine Optimization (GEO) focuses on making your content discoverable and citeable by AI models like ChatGPT, Perplexity, and Google AI Overviews.
                            </p>
                        </div>

                        {/* AI Bot Access Summary */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold text-[#555] mb-3 uppercase tracking-widest border-b border-[#222] pb-1">AI Crawler Access</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {(() => {
                                    const botAccess = robotsTxt?.aiBotAccess || {};
                                    const bots = [
                                        { key: 'gptBot', label: 'GPTBot' },
                                        { key: 'claudeBot', label: 'ClaudeBot' },
                                        { key: 'perplexityBot', label: 'Perplexity' },
                                        { key: 'googleExtended', label: 'Google Ext' },
                                        { key: 'ccBot', label: 'CCBot' },
                                        { key: 'byteSpider', label: 'ByteSpider' },
                                        { key: 'amazonBot', label: 'Amazonbot' },
                                        { key: 'appleBotExtended', label: 'Apple Ext' }
                                    ];
                                    return bots.map(bot => {
                                        const access = botAccess[bot.key] || 'unspecified';
                                        const colorClass =
                                            access === 'allow'       ? 'text-green-500 font-bold' :
                                            access === 'disallow'    ? 'text-red-400 font-bold' :
                                            access === 'partial'     ? 'text-yellow-500 font-bold' :
                                            'text-[#555]';
                                        const label =
                                            access === 'allow'    ? 'ALLOW' :
                                            access === 'disallow' ? 'BLOCK' :
                                            access === 'partial'  ? 'PARTIAL' : 'NONE';
                                        return (
                                            <div key={bot.key} className="flex items-center justify-between p-2 bg-[#141414] border border-[#222] rounded text-[10px]">
                                                <span className="text-gray-400 font-medium truncate pr-1">{bot.label}</span>
                                                <span className={colorClass}>{label}</span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* GEO Metrics Overview */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-[#555] uppercase tracking-widest border-b border-[#222] pb-1">Site-wide GEO Signals</h4>
                            
                            <div className="space-y-3">
                                {(() => {
                                    const metrics = [
                                        { label: 'Passage Readiness', key: 'passageReadiness', color: 'blue' },
                                        { label: 'Voice Search Ready', key: 'voiceSearchScore', color: 'orange' },
                                        { label: 'Overall GEO Score', key: 'geoScore', color: 'amber' }
                                    ];
                                    
                                    return metrics.map(m => {
                                        const values = pages.map(p => p[m.key] || 0).filter(v => v > 0);
                                        const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
                                        
                                        return (
                                            <div key={m.key} className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase tracking-tighter">
                                                    <span className="text-gray-400 font-bold">{m.label}</span>
                                                    <span className="text-gray-500 font-mono">{avg}% AVG</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full bg-${m.color}-500 transition-all duration-1000`}
                                                        style={{ width: `${avg}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* llms.txt Status */}
                        <div className={`p-3 rounded-lg border flex items-center justify-between ${robotsTxt?.hasLlmsTxt ? 'bg-green-500/5 border-green-500/20' : 'bg-[#1a1a1a] border-[#222]'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${robotsTxt?.hasLlmsTxt ? 'bg-green-500/20 text-green-400' : 'bg-[#222] text-[#444]'}`}>
                                    <FileText size={16} />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-white">/llms.txt</div>
                                    <div className="text-[10px] text-[#666]">{robotsTxt?.hasLlmsTxt ? 'Present and discovered' : 'Not found at root'}</div>
                                </div>
                            </div>
                            {robotsTxt?.hasLlmsTxt ? (
                                <span className="text-[9px] bg-green-500 text-black font-bold px-1.5 py-0.5 rounded uppercase">Optimized</span>
                            ) : (
                                <button className="text-[9px] text-orange-400 hover:underline">How to add?</button>
                            )}
                        </div>
                    </div>
                )}

                {activeAuditTab === 'ai' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Executive Summary Narrative */}
                        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/30 rounded-lg p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl -mr-8 -mt-8" />
                            <h4 className="text-[11px] font-bold text-indigo-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} fill="currentColor" /> Executive AI Narrative
                            </h4>
                            {aiNarrative ? (
                                <p className="text-[12px] text-gray-200 leading-relaxed italic">
                                    {aiNarrative}
                                </p>
                            ) : (
                                <div className="text-[11px] text-[#666] text-center py-4 border border-white/5 bg-black/20 rounded">
                                    {isAnalyzingAI ? 'Generating narrative...' : 'Run AI Analysis to generate site narrative.'}
                                </div>
                            )}
                        </div>

                        {/* Top AI Insights / Opportunities */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold text-[#555] mb-3 uppercase tracking-widest border-b border-[#222] pb-1">Strategic Topic Clusters</h4>
                            {(() => {
                                const clusters: Record<string, number> = {};
                                pages.forEach(p => {
                                    if (p.topicCluster) clusters[p.topicCluster] = (clusters[p.topicCluster] || 0) + 1;
                                });
                                const sortedClusters = Object.entries(clusters).sort((a, b) => b[1] - a[1]);

                                if (sortedClusters.length === 0) return <div className="text-[11px] text-[#444] text-center py-4 italic">No clusters identified yet.</div>;

                                return (
                                    <div className="grid grid-cols-1 gap-2">
                                        {sortedClusters.slice(0, 6).map(([cluster, count]) => (
                                            <div key={cluster} className="flex items-center justify-between p-2 bg-[#141414] border border-[#222] rounded text-[11px]">
                                                <span className="text-gray-300 font-medium truncate pr-2">{cluster}</span>
                                                <span className="text-gray-500 font-mono text-[10px] bg-black px-1.5 py-0.5 rounded">{count} pages</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Funnel Stage Breakdown */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-bold text-[#555] mb-3 uppercase tracking-widest border-b border-[#222] pb-1">Search Intent Funnel</h4>
                            {(() => {
                                const stages = ['Informational', 'Commercial', 'Transactional', 'Navigational'];
                                const counts = stages.map(s => pages.filter(p => p.funnelStage === s).length);
                                const total = counts.reduce((a, b) => a + b, 0);
                                const max = Math.max(...counts, 1);

                                if (total === 0) return <div className="text-[11px] text-[#444] text-center py-4 italic">No intent data available.</div>;

                                return (
                                    <div className="space-y-3">
                                        {stages.map((stage, i) => (
                                            <div key={stage} className="space-y-1">
                                                <div className="flex justify-between text-[10px] uppercase tracking-tighter">
                                                    <span className="text-gray-400 font-bold">{stage}</span>
                                                    <span className="text-gray-500">{counts[i]} pages</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ${
                                                            stage === 'Transactional' ? 'bg-emerald-500' :
                                                            stage === 'Commercial' ? 'bg-blue-500' :
                                                            stage === 'Navigational' ? 'bg-orange-500' : 'bg-gray-500'
                                                        }`}
                                                        style={{ width: `${(counts[i] / max) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Batch AI Actions */}
                        <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                            <h4 className="text-[11px] font-bold text-emerald-400 mb-3 uppercase tracking-widest flex items-center justify-between">
                                Batch AI Actions
                                <span className="text-[9px] text-[#555] normal-case tracking-normal font-normal">Coming Soon</span>
                            </h4>
                            <div className="space-y-2 opacity-50">
                                <button disabled className="w-full flex items-center justify-between p-2.5 bg-[#111] border border-[#222] rounded text-[11px] text-gray-500 cursor-not-allowed">
                                    <span>Rewrite missing meta descriptions</span>
                                    <Sparkles size={12} className="text-emerald-500 opacity-50" />
                                </button>
                                <button disabled className="w-full flex items-center justify-between p-2.5 bg-[#111] border border-[#222] rounded text-[11px] text-gray-500 cursor-not-allowed">
                                    <span>Generate missing alt text</span>
                                    <Sparkles size={12} className="text-emerald-500 opacity-50" />
                                </button>
                                <button disabled className="w-full flex items-center justify-between p-2.5 bg-[#111] border border-[#222] rounded text-[11px] text-gray-500 cursor-not-allowed">
                                    <span>Cluster topics across site</span>
                                    <Sparkles size={12} className="text-emerald-500 opacity-50" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeAuditTab === 'monitor' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                            <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-2">
                                <Radar size={13} /> Continuous Change Monitoring
                            </div>
                            <div className="mt-2 text-[11px] text-[#9aa3ad] leading-relaxed">
                                Save a crawl snapshot, then compare future crawls against it for title, content, status, canonical, robots, and schema changes.
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={createMonitorSnapshot}
                                className="px-3 py-2 rounded border border-[#333] bg-[#111] text-[11px] font-bold text-white"
                            >
                                Save Baseline Snapshot
                            </button>
                            <button
                                onClick={runMonitorDiff}
                                className="px-3 py-2 rounded border border-cyan-500/20 bg-cyan-500/10 text-[11px] font-bold text-cyan-200"
                            >
                                Compare Against Baseline
                            </button>
                        </div>
                        <div className="space-y-2">
                            {monitorChanges.length === 0 ? (
                                <div className="p-3 rounded border border-[#222] bg-[#0a0a0a] text-[11px] text-[#666]">
                                    No detected changes yet. Save a baseline, then compare after the next crawl.
                                </div>
                            ) : (
                                monitorChanges.slice(0, 50).map((item) => (
                                    <div key={item.url} className="p-3 rounded border border-[#222] bg-[#0a0a0a]">
                                        <div className="text-[11px] text-white truncate">{item.url}</div>
                                        <div className="mt-1 text-[10px] text-[#777] uppercase tracking-widest">
                                            {item.changes.join(', ')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeAuditTab === 'migration' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-300 flex items-center gap-2">
                                <Route size={13} /> Site Migration Planner
                            </div>
                            <div className="mt-2 text-[11px] text-[#9aa3ad] leading-relaxed">
                                Paste target URLs from the destination site to generate redirect mappings from the current crawl.
                            </div>
                        </div>
                        <textarea
                            value={migrationTargets}
                            onChange={(event) => setMigrationTargets(event.target.value)}
                            placeholder={"https://newsite.com/page-a\nhttps://newsite.com/page-b"}
                            rows={8}
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-3 text-[11px] text-white font-mono focus:outline-none focus:border-[#F5364E]"
                        />
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => generateMigrationPlan().catch((error) => addLog(error.message, 'error', { source: 'analysis' }))}
                                className="px-3 py-2 rounded border border-[#333] bg-[#111] text-[11px] font-bold text-white"
                            >
                                Generate Mapping
                            </button>
                            {migrationMappings.length > 0 && (
                                <>
                                    <button
                                        onClick={() => downloadText('migration-plan.csv', MigrationPlannerService.exportCsv(migrationMappings))}
                                        className="px-3 py-2 rounded border border-[#333] bg-[#111] text-[11px] font-bold text-white"
                                    >
                                        Export CSV
                                    </button>
                                    <button
                                        onClick={() => downloadText('migration-plan.htaccess', MigrationPlannerService.exportHtaccess(migrationMappings))}
                                        className="px-3 py-2 rounded border border-[#333] bg-[#111] text-[11px] font-bold text-white"
                                    >
                                        Export .htaccess
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="space-y-2">
                            {migrationMappings.slice(0, 50).map((mapping) => (
                                <div key={mapping.sourceUrl} className="p-3 rounded border border-[#222] bg-[#0a0a0a]">
                                    <div className="text-[11px] text-white truncate">{mapping.sourceUrl}</div>
                                    <div className="text-[10px] text-[#777] truncate">
                                        {mapping.targetUrl || 'No target match found'}
                                    </div>
                                    <div className="mt-1 text-[9px] uppercase tracking-widest text-[#666]">
                                        {mapping.matchType} · {Math.round(mapping.confidence * 100)}% confidence
                                    </div>
                                </div>
                            ))}
                            {migrationMappings.length === 0 && (
                                <div className="p-3 rounded border border-[#222] bg-[#0a0a0a] text-[11px] text-[#666]">
                                    No mappings generated yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* HISTORY TAB — NEW */}
                {activeAuditTab === 'history' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <p className="text-[12px] text-[#888]">Your past crawl sessions stored on this device.</p>
                            {crawlHistory.length > 0 && (
                                <span className="text-[10px] text-[#555] font-mono">{crawlHistory.length} sessions</span>
                            )}
                        </div>


                        {isLoadingHistory ? (
                            <div className="flex flex-col items-center justify-center py-12 text-[#555] gap-3">
                                <div className="w-5 h-5 border-2 border-[#333] border-t-[#F5364E] rounded-full animate-spin" />
                                <p className="text-[11px] text-center">Loading history...</p>
                            </div>
                        ) : crawlHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-[#666] gap-3">
                                <Clock size={32} className="text-[#333]" />
                                <p className="text-[12px] text-center">No scan history yet. Start a crawl and it&apos;ll be saved here automatically.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {crawlHistory.map(session => {
                                    const compareTargetId = currentSessionId && currentSessionId !== session.id
                                        ? currentSessionId
                                        : (crawlHistory.find(candidate => candidate.id !== session.id)?.id || null);

                                    return (
                                    <div 
                                        key={session.id}
                                        className={`bg-[#141414] border rounded-lg p-3 transition-all cursor-pointer group ${
                                            selectedHistoryId === session.id ? 'border-[#F5364E]/50 bg-[#F5364E]/5' : 'border-[#222] hover:border-[#333]'
                                        }`}
                                        onClick={() => setSelectedHistoryId(selectedHistoryId === session.id ? null : session.id)}
                                    >
                                        <div className="flex items-start justify-between mb-1.5">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] text-blue-400 truncate flex items-center gap-1.5">
                                                    <ExternalLink size={10} className="shrink-0" />
                                                    {session.url}
                                                </div>
                                                <div className="text-[10px] text-[#555] mt-1 flex items-center gap-2">
                                                    <span>{session.totalPages} pages</span>
                                                    <span className="text-[#333]">•</span>
                                                    <span className={`font-bold ${
                                                        session.healthGrade === 'A' ? 'text-green-400' : 
                                                        session.healthGrade === 'B' ? 'text-blue-400' : 
                                                        session.healthGrade === 'C' ? 'text-yellow-400' : 'text-red-400'
                                                    }`}>{session.healthScore}/100 {session.healthGrade}</span>
                                                    <span className="text-[#333]">•</span>
                                                    <span>{session.totalIssues} issues</span>
                                                </div>
                                                <div className="text-[9px] text-[#444] mt-1 flex items-center gap-2 font-mono">
                                                    <span>{session.runtime?.crawled ?? session.totalPages} crawled</span>
                                                    <span className="text-[#2d2d2d]">•</span>
                                                    <span>{session.runtime?.queued ?? 0} queued</span>
                                                    <span className="text-[#2d2d2d]">•</span>
                                                    <span>checkpoint {new Date(session.checkpointAt || session.lastActivityAt || session.startedAt).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                                                session.status === 'completed' ? 'bg-green-500/15 text-green-400' : 
                                                session.status === 'paused' ? 'bg-yellow-500/15 text-yellow-400' : 
                                                'bg-[#222] text-[#888]'
                                            }`}>
                                                {session.status}
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-[#444] font-mono">
                                            {new Date(session.startedAt).toLocaleString()}
                                        </div>

                                        {/* Expanded actions */}
                                        {selectedHistoryId === session.id && (
                                            <div className="mt-3 pt-3 border-t border-[#222] flex items-center gap-2 animate-in fade-in duration-150">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); loadSession(session.id); }}
                                                    disabled={isLoadingHistory}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5364E]/10 hover:bg-[#F5364E]/20 text-[#F5364E] rounded text-[10px] font-bold transition-colors"
                                                >
                                                    <RefreshCw size={10} /> Restore
                                                </button>
                                                {(session.status === 'paused' || session.status === 'running') && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); resumeCrawlSession(session.id); }}
                                                        disabled={isLoadingHistory}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-[10px] font-bold transition-colors"
                                                    >
                                                        <RefreshCw size={10} /> Resume
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        if (compareTargetId) {
                                                            compareSessions(session.id, compareTargetId);
                                                        }
                                                    }}
                                                    disabled={!compareTargetId || isLoadingHistory}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold transition-colors disabled:opacity-30"
                                                >
                                                    <GitCompare size={10} /> Compare
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteCrawlSession(session.id); setSelectedHistoryId(null); }}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#222] hover:bg-red-500/20 text-[#888] hover:text-red-400 rounded text-[10px] font-bold transition-colors ml-auto"
                                                >
                                                    <Trash2 size={10} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )})}
                            </div>
                        )}

                    </div>
                )}




                {/* LOGS TAB */}
                {activeAuditTab === 'logs' && (
                    <div className="h-full flex flex-col animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[11px] font-bold text-[#666] uppercase tracking-widest flex items-center gap-2">
                                Logs {isCrawling && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>}
                            </h4>
                            <button onClick={() => setLogs([])} className="text-[10px] text-[#555] hover:text-white">Clear</button>
                        </div>
                        <div className="mb-3 p-3 bg-[#0d0d0d] border border-[#222] rounded-lg space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[11px] font-bold text-white uppercase tracking-widest">Log Analysis</div>
                                    <div className="text-[10px] text-[#666]">Upload access logs to map Googlebot and AI crawler activity back to crawled pages.</div>
                                </div>
                                <label className="px-3 py-1.5 rounded border border-[#333] text-[11px] text-white flex items-center gap-2 cursor-pointer">
                                    <Upload size={12} /> Upload Log
                                    <input type="file" accept=".log,.txt,.csv,.jsonl,.gz" className="hidden" onChange={handleLogAnalysisUpload} />
                                </label>
                            </div>
                            {logAnalysis && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2 bg-[#111] border border-[#222] rounded">
                                        <div className="text-[9px] text-[#666] uppercase">File</div>
                                        <div className="text-[11px] text-white truncate">{logAnalysis.fileName}</div>
                                    </div>
                                    <div className="p-2 bg-[#111] border border-[#222] rounded">
                                        <div className="text-[9px] text-[#666] uppercase">Googlebot Hits</div>
                                        <div className="text-[11px] text-emerald-300">{logAnalysis.googlebot}</div>
                                    </div>
                                    <div className="p-2 bg-[#111] border border-[#222] rounded">
                                        <div className="text-[9px] text-[#666] uppercase">AI Bot Hits</div>
                                        <div className="text-[11px] text-blue-300">{logAnalysis.aiBots}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Log search & type filter */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#555]" size={10} />
                                <input
                                    type="text"
                                    value={logSearch}
                                    onChange={e => setLogSearch(e.target.value)}
                                    placeholder="Filter logs..."
                                    className="w-full bg-[#0a0a0a] border border-[#222] rounded pl-6 pr-2 py-0.5 text-[10px] text-[#ccc] placeholder-[#555] focus:border-[#F5364E] focus:outline-none"
                                />
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                                {(['all', 'info', 'warn', 'error', 'success'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setLogTypeFilter(t)}
                                        className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded transition-colors ${
                                            logTypeFilter === t
                                                ? t === 'error' ? 'bg-red-500/20 text-red-400'
                                                : t === 'success' ? 'bg-green-500/20 text-green-400'
                                                : t === 'warn' ? 'bg-yellow-500/20 text-yellow-400'
                                                : 'bg-[#222] text-white'
                                                : 'text-[#555] hover:text-[#888]'
                                        }`}
                                    >
                                        {t === 'all' ? 'All' : t[0].toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 bg-[#0a0a0a] border border-[#222] rounded p-3 font-mono text-[10px] text-[#888] overflow-y-auto space-y-1.5 shadow-inner custom-scrollbar">
                            {(() => {
                                let filtered = logs;
                                if (logTypeFilter !== 'all') filtered = filtered.filter((l: any) => l.type === logTypeFilter);
                                if (logSearch) filtered = filtered.filter((l: any) => l.msg.toLowerCase().includes(logSearch.toLowerCase()));
                                if (filtered.length === 0) return <span className="text-[#444]">{logs.length === 0 ? 'Idle. Ready to scan.' : 'No matching logs.'}</span>;
                                return filtered.map((L: any, i: number) => (
                                    <div key={i} className={`leading-relaxed break-all py-0.5 ${
                                        L.type === 'error' ? 'text-red-400'
                                        : L.type === 'success' ? 'text-green-400'
                                        : L.type === 'warn' ? 'text-yellow-400'
                                        : 'text-[#777]'
                                    }`}>
                                        <div className="flex items-start gap-1.5">
                                            <span className="opacity-40 shrink-0 font-mono" style={{fontSize:'9px'}}>
                                                {new Date(L.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                            </span>
                                            {L.source && (
                                                <span className={`shrink-0 px-1 py-0 rounded font-bold leading-relaxed ${
                                                    L.source === 'error' || L.type === 'error' ? 'bg-red-500/10 text-red-500'
                                                    : L.source === 'session' ? 'bg-purple-500/10 text-purple-400'
                                                    : L.source === 'history' ? 'bg-blue-500/10 text-blue-400'
                                                    : L.source === 'analysis' ? 'bg-orange-500/10 text-orange-400'
                                                    : L.source === 'system' ? 'bg-[#222] text-[#666]'
                                                    : 'bg-[#1a1a1a] text-[#555]'
                                                }`} style={{fontSize:'8px'}}>
                                                    {L.source}
                                                </span>
                                            )}
                                            <span className="flex-1">{L.msg}</span>
                                        </div>
                                        {L.url && (
                                            <div className="ml-7 mt-0.5 text-[9px] text-blue-400/60 truncate">{L.url}</div>
                                        )}
                                        {L.detail && L.detail !== L.msg && (
                                            <div className="ml-7 mt-0.5 text-[9px] text-[#555] break-all">{L.detail}</div>
                                        )}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                )}

                {/* COMPETITIVE SIDEBAR TABS */}
                {(activeAuditTab.startsWith('comp_') || (activeAuditTab === 'tasks' && activeViewType === 'competitor_matrix')) && (
                    <CompSidebarRouter />
                )}

                {/* ROBOTS.TXT TAB */}
                {activeAuditTab === 'robots' && (
                    <div className="space-y-4 animate-in fade-in duration-200 h-full flex flex-col">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-[#888] uppercase tracking-widest flex items-center gap-1.5">
                                <FileText size={12} /> Robots.txt
                            </h4>
                            {robotsTxt?.crawlDelay > 0 && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                                    Delay: {robotsTxt.crawlDelay}s
                                </span>
                            )}
                        </div>

                        {!robotsTxt ? (
                            <div className="text-[11px] text-[#666] text-center py-8 bg-[#141414] rounded border border-[#222]">
                                No robots.txt detected yet.
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 bg-[#0a0a0a] border border-[#222] rounded p-3 font-mono text-[10px] text-[#888] overflow-y-auto custom-scrollbar shadow-inner min-h-[300px]">
                                    {robotsTxt.raw.split('\n').map((line, i) => (
                                        <div key={i} className={line.toLowerCase().startsWith('disallow') ? 'text-red-400/80' : line.toLowerCase().startsWith('allow') ? 'text-green-400/80' : ''}>
                                            {line || ' '}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* SITEMAP TAB */}
                {activeAuditTab === 'sitemap' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <h4 className="text-[11px] font-bold text-[#888] uppercase tracking-widest flex items-center gap-1.5">
                            <MapIcon size={12} /> Sitemap Coverage
                        </h4>

                        {!sitemapData ? (
                            <div className="text-[11px] text-[#666] text-center py-8 bg-[#141414] rounded border border-[#222]">
                                {crawlingMode === 'sitemap' ? 'Scanning sitemap...' : 'No sitemap discovered yet.'}
                            </div>
                        ) : sitemapData.coverageParsed === false ? (
                            <div className="space-y-4">
                                <div className="text-[11px] text-[#888] text-center py-5 bg-[#141414] rounded border border-[#222]">
                                    Sitemap source detected. URL coverage has not been parsed for this crawl yet.
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-[#141414] p-3 rounded border border-[#222]">
                                        <div className="text-[10px] text-[#888] mb-1">Known Sources</div>
                                        <div className="text-[16px] font-mono text-white">{sitemapData.sources.length}</div>
                                    </div>
                                    <div className="bg-[#141414] p-3 rounded border border-[#222]">
                                        <div className="text-[10px] text-[#888] mb-1">Matched in Crawl</div>
                                        <div className="text-[16px] font-mono text-white">{sitemapCrawledCount}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[10px] text-[#555] uppercase tracking-widest font-bold">Sitemap Sources</div>
                                    {sitemapData.sources.map((s, i) => (
                                        <div key={i} className="text-[10px] text-[#888] truncate bg-[#0a0a0a] p-2 rounded border border-[#222] font-mono">
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-[#141414] p-3 rounded border border-[#222]">
                                        <div className="text-[10px] text-[#888] mb-1">Total in Sitemap</div>
                                        <div className="text-[16px] font-mono text-white">{sitemapData.totalUrls}</div>
                                    </div>
                                    <div className="bg-[#141414] p-3 rounded border border-[#222]">
                                        <div className="text-[10px] text-[#888] mb-1">Crawled So Far</div>
                                        <div className="text-[16px] font-mono text-white">{sitemapCrawledCount}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[10px] text-[#555] uppercase tracking-widest font-bold">Coverage Status</div>
                                    {[
                                        { label: 'In Sitemap & Crawled', count: sitemapCrawledCount, color: 'bg-green-500' },
                                        { label: 'In Sitemap but Missing', count: Math.max(0, sitemapData.totalUrls - sitemapCrawledCount), color: 'bg-red-500' },
                                        { label: 'Crawled but Not in Sitemap', count: pages.filter(p => !p.inSitemap && !p.isImage && !p.isCss && !p.isJs).length, color: 'bg-orange-400' }
                                    ].map(stat => (
                                        <div key={stat.label} className="flex items-center gap-3 text-[11px]">
                                            <div className={`w-1.5 h-1.5 rounded-full ${stat.color} shrink-0`}></div>
                                            <div className="flex-1 text-[#aaa]">{stat.label}</div>
                                            <div className="font-mono text-white">{stat.count}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[10px] text-[#555] uppercase tracking-widest font-bold">Sitemap Sources</div>
                                    {sitemapData.sources.map((s, i) => (
                                        <div key={i} className="text-[10px] text-[#888] truncate bg-[#0a0a0a] p-2 rounded border border-[#222] font-mono">
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}
