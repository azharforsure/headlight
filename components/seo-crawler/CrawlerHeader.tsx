import React, { useState } from 'react';
import { 
    Network, List, Upload, Play, Pause, Settings, X,
    Save, LogIn, 
    Keyboard, Database, Sparkles
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import AuditModeSelector from './AuditModeSelector';
import { AUDIT_MODES, INDUSTRY_FILTERS } from '../../services/AuditModeConfig';

export default function CrawlerHeader() {
    const {
        crawlingMode, setCrawlingMode,
        urlInput, setUrlInput,
        listUrls, showListModal, setShowListModal,
        isCrawling, handleStartPause,
        pages,
        setAutoFixItems, setShowAutoFixModal,
        showSettings, setShowSettings,
        saveCrawlSession, currentSessionId, crawlHistory,
        isAuthenticated, user, profile, trialPagesLimit,
        showScheduleModal, setShowScheduleModal,
        crawlRuntime, elapsedTime, crawlRate,
        clearCrawlerWorkspace,
        integrationConnections,
        integrationsSource,
        runFullEnrichment,
        runIncrementalEnrichment,
        auditFilter, applyAuditMode, saveCustomPreset,
        runAIAnalysis, isAnalyzingAI, aiProgress
    } = useSeoCrawler();

    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showModeSelector, setShowModeSelector] = useState(false);
    const isPausedSession = !isCrawling && crawlRuntime.stage === 'paused' && pages.length > 0;
    const isActiveSession = isCrawling || crawlRuntime.stage === 'crawling' || crawlRuntime.stage === 'connecting';
    const crawlButtonLabel = isActiveSession ? 'Pause Scan' : isPausedSession ? 'Resume Scan' : 'Start Scan';
    const connectedIntegrations = Object.values(integrationConnections).filter(Boolean);
    const showNoIntegrationsState = integrationsSource === 'project' && connectedIntegrations.length === 0;
    const currentModeLabel = auditFilter.modes.includes('full')
        ? 'Full Audit'
        : auditFilter.modes
            .map((modeId) => AUDIT_MODES.find((mode) => mode.id === modeId)?.label || modeId)
            .join(' + ');
    const currentIndustryLabel = INDUSTRY_FILTERS.find((industry) => industry.id === auditFilter.industry)?.label || 'All Industries';

    return (
        <header className="h-[52px] border-b border-[#222] bg-[#141414] flex items-center px-4 justify-between shrink-0 relative z-40">
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 relative">
                    {isCrawling && (
                        <div className="absolute -inset-2 bg-[#F5364E]/20 rounded-full blur-md animate-pulse z-0 hidden md:block" />
                    )}
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 relative z-10 transition-colors duration-500 ${isCrawling ? 'text-[#F5364E] drop-shadow-[0_0_12px_rgba(245,54,78,0.8)]' : 'text-white drop-shadow-[0_0_8px_rgba(245,54,78,0.3)]'}`}>
                        <circle cx="9" cy="16" r="5" fill="currentColor" />
                        <path d="M17 11H27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M17 16H31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M17 21H27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span className="font-bold text-white text-[15px] tracking-tight relative z-10">Headlight <span className="text-gray-500 font-medium transition-colors">Scanner</span></span>
                </div>

                <div className="h-4 border-l border-[#333] hidden md:block"></div>

                {/* Mode Selector */}
                <div className="hidden md:flex p-0.5 bg-[#0a0a0a] rounded border border-[#222]">
                    {[
                        { id: 'spider', icon: Network, label: 'Spider' },
                        { id: 'list', icon: List, label: 'List' },
                    ].map(m => (
                        <button 
                            key={m.id}
                            onClick={() => setCrawlingMode(m.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium rounded-sm transition-colors ${crawlingMode === m.id ? 'bg-[#222] text-white shadow-sm' : 'text-[#888] hover:text-[#bbb]'}`}
                        >
                            <m.icon size={12}/> {m.label}
                        </button>
                    ))}
                </div>

                <div className="hidden xl:flex items-center gap-2">
                    <button
                        onClick={() => setShowModeSelector(true)}
                        className="px-2.5 py-1 bg-[#0f0f0f] border border-[#222] rounded text-[11px] text-[#ccc] hover:border-[#333] hover:text-white transition-colors"
                    >
                        Mode: {currentModeLabel}
                        <span className="text-[#555] ml-1">▾</span>
                    </button>
                    <button
                        onClick={() => setShowModeSelector(true)}
                        className="px-2.5 py-1 bg-[#0f0f0f] border border-[#222] rounded text-[11px] text-[#ccc] hover:border-[#333] hover:text-white transition-colors"
                    >
                        Industry: {currentIndustryLabel}
                        <span className="text-[#555] ml-1">▾</span>
                    </button>
                </div>


            </div>

            {/* Main Input Control */}
            <div className="flex items-center gap-2 flex-1 max-w-[600px] ml-6">
                {crawlingMode === 'list' ? (
                    <button 
                        onClick={() => setShowListModal(true)}
                        className={`flex-1 bg-gradient-to-b from-[#111] to-[#0a0a0a] border hover:border-[#F5364E] rounded-md px-3 py-1.5 text-[13px] text-[#888] flex items-center justify-between transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] ${isCrawling ? 'border-[#F5364E]/50 shadow-[0_0_10px_rgba(245,54,78,0.1)]' : 'border-white/10'}`}
                    >
                        <span className="truncate pr-4">{listUrls ? `${listUrls.split('\n').filter((u: string)=>u).length} URLs ready` : 'Paste list of URLs...'}</span>
                        <Upload size={14} className="shrink-0" />
                    </button>
                ) : (
                    <div className={`flex-1 relative flex items-center rounded-md transition-all duration-300 bg-gradient-to-b from-[#111] to-[#0a0a0a] border ${isCrawling ? 'border-[#F5364E]/50 shadow-[0_0_15px_rgba(245,54,78,0.15)]' : 'border-white/10 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]'}`}>
                        {isCrawling && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F5364E] animate-ping z-20" />
                        )}
                        <input 
                            type="text"
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            placeholder={isCrawling ? "Scanning architecture..." : "Enter URL to scan (e.g., https://example.com/)"}
                            className={`relative z-10 w-full bg-transparent rounded-md pl-3 pr-8 py-1.5 text-[13px] text-[#e0e0e0] placeholder-[#666] focus:outline-none transition-colors ${isCrawling ? 'opacity-80' : ''}`}
                            onKeyDown={e => e.key === 'Enter' && handleStartPause()}
                            readOnly={isCrawling}
                        />
                    </div>
                )}

                <button 
                    onClick={() => handleStartPause()}
                    className={`h-[32px] px-4 rounded-md text-[12px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 min-w-[110px] shadow-sm ${
                        isActiveSession
                        ? 'bg-[#1a0508] text-[#F5364E] border border-[#F5364E]/30 hover:bg-[#2a080d] hover:border-[#F5364E]/50' 
                        : isPausedSession
                        ? 'bg-[#1c1403] text-amber-400 border border-amber-500/30 hover:bg-[#261a04] hover:border-amber-400/50'
                        : 'bg-gradient-to-t from-[#d62839] to-[#F5364E] text-white hover:to-[#ff455d] border border-transparent shadow-[0_2px_10px_rgba(245,54,78,0.2)]'
                    }`}
                >
                    {isActiveSession ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    {crawlButtonLabel}
                </button>
            </div>

            <div className="flex items-center gap-2 ml-4">
                {/* Save session button */}
                <button 
                    onClick={() => saveCrawlSession('completed')}
                    disabled={pages.length === 0}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent hover:bg-[#222] border border-[#333] rounded text-[11px] font-medium text-[#ccc] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Save current session (Ctrl+S)"
                >
                    <Save size={12} /> Save
                </button>

                <button 
                    onClick={clearCrawlerWorkspace}
                    disabled={pages.length === 0 || isCrawling}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-transparent hover:bg-[#222] border border-[#333] rounded text-[11px] font-medium text-[#ccc] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isCrawling ? 'Pause the crawl before clearing' : 'Clear current crawler workspace'}
                >
                    <X size={12} /> Clear
                </button>


                <div className="w-[1px] h-4 bg-[#333]"></div>

                <div className="hidden xl:flex items-center gap-1.5">
                    {showNoIntegrationsState && (
                        <span className="px-2 py-1 rounded border border-[#222] text-[10px] text-[#666]">No integrations</span>
                    )}
                    {pages.length > 0 && !isCrawling && (
                        <div className="flex items-center gap-1.5">
                             <button 
                                onClick={() => runAIAnalysis()}
                                disabled={isAnalyzingAI}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold shadow-lg transition-all ${
                                    isAnalyzingAI 
                                    ? 'bg-[#1a1a1a] text-gray-500 border border-[#333] cursor-not-allowed'
                                    : 'bg-gradient-to-t from-[#4f46e5] to-[#6366f1] text-white hover:to-[#818cf8] shadow-[0_2px_8px_rgba(79,70,229,0.3)]'
                                }`}
                                title="Run Tier 3 AI checks (Summaries, Intent, Quality, EEAT, Keywords)"
                            >
                                {isAnalyzingAI ? (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {aiProgress ? `Analyzing ${aiProgress.done}/${aiProgress.total}...` : 'Analyzing...'}
                                    </div>
                                ) : (
                                    <>
                                        <Sparkles size={12} fill="currentColor" /> Run AI Analysis
                                    </>
                                )}
                            </button>

                            {integrationConnections.google?.status === 'connected' && (
                                <>
                                    <button 
                                        onClick={() => runFullEnrichment()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-t from-[#059669] to-[#10b981] text-white rounded text-[11px] font-bold shadow-[0_2px_8px_rgba(16,185,129,0.3)] hover:to-[#34d399] transition-all"
                                        title="Run GSC, GA4, and Strategic Intelligence pipeline (Opportunity, Authority, Priority) based on current signals"
                                    >
                                        <Sparkles size={12} fill="currentColor" /> Run Strategic Audit
                                    </button>
                                    <button 
                                        onClick={() => runIncrementalEnrichment()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-[#ccc] rounded text-[11px] font-medium transition-all"
                                        title="Continue enrichment for large sites (processes next batch of stale/never-enriched pages)"
                                    >
                                        <Database size={11} /> Continue Audit
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Keyboard shortcuts help */}
                <div className="relative">
                    <button 
                        onClick={() => setShowShortcuts(!showShortcuts)} 
                        className="p-1.5 rounded text-[#666] hover:bg-[#222] hover:text-white transition-colors"
                        title="Keyboard Shortcuts"
                    >
                        <Keyboard size={13}/>
                    </button>
                    {showShortcuts && (
                        <div className="absolute right-0 top-full mt-1 w-[260px] bg-[#111] border border-[#333] rounded-lg shadow-2xl z-[100] p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                            <h4 className="text-[11px] font-bold text-[#888] uppercase tracking-wider mb-3">Keyboard Shortcuts</h4>
                            <div className="space-y-2">
                                {[
                                    { keys: '⌘ + Enter', desc: 'Start / Pause crawl' },
                                    { keys: '⌘ + F', desc: 'Search URLs' },
                                    { keys: '⌘ + E', desc: 'Export to CSV' },
                                    { keys: 'Escape', desc: 'Close / Clear' },
                                ].map(s => (
                                    <div key={s.keys} className="flex items-center justify-between text-[11px]">
                                        <span className="text-[#888]">{s.desc}</span>
                                        <kbd className="px-1.5 py-0.5 bg-[#222] border border-[#333] rounded text-[10px] text-[#ccc] font-mono">{s.keys}</kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded transition-colors ${showSettings ? 'bg-[#333] text-white' : 'text-[#888] hover:bg-[#222] hover:text-white'}`} title="Configuration">
                    <Settings size={14}/>
                </button>


                {/* Auth indicator */}
                {isAuthenticated ? (
                    <div className="flex items-center gap-2 px-2 py-1 bg-[#1a1a1a] border border-[#222] rounded ml-1" title={user?.email || ''}>
                        <div className="w-5 h-5 rounded-full bg-[#F5364E]/20 flex items-center justify-center text-[9px] font-bold text-[#F5364E]">
                            {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-[10px] text-[#888] max-w-[80px] truncate hidden xl:block">{profile?.full_name || user?.email?.split('@')[0]}</span>
                    </div>
                ) : (
                    <button 
                        onClick={() => window.location.assign('/auth')}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5364E]/10 hover:bg-[#F5364E]/20 border border-[#F5364E]/30 rounded text-[11px] font-bold text-[#F5364E] transition-colors ml-1"
                        title="Sign in for unlimited scans and saved history"
                    >
                        <LogIn size={11}/> Sign in
                    </button>
                )}
            </div>

            <AuditModeSelector
                isOpen={showModeSelector}
                onClose={() => setShowModeSelector(false)}
                currentModes={auditFilter.modes}
                currentIndustry={auditFilter.industry}
                onApply={applyAuditMode}
                onSavePreset={saveCustomPreset}
            />
        </header>
    );
}
