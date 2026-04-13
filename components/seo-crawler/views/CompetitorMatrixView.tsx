import React, { useState, useMemo, useCallback, Fragment, useEffect } from 'react';
import { 
  ChevronDown, 
  Plus, 
  Download, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  Pencil, 
  Check, 
  X, 
  Info,
  Globe,
  Bot,
  User,
  Link as LinkIcon,
  BarChart2,
  Smartphone
} from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { useOptionalProject } from '../../../services/ProjectContext';
import { 
  COMPARISON_ROWS, 
  COMPARISON_CATEGORIES, 
  CompetitorProfile, 
  getProfileValue, 
  createEmptyProfile,
  DataSource
} from '../../../services/CompetitorMatrixConfig';
import { CompetitorProfileBuilder } from '../../../services/CompetitorProfileBuilder';
import { runCompetitorMicroCrawl, MicroCrawlProgress } from '../../../services/CompetitorMicroCrawl';
import { saveCompetitorProfile, deleteCompetitorProfile } from '../../../services/CrawlDatabase';
import { addCompetitor, listCompetitors, deleteCompetitor } from '../../../services/DashboardDataService';
import { exportMatrixCSV, downloadCSV } from '../../../services/CompetitorMatrixExport';
import { getAIEngine } from '../../../services/ai';

export default function CompetitorMatrixView() {
  const { 
    pages, 
    ownProfile, 
    competitorProfiles, 
    setCompetitorProfiles,
    currentSessionId,
    addLog
  } = useSeoCrawler();
  const { activeProject } = useOptionalProject();

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [crawlingDomains, setCrawlingDomains] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCell, setEditingCell] = useState<{ domain: string; rowId: string } | null>(null);
  const [crawlProgress, setCrawlProgress] = useState<Record<string, MicroCrawlProgress>>({});

  const toggleCategory = (category: string) => {
    const next = new Set(collapsedCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setCollapsedCategories(next);
  };

  const handleAddCompetitor = async (name: string, url: string) => {
    if (!activeProject?.id) return;
    
    try {
      // 1. Add to dashboard list
      await addCompetitor(activeProject.id, name, url);
      
      // 2. Start micro-crawl
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '').toLowerCase();
      setCrawlingDomains(prev => new Set(prev).add(domain));
      
      const ai = getAIEngine();
      const profile = await runCompetitorMicroCrawl(url, activeProject.id, {
        aiEnrich: true,
        aiComplete: async (opts) => {
          const res = await ai.complete(opts.prompt, { format: 'json' });
          return { text: res.text };
        },
        onProgress: (p) => {
          setCrawlProgress(prev => ({ ...prev, [domain]: p }));
        }
      });

      setCompetitorProfiles(prev => [...prev.filter(cp => cp.domain !== domain), profile]);
      setCrawlingDomains(prev => {
        const next = new Set(prev);
        next.delete(domain);
        return next;
      });
      addLog(`Competitor ${domain} analysis complete.`, 'success');
    } catch (err: any) {
      addLog(`Failed to add competitor: ${err.message}`, 'error');
    }
  };

  const handleRemoveCompetitor = async (domain: string) => {
    if (!activeProject?.id) return;
    if (!confirm(`Are you sure you want to remove ${domain}?`)) return;

    try {
      // Find the competitor record ID first
      const comps = await listCompetitors(activeProject.id);
      const record = comps.find(c => {
        try { return new URL(c.url).hostname.replace(/^www\./, '') === domain; } catch { return false; }
      });

      if (record) {
        await deleteCompetitor(activeProject.id, record.id);
      }
      
      await deleteCompetitorProfile(activeProject.id, domain);
      setCompetitorProfiles(prev => prev.filter(p => p.domain !== domain));
      addLog(`Removed competitor ${domain}`, 'info');
    } catch (err: any) {
      addLog(`Failed to remove competitor: ${err.message}`, 'error');
    }
  };

  const handleCrawlAll = async () => {
    if (!activeProject?.id || competitorProfiles.length === 0) return;
    
    addLog(`Starting micro-crawl for ${competitorProfiles.length} competitors...`, 'info');
    const ai = getAIEngine();

    for (const comp of competitorProfiles) {
      try {
        const domain = comp.domain;
        setCrawlingDomains(prev => new Set(prev).add(domain));
        
        const profile = await runCompetitorMicroCrawl(comp.domain, activeProject.id, {
          aiEnrich: true,
          aiComplete: async (opts) => {
            const res = await ai.complete(opts.prompt, { format: 'json' });
            return { text: res.text };
          },
          onProgress: (p) => {
            setCrawlProgress(prev => ({ ...prev, [domain]: p }));
          }
        });

        setCompetitorProfiles(prev => prev.map(p => p.domain === domain ? profile : p));
        setCrawlingDomains(prev => {
          const next = new Set(prev);
          next.delete(domain);
          return next;
        });
      } catch (err: any) {
        console.error(`Crawl failed for ${comp.domain}:`, err);
      }
    }
    addLog('Crawl all competitors complete.', 'success');
  };

  const handleExportCSV = () => {
    const csv = exportMatrixCSV(ownProfile, competitorProfiles);
    downloadCSV(csv, `competitor_matrix_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleSaveEdit = async (domain: string, key: string, value: any) => {
    if (!activeProject?.id) return;
    
    const profile = competitorProfiles.find(p => p.domain === domain);
    if (!profile) return;

    const edits: any = {};
    edits[key] = value;
    
    const updated = CompetitorProfileBuilder.applyManualEdits(profile, edits);
    await saveCompetitorProfile(activeProject.id, updated);
    setCompetitorProfiles(prev => prev.map(p => p.domain === domain ? updated : p));
    setEditingCell(null);
  };

  if (pages.length === 0 && competitorProfiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-8">
        <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-6 text-[#F5364E]">
          <BarChart2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Build Your Competitor Matrix</h2>
        <p className="text-[#666] max-w-md mb-8">
          Run a crawl of your own site first, then add competitors to see how you stack up across 80+ metrics.
        </p>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-[#F5364E] text-white rounded-lg font-bold hover:bg-[#d42d42] transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add First Competitor
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
      {/* Matrix Toolbar */}
      <div className="h-14 border-b border-[#222] flex items-center justify-between px-4 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-white flex items-center gap-2">
            <BarChart2 size={18} className="text-[#F5364E]" />
            Competitor Matrix
          </h2>
          <div className="h-4 w-[1px] bg-[#222] mx-2" />
          <button 
            onClick={() => setShowAddModal(true)}
            className="h-8 px-3 bg-[#F5364E] text-white rounded flex items-center gap-2 text-xs font-bold hover:bg-[#d42d42]"
          >
            <Plus size={14} />
            Add Competitor
          </button>
          <button 
            onClick={handleCrawlAll}
            disabled={crawlingDomains.size > 0 || competitorProfiles.length === 0}
            className="h-8 px-3 bg-[#111] border border-[#222] text-white rounded flex items-center gap-2 text-xs font-bold hover:bg-[#1a1a1a] disabled:opacity-50"
          >
            <RefreshCw size={14} className={crawlingDomains.size > 0 ? 'animate-spin' : ''} />
            Crawl All
          </button>
        </div>
        <div className="flex items-center gap-4">
          {crawlingDomains.size > 0 && (
            <div className="text-[10px] text-[#F5364E] font-medium animate-pulse flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#F5364E] rounded-full" />
              Crawling {Array.from(crawlingDomains).join(', ')}...
            </div>
          )}
          <button 
            onClick={handleExportCSV}
            className="h-8 px-3 text-[#aaa] hover:text-white flex items-center gap-2 text-xs font-medium"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-[12px] table-fixed min-w-max">
          <thead className="sticky top-0 z-20 bg-[#111]">
            <tr className="border-b border-[#222]">
              <th className="sticky left-0 z-30 bg-[#111] w-[240px] text-left px-4 py-3 text-[#666] font-bold uppercase tracking-wider">Metric</th>
              <th className="w-[240px] text-center px-4 py-3 bg-[#161616] border-x border-[#222]">
                <div className="text-[#F5364E] font-black uppercase tracking-tighter text-[10px] mb-1">Our Site</div>
                <div className="text-white font-bold truncate">{ownProfile?.domain || 'Target Site'}</div>
              </th>
              {competitorProfiles.map(comp => (
                <th key={comp.domain} className="w-[240px] text-center px-4 py-3 border-r border-[#222] relative group">
                  <button 
                    onClick={() => handleRemoveCompetitor(comp.domain)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-[#444] hover:text-red-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="text-[#aaa] font-bold uppercase tracking-tighter text-[10px] mb-1">Competitor</div>
                  <div className="text-white font-bold truncate">{comp.businessName || comp.domain}</div>
                  {crawlingDomains.has(comp.domain) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                      <RefreshCw size={16} className="text-[#F5364E] animate-spin mb-1" />
                      <div className="text-[8px] text-[#F5364E] font-bold uppercase">{crawlProgress[comp.domain]?.stage || 'Crawling'}</div>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_CATEGORIES.map(category => (
              <Fragment key={category}>
                {/* Category Header Row */}
                <tr 
                  onClick={() => toggleCategory(category)}
                  className="cursor-pointer bg-[#161616] hover:bg-[#1a1a1a] group border-b border-[#222]"
                >
                  <td colSpan={2 + competitorProfiles.length} className="px-4 py-2 text-white font-bold flex items-center gap-2">
                    <ChevronDown size={14} className={`transition-transform duration-200 ${collapsedCategories.has(category) ? '-rotate-90' : ''}`} />
                    {category}
                    <div className="flex-1 h-[1px] bg-[#222] ml-4" />
                  </td>
                </tr>

                {/* Data Rows */}
                {!collapsedCategories.has(category) && 
                  COMPARISON_ROWS.filter(r => r.category === category).map(row => (
                    <tr key={row.id} className="border-b border-[#1a1a1a] hover:bg-[#111]/40 group h-10 transition-colors">
                      <td className="sticky left-0 z-10 bg-[#0a0a0a] px-4 py-2 border-r border-[#1a1a1a] group-hover:bg-[#111] transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#aaa] font-medium leading-tight">{row.label}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {row.source !== 'crawl' && <SourceBadge source={row.source} />}
                            {row.tooltip && (
                              <div className="relative group/tip">
                                <Info size={12} className="text-[#333] cursor-help" />
                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-48 p-2 bg-[#222] text-white text-[10px] rounded shadow-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 pointer-events-none">
                                  {row.tooltip}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 bg-[#161616]/20 border-x border-[#1a1a1a] text-center">
                        <MatrixCell profile={ownProfile} row={row} isOwn={true} />
                      </td>
                      {competitorProfiles.map(comp => (
                        <td key={comp.domain} className="px-4 py-2 border-r border-[#1a1a1a] text-center relative group/cell">
                          <MatrixCell 
                            profile={comp} 
                            row={row} 
                            isOwn={false}
                            ownValue={ownProfile ? getProfileValue(ownProfile, row.profileKey) : null}
                            isEditing={editingCell?.domain === comp.domain && editingCell?.rowId === row.id}
                            onStartEdit={() => row.isManualEntry && setEditingCell({ domain: comp.domain, rowId: row.id })}
                            onSaveEdit={(val) => handleSaveEdit(comp.domain, row.profileKey, val)}
                          />
                          {row.isManualEntry && !editingCell && (
                            <button 
                              onClick={() => setEditingCell({ domain: comp.domain, rowId: row.id })}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 text-[#444] hover:text-white"
                            >
                              <Pencil size={10} />
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                }
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddCompetitorModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddCompetitor}
        />
      )}
    </div>
  );
}

function MatrixCell({ 
  profile, 
  row, 
  isOwn, 
  ownValue,
  isEditing,
  onStartEdit,
  onSaveEdit
}: { 
  profile: CompetitorProfile | null; 
  row: typeof COMPARISON_ROWS[0]; 
  isOwn: boolean;
  ownValue?: any;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onSaveEdit?: (val: any) => void;
}) {
  const value = profile ? getProfileValue(profile, row.profileKey) : null;
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  if (isEditing) {
    if (row.format === 'manual_boolean') {
      return (
        <div className="flex items-center justify-center gap-2">
          <input 
            type="checkbox" 
            checked={!!localVal} 
            onChange={(e) => onSaveEdit?.(e.target.checked)}
            autoFocus
          />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <input 
          type="text"
          value={localVal || ''}
          onChange={(e) => setLocalVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit?.(localVal);
            if (e.key === 'Escape') onStartEdit?.(); // Actually just toggles off
          }}
          className="w-full bg-[#111] border border-[#F5364E] text-white px-1 py-0.5 rounded outline-none text-[12px]"
          autoFocus
        />
      </div>
    );
  }

  if (!profile || (value === null && !row.isManualEntry)) {
    return <span className="text-[#333]">/</span>;
  }

  // Calculate comparison color
  let colorClass = 'text-white';
  if (!isOwn && ownValue !== null && value !== null) {
    if (row.format === 'number' || row.format === 'currency' || row.format === 'score_100') {
      // For these metrics, higher is usually better.
      // Green = they are beating us. Red = we are beating them.
      if (value > ownValue) colorClass = 'text-green-400';
      else if (value < ownValue) colorClass = 'text-red-400';
    } else if (row.format === 'boolean' || row.format === 'manual_boolean') {
      if (value && !ownValue) colorClass = 'text-green-400';
      if (!value && ownValue) colorClass = 'text-red-400';
    }
  }

  const renderValue = () => {
    switch (row.format) {
      case 'boolean':
      case 'manual_boolean':
        return value ? <Check size={14} className="text-green-500 mx-auto" strokeWidth={3} /> : <X size={14} className="text-red-500 mx-auto" strokeWidth={3} />;
      
      case 'url':
        const displayUrl = String(value).replace(/^https?:\/\//, '').replace(/\/$/, '');
        return (
          <a href={String(value)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center justify-center gap-1 group/link">
            <span className="truncate max-w-[120px]">{displayUrl}</span>
            <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100" />
          </a>
        );
      
      case 'number':
        return <span className={`font-mono font-bold ${colorClass}`}>{Number(value).toLocaleString()}</span>;
      
      case 'currency':
        return <span className={`font-mono font-bold ${colorClass}`}>${Number(value).toLocaleString()}</span>;
      
      case 'score_100':
        const num = Number(value);
        const bg = num >= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30' : num >= 40 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
        return (
          <div className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-black min-w-[32px] ${bg}`}>
            {num}
          </div>
        );
      
      case 'list':
        if (!Array.isArray(value) || value.length === 0) return <span className="text-[#333]">/</span>;
        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {value.slice(0, 3).map((item, i) => (
              <span key={i} className="px-1 bg-[#222] text-[#aaa] rounded text-[10px] whitespace-nowrap">{item}</span>
            ))}
            {value.length > 3 && <span className="text-[#444] text-[10px]">+{value.length - 3}</span>}
          </div>
        );
      
      case 'text':
      case 'manual_text':
      default:
        return <span className={`font-medium ${colorClass}`}>{String(value)}</span>;
    }
  };

  return (
    <div className="cursor-default flex items-center justify-center min-h-[20px]">
      {renderValue()}
    </div>
  );
}

function SourceBadge({ source }: { source: DataSource }) {
  const iconProps = { size: 10, className: "shrink-0" };
  switch (source) {
    case 'ai': return <Bot {...iconProps} className="text-purple-400" />;
    case 'manual': return <Pencil {...iconProps} className="text-blue-400" />;
    case 'backlinks': return <LinkIcon {...iconProps} className="text-orange-400" />;
    case 'gsc': return <BarChart2 {...iconProps} className="text-green-400" />;
    case 'ga4': return <Globe {...iconProps} className="text-teal-400" />;
    case 'social_api': return <Smartphone {...iconProps} className="text-pink-400" />;
    default: return null;
  }
}

function AddCompetitorModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, url: string) => void }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!name) {
      try {
        const domain = new URL(val.startsWith('http') ? val : `https://${val}`).hostname.replace(/^www\./, '').split('.')[0];
        setName(domain.charAt(0).toUpperCase() + domain.slice(1));
      } catch { /* ignore */ }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#222] w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between">
          <h3 className="font-bold text-white">Add New Competitor</h3>
          <button onClick={onClose} className="text-[#666] hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#666] uppercase mb-1">Competitor URL</label>
            <input 
              type="text"
              placeholder="https://competitor.com"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] text-white px-4 py-2 rounded shadow-inner outline-none focus:border-[#F5364E]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#666] uppercase mb-1">Display Name (Optional)</label>
            <input 
              type="text"
              placeholder="Competitor Brand"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] text-white px-4 py-2 rounded shadow-inner outline-none focus:border-[#F5364E]"
            />
          </div>
          <div className="bg-[#1a1313] p-3 rounded-lg border border-red-900/30 flex gap-3">
            <Bot size={20} className="text-[#F5364E] shrink-0" />
            <div className="text-[11px] text-[#aaa] leading-relaxed">
              Adding a competitor will trigger a <span className="text-white font-bold">Ghost Micro-Crawl</span> (20-30 pages) and AI extraction. This session is isolated and won't affect your project crawl limits.
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-[#0d0d0d] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[#aaa] hover:text-white font-bold text-xs uppercase">Cancel</button>
          <button 
            onClick={() => {
              if (url) {
                onSubmit(name || url, url);
                onClose();
              }
            }}
            disabled={!url}
            className="px-6 py-2 bg-[#F5364E] text-white rounded font-bold text-xs uppercase hover:bg-[#d42d42] disabled:opacity-30"
          >
            Add & Analyze
          </button>
        </div>
      </div>
    </div>
  );
}
