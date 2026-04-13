import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../../../../contexts/CrawlerUIContext';
import { exportMatrixCSV, downloadCSV } from '../../../../services/CompetitorMatrixExport';
import {
  LayoutGrid, BarChart3, Crosshair, Clock, FileText,
  Plus, RefreshCw, Download, Loader2
} from 'lucide-react';
import type { CompetitiveViewMode } from '../../../../contexts/SeoCrawlerContext';

const VIEWS: { id: CompetitiveViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'matrix',      label: 'Matrix',      icon: <LayoutGrid size={14} /> },
  { id: 'charts',      label: 'Charts',      icon: <BarChart3 size={14} /> },
  { id: 'battlefield', label: 'Battlefield', icon: <Crosshair size={14} /> },
  { id: 'timeline',    label: 'Timeline',    icon: <Clock size={14} /> },
  { id: 'brief',       label: 'AI Brief',    icon: <FileText size={14} /> },
];

export default function CompetitorToolbar() {
  const {
    competitiveViewMode, setCompetitiveViewMode,
    competitorProfiles, ownProfile,
    showAddCompetitorInput, setShowAddCompetitorInput,
    refreshAllCompetitors, crawlingCompetitorDomain,
  } = useSeoCrawler();

  const handleExport = () => {
    const csv = exportMatrixCSV(ownProfile, competitorProfiles);
    downloadCSV(csv, `headlight_competitive_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="h-[48px] flex items-center justify-between px-4 border-b border-[#1a1a1e] bg-[#0d0d0f]">
      {/* Left: View Switcher */}
      <div className="flex items-center gap-1 bg-[#111] rounded-lg p-0.5 border border-[#222]">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setCompetitiveViewMode(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all
              ${competitiveViewMode === v.id
                ? 'bg-[#F5364E]/10 text-[#F5364E] shadow-[inset_0_0_0_1px_rgba(245,54,78,0.22)]'
                : 'text-[#888] hover:bg-[#1a1a1e] hover:text-[#ccc]'
              }`}
          >
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Competitor pills */}
        <div className="flex items-center gap-1.5 mr-2">
          {ownProfile && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F5364E]/15 text-[#F5364E] border border-[#F5364E]/20">
              {ownProfile.domain} (You)
            </span>
          )}
          {competitorProfiles.map(comp => (
            <span
              key={comp.domain}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all
                ${crawlingCompetitorDomain === comp.domain
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse'
                  : 'bg-[#1a1a1e] text-[#aaa] border-[#2a2a2e] hover:border-[#444]'
                }`}
            >
              {crawlingCompetitorDomain === comp.domain && <Loader2 size={10} className="inline mr-1 animate-spin" />}
              {comp.domain}
            </span>
          ))}
        </div>

        <button
          onClick={() => setShowAddCompetitorInput(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#888] hover:text-white hover:bg-[#1a1a1e] border border-[#222] transition-all"
        >
          <Plus size={12} /> Add
        </button>

        <button
          onClick={refreshAllCompetitors}
          disabled={!!crawlingCompetitorDomain}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#888] hover:text-white hover:bg-[#1a1a1e] border border-[#222] transition-all disabled:opacity-40"
        >
          <RefreshCw size={12} className={crawlingCompetitorDomain ? 'animate-spin' : ''} /> Re-crawl
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#888] hover:text-white hover:bg-[#1a1a1e] border border-[#222] transition-all"
        >
          <Download size={12} /> CSV
        </button>
      </div>
    </div>
  );
}
