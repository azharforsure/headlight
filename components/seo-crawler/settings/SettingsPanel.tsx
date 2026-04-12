import React from 'react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { Settings, Globe, Zap, Network, Wand2, Filter, Code, Calendar, Database, X, Webhook } from 'lucide-react';
import GeneralTab from './GeneralTab';
import PerformanceTab from './PerformanceTab';
import { IntegrationsTab } from '../IntegrationsTab';
import AITab from './AITab';
import RulesTab from './RulesTab';
import ExtractionTab from './ExtractionTab';
import SchedulingTab from './SchedulingTab';
import StorageTab from './StorageTab';
import APIWebhooksTab from './APIWebhooksTab';
import { SettingsTabId } from '../../../services/CrawlerConfigTypes';

export const SETTINGS_TABS: { id: SettingsTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'general',       label: 'General',        icon: <Globe size={14}/> },
  { id: 'performance',   label: 'Performance',    icon: <Zap size={14}/> },
  { id: 'integrations',  label: 'Integrations',   icon: <Network size={14}/> },
  { id: 'ai',            label: 'AI Analysis',    icon: <Wand2 size={14}/> },
  { id: 'rules',         label: 'Rules & Auth',   icon: <Filter size={14}/> },
  { id: 'extraction',    label: 'Extraction',     icon: <Code size={14}/> },
  { id: 'scheduling',    label: 'Scheduling',     icon: <Calendar size={14}/> },
  { id: 'storage',       label: 'Storage',        icon: <Database size={14}/> },
  { id: 'api',           label: 'API & Webhooks', icon: <Webhook size={14}/> },
];


import { importConfig, exportConfig } from '../../../services/CrawlerConfigService';

export default function SettingsPanel() {
  const { showSettings, setShowSettings, settingsTab, setSettingsTab, config, setConfig } = useSeoCrawler();
  
  if (!showSettings) return null;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imported = await importConfig(file);
    if (imported) {
      setConfig(prev => ({ ...prev, ...imported }));
    }
  };

  const handleExport = () => {
    exportConfig(config);
  };

  const renderTab = () => {
    switch (settingsTab) {
      case 'general':       return <GeneralTab config={config} setConfig={setConfig} />;
      case 'performance':   return <PerformanceTab config={config} setConfig={setConfig} />;
      case 'integrations':  return <IntegrationsTab />;
      case 'ai':            return <AITab config={config} setConfig={setConfig} />;
      case 'rules':         return <RulesTab config={config} setConfig={setConfig} />;
      case 'extraction':    return <ExtractionTab config={config} setConfig={setConfig} />;
      case 'scheduling':    return <SchedulingTab config={config} setConfig={setConfig} />;
      case 'storage':       return <StorageTab config={config} setConfig={setConfig} />;
      case 'api':           return <APIWebhooksTab />;
      default:              return <GeneralTab config={config} setConfig={setConfig} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
      
      <div className="relative w-full max-w-5xl h-[700px] flex bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Left sidebar */}
        <div className="w-[220px] bg-[#111] border-r border-[#222] flex flex-col">
          <div className="h-[60px] flex items-center px-5 border-b border-[#222]">
            <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
              <Settings size={16} className="text-[#F5364E]" /> Configuration
            </h3>
          </div>
          
          <div className="p-3 space-y-1 flex-1 overflow-y-auto">
            {SETTINGS_TABS.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setSettingsTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all
                  ${settingsTab === tab.id 
                    ? 'bg-[#F5364E]/10 text-[#F5364E] shadow-[inset_0_0_0_1px_rgba(245,54,78,0.2)]' 
                    : 'text-[#888] hover:bg-[#222] hover:text-[#ccc]'}`}
              >
                <span className={settingsTab === tab.id ? 'text-[#F5364E]' : 'text-[#666]'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-[#222] space-y-2">
            <input 
              type="file" 
              id="config-import" 
              className="hidden" 
              accept=".json" 
              onChange={handleImport} 
            />
            <label 
              htmlFor="config-import"
              className="w-full px-3 py-2 text-[11px] text-[#666] hover:text-white hover:bg-[#222] rounded-lg transition-colors text-left flex items-center gap-2 cursor-pointer"
            >
               📥 Import JSON
            </label>
            <button 
              onClick={handleExport}
              className="w-full px-3 py-2 text-[11px] text-[#666] hover:text-white hover:bg-[#222] rounded-lg transition-colors text-left flex items-center gap-2"
            >
               📤 Export JSON
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col bg-[#050505]">
          <div className="h-[60px] flex items-center justify-between px-6 border-b border-[#222]">
            <div className="flex items-center gap-2">
              <span className="text-[#666] text-[12px]">Configuration</span>
              <span className="text-[#444] text-[12px]">/</span>
              <span className="text-white text-[12px] font-bold">{SETTINGS_TABS.find(t => t.id === settingsTab)?.label}</span>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#222] text-[#666] hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto">
              {renderTab()}
            </div>
          </div>

          <div className="px-8 py-4 border-t border-[#222] bg-[#0a0a0a]/50 flex justify-end gap-3">
            <button 
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-[12px] font-bold text-[#666] hover:text-white transition-colors"
            >
              Discard Changes
            </button>
            <button 
              onClick={() => setShowSettings(false)}
              className="px-8 py-2 bg-[#F5364E] text-white text-[12px] font-bold rounded-lg hover:bg-[#e02d43] shadow-lg shadow-[#F5364E]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
