import React from 'react';
import { CrawlerConfig, CustomExtractionRule } from '../../../services/CrawlerConfigTypes';
import { SettingsSection, SettingsInput, SettingsSelect, SettingsToggle, SettingsTextarea } from './shared';
import { Plus, Trash2, Shield, Filter } from 'lucide-react';

interface TabProps {
  config: CrawlerConfig;
  setConfig: React.Dispatch<React.SetStateAction<CrawlerConfig>>;
}

export default function RulesTab({ config, setConfig }: TabProps) {
  const updateConfig = (key: keyof CrawlerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addExtractionRule = () => {
    const newRule: CustomExtractionRule = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Rule',
      selector: '',
      pages: '*',
      condition: 'exists',
      severity: 'warning'
    };
    updateConfig('customExtractionRules', [...(config.customExtractionRules || []), newRule]);
  };

  const removeExtractionRule = (id: string) => {
    updateConfig('customExtractionRules', (config.customExtractionRules || []).filter(r => r.id !== id));
  };

  const updateExtractionRule = (id: string, updates: Partial<CustomExtractionRule>) => {
    updateConfig('customExtractionRules', (config.customExtractionRules || []).map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const customExtractionRules = config.customExtractionRules || [];

  return (
    <div className="space-y-6">
      <SettingsSection title="Crawl Boundaries" description="Define which URLs are allowed and which are forbidden.">
        <SettingsTextarea 
          label="Include Patterns (Regex)" 
          description="Only URLs matching these patterns will be crawled."
          value={config.includeRules}
          onChange={(val) => updateConfig('includeRules', val)}
          placeholder="/products/.*"
          rows={2}
        />
        <SettingsTextarea 
          label="Exclude Patterns (Regex)" 
          description="URLs matching these patterns will be skipped."
          value={config.excludeRules}
          onChange={(val) => updateConfig('excludeRules', val)}
          placeholder="/wp-admin/.*"
          rows={2}
        />
        <SettingsTextarea 
          label="Allowed Domains" 
          description="Additional domains the spider is allowed to follow."
          value={config.allowedDomains}
          onChange={(val) => updateConfig('allowedDomains', val)}
          placeholder="blog.example.com"
          rows={2}
        />
        <SettingsToggle 
          label="Ignore Query Parameters" 
          description="Treats /page?s=1 and /page as the same URL."
          checked={config.ignoreQueryParams} 
          onChange={(val) => updateConfig('ignoreQueryParams', val)} 
        />
      </SettingsSection>

      <SettingsSection title="Authentication" description="Credentials for password-protected areas.">
        <SettingsSelect 
          label="Auth Type" 
          value={config.authType}
          onChange={(val) => updateConfig('authType', val)}
          options={[
            { label: 'None', value: 'none' },
            { label: 'HTTP Basic', value: 'basic' },
            { label: 'Bearer Token', value: 'bearer' },
            { label: 'Custom Cookie', value: 'cookie' }
          ]}
        />
        {config.authType === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <SettingsInput label="Username" value={config.authUser} onChange={(val) => updateConfig('authUser', val)} />
            <SettingsInput label="Password" value={config.authPass} onChange={(val) => updateConfig('authPass', val)} type="password" />
          </div>
        )}
        {config.authType === 'bearer' && (
          <SettingsInput label="Token" value={config.authBearerToken} onChange={(val) => updateConfig('authBearerToken', val)} />
        )}
        {config.authType === 'cookie' && (
          <SettingsTextarea label="Raw Cookie String" value={config.customCookies} onChange={(val) => updateConfig('customCookies', val)} rows={2} />
        )}
      </SettingsSection>

      <SettingsSection title="Custom Health Checks" description="Define custom pass/fail conditions for pages.">
        <div className="space-y-3">
          {customExtractionRules.map((rule) => (
            <div key={rule.id} className="p-4 bg-[#111] border border-[#222] rounded-lg space-y-3 relative group">
              <button 
                onClick={() => removeExtractionRule(rule.id)}
                className="absolute top-4 right-4 p-1 text-[#444] hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-2 gap-4">
                <SettingsInput label="Rule Name" value={rule.name} onChange={(val) => updateExtractionRule(rule.id, { name: val })} />
                <SettingsInput label="Pages (Glob)" value={rule.pages} onChange={(val) => updateExtractionRule(rule.id, { pages: val })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <SettingsInput label="CSS Selector" value={rule.selector} onChange={(val) => updateExtractionRule(rule.id, { selector: val })} />
                </div>
                <SettingsSelect 
                  label="Condition" 
                  value={rule.condition} 
                  onChange={(val) => updateExtractionRule(rule.id, { condition: val })}
                  options={[
                    { label: 'Must exist', value: 'exists' },
                    { label: 'Must NOT exist', value: 'missing' },
                    { label: 'Must be empty', value: 'empty' },
                    { label: 'Must NOT be empty', value: 'not_empty' }
                  ]}
                />
              </div>
            </div>
          ))}
          <button 
            onClick={addExtractionRule}
            className="w-full py-2 border border-dashed border-[#333] rounded-lg text-[11px] text-[#666] hover:border-[#F5364E] hover:text-[#F5364E] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add Custom Health Check
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
