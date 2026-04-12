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

  const predefinedAgents = [
    'Headlight Scanner 1.0',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
  ];

  const isCustomAgent = config.userAgent && !predefinedAgents.includes(config.userAgent);

  return (
    <div className="space-y-6">
      <SettingsSection title="Target" description="What should we scan?">
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

        {config.mode === 'list' && (
          <div className="space-y-4 pt-2 pb-2 pl-4 border-l-2 border-[#F5364E]/30 animate-in slide-in-from-left-2 duration-200">
            <SettingsSelect
              label="Input Source"
              value={config.urlListSource}
              onChange={(val) => updateConfig('urlListSource', val)}
              options={[
                { label: 'Add Manually', value: 'manual' },
                { label: 'Upload File (.csv, .txt)', value: 'upload' },
                { label: 'Import from Google Sheet', value: 'import' }
              ]}
            />
            
            {config.urlListSource === 'manual' && (
              <SettingsTextarea
                label="Paste URLs"
                description="One URL per line"
                value={config.manualUrls}
                onChange={(val) => updateConfig('manualUrls', val)}
                placeholder="https://example.com/page1\nhttps://example.com/page2"
                rows={6}
              />
            )}

            {config.urlListSource === 'upload' && (
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-[#888]">Upload File</label>
                <div className="flex items-center gap-3 p-4 bg-[#0a0a0a] border border-[#222] border-dashed rounded-lg hover:border-[#F5364E]/50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-[#444] group-hover:text-[#F5364E] transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] text-[#ccc] font-medium">{config.uploadedFileName || 'Click to upload CSV or TXT'}</div>
                    <div className="text-[10px] text-[#555]">Max size: 10MB</div>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateConfig('uploadedFileName', file.name);
                    }}
                  />
                  <button className="px-3 py-1.5 bg-[#111] hover:bg-[#222] border border-[#333] rounded text-[11px] text-[#888] hover:text-white transition-colors">Browse</button>
                </div>
              </div>
            )}

            {config.urlListSource === 'import' && (
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-[#888]">Google Sheets</label>
                <button className="w-full flex items-center justify-center gap-2 p-3 bg-[#0a0a0a] border border-[#222] rounded-lg hover:bg-[#1a1a1a] hover:border-[#F5364E]/50 transition-all group font-bold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#107C41"/>
                    <path d="M14 2V8H20L14 2Z" fill="#33C481"/>
                  </svg>
                  <span className="text-[12px] text-[#ccc] group-hover:text-white">Connect to Google Sheet</span>
                </button>
              </div>
            )}
          </div>
        )}

        {config.mode === 'sitemap' && (
          <div className="space-y-4 pt-2 pb-2 pl-4 border-l-2 border-[#F5364E]/30 animate-in slide-in-from-left-2 duration-200">
            <SettingsSelect
              label="Sitemap Discovery"
              value={config.sitemapSource}
              onChange={(val) => updateConfig('sitemapSource', val)}
              options={[
                { label: 'Auto-detect from robots.txt', value: 'auto' },
                { label: 'Manual sitemap URL(s)', value: 'manual' }
              ]}
            />

            {config.sitemapSource === 'auto' ? (
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-md">
                <p className="text-[11px] text-blue-400">
                  Crawler will automatically find sitemaps listed in <strong>robots.txt</strong> or typical paths like <code>/sitemap.xml</code>.
                </p>
              </div>
            ) : (
              <SettingsTextarea
                label="Manual Sitemap URLs"
                description="Enter one or more sitemap URLs (one per line)"
                value={config.importSitemapUrl}
                onChange={(val) => updateConfig('importSitemapUrl', val)}
                placeholder="https://example.com/sitemap_index.xml\nhttps://example.com/sitemap_products.xml"
                rows={4}
              />
            )}
          </div>
        )}

        {config.mode === 'single' && (
          <div className="space-y-4 pt-2 pb-2 pl-4 border-l-2 border-[#F5364E]/30 animate-in slide-in-from-left-2 duration-200">
            <SettingsInput
              label="Target URL"
              description="A single page to analyze in-depth"
              value={config.startUrls[0] || ''}
              onChange={(val) => updateConfig('startUrls', [val])}
              placeholder="https://example.com/specific-page"
            />
          </div>
        )}

        <SettingsSelect 
          label="Industry Focus" 
          value={config.industry}
          onChange={(val: any) => updateConfig('industry', val)}
          options={[
            { label: 'All Industries', value: 'all' },
            { label: 'Ecommerce', value: 'ecommerce' },
            { label: 'Local Business', value: 'local' },
            { label: 'SaaS / Tech', value: 'saas' },
            { label: 'E-learning', value: 'elearning' }
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
          value={isCustomAgent ? 'custom' : config.userAgent}
          onChange={(val) => updateConfig('userAgent', val === 'custom' ? 'Custom Bot 1.0' : val)}
          options={[
            { label: 'Headlight Bot (Default)', value: 'Headlight Scanner 1.0' },
            { label: 'Googlebot (Desktop)', value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
            { label: 'Googlebot (Mobile)', value: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
            { label: 'Bingbot', value: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
            { label: 'Custom User Agent...', value: 'custom' }
          ]}
        />
        {(isCustomAgent || config.userAgent === 'custom') && (
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
