import React, { useEffect, useMemo, useState } from 'react';
import { 
    XCircle, Settings, Globe, Code, AlertTriangle, Wand2, Network, Server, 
    FastForward, Palette, CheckCircle2, Database, LinkIcon, Calendar, Clock,
    Play, Repeat, Bell, Shield, Upload, Sparkles
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { IntegrationsTab } from './IntegrationsTab';

export default function CrawlerModals() {
    const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    const bingClientId = (import.meta as any).env?.VITE_BING_CLIENT_ID;
    const configuredCrawlerApiUrl = (import.meta as any).env?.VITE_CRAWLER_API_URL;
    const crawlerApiUrl = configuredCrawlerApiUrl || (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : 'http://localhost:3001');
    const hasGoogleOAuthConfig = Boolean(
        googleClientId &&
        googleClientId !== 'placeholder-client-id' &&
        String(googleClientId).includes('.apps.googleusercontent.com')
    );
    const hasBingOAuthConfig = Boolean(bingClientId);
    const {
        showListModal, setShowListModal,
        listUrls, setListUrls,
        showSettings, setShowSettings,
        settingsTab, setSettingsTab,
        config, setConfig,
        theme, setTheme,
        integrationConnections, saveIntegrationConnection, removeIntegrationConnection,
        showAutoFixModal, setShowAutoFixModal,
        autoFixItems, setAutoFixItems,
        isFixing, setIsFixing,
        autoFixProgress, setAutoFixProgress,
        setCrawlingMode, crawlDb, pages,
        showScheduleModal, setShowScheduleModal,
        addLog
    } = useSeoCrawler();

    const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
    const [scheduleDay, setScheduleDay] = useState('monday');
    const [scheduleTime, setScheduleTime] = useState('09:00');
    const [scheduleNotify, setScheduleNotify] = useState(true);



    return (
        <>
            {showListModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowListModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-[#111] border border-[#333] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-[#222] flex justify-between items-center bg-[#181818]">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Import URL List</h3>
                            <button onClick={() => setShowListModal(false)} className="text-gray-500 hover:text-white"><XCircle size={18}/></button>
                        </div>
                        <div className="p-5">
                            <p className="text-[12px] text-gray-500 mb-3">Paste one URL per line. We will scan each one individually.</p>
                            <textarea 
                                value={listUrls}
                                onChange={(e) => setListUrls(e.target.value)}
                                placeholder={"https://example.com/page-1\nhttps://example.com/page-2"}
                                className="w-full h-64 bg-[#0a0a0a] border border-[#222] rounded p-3 text-[13px] font-mono text-white focus:border-[#F5364E] focus:outline-none transition-colors custom-scrollbar"
                            />
                        </div>
                        <div className="px-5 py-4 border-t border-[#222] bg-[#181818] flex justify-end gap-3">
                            <button onClick={() => setShowListModal(false)} className="px-4 py-2 text-[12px] font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                            <button 
                                onClick={() => { setShowListModal(false); setCrawlingMode('list'); }}
                                className="px-6 py-2 bg-[#F5364E] text-white text-[12px] font-bold rounded hover:bg-[#e02d43] transition-colors"
                            >
                                Confirm List ({listUrls?.split('\n').filter((u: string) => u.trim()).length || 0} URLs)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
                    <div className="relative w-full max-w-4xl h-[600px] flex bg-[#111] border border-[#333] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-[220px] bg-[#141414] border-r border-[#222] flex flex-col">
                            <div className="h-[60px] flex items-center px-5 border-b border-[#222]">
                                <h3 className="text-[14px] font-bold text-white flex items-center gap-2"><Settings size={16} className="text-[#F5364E]"/> Configuration</h3>
                            </div>
                            <div className="p-3 space-y-1">
                                {[
                                    { id: 'general', label: 'General & Limits', icon: <Globe size={14}/> },
                                    { id: 'extraction', label: 'Rendering & Extract', icon: <Code size={14}/> },
                                    { id: 'rules', label: 'Rules & Exclusions', icon: <AlertTriangle size={14}/> },
                                    { id: 'ai', label: 'AI & NLP Analysis', icon: <Wand2 size={14}/> },
                                    { id: 'integrations', label: 'API Integrations', icon: <Network size={14}/> },
                                    { id: 'auth', label: 'Auth & Headers', icon: <Server size={14}/> },
                                    { id: 'proxies', label: 'Proxies', icon: <Globe size={14}/> },
                                    { id: 'scheduling', label: 'Scheduling', icon: <FastForward size={14}/> },
                                    { id: 'display', label: 'Display & Theme', icon: <Palette size={14}/> }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSettingsTab(tab.id as any)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-[12px] font-medium transition-colors ${settingsTab === tab.id ? 'bg-[#F5364E]/10 text-[#F5364E]' : 'text-[#888] hover:bg-[#222] hover:text-[#ccc]'}`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                         <div className="flex-1 flex flex-col bg-[#0a0a0a]">
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                {settingsTab === 'general' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Crawl Limits</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Max URLs</label>
                                                    <input type="number" value={config?.limit || ''} onChange={e => setConfig({...config, limit: e.target.value})} placeholder="Unlimited" className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Max Depth</label>
                                                    <input type="number" value={config?.maxDepth || ''} onChange={e => setConfig({...config, maxDepth: e.target.value})} placeholder="Unlimited" className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Max Threads (Concurrency)</label>
                                                    <input type="number" value={config?.threads || 5} onChange={e => setConfig({...config, threads: parseInt(e.target.value)})} min="1" max="20" className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Crawl Speed</label>
                                                    <select value={config?.crawlSpeed || 'normal'} onChange={e => setConfig({...config, crawlSpeed: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none">
                                                        <option value="slow">Slow (Respectful)</option>
                                                        <option value="normal">Normal</option>
                                                        <option value="fast">Fast (Aggressive)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Execution Engine</h4>
                                            <div className="space-y-4">
                                                <label className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg cursor-pointer" onClick={() => setConfig({...config, useGhostEngine: !config?.useGhostEngine})}>
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg ${config?.useGhostEngine ? 'bg-[#F5364E]/10 text-[#F5364E]' : 'bg-[#222] text-[#666]'}`}>
                                                            <Sparkles size={16}/>
                                                        </div>
                                                        <div>
                                                            <div className="text-[12px] text-white font-medium mb-0.5">Ghost Engine (Local-Only)</div>
                                                            <div className="text-[10px] text-[#666] pr-8">Run crawl directly from your browser's IP. Enterprise-grade speed with zero server footprint. Best for bypassing rate limits.</div>
                                                        </div>
                                                    </div>
                                                    <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${config?.useGhostEngine ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
                                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.useGhostEngine ? 'right-1' : 'left-1'}`}></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Identity</h4>
                                            <div>
                                                <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">User Agent String</label>
                                                <input type="text" value={config?.userAgent || ''} onChange={e => setConfig({...config, userAgent: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono" />
                                                <p className="text-[10px] text-[#555] mt-1">Change this to emulate Googlebot, Bingbot, or mobile devices.</p>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {settingsTab === 'extraction' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Rendering Mode</h4>
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setConfig({...config, jsRendering: !config?.jsRendering})}>
                                                    <div className={`w-10 h-5 rounded-full transition-colors relative ${config?.jsRendering ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
                                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.jsRendering ? 'right-1' : 'left-1'}`}></div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] text-white font-medium">Enable JavaScript Rendering</div>
                                                        <div className="text-[10px] text-[#666]">Execute client-side JS (React/Vue/Angular) before parsing. Slower crawl speed.</div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setConfig({...config, fetchWebVitals: !config?.fetchWebVitals})}>
                                                    <div className={`w-10 h-5 rounded-full transition-colors relative ${config?.fetchWebVitals ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
                                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.fetchWebVitals ? 'right-1' : 'left-1'}`}></div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] text-white font-medium">Fetch Core Web Vitals (Lighthouse API)</div>
                                                        <div className="text-[10px] text-[#666]">Collect real-user LCP, CLS, INP metrics during crawl.</div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Custom Extraction</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Extract via CSS Selector</label>
                                                    <input type="text" value={config?.extractCss || ''} onChange={e => setConfig({...config, extractCss: e.target.value})} placeholder="e.g. .product-price, #author-name" className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Extract via Regex</label>
                                                    <input type="text" value={config?.extractRegex || ''} onChange={e => setConfig({...config, extractRegex: e.target.value})} placeholder="e.g. UA-[0-9]+-[0-9]+" className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'rules' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer group mb-4" onClick={() => setConfig({...config, respectRobots: !config?.respectRobots})}>
                                                <div className={`w-10 h-5 rounded-full transition-colors relative ${config?.respectRobots ? 'bg-green-600' : 'bg-[#333]'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.respectRobots ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                                <div>
                                                    <div className="text-[12px] text-white font-medium">Respect Robots.txt</div>
                                                    <div className="text-[10px] text-[#666]">Strictly adhere to disallow rules and crawl delays.</div>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer group mb-4" onClick={() => setConfig({...config, ignoreQueryParams: !config?.ignoreQueryParams})}>
                                                <div className={`w-10 h-5 rounded-full transition-colors relative ${config?.ignoreQueryParams ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.ignoreQueryParams ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                                <div>
                                                    <div className="text-[12px] text-white font-medium">Ignore Query Parameters</div>
                                                    <div className="text-[10px] text-[#666]">Strip ?session=123 from URLs to prevent duplicate crawling.</div>
                                                </div>
                                            </label>
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Path Rules</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Include Paths (Regex)</label>
                                                    <textarea value={config?.includeRules || ''} onChange={e => setConfig({...config, includeRules: e.target.value})} placeholder="^/blog/.*" className="w-full h-20 bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono custom-scrollbar" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Exclude Paths (Regex)</label>
                                                    <textarea value={config?.excludeRules || ''} onChange={e => setConfig({...config, excludeRules: e.target.value})} placeholder={"^/admin/.*\n.*\\.pdf$"} className="w-full h-20 bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono custom-scrollbar" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'ai' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4 mb-4">
                                            <div className="flex items-center gap-2 text-blue-400 mb-1"><Wand2 size={16}/> <strong>AI Features</strong></div>
                                            <p className="text-[11px] text-blue-200/70">Turn on AI analysis to automatically categorize your content, detect topics, and find similar pages across your site.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg cursor-pointer" onClick={() => setConfig({...config, generateEmbeddings: !config?.generateEmbeddings})}>
                                                <div>
                                                    <div className="text-[12px] text-white font-medium mb-0.5">Detect Topics & Similarities</div>
                                                    <div className="text-[10px] text-[#666]">Create vector representations for every page. Requires high CPU or external API.</div>
                                                </div>
                                                <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${config?.generateEmbeddings ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.generateEmbeddings ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                            </label>
                                            <label className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg cursor-pointer" onClick={() => setConfig({...config, aiCategorization: !config?.aiCategorization})}>
                                                <div>
                                                    <div className="text-[12px] text-white font-medium mb-0.5">Auto-Categorize Content</div>
                                                    <div className="text-[10px] text-[#666]">Automatically group pages into topic clusters.</div>
                                                </div>
                                                <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${config?.aiCategorization ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.aiCategorization ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                            </label>
                                            <label className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg cursor-pointer" onClick={() => setConfig({...config, aiSentiment: !config?.aiSentiment})}>
                                                <div>
                                                    <div className="text-[12px] text-white font-medium mb-0.5">Sentiment Analysis</div>
                                                    <div className="text-[10px] text-[#666]">Analyze the emotional tone and intent of page content.</div>
                                                </div>
                                                <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${config?.aiSentiment ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.aiSentiment ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'integrations' && (
                                    <IntegrationsTab />
                                )}
                                
                                {settingsTab === 'auth' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">HTTP Authentication</h4>
                                            <p className="text-[11px] text-[#666] mb-4">Set credentials if the site you're crawling requires Basic Auth or custom headers.</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Username</label>
                                                    <input type="text" value={config?.authUser || ''} onChange={e => setConfig({...config, authUser: e.target.value})} placeholder="admin" className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Password</label>
                                                    <input type="password" value={config?.authPass || ''} onChange={e => setConfig({...config, authPass: e.target.value})} placeholder="••••••" className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono" />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Custom Headers</h4>
                                            <textarea value={config?.customHeaders || ''} onChange={e => setConfig({...config, customHeaders: e.target.value})} placeholder={"Authorization: Bearer token123\nX-Custom-Header: value"} className="w-full h-24 bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono custom-scrollbar" />
                                            <p className="text-[10px] text-[#555] mt-1">One header per line in the format: Header-Name: value</p>
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Custom Cookies</h4>
                                            <textarea value={config?.customCookies || ''} onChange={e => setConfig({...config, customCookies: e.target.value})} placeholder={"session_id=abc123; path=/\nauth_token=xyz789; path=/"} className="w-full h-20 bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono custom-scrollbar" />
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'proxies' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Proxy Configuration</h4>
                                            <label className="flex items-center gap-3 cursor-pointer group mb-4" onClick={() => setConfig({...config, useProxy: !config?.useProxy})}>
                                                <div className={`w-10 h-5 rounded-full transition-colors relative ${config?.useProxy ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.useProxy ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                                <div>
                                                    <div className="text-[12px] text-white font-medium">Route Crawl Through Proxy</div>
                                                    <div className="text-[10px] text-[#666]">Useful for geo-targeted crawls or avoiding IP blocks.</div>
                                                </div>
                                            </label>
                                            {config?.useProxy && (
                                                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                                    <div>
                                                        <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Proxy Host</label>
                                                        <input type="text" value={config?.proxyUrl || ''} onChange={e => setConfig({...config, proxyUrl: e.target.value})} placeholder="proxy.example.com" className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Port</label>
                                                        <input type="text" value={config?.proxyPort || ''} onChange={e => setConfig({...config, proxyPort: e.target.value})} placeholder="8080" className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Username (optional)</label>
                                                        <input type="text" value={config?.proxyUser || ''} onChange={e => setConfig({...config, proxyUser: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Password (optional)</label>
                                                        <input type="password" value={config?.proxyPass || ''} onChange={e => setConfig({...config, proxyPass: e.target.value})} className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none font-mono" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'scheduling' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div className="bg-[#F5364E]/10 border border-[#F5364E]/20 rounded p-4 mb-4">
                                            <div className="flex items-center gap-2 text-[#F5364E] mb-1"><Calendar size={16}/> <strong>Automated Scheduling</strong></div>
                                            <p className="text-[11px] text-[#F5364E]/70">Set up recurring crawls to track SEO health over time. Requires sign-in for cloud-based scheduling.</p>
                                        </div>
                                        <label className="flex items-center gap-3 cursor-pointer group mb-4" onClick={() => setConfig({...config, scheduleEnabled: !config?.scheduleEnabled})}>
                                            <div className={`w-10 h-5 rounded-full transition-colors relative ${config?.scheduleEnabled ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config?.scheduleEnabled ? 'right-1' : 'left-1'}`}></div>
                                            </div>
                                            <div>
                                                <div className="text-[12px] text-white font-medium">Enable Scheduled Crawls</div>
                                                <div className="text-[10px] text-[#666]">Automatically re-crawl at your chosen frequency.</div>
                                            </div>
                                        </label>
                                        {config?.scheduleEnabled && (
                                            <div className="space-y-4 animate-in fade-in">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Frequency</label>
                                                        <select value={scheduleFrequency} onChange={e => setScheduleFrequency(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none">
                                                            <option value="daily">Daily</option>
                                                            <option value="weekly">Weekly</option>
                                                            <option value="biweekly">Every 2 Weeks</option>
                                                            <option value="monthly">Monthly</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Time</label>
                                                        <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none" />
                                                    </div>
                                                </div>
                                                {scheduleFrequency === 'weekly' && (
                                                    <div>
                                                        <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">Day of Week</label>
                                                        <select value={scheduleDay} onChange={e => setScheduleDay(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded p-2 text-[12px] text-white focus:border-[#F5364E] focus:outline-none">
                                                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => (
                                                                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setScheduleNotify(!scheduleNotify)}>
                                                    <div className={`w-10 h-5 rounded-full transition-colors relative ${scheduleNotify ? 'bg-green-600' : 'bg-[#333]'}`}>
                                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${scheduleNotify ? 'right-1' : 'left-1'}`}></div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] text-white font-medium">Email Notifications</div>
                                                        <div className="text-[10px] text-[#666]">Get notified when a scheduled crawl finishes or finds new issues.</div>
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {settingsTab === 'display' && (
                                    <div className="space-y-6 animate-in fade-in">
                                        <div>
                                            <h4 className="text-[12px] font-bold text-white mb-4 border-b border-[#222] pb-2">Appearance</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[11px] text-[#888] uppercase tracking-widest mb-1.5">User Interface Theme</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[
                                                            { id: 'dark', label: 'Dark Mode', desc: 'Sleek & Professional' },
                                                            { id: 'light', label: 'Light Mode', desc: 'Classic & Clear' },
                                                            { id: 'high-contrast', label: 'High Contrast', desc: 'Enhanced Visibility' },
                                                            { id: 'system', label: 'System Default', desc: 'Sync with OS' }
                                                        ].map(t => (
                                                            <button 
                                                                key={t.id}
                                                                onClick={() => setTheme(t.id as any)}
                                                                className={`flex flex-col text-left p-3 rounded-lg border transition-all ${theme === t.id ? 'bg-[#F5364E]/10 border-[#F5364E] ring-1 ring-[#F5364E]/50' : 'bg-[#111] border-[#333] hover:border-[#444]'}`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className={`text-[12px] font-bold ${theme === t.id ? 'text-[#F5364E]' : 'text-white'}`}>{t.label}</span>
                                                                    {theme === t.id && <CheckCircle2 size={12} className="text-[#F5364E]" />}
                                                                </div>
                                                                <span className="text-[10px] text-[#666]">{t.desc}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="h-[60px] border-t border-[#222] bg-[#141414] flex items-center justify-between px-6 shrink-0">
                                <button onClick={() => setConfig({...config, limit: ''})} className="text-[12px] text-[#666] hover:text-white transition-colors">Reset to Defaults</button>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-[12px] font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                                    <button onClick={() => setShowSettings(false)} className="px-6 py-2 bg-[#F5364E] text-white text-[12px] font-bold rounded hover:bg-[#e02d43] transition-colors flex items-center gap-2">
                                        <CheckCircle2 size={14}/> Save Configuration
                                    </button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            )}

            {showAutoFixModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isFixing && setShowAutoFixModal(false)}></div>
                    <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#111] border border-[#333] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-[#222] flex justify-between items-center bg-[#141414]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-[#F5364E]/10 flex items-center justify-center">
                                    <Wand2 size={16} className="text-[#F5364E]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Auto-Fix</h3>
                                    <p className="text-[11px] text-[#888]">Generating Missing Meta Descriptions</p>
                                </div>
                            </div>
                            {!isFixing && <button onClick={() => setShowAutoFixModal(false)} className="text-gray-500 hover:text-white"><XCircle size={20}/></button>}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a] custom-scrollbar space-y-4">
                            {autoFixItems?.length === 0 ? (
                                <div className="text-center py-12 text-[#666]">
                                    <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                                    <p>No missing meta descriptions found!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {autoFixItems?.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-[#111] border border-[#222] rounded-lg p-4 transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="text-[12px] text-blue-400 truncate mb-1">{item.url}</div>
                                                    <div className="text-[14px] font-bold text-[#e0e0e0] truncate">{item.title || 'Untitled Page'}</div>
                                                    <div className="text-[11px] text-[#666] mt-1 flex items-center gap-2">
                                                        <span className="bg-[#222] px-1.5 py-0.5 rounded">H1: {item.h1_1 || 'None'}</span>
                                                        <span>• {item.wordCount} words</span>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex flex-col items-end">
                                                    {item.fixStatus === 'pending' && <span className="px-2 py-1 bg-[#222] text-[#888] rounded text-[10px] font-bold uppercase tracking-wider">Queued</span>}
                                                    {item.fixStatus === 'generating' && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/> Generating</span>}
                                                    {item.fixStatus === 'done' && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10}/> Ready</span>}
                                                </div>
                                            </div>
                                            
                                            {item.fixStatus !== 'pending' && (
                                                <div className="mt-3 pt-3 border-t border-[#222]">
                                                    <label className="text-[10px] text-[#555] uppercase tracking-widest font-bold mb-1 block">Generated Meta Description</label>
                                                    {item.fixStatus === 'generating' ? (
                                                        <div className="h-10 bg-[#1a1a1a] rounded animate-pulse border border-[#333]"></div>
                                                    ) : (
                                                        <div className="relative">
                                                            <textarea 
                                                                className="w-full bg-[#1a1a1a] border border-[#333] rounded p-2 text-[12px] text-[#ccc] focus:border-[#F5364E] focus:outline-none min-h-[60px] custom-scrollbar"
                                                                value={item.generatedMeta}
                                                                onChange={(e) => {
                                                                    const newItems = [...autoFixItems];
                                                                    newItems[idx].generatedMeta = e.target.value;
                                                                    setAutoFixItems(newItems);
                                                                }}
                                                            />
                                                            <div className={`absolute bottom-2 right-2 text-[10px] font-mono ${(item.generatedMeta?.length || 0) > 155 ? 'text-red-400' : 'text-[#666]'}`}>
                                                                {item.generatedMeta?.length || 0}/155
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-[#222] bg-[#141414] flex justify-between items-center">
                            <div className="flex-1 pr-8">
                                {isFixing && (
                                    <div>
                                        <div className="flex justify-between text-[10px] text-[#888] mb-1 uppercase tracking-widest">
                                            <span>Progress</span>
                                            <span>{Math.round(autoFixProgress)}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#F5364E] transition-all duration-300" style={{width: `${autoFixProgress}%`}}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 shrink-0">
                                <button 
                                    onClick={() => setShowAutoFixModal(false)} 
                                    disabled={isFixing}
                                    className="px-4 py-2 text-[12px] font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {autoFixItems?.some((i: any) => i.fixStatus === 'done') ? 'Close' : 'Cancel'}
                                </button>
                                
                                {autoFixItems?.length > 0 && !autoFixItems.every((i: any) => i.fixStatus === 'done') && (
                                    <button 
                                        onClick={async () => {
                                            setIsFixing(true);
                                            const total = autoFixItems.length;
                                            
                                            for (let i = 0; i < total; i++) {
                                                setAutoFixItems((prev: any) => {
                                                    const next = [...prev];
                                                    next[i].fixStatus = 'generating';
                                                    return next;
                                                });
                                                
                                                await new Promise(r => setTimeout(r, 1200));
                                                
                                                const title = autoFixItems[i].title || 'this page';
                                                const h1 = autoFixItems[i].h1_1 || '';
                                                const generated = `Discover comprehensive insights on ${title}. ${h1 ? `Learn about ${h1} and ` : ''}Explore our detailed guide to enhance your strategy and drive better results.`;
                                                
                                                setAutoFixItems((prev: any) => {
                                                    const next = [...prev];
                                                    next[i].fixStatus = 'done';
                                                    next[i].generatedMeta = generated;
                                                    return next;
                                                });
                                                
                                                setAutoFixProgress(((i + 1) / total) * 100);
                                            }
                                            
                                            setIsFixing(false);
                                            
                                            const updatedPages = pages.map(p => {
                                                const fixedItem = autoFixItems.find((item: any) => item.url === p.url);
                                                if (fixedItem && fixedItem.fixStatus === 'done') {
                                                    return {
                                                        ...p,
                                                        metaDesc: fixedItem.generatedMeta || p.metaDesc,
                                                        metaDescLength: (fixedItem.generatedMeta || '').length,
                                                        fixStatus: 'applied'
                                                    };
                                                }
                                                return p;
                                            });

                                            crawlDb.pages.bulkPut(updatedPages).catch(err => {
                                                console.error('[CrawlDB] Failed to save auto-fix updates:', err);
                                            });
                                        }}
                                        disabled={isFixing}
                                        className="px-6 py-2 bg-[#F5364E] text-white text-[12px] font-bold rounded hover:bg-[#e02d43] transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isFixing ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/> Generating...</> : 'Generate All with AI'}
                                    </button>
                                )}

                                {autoFixItems?.length > 0 && autoFixItems.every((i: any) => i.fixStatus === 'done') && (
                                    <button 
                                        onClick={() => {
                                            alert('Queued for CMS Push! (Mock functionality)');
                                            setShowAutoFixModal(false);
                                        }}
                                        className="px-6 py-2 bg-green-600 text-white text-[12px] font-bold rounded hover:bg-green-500 transition-colors flex items-center gap-2"
                                    >
                                        <Database size={14} /> Queue for CMS Push
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
