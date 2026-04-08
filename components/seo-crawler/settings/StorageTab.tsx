import React, { useEffect, useState } from 'react';
import { CrawlerConfig } from '../../../services/CrawlerConfigTypes';
import { SettingsSection, SettingsSelect, SettingsToggle, SettingsInput } from './shared';
import { Database, HardDrive, Cloud, AlertTriangle, Download, Trash2 } from 'lucide-react';

interface TabProps {
  config: CrawlerConfig;
  setConfig: React.Dispatch<React.SetStateAction<CrawlerConfig>>;
}

export default function StorageTab({ config, setConfig }: TabProps) {
  const [storageStats, setStorageStats] = useState({ used: 0, limit: 500 });

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        setStorageStats({
          used: Math.round((estimate.usage || 0) / (1024 * 1024)),
          limit: Math.round((estimate.quota || 500 * 1024 * 1024) / (1024 * 1024))
        });
      });
    }
  }, []);

  const updateConfig = (key: keyof CrawlerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const usagePercent = Math.min(100, (storageStats.used / storageStats.limit) * 100);

  return (
    <div className="space-y-6">
      <SettingsSection title="Local Browser Storage" description="Current usage of IndexedDB and LocalStorage.">
        <div className="p-4 bg-[#111] border border-[#222] rounded-lg space-y-3">
          <div className="flex justify-between items-center text-[12px]">
            <span className="text-[#888] flex items-center gap-2"><HardDrive size={14} /> Capacity</span>
            <span className="text-white font-bold">{storageStats.used}MB / {storageStats.limit}MB</span>
          </div>
          <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-[#F5364E]'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-[10px] text-[#666]">Data is stored locally in your browser to ensure privacy and speed.</p>
        </div>
      </SettingsSection>

      <SettingsSection title="Cloud Sync & Backups">
        <SettingsSelect 
          label="Cloud Sync Mode" 
          description="Sync metadata to our servers for multi-device access."
          value={config.cloudSync}
          onChange={(val) => updateConfig('cloudSync', val)}
          options={[
            { label: 'Metadata Only (Score, Errors, URLs)', value: 'metadata' },
            { label: 'Full Sync (All content & screenshots)', value: 'full' },
            { label: 'Off (Local-only)', value: 'off' }
          ]}
        />
        <SettingsSelect 
          label="Raw HTML Backup" 
          description="Save the original HTML source for every page."
          value={config.rawHtmlBackup}
          onChange={(val) => updateConfig('rawHtmlBackup', val)}
          options={[
            { label: 'Off', value: 'off' },
            { label: 'Local (Browser Storage)', value: 'local' },
            { label: 'Google Drive', value: 'google-drive' },
            { label: 'Cloudflare R2 (Private)', value: 'r2' }
          ]}
        />
        <SettingsSelect 
          label="Automatic Export" 
          description="Automatically download results after every crawl."
          value={config.exportOnCrawl}
          onChange={(val) => updateConfig('exportOnCrawl', val)}
          options={[
            { label: 'None', value: 'none' },
            { label: 'Download CSV', value: 'csv' },
            { label: 'Download JSON', value: 'json' },
            { label: 'Export to Google Sheets', value: 'google-sheets' }
          ]}
        />
      </SettingsSection>

      <SettingsSection title="Data Retention">
        <SettingsInput 
          label="Keep Last N Sessions" 
          description="Automatically delete old scans after reaching this limit."
          value={config.retentionSessions} 
          onChange={(val) => updateConfig('retentionSessions', parseInt(val))} 
          type="number" 
        />
      </SettingsSection>

      <SettingsSection title="Danger Zone">
        <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div>
              <h4 className="text-[12px] font-bold text-white">Reset Local Workspace</h4>
              <p className="text-[10px] text-[#888]">This will permanently delete all locally stored crawl history and configurations.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 bg-transparent border border-[#333] hover:border-[#444] text-[11px] font-bold text-white rounded transition-colors flex items-center justify-center gap-2">
              <Download size={14} /> Export All Data
            </button>
            <button className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-[11px] font-bold text-red-500 rounded transition-colors flex items-center justify-center gap-2">
              <Trash2 size={14} /> Purge Everything
            </button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
