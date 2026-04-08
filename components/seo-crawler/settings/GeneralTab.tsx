import React from 'react';
import { CrawlerConfig } from '../../../services/CrawlerConfigTypes';
import { SettingsSection, SettingsInput, SettingsSelect, SettingsToggle, SettingsSlider, SettingsTextarea } from './shared';

interface TabProps {
  config: CrawlerConfig;
  setConfig: React.Dispatch<React.SetStateAction<CrawlerConfig>>;
}

export default function GeneralTab({ config, setConfig }: TabProps) {
  const updateConfig = (key: keyof CrawlerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <SettingsSection title="Target" description="What should we scan?">
        <SettingsTextarea 
          label="Start URLs" 
          description="Enter one URL per line. These are the entry points for the spider."
          value={config.startUrls?.join('\n') || ''}
          onChange={(val) => updateConfig('startUrls', val.split('\n').map(u => u.trim()).filter(Boolean))}
          placeholder="https://example.com"
          rows={2}
        />
        <SettingsSelect 
          label="Crawl Mode" 
          value={config.mode}
          onChange={(val) => updateConfig('mode', val)}
          options={[
            { label: 'Spider (Full Site)', value: 'spider' },
            { label: 'URL List', value: 'list' },
            { label: 'Sitemap only', value: 'sitemap' },
            { label: 'Single page', value: 'single' }
          ]}
        />
      </SettingsSection>

      <SettingsSection title="Limits & Depth">
        <div className="grid grid-cols-2 gap-4">
          <SettingsInput 
            label="Max Pages" 
            value={config.limit} 
            onChange={(val) => updateConfig('limit', val)} 
            type="number" 
            placeholder="No limit"
          />
          <SettingsInput 
            label="Max Depth" 
            value={config.maxDepth} 
            onChange={(val) => updateConfig('maxDepth', val)} 
            type="number" 
            placeholder="No limit"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Speed & User Agent">
        <SettingsSlider 
          label="Crawl Speed" 
          min={1} max={20} step={1} 
          value={config.threads} 
          onChange={(val) => updateConfig('threads', val)}
          unit=" pages/sec"
        />
        <SettingsSelect 
          label="User Agent" 
          value={config.userAgent}
          onChange={(val) => updateConfig('userAgent', val)}
          options={[
            { label: 'Headlight Bot (Default)', value: 'Headlight Scanner 1.0' },
            { label: 'Googlebot (Desktop)', value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
            { label: 'Googlebot (Mobile)', value: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
            { label: 'Bingbot', value: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
            { label: 'Custom User Agent...', value: 'custom' }
          ]}
        />
        {config.userAgent === 'custom' && (
          <SettingsInput 
            label="Custom User Agent String" 
            value={config.userAgent === 'custom' ? '' : config.userAgent} 
            onChange={(val) => updateConfig('userAgent', val)} 
          />
        )}
      </SettingsSection>

      <SettingsSection title="Behavior">
        <SettingsToggle 
          label="Respect robots.txt" 
          checked={config.respectRobots} 
          onChange={(val) => updateConfig('respectRobots', val)} 
        />
        <SettingsToggle 
          label="Follow Redirects" 
          checked={config.followRedirects} 
          onChange={(val) => updateConfig('followRedirects', val)} 
        />
        {config.followRedirects && (
          <SettingsInput 
            label="Max Redirect Hops" 
            value={config.maxRedirectHops} 
            onChange={(val) => updateConfig('maxRedirectHops', parseInt(val))} 
            type="number" 
          />
        )}
        <SettingsSelect 
          label="Cookie Consent" 
          value={config.cookieConsent}
          onChange={(val) => updateConfig('cookieConsent', val)}
          options={[
            { label: 'Auto-accept all cookies', value: 'auto-accept' },
            { label: 'Ignore (clean session)', value: 'ignore' },
            { label: 'Skip pages with banners', value: 'skip' }
          ]}
        />
      </SettingsSection>
    </div>
  );
}
