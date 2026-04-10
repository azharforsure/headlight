import React, { useEffect, useMemo, useState } from 'react';
import { 
    XCircle, Settings, Globe, Code, AlertTriangle, Wand2, Network, Server, 
    FastForward, Palette, CheckCircle2, Database, LinkIcon, Calendar, Clock,
    Play, Repeat, Bell, Shield, Upload, Sparkles
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../../contexts/CrawlerUIContext';
import { IntegrationsTab } from './IntegrationsTab';
import SettingsPanel from './settings/SettingsPanel';

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
        config, setConfig,
        integrationConnections, saveIntegrationConnection, removeIntegrationConnection,
        isFixing, setIsFixing,
        autoFixProgress, setAutoFixProgress,
        setCrawlingMode, crawlDb, pages,
        addLog
    } = useSeoCrawler();

    const {
        showListModal, setShowListModal,
        listUrls, setListUrls,
        showSettings, setShowSettings,
        settingsTab, setSettingsTab,
        theme, setTheme,
        showAutoFixModal, setShowAutoFixModal,
        autoFixItems, setAutoFixItems,
        showScheduleModal, setShowScheduleModal,
    } = useCrawlerUI();

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

            {showSettings && <SettingsPanel />}

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
