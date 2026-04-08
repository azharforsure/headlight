import React, { useMemo, useState } from 'react';
import { 
    ChevronRight, CheckCircle2, AlertTriangle, ArrowRight,
    Search, PanelRightOpen, Clock, Trash2, GitCompare, ExternalLink,
    RefreshCw, BarChart3, FileText, Map as MapIcon, Globe
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { SEO_ISSUES_TAXONOMY } from './constants';

export default function AuditSidebar() {
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
        robotsTxt, sitemapData
    } = useSeoCrawler();

    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const sitemapCrawledCount = useMemo(
        () => pages.filter((p) => p.inSitemap).length,
        [pages]
    );

    const issueGroups = useMemo(() => {
        return SEO_ISSUES_TAXONOMY.map((group) => {
            const issues = group.issues
                .map((issue) => ({
                    ...issue,
                    count: pages.filter(issue.condition).length
                }))
                .filter((issue) => issue.count > 0);

            return { ...group, issues };
        }).filter((group) => group.issues.length > 0);
    }, [pages]);

    const totalIssueCount = useMemo(() => {
        return issueGroups.reduce((sum, group) => {
            return sum + group.issues.reduce((groupSum, issue) => groupSum + issue.count, 0);
        }, 0);
    }, [issueGroups]);

    if (!showAuditSidebar) {
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
        <aside style={{ width: auditSidebarWidth }} className="bg-[#111] flex flex-col shrink-0 border-l border-[#222] z-10 shadow-[-4px_0_15px_rgba(0,0,0,0.2)] relative">
            {/* Resize Handle Area */}
            <div 
                onMouseDown={() => setIsDraggingSidebar(true)}
                className="absolute top-0 bottom-0 left-0 w-1.5 -ml-0.5 cursor-ew-resize z-50 transition-colors hover:bg-[#F5364E]"
            ></div>

            {/* Header & Tabs */}
            <div className="flex flex-col shrink-0 bg-[#141414] border-b border-[#222]">
                <div className="h-[40px] px-4 flex items-center justify-between">
                    <h3 className="text-[12px] font-semibold text-[#ccc] uppercase tracking-wider flex items-center gap-2">
                        Audit
                    </h3>
                    <button onClick={() => setShowAuditSidebar(false)} className="text-[#666] hover:text-white p-1 rounded hover:bg-[#222] transition-colors"><ChevronRight size={14}/></button>
                </div>
                <div className="flex px-2 pb-0 overflow-x-auto custom-scrollbar-hidden">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'issues', label: 'Issues', count: totalIssueCount },
                        { id: 'opportunities', label: 'Opportunities', count: strategicOpportunities.length },
                        { id: 'robots', label: 'Robots' },
                        { id: 'sitemap', label: 'Sitemap' },
                        { id: 'history', label: 'History', count: crawlHistory?.length || 0 },
                        { id: 'logs', label: 'Logs', count: logs?.length || 0 }
                    ].map(tab => (
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
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111] p-4">
                {/* OVERVIEW TAB */}
                {activeAuditTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Health Score */}
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#222] rounded-lg p-4 relative overflow-hidden group/health w-full shadow-inner">
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors duration-1000 ${
                                healthScore.grade === 'A' ? 'bg-green-500/10' : 
                                healthScore.grade === 'B' ? 'bg-blue-500/10' : 
                                healthScore.grade === 'F' ? 'bg-[#F5364E]/15' : 'bg-yellow-500/10'
                            }`}></div>
                            <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${healthScore.grade === 'A' ? 'green' : healthScore.grade === 'B' ? 'blue' : healthScore.grade === 'F' ? 'red' : 'yellow'}-500/50 to-transparent`}></div>
                            {/* Live crawl progress */}
                            {isCrawling && (
                                <div className="mb-3 pb-3 border-b border-[#222]">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] text-[#888] uppercase tracking-widest font-bold flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Crawling Live
                                        </span>
                                        <span className="text-[10px] font-mono text-[#666]">{elapsedTime}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-[#ccc]">
                                        <span className="font-mono">{pages.length} URLs</span>
                                        <span className="text-[#444]">|</span>
                                        <span className="font-mono text-[#F5364E]">{crawlRate} p/s</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="flex-1">
                                    <h4 className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1">Site Health</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white">{pages.length === 0 ? '--' : healthScore.score}</span>
                                        <span className={`text-lg font-black ${healthScore.grade === 'A' ? 'text-green-400' : healthScore.grade === 'B' ? 'text-blue-400' : healthScore.grade === 'C' ? 'text-yellow-400' : healthScore.grade === 'D' ? 'text-orange-400' : healthScore.grade === 'F' ? 'text-red-400' : 'text-[#555]'}`}>{healthScore.grade}</span>
                                        <span className="text-[#666] text-[12px]">/ 100</span>
                                    </div>
                                </div>
                                <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="32" cy="32" r="28" stroke="#222" strokeWidth="6" fill="none" />
                                        <circle cx="32" cy="32" r="28" stroke={healthScore.grade === 'A' ? '#4ade80' : healthScore.grade === 'B' ? '#60a5fa' : healthScore.grade === 'C' ? '#fbbf24' : '#F5364E'} strokeWidth="6" fill="none" strokeDasharray="175.9" strokeDashoffset={pages.length === 0 ? 175.9 : 175.9 * (1 - healthScore.score / 100)} className="transition-all duration-1000 ease-out" />
                                    </svg>
                                </div>
                            </div>
                        </div>



                        {/* Crawl Summary */}
                        <div>
                            <h4 className="text-[11px] font-bold text-[#555] mb-3 uppercase tracking-widest border-b border-[#222] pb-1">Crawl Summary</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#141414] p-3 rounded border border-[#222]">
                                    <div className="text-[10px] text-[#888] mb-1">Total URLs</div>
                                    <div className="text-[16px] font-mono text-white">{stats?.total || 0}</div>
                                </div>
                                <div className="bg-[#141414] p-3 rounded border border-[#222]">
                                    <div className="text-[10px] text-[#888] mb-1">HTML Pages</div>
                                    <div className="text-[16px] font-mono text-white">{stats?.html || 0}</div>
                                </div>
                                <div className="bg-[#141414] p-3 rounded border border-[#222]">
                                    <div className="text-[10px] text-[#888] mb-1">Images</div>
                                    <div className="text-[16px] font-mono text-white">{stats?.img || 0}</div>
                                </div>
                                <div className="bg-[#141414] p-3 rounded border border-[#222]">
                                    <div className="text-[10px] text-[#888] mb-1">Avg Load Time</div>
                                    <div className="text-[16px] font-mono text-white">{pages.length > 0 ? Math.round(pages.reduce((acc: any, p: any) => acc + (p.loadTime || 0), 0) / pages.length) : 0}ms</div>
                                </div>
                            </div>
                        </div>



                        {/* Fix These First */}
                        <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                            <h4 className="text-[11px] font-bold text-[#F5364E] mb-3 uppercase tracking-widest flex items-center gap-1.5">Fix These First</h4>
                            {pages.length === 0 ? (
                                <div className="text-[11px] text-[#666] text-center py-4">Scan a website to see what needs fixing.</div>
                            ) : (
                                <div className="space-y-3">
                                    {(() => {
                                        if (auditInsights.length === 0) return <div className="text-[11px] text-green-400 flex items-center gap-2 pb-2"><CheckCircle2 size={12}/> Looking good! No big issues found.</div>;

                                        return auditInsights.slice(0, 5).map((r: any) => (
                                            <div 
                                                key={r.id} 
                                                onClick={() => setActiveMacro(r.id)}
                                                className="flex items-start gap-3 p-2.5 rounded-md bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] cursor-pointer transition-colors group/fix"
                                            >
                                                <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                                                    r.impact === 'High' ? 'text-red-400 bg-red-400/10 border-red-500/20' : 'text-blue-400 bg-blue-400/10 border-blue-500/20'
                                                }`}>{r.impact}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[12px] text-[#eee] font-medium leading-tight group-hover/fix:text-white transition-colors">{r.label}</div>
                                                    <div className="text-[10px] text-[#666] mt-0.5 leading-snug">{r.summary}</div>
                                                </div>
                                                <div className="text-[#444] group-hover/fix:text-white transition-colors self-center">
                                                    <ArrowRight size={14}/>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Status Distribution */}
                        <div>
                            <h4 className="text-[11px] font-bold text-[#555] mb-3 uppercase tracking-widest border-b border-[#222] pb-1">Status Codes</h4>
                            <div className="space-y-2">
                                {[
                                    { label: '2xx Success', count: pages.filter((p: any) => p.statusCode >= 200 && p.statusCode < 300).length, color: 'bg-green-500' },
                                    { label: '3xx Redirect', count: stats?.redirects || 0, color: 'bg-orange-400' },
                                    { label: '4xx Error', count: stats?.broken || 0, color: 'bg-red-500' },
                                    { label: '5xx Server Error', count: pages.filter((p: any) => p.statusCode >= 500).length, color: 'bg-red-700' }
                                ].map(stat => (
                                    <div key={stat.label} className="flex items-center gap-3 text-[12px]">
                                        <div className={`w-2 h-2 rounded-full ${stat.color} shrink-0`}></div>
                                        <div className="flex-1 text-[#aaa]">{stat.label}</div>
                                        <div className="font-mono text-white">{stat.count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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
