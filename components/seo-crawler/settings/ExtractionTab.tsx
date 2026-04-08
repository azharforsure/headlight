import React from 'react';
import { CrawlerConfig, CustomFieldExtractor } from '../../../services/CrawlerConfigTypes';
import { SettingsSection, SettingsInput, SettingsSelect, SettingsToggle } from './shared';
import { Plus, Trash2, Code } from 'lucide-react';

interface TabProps {
  config: CrawlerConfig;
  setConfig: React.Dispatch<React.SetStateAction<CrawlerConfig>>;
}

export default function ExtractionTab({ config, setConfig }: TabProps) {
  const updateConfig = (key: keyof CrawlerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addExtractor = () => {
    const newExtractor: CustomFieldExtractor = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Field',
      cssSelector: '',
      extractType: 'text'
    };
    updateConfig('customFieldExtractors', [...(config.customFieldExtractors || []), newExtractor]);
  };

  const removeExtractor = (id: string) => {
    updateConfig('customFieldExtractors', (config.customFieldExtractors || []).filter(r => r.id !== id));
  };

  const updateExtractor = (id: string, updates: Partial<CustomFieldExtractor>) => {
    updateConfig('customFieldExtractors', (config.customFieldExtractors || []).map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const customFieldExtractors = config.customFieldExtractors || [];

  return (
    <div className="space-y-6">
      <SettingsSection title="Rendering Mode" description="How the crawler processes pages.">
        <SettingsToggle 
          label="JavaScript Rendering" 
          description="Enable this for SPAs or pages that need JS to load content."
          checked={config.jsRendering} 
          onChange={(val) => updateConfig('jsRendering', val)} 
        />
        <SettingsToggle 
          label="Fetch Core Web Vitals" 
          description="Gather LCP, FID, CLS, and TTFB for every page."
          checked={config.fetchWebVitals} 
          onChange={(val) => updateConfig('fetchWebVitals', val)} 
        />
        <SettingsToggle 
          label="Crawl All Resources" 
          description="Identify and check CSS, JS, and image files for errors."
          checked={config.crawlResources} 
          onChange={(val) => updateConfig('crawlResources', val)} 
        />
      </SettingsSection>

      <SettingsSection title="Quick Extraction" description="Simple global extraction rules.">
        <SettingsInput 
          label="Extract by CSS Selector" 
          description="Find specific content on every page."
          value={config.extractCss} 
          onChange={(val) => updateConfig('extractCss', val)} 
          placeholder=".product-price"
        />
        <SettingsInput 
          label="Extract by Regex" 
          description="Pattern match within the raw HTML."
          value={config.extractRegex} 
          onChange={(val) => updateConfig('extractRegex', val)} 
          placeholder="[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}"
        />
      </SettingsSection>

      <SettingsSection title="Custom Field Extractors" description="Map CSS selectors to custom named columns in your data.">
        <div className="space-y-3">
          {customFieldExtractors.map((extractor) => (
            <div key={extractor.id} className="p-4 bg-[#111] border border-[#222] rounded-lg space-y-3 relative">
              <button 
                onClick={() => removeExtractor(extractor.id)}
                className="absolute top-4 right-4 p-1 text-[#444] hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-2 gap-4">
                <SettingsInput label="Field Name" value={extractor.name} onChange={(val) => updateExtractor(extractor.id, { name: val })} />
                <SettingsSelect 
                  label="Extract Type" 
                  value={extractor.extractType} 
                  onChange={(val) => updateExtractor(extractor.id, { extractType: val })}
                  options={[
                    { label: 'Text Content', value: 'text' },
                    { label: 'HTML (Outer)', value: 'html' },
                    { label: 'Attribute Value', value: 'attribute' }
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SettingsInput label="CSS Selector" value={extractor.cssSelector} onChange={(val) => updateExtractor(extractor.id, { cssSelector: val })} />
                {extractor.extractType === 'attribute' && (
                  <SettingsInput label="Attr Name" value={extractor.attributeName || ''} onChange={(val) => updateExtractor(extractor.id, { attributeName: val })} placeholder="href, data-price, etc" />
                )}
                <SettingsInput label="Regex (Optional)" value={extractor.regex || ''} onChange={(val) => updateExtractor(extractor.id, { regex: val })} placeholder="Filter result with regex..." />
              </div>
            </div>
          ))}
          <button 
            onClick={addExtractor}
            className="w-full py-2 border border-dashed border-[#333] rounded-lg text-[11px] text-[#666] hover:border-[#F5364E] hover:text-[#F5364E] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add Custom Field Extractor
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
