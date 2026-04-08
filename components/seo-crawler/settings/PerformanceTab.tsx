import React from 'react';
import { CrawlerConfig } from '../../../services/CrawlerConfigTypes';
import { SettingsSection, SettingsInput, SettingsToggle, SettingsSlider } from './shared';

interface TabProps {
  config: CrawlerConfig;
  setConfig: React.Dispatch<React.SetStateAction<CrawlerConfig>>;
}

export default function PerformanceTab({ config, setConfig }: TabProps) {
  const updateConfig = (key: keyof CrawlerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <SettingsSection title="Throughput & Timeout">
        <SettingsSlider 
          label="Concurrent Requests" 
          description="How many pages to fetch at the same time."
          min={1} max={20} step={1} 
          value={config.concurrent} 
          onChange={(val) => updateConfig('concurrent', val)}
          unit=" workers"
        />
        <SettingsInput 
          label="Request Timeout" 
          description="Max time to wait for a page (seconds)."
          value={config.requestTimeout} 
          onChange={(val) => updateConfig('requestTimeout', parseInt(val))} 
          type="number" 
        />
      </SettingsSection>

      <SettingsSection title="Retries & Throttling">
        <SettingsToggle 
          label="Retry on Failure" 
          checked={config.retryOnFail} 
          onChange={(val) => updateConfig('retryOnFail', val)} 
        />
        {config.retryOnFail && (
          <SettingsInput 
            label="Max Retries" 
            value={config.retryCount} 
            onChange={(val) => updateConfig('retryCount', parseInt(val))} 
            type="number" 
          />
        )}
        <SettingsToggle 
          label="Rate Limiting" 
          description="Enable to slow down requests and avoid bans."
          checked={config.rateLimit} 
          onChange={(val) => updateConfig('rateLimit', val)} 
        />
        {config.rateLimit && (
          <SettingsInput 
            label="Delay between requests (ms)" 
            value={config.rateLimitDelay} 
            onChange={(val) => updateConfig('rateLimitDelay', parseInt(val))} 
            type="number" 
          />
        )}
      </SettingsSection>

      <SettingsSection title="Execution Engine">
        <SettingsToggle 
          label="Ghost Engine (Local Browser)" 
          description="Scan directly from your browser. Bypasses some firewalls but is slower."
          checked={config.useGhostEngine} 
          onChange={(val) => updateConfig('useGhostEngine', val)} 
        />
        <SettingsToggle 
          label="Server Fallback" 
          description="Use Headlight cloud nodes if local scan is blocked."
          checked={config.fallbackToServer} 
          onChange={(val) => updateConfig('fallbackToServer', val)} 
        />
      </SettingsSection>

      <SettingsSection title="Viewport & Proxies">
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput 
            label="Viewport Width" 
            value={config.viewportWidth} 
            onChange={(val) => updateConfig('viewportWidth', parseInt(val))} 
            type="number" 
          />
          <SettingsInput 
            label="Viewport Height" 
            value={config.viewportHeight} 
            onChange={(val) => updateConfig('viewportHeight', parseInt(val))} 
            type="number" 
          />
        </div>
        <SettingsToggle 
          label="Use Proxy" 
          checked={config.useProxy} 
          onChange={(val) => updateConfig('useProxy', val)} 
        />
        {config.useProxy && (
          <div className="space-y-3 mt-2 p-3 bg-[#0a0a0a] rounded-lg border border-[#222]">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <SettingsInput 
                  label="Proxy Host" 
                  value={config.proxyUrl} 
                  onChange={(val) => updateConfig('proxyUrl', val)} 
                />
              </div>
              <SettingsInput 
                label="Port" 
                value={config.proxyPort} 
                onChange={(val) => updateConfig('proxyPort', val)} 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SettingsInput 
                label="Username" 
                value={config.proxyUser} 
                onChange={(val) => updateConfig('proxyUser', val)} 
              />
              <SettingsInput 
                label="Password" 
                value={config.proxyPass} 
                onChange={(val) => updateConfig('proxyPass', val)} 
                type="password"
              />
            </div>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
