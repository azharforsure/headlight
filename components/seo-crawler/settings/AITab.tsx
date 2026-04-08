import React from 'react';
import { CrawlerConfig, AITaskToggles } from '../../../services/CrawlerConfigTypes';
import { SettingsSection, SettingsInput, SettingsToggle, SettingsSlider } from './shared';
import { Wand2, Zap, Layout, FileText, Search, BarChart3, ShieldCheck, Code, Globe } from 'lucide-react';

interface TabProps {
  config: CrawlerConfig;
  setConfig: React.Dispatch<React.SetStateAction<CrawlerConfig>>;
}

export default function AITab({ config, setConfig }: TabProps) {
  const updateConfig = (key: keyof CrawlerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateAiTask = (task: keyof AITaskToggles, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      aiTasks: { ...(prev.aiTasks || {}), [task]: value }
    }));
  };

  const aiTasks = config.aiTasks || {};
  const aiCustomKeys = config.aiCustomKeys || { openai: '', anthropic: '', gemini: '', cohere: '' };

  const tasks = [
    { id: 'summarize', label: 'Page Summarization', icon: <FileText size={14}/>, desc: 'Generate concise executive summaries for every page.' },
    { id: 'keywords', label: 'Keyword Extraction', icon: <Search size={14}/>, desc: 'Identify primary and secondary semantic keywords.' },
    { id: 'intent', label: 'Search Intent Analysis', icon: <Zap size={14}/>, desc: 'Classify intent as Informational, Transactional, etc.' },
    { id: 'quality', label: 'Content Quality Audit', icon: <BarChart3 size={14}/>, desc: 'Score content for readability, depth, and relevance.' },
    { id: 'eeat', label: 'E-E-A-T Assessment', icon: <ShieldCheck size={14}/>, desc: 'Evaluate Experience, Expertise, Authoritativeness, and Trust.' },
    { id: 'fixSuggestions', label: 'Fix Suggestions', icon: <Wand2 size={14}/>, desc: 'Generate actionable steps to fix detected SEO issues.' },
    { id: 'metaRewrite', label: 'Meta Tag Optimization', icon: <Layout size={14}/>, desc: 'Automatically draft optimized Title and Meta descriptions.' },
    { id: 'schemaGenerate', label: 'Schema.org Generation', icon: <Code size={14}/>, desc: 'Generate JSON-LD structured data for the page content.' },
    { id: 'altTextGenerate', label: 'Image Alt Generation', icon: <Globe size={14}/>, desc: 'Create descriptive alt text for images missing it.' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gradient-to-br from-[#F5364E]/20 to-transparent border border-[#F5364E]/30 rounded-xl mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#F5364E] flex items-center justify-center">
            <Wand2 size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-white">Advanced AI Intelligence</h3>
            <p className="text-[11px] text-[#aaa]">Powered by Gemini 1.5 & Cloudflare Workers AI</p>
          </div>
          <div className="ml-auto">
            <SettingsToggle 
              label="" 
              checked={config.aiEnabled} 
              onChange={(val) => updateConfig('aiEnabled', val)} 
            />
          </div>
        </div>
      </div>

      {config.aiEnabled && (
        <>
          <SettingsSection title="Analysis Tasks" description="Select which AI models to run during the crawl.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasks.map(task => (
                <div key={task.id} 
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex gap-3
                    ${aiTasks[task.id as keyof AITaskToggles] ? 'bg-[#111] border-[#F5364E]/30 shadow-[0_0_15px_rgba(245,54,78,0.05)]' : 'bg-[#0a0a0a] border-[#222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}
                  onClick={() => updateAiTask(task.id as keyof AITaskToggles, !aiTasks[task.id as keyof AITaskToggles])}
                >
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 
                    ${aiTasks[task.id as keyof AITaskToggles] ? 'bg-[#F5364E]/20 text-[#F5364E]' : 'bg-[#222] text-[#666]'}`}>
                    {task.icon}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-white mb-0.5">{task.label}</div>
                    <div className="text-[10px] text-[#666] leading-tight">{task.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Batching & Rotation">
            <SettingsSlider 
              label="AI Batch Size" 
              description="How many pages to process in a single AI request."
              min={1} max={50} step={1} 
              value={config.aiBatchSize} 
              onChange={(val) => updateConfig('aiBatchSize', val)}
              unit=" pages"
            />
            <SettingsToggle 
              label="Auto Provider Rotation" 
              description="Automatically switch AI models if rate limits are reached."
              checked={config.aiAutoRotation} 
              onChange={(val) => updateConfig('aiAutoRotation', val)} 
            />
          </SettingsSection>

          <SettingsSection title="Custom Provider Keys (Optional)" description="Use your own API keys for higher rate limits.">
            <div className="grid grid-cols-2 gap-4">
              <SettingsInput 
                label="OpenAI Key" 
                value={aiCustomKeys.openai} 
                onChange={(val) => setConfig(prev => ({ ...prev, aiCustomKeys: { ...(prev.aiCustomKeys || {}), openai: val } }))} 
                type="password"
                placeholder="sk-..."
              />
              <SettingsInput 
                label="Anthropic Key" 
                value={aiCustomKeys.anthropic} 
                onChange={(val) => setConfig(prev => ({ ...prev, aiCustomKeys: { ...(prev.aiCustomKeys || {}), anthropic: val } }))} 
                type="password"
                placeholder="sk-ant-..."
              />
              <SettingsInput 
                label="Gemini Key" 
                value={aiCustomKeys.gemini} 
                onChange={(val) => setConfig(prev => ({ ...prev, aiCustomKeys: { ...(prev.aiCustomKeys || {}), gemini: val } }))} 
                type="password"
              />
              <SettingsInput 
                label="Cohere Key" 
                value={aiCustomKeys.cohere} 
                onChange={(val) => setConfig(prev => ({ ...prev, aiCustomKeys: { ...(prev.aiCustomKeys || {}), cohere: val } }))} 
                type="password"
              />
            </div>
          </SettingsSection>
        </>
      )}
    </div>
  );
}
