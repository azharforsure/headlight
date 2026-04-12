import React, { useState, useRef, useEffect } from 'react';
import { 
    Network, List,
    Settings, X,
    LogIn,
    Keyboard, Database, Sparkles, Bot,
    FolderOpen, Plus, ChevronDown, Check, ArrowRight,
    Pause, Play, Pencil, Trash2
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useOptionalProject } from '../../services/ProjectContext';
import { NotificationBell } from '../NotificationBell';
import { useNavigate } from 'react-router-dom';

// ─── Mini "New Project" form rendered inside the dropdown ───────────────────

const extractDomain = (url: string) => {
    try {
        const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
        return hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
};

interface NewProjectFormProps {
    onCreated: () => void;
    onCancel: () => void;
}

function NewProjectForm({ onCreated, onCancel }: NewProjectFormProps) {
    const projectCtx = useOptionalProject();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [industry, setIndustry] = useState('all');
    const [loading, setLoading] = useState(false);

    const handleUrlChange = (value: string) => {
        const domain = extractDomain(value);
        setUrl(value);
        if (!name || name === extractDomain(url)) setName(domain);
    };

    const handleCreate = async () => {
        if (!url.trim() || !projectCtx) return;
        setLoading(true);
        try {
            const newProject = await projectCtx.addProject(name || extractDomain(url), url, industry as any);
            if (newProject) {
                navigate(`/project/${newProject.id}/crawler?setup=true`);
                onCreated();
            }
        } catch (err) {
            console.error('Failed to create project:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 border-t border-[#222] space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#555] mb-1">New Project</div>

            <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Project name (optional)"
                className="w-full h-8 px-3 bg-[#0a0a0a] border border-[#222] rounded text-[12px] text-white placeholder-[#444] focus:outline-none focus:border-[#F5364E] transition-colors"
            />
            <input
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full h-8 px-3 bg-[#0a0a0a] border border-[#222] rounded text-[12px] text-white placeholder-[#444] focus:outline-none focus:border-[#F5364E] transition-colors"
            />
            <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full h-8 px-2 bg-[#0a0a0a] border border-[#222] rounded text-[12px] text-white focus:outline-none appearance-none cursor-pointer"
            >
                {INDUSTRY_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>

            <div className="flex gap-2 pt-0.5">
                <button
                    onClick={onCancel}
                    className="flex-1 h-7 text-[11px] font-medium text-[#666] hover:text-[#999] border border-[#222] rounded transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreate}
                    disabled={loading || !url.trim()}
                    className="flex-1 h-7 text-[11px] font-bold bg-white hover:bg-[#eee] disabled:opacity-30 disabled:cursor-not-allowed text-black rounded flex items-center justify-center gap-1 transition-all"
                >
                    {loading ? 'Creating…' : <><ArrowRight size={11} /> Create</>}
                </button>
            </div>
        </div>
    );
}

// ─── Project Selector Dropdown ───────────────────────────────────────────────

function ProjectSelector() {
    const projectCtx = useOptionalProject();
    const { isCrawling, crawlRuntime, clearCrawlerWorkspace } = useSeoCrawler();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', url: '' });
    const ref = useRef<HTMLDivElement>(null);

    const projects = projectCtx?.projects ?? [];
    const active = projectCtx?.activeProject ?? null;

    // Progress calculation
    const isActive = isCrawling || crawlRuntime.stage === 'crawling' || crawlRuntime.stage === 'connecting' || crawlRuntime.stage === 'paused';
    const isError = crawlRuntime.stage === 'error';
    const progress = Math.min(100, Math.max(0, (crawlRuntime.crawled / Math.max(1, crawlRuntime.discovered)) * 100));

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setShowNewForm(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleSwitch = (id: string) => {
        // Clear old project data/workspace before switching
        clearCrawlerWorkspace();
        projectCtx?.switchProject(id, { persist: false });
        navigate(`/project/${id}/crawler`);
        setOpen(false);
        setShowNewForm(false);
    };

    const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete project "${name}"? This will permanently remove all associated crawl data.`)) {
            projectCtx?.deleteProject(id);
            if (active?.id === id) {
                navigate('/crawler');
            }
        }
    };

    const handleEdit = (e: React.MouseEvent, p: any) => {
        e.stopPropagation();
        setEditingProjectId(p.id);
        setEditForm({ name: p.name, url: p.url || p.domain || '' });
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProjectId(null);
    };

    const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!editForm.name.trim() || !editForm.url.trim()) return;

        const domain = editForm.url.replace(/^https?:\/\//, '').split('/')[0];
        const url = editForm.url.startsWith('http') ? editForm.url : `https://${editForm.url}`;

        await projectCtx?.updateProject(id, { 
            name: editForm.name, 
            url,
            domain
        });
        setEditingProjectId(null);
    };

    return (
        <div ref={ref} className="relative flex-1 max-w-[340px]">
            {/* Trigger */}
            <button
                id="crawler-project-selector"
                onClick={() => { setOpen(o => !o); setShowNewForm(false); }}
                className={`w-full h-[32px] flex items-center gap-2 px-3 rounded-md text-[13px] transition-all duration-200
                    bg-gradient-to-b from-[#111] to-[#0a0a0a] border shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] relative overflow-hidden
                    ${open ? 'border-[#F5364E]/40 shadow-[0_0_10px_rgba(245,54,78,0.08)]' : 'border-white/10 hover:border-white/20'}`}
                style={isActive ? {
                    backgroundImage: `linear-gradient(to right, ${isError ? 'rgba(245, 54, 78, 0.2)' : 'rgba(34, 197, 94, 0.2)'} ${progress}%, transparent ${progress}%), linear-gradient(to bottom, #111, #0a0a0a)`
                } : {}}
            >
                <FolderOpen size={13} className="shrink-0 text-[#666] relative z-10" />
                <span className="flex-1 text-left truncate text-[#ccc] relative z-10">
                    {active ? active.name : <span className="text-[#555]">Select a project…</span>}
                </span>
                {active?.domain && (
                    <span className="text-[10px] text-[#555] truncate max-w-[100px] hidden sm:block relative z-10">{active.domain}</span>
                )}
                <ChevronDown
                    size={11}
                    className={`shrink-0 text-[#555] transition-transform duration-200 relative z-10 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute left-0 top-full mt-1 w-full min-w-[280px] max-w-[380px] bg-[#111] border border-[#2a2a2a] rounded-lg shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

                    {/* Project list */}
                    {projects.length > 0 ? (
                        <div className="max-h-[220px] overflow-y-auto">
                            {projects.map(p => (
                                <div key={p.id}>
                                    {editingProjectId === p.id ? (
                                        <div 
                                            className="px-3 py-2 space-y-2 bg-[#1a1a1a] border-y border-[#2a2a2a]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input 
                                                autoFocus
                                                value={editForm.name}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full bg-black border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#F5364E]/50"
                                                placeholder="Project Name"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    value={editForm.url}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                                                    className="flex-1 bg-black border border-white/10 rounded px-2 py-1 text-[11px] text-[#888] focus:outline-none focus:border-[#F5364E]/50"
                                                    placeholder="URL or Domain"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={(e) => handleSaveEdit(e, p.id)}
                                                        className="p-1 rounded hover:bg-green-500/20 text-green-500 transition-colors"
                                                    >
                                                        <Check size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={handleCancelEdit}
                                                        className="p-1 rounded hover:bg-white/10 text-[#666] hover:text-white transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => handleSwitch(p.id)}
                                            className={`group/item w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer
                                                ${p.id === active?.id
                                                    ? 'bg-[#1a1a1a] text-white'
                                                    : 'text-[#999] hover:bg-[#161616] hover:text-white'
                                                }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.id === active?.id ? 'bg-[#F5364E]' : 'bg-[#333]'}`} />
                                            <span className="flex-1 text-[12px] font-medium truncate">{p.name}</span>
                                            <span className="text-[10px] text-[#444] truncate max-w-[80px] hidden sm:block">{p.domain}</span>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => handleEdit(e, p)}
                                                    className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                                    title="Edit Project"
                                                >
                                                    <Pencil size={10} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, p.id, p.name)}
                                                    className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                                                    title="Delete Project"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>

                                            {p.id === active?.id && <Check size={10} className="shrink-0 text-[#F5364E]" />}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 py-4 text-center text-[11px] text-[#555]">
                            No projects yet
                        </div>
                    )}

                    {/* New Project toggle */}
                    {!showNewForm ? (
                        <div className="border-t border-[#1e1e1e]">
                            <button
                                onClick={() => setShowNewForm(true)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-[#F5364E] hover:bg-[#F5364E]/5 transition-colors"
                            >
                                <Plus size={12} />
                                New Project
                            </button>
                        </div>
                    ) : (
                        <NewProjectForm
                            onCreated={() => { setOpen(false); setShowNewForm(false); }}
                            onCancel={() => setShowNewForm(false)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Header ─────────────────────────────────────────────────────────────

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
        runAIAnalysis, isAnalyzingAI, aiProgress,
        analysisRuntime, runCompleteAnalysis,
        setShowComparisonView, setShowExportDialog,
        setShowAiChat
    } = useSeoCrawler();

    const [showShortcuts, setShowShortcuts] = useState(false);
    const isPausedSession = !isCrawling && crawlRuntime.stage === 'paused' && pages.length > 0;
    const isActiveSession = isCrawling || crawlRuntime.stage === 'crawling' || crawlRuntime.stage === 'connecting';
    const crawlButtonLabel = isActiveSession ? 'Pause Scan' : isPausedSession ? 'Resume Scan' : 'Start Scan';

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
            </div>

            {/* Project Selector (replaces scan input) */}
            <div className="flex items-center gap-2 flex-1 max-w-[600px] ml-6">
                <ProjectSelector />

                <button 
                    onClick={() => handleStartPause()}
                    className={`h-[28px] px-3 rounded-md text-[11px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 min-w-[100px] shadow-sm ${
                        isActiveSession
                        ? 'bg-[#1a0508] text-[#F5364E] border border-[#F5364E]/30 hover:bg-[#2a080d] hover:border-[#F5364E]/50' 
                        : isPausedSession
                        ? 'bg-[#1c1403] text-amber-400 border border-amber-500/30 hover:bg-[#261a04] hover:border-amber-400/50'
                        : 'bg-gradient-to-t from-[#d62839] to-[#F5364E] text-white hover:to-[#ff455d] border border-transparent shadow-[0_2px_10px_rgba(245,54,78,0.2)]'
                    }`}
                >
                    {isActiveSession ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                    {crawlButtonLabel}
                </button>
            </div>

            <div className="flex items-center gap-2 ml-4">
                <button 
                    onClick={clearCrawlerWorkspace}
                    disabled={pages.length === 0 || isCrawling}
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-transparent hover:bg-[#222] border border-[#333] rounded text-[10px] font-medium text-[#ccc] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isCrawling ? 'Pause the crawl before clearing' : 'Clear current crawler workspace'}
                >
                    <X size={11} /> Clear
                </button>

                <div className="hidden xl:flex items-center gap-1.5 ml-4">
                    {pages.length > 0 && !isCrawling && (
                        <div className="flex items-center gap-1.5">
                            {/* Unified Analysis Button */}
                            <button 
                                onClick={() => runCompleteAnalysis()}
                                disabled={analysisRuntime.isAnalyzing || isCrawling}
                                className={`group relative flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold shadow-lg transition-all duration-300 overflow-hidden ${
                                    analysisRuntime.isAnalyzing 
                                    ? 'bg-[#1a1a1a] text-gray-400 border border-[#333] cursor-wait min-w-[140px]'
                                    : 'bg-gradient-to-t from-[#4f46e5] to-[#6366f1] text-white hover:to-[#818cf8] shadow-[0_2px_8px_rgba(79,70,229,0.3)] min-w-[110px]'
                                }`}
                                title="Run full analysis pipeline: AI analysis + GSC/GA4 Strategic Audit + Automatic Enrichment"
                            >
                                {/* Progress Background Glow */}
                                {analysisRuntime.isAnalyzing && (
                                    <div 
                                        className="absolute inset-0 bg-white/5 transition-all duration-500 ease-out z-0"
                                        style={{ width: `${analysisRuntime.progress}%` }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-2 w-full justify-center">
                                    {analysisRuntime.isAnalyzing ? (
                                        <div className="flex items-center gap-2">
                                            {/* Circular Progress SVG */}
                                            <svg className="w-3.5 h-3.5 -rotate-90 animate-in fade-in duration-500" viewBox="0 0 24 24">
                                                <circle 
                                                    className="text-white/10" 
                                                    strokeWidth="3.5" 
                                                    stroke="currentColor" 
                                                    fill="transparent" 
                                                    r="10" 
                                                    cx="12" 
                                                    cy="12" 
                                                />
                                                <circle 
                                                    className="text-white transition-all duration-700 ease-in-out" 
                                                    strokeWidth="3.5" 
                                                    strokeDasharray={2 * Math.PI * 10}
                                                    strokeDashoffset={2 * Math.PI * 10 * (1 - analysisRuntime.progress / 100)}
                                                    strokeLinecap="round" 
                                                    stroke="currentColor" 
                                                    fill="transparent" 
                                                    r="10" 
                                                    cx="12" 
                                                    cy="12" 
                                                />
                                            </svg>
                                            <span className="truncate">{analysisRuntime.label}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Sparkles size={11} className={analysisRuntime.stage === 'completed' ? 'text-green-400' : 'text-white'} fill="currentColor" /> 
                                            <span>{analysisRuntime.stage === 'completed' ? 'Audit Complete' : 'Run Analysis'}</span>
                                        </>
                                    )}
                                </div>
                            </button>

                            <button
                                onClick={() => setShowAiChat(true)}
                                className="ai-tab flex items-center gap-1.5 px-2.5 py-1 bg-[#111827] hover:bg-[#172033] border border-[#2c3344] text-[#c6d3ff] rounded text-[10px] font-bold transition-all shadow-sm"
                                title="Open AI chat assistant for crawl questions and actions"
                            >
                                <Bot size={11} /> AI Chat
                            </button>
                        </div>
                    )}
                </div>

                {/* Utilities Group (Bell, Shortcuts, Settings) */}
                <div className="flex items-center gap-1 ml-2 border-l border-[#333] pl-3">
                    <NotificationBell />

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
                </div>

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
        </header>
    );
}
