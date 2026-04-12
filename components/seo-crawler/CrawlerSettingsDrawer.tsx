import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { 
    X,
    Settings as SettingsIcon,
    Play
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { SETTINGS_TABS } from './settings/SettingsPanel';
import { SettingsTabId, CrawlerConfig } from '../../services/CrawlerConfigTypes';

// Import Tab Components for 1:1 Parity
import GeneralTab from './settings/GeneralTab';
import PerformanceTab from './settings/PerformanceTab';
import { IntegrationsTab } from './IntegrationsTab';
import AITab from './settings/AITab';
import RulesTab from './settings/RulesTab';
import ExtractionTab from './settings/ExtractionTab';
import SchedulingTab from './settings/SchedulingTab';
import StorageTab from './settings/StorageTab';
import APIWebhooksTab from './settings/APIWebhooksTab';


const readFileText = (file: File) => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
        reader.readAsText(file);
    });
};

const parseUrlsFromText = (text: string) => {
    return text.split(/\r?\n|,/).map(v => v.trim()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
};

// Tab definitions are now shared from SettingsPanel


interface CrawlerSettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CrawlerSettingsDrawer({ isOpen, onClose }: CrawlerSettingsDrawerProps) {
    const {
        urlInput,
        setUrlInput,
        listUrls,
        setListUrls,
        setCrawlingMode,
        handleStartPause,
        config,
        setConfig,
        addLog
    } = useSeoCrawler();

    const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
    
    // Unified Setup State using CrawlerConfig interface
    const [localConfig, setLocalConfig] = useState<CrawlerConfig>({ 
        ...config, 
        startUrls: urlInput ? [urlInput] : config.startUrls 
    });

    // Reset state when drawer opens to ensure we have fresh data from context
    useEffect(() => {
        if (isOpen) {
            setLocalConfig({
                ...config,
                startUrls: urlInput ? [urlInput] : config.startUrls
            });
        }
    }, [isOpen, urlInput, listUrls, config]);


    // Reset state when drawer opens to ensure we have fresh data from context
    useEffect(() => {
        if (isOpen) {
            setLocalConfig({
                ...config,
                startUrls: urlInput ? [urlInput] : config.startUrls
            });
        }
    }, [isOpen, urlInput, listUrls, config]);


    const sitemapInputRef = useRef<HTMLInputElement | null>(null);
    const csvInputRef = useRef<HTMLInputElement | null>(null);

    const clearSetupParams = () => {
        const searchParams = new URLSearchParams(window.location.search);
        let changed = false;
        if (searchParams.has('setup')) { searchParams.delete('setup'); changed = true; }
        if (searchParams.has('project_id')) { searchParams.delete('project_id'); changed = true; }
        
        if (changed) {
            const nextUrl = `${window.location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
            window.history.replaceState({}, '', nextUrl);
        }
    };

    const handleClose = () => {
        clearSetupParams();
        onClose();
    };

    const onStart = async () => {
        // Apply local setup config to global context
        setConfig(localConfig);

        if (localConfig.mode === 'spider' || localConfig.mode === 'single') {
            setUrlInput(localConfig.startUrls[0] || '');
        } else if (localConfig.mode === 'list') {
            setListUrls(localConfig.startUrls.join('\n'));
        }

        setCrawlingMode(localConfig.mode === 'single' ? 'spider' : localConfig.mode as any);

        clearSetupParams();
        onClose();
        window.setTimeout(() => handleStartPause(), 100);
    };



    const handleSitemapImport = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await readFileText(file);
            const xml = new DOMParser().parseFromString(text, 'application/xml');
            const urls = Array.from(xml.getElementsByTagName('loc')).map(n => n.textContent?.trim() || '').filter(Boolean);
            if (urls.length === 0) throw new Error('Empty Sitemap');
            setLocalConfig(p => ({ ...p, list: urls.join('\n'), mode: 'list' }));
            addLog(`Imported ${urls.length} URLs from sitemap.`, 'success');
        } catch (e: any) { addLog(e.message, 'error'); } finally { event.target.value = ''; }
    };

    const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await readFileText(file);
            const urls = parseUrlsFromText(text).filter(u => /^https?:\/\//i.test(u));
            if (urls.length === 0) throw new Error('No valid URLs');
            setLocalConfig(p => ({ ...p, list: urls.join('\n'), mode: 'list' }));
            addLog(`Imported ${urls.length} URLs from CSV.`, 'success');
        } catch (e: any) { addLog(e.message, 'error'); } finally { event.target.value = ''; }
    };

    if (!isOpen) return null;

    const activeTabLabel = SETTINGS_TABS.find(t => t.id === activeTab)?.label || '';

    const renderTab = () => {
        const tabProps = { config: localConfig, setConfig: setLocalConfig as any };
        switch (activeTab) {
            case 'general':       return <GeneralTab {...tabProps} />;
            case 'performance':   return <PerformanceTab {...tabProps} />;
            case 'integrations':  return <IntegrationsTab />;
            case 'ai':            return <AITab {...tabProps} />;
            case 'rules':         return <RulesTab {...tabProps} />;
            case 'extraction':    return <ExtractionTab {...tabProps} />;
            case 'scheduling':    return <SchedulingTab {...tabProps} />;
            case 'storage':       return <StorageTab {...tabProps} />;
            case 'api':           return <APIWebhooksTab />;
            default:              return <GeneralTab {...tabProps} />;
        }
    };


    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="w-full max-w-6xl h-full bg-[#050505] border-l border-[#222] shadow-2xl flex animate-in slide-in-from-right duration-500 ease-out">
                
                {/* Parity Sidebar */}
                <div className="w-[220px] bg-[#111] border-r border-[#222] flex flex-col">
                    <div className="h-[60px] flex items-center px-5 border-b border-[#222]">
                        <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
                            <SettingsIcon size={16} className="text-[#F5364E]" /> Configuration
                        </h3>
                    </div>
                    
                    <div className="p-3 space-y-1 flex-1 overflow-y-auto">
                        {SETTINGS_TABS.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all
                                    ${activeTab === tab.id 
                                        ? 'bg-[#F5364E]/10 text-[#F5364E] shadow-[inset_0_0_0_1px_rgba(245,54,78,0.2)]' 
                                        : 'text-[#888] hover:bg-[#222] hover:text-[#ccc]'}`}
                            >
                                <span className={activeTab === tab.id ? 'text-[#F5364E]' : 'text-[#666]'}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>


                {/* 1:1 Parity Workspace */}
                <div className="flex-1 flex flex-col bg-[#050505]">
                    {/* Content Header (Breadcrumb Style) */}
                    <div className="h-[60px] flex items-center justify-between px-6 border-b border-[#222]">
                        <div className="flex items-center gap-2">
                            <span className="text-[#666] text-[12px]">Configuration</span>
                            <span className="text-[#444] text-[12px]">/</span>
                            <span className="text-white text-[12px] font-bold">{activeTabLabel}</span>
                        </div>
                        <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#222] text-[#666] hover:text-white transition-all">
                            <X size={16} />
                        </button>

                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        <div className="max-w-3xl mx-auto">
                            {renderTab()}
                        </div>
                    </div>


                    {/* Fixed Action Footer (Parity with Settings Apply) */}
                    <div className="px-8 py-4 border-t border-[#222] bg-[#0a0a0a]/50 flex justify-between items-center">
                        <button onClick={handleClose} className="text-[12px] font-bold text-[#666] hover:text-white transition-colors">Discard Setup</button>

                        <button 
                            onClick={onStart}
                            className="px-8 py-2 bg-[#F5364E] text-white text-[12px] font-bold rounded-lg hover:bg-[#e02d43] shadow-lg shadow-[#F5364E]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                        >
                            <Play size={12} fill="currentColor" />
                            Launch Project
                        </button>
                    </div>
                </div>
            </div>

            <input ref={sitemapInputRef} type="file" accept=".xml" className="hidden" onChange={handleSitemapImport} />
            <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
        </div>
    );
}
