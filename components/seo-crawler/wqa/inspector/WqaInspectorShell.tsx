import React, { useEffect, useMemo } from 'react';
import {
  ExternalLink, Maximize2, MessageCircle, Minimize2, UserPlus,
  LayoutDashboard, ListChecks, Search, FileText, Link2, Wrench, Braces, Factory
} from 'lucide-react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import type { WqaInspectorTab } from '../../../../contexts/SeoCrawlerContext';
import SummaryTab from './tabs/SummaryTab';
import ActionsTab from './tabs/ActionsTab';
import SearchTab from './tabs/SearchTab';
import ContentTab from './tabs/ContentTab';
import TechTab from './tabs/TechTab';
import IndustryTab from './tabs/IndustryTab';
import LinksTab from '../../inspector/LinksTab';
import SchemaTab from '../../inspector/SchemaTab';
import { formatIndustryLabel } from '../wqaUtils';

type TabDef = {
  id: WqaInspectorTab;
  label: string;
  Icon: React.ElementType;
  count?: (page: any) => number | undefined;
};

const baseTabs: TabDef[] = [
  { id: 'summary',  label: 'Summary',  Icon: LayoutDashboard },
  { id: 'actions',  label: 'Actions',  Icon: ListChecks,
    count: (p) => countActions(p) },
  { id: 'search',   label: 'Search',   Icon: Search },
  { id: 'content',  label: 'Content',  Icon: FileText },
  { id: 'links',    label: 'Links',    Icon: Link2,
    count: (p) => Number(p?.inlinks || 0) + Number(p?.outlinks || 0) },
  { id: 'tech',     label: 'Tech',     Icon: Wrench },
  { id: 'schema',   label: 'Schema',   Icon: Braces,
    count: (p) => Array.isArray(p?.schemaTypes) ? p.schemaTypes.length : 0 },
  { id: 'industry', label: 'Industry', Icon: Factory },
];

function countActions(p: any): number {
  let n = 0;
  if (p?.technicalAction && p.technicalAction !== 'Monitor') n++;
  if (p?.contentAction  && p.contentAction  !== 'No Action') n++;
  if (p?.industryAction) n++;
  if (Array.isArray(p?.secondaryActions)) n += p.secondaryActions.length;
  return n || undefined as any;
}

const TAB_COMPONENTS: Record<WqaInspectorTab, React.FC<{ page: any }>> = {
  summary:  SummaryTab,
  actions:  ActionsTab,
  search:   SearchTab,
  content:  ContentTab,
  links:    LinksTab,
  tech:     TechTab,
  schema:   SchemaTab,
  industry: IndustryTab,
};

export default function WqaInspectorShell() {
  const {
    selectedPage, setSelectedPage,
    detailsHeight, setIsDraggingDetails,
    wqaInspectorTab, setWqaInspectorTab,
    inspectorCollapsed, setInspectorCollapsed,
    wqaState,
  } = useSeoCrawler();

  const industry = wqaState?.industryOverride ?? wqaState?.detectedIndustry ?? 'general';

  const tabs = useMemo(() => {
    // Relabel Industry tab with the actual industry (e.g. "News")
    return baseTabs.map((t) =>
      t.id === 'industry'
        ? { ...t, label: formatIndustryLabel(industry) || 'Industry' }
        : t
    );
  }, [industry]);

  const ActiveTab = useMemo(
    () => TAB_COMPONENTS[wqaInspectorTab] || SummaryTab,
    [wqaInspectorTab]
  );

  useEffect(() => {
    if (!selectedPage) return;
    const handler = (e: KeyboardEvent) => {
      const ids = tabs.map((t) => t.id);
      const idx = ids.indexOf(wqaInspectorTab);
      if ((e.ctrlKey || e.metaKey) && e.key === '[' && idx > 0) {
        e.preventDefault();
        setWqaInspectorTab(ids[idx - 1]);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ']' && idx < ids.length - 1) {
        e.preventDefault();
        setWqaInspectorTab(ids[idx + 1]);
      }
      if (e.key === 'Escape') setSelectedPage(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedPage, wqaInspectorTab, setWqaInspectorTab, setSelectedPage, tabs]);

  if (!selectedPage) return null;

  if (inspectorCollapsed) {
    return (
      <div className="h-[44px] border-t border-[#222] bg-[#111] flex items-center justify-between px-4 shrink-0">
        <div className="text-[11px] font-mono text-[#888] truncate">
          PAGE DETAIL: <span className="text-blue-400">{selectedPage.url}</span>
        </div>
        <button
          onClick={() => setInspectorCollapsed(false)}
          className="text-[#888] hover:text-white p-1 rounded hover:bg-[#222] transition-colors"
          title="Expand inspector"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ height: detailsHeight }}
      className="border-t border-[#222] bg-[#111] flex flex-col shrink-0 relative"
    >
      <div
        onMouseDown={() => setIsDraggingDetails(true)}
        className="absolute top-0 left-0 right-0 h-1.5 -mt-0.5 cursor-ns-resize z-50 transition-colors hover:bg-[#F5364E]"
      />

      {/* Tab strip */}
      <div className="h-[34px] border-b border-[#222] flex items-center px-4 justify-between bg-[#0a0a0a] shrink-0">
        <div className="flex h-full overflow-x-auto custom-scrollbar-hidden flex-1 mr-4">
          {tabs.map(({ id, label, Icon, count }) => {
            const c = count ? count(selectedPage) : undefined;
            const active = wqaInspectorTab === id;
            return (
              <button
                key={id}
                onClick={() => setWqaInspectorTab(id)}
                className={`px-3 pt-1 pb-1.5 text-[11px] font-medium border-r border-[#222] flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#111] text-white border-t-2 border-t-[#F5364E]'
                    : 'bg-transparent text-[#888] hover:bg-[#111] hover:text-[#ccc] border-t-2 border-t-transparent'
                }`}
              >
                <Icon size={12} className={active ? 'text-[#F5364E]' : 'text-[#666]'} />
                {label}
                {c !== undefined && (
                  <span className="text-[#555] font-mono text-[10px]">({c})</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button className="text-[#666] hover:text-white p-1 hover:bg-[#222] rounded" title="Assign">
            <UserPlus size={13} />
          </button>
          <button className="text-[#666] hover:text-white p-1 hover:bg-[#222] rounded" title="Comment">
            <MessageCircle size={13} />
          </button>
          <button
            onClick={() => window.open(selectedPage.url, '_blank', 'noopener,noreferrer')}
            className="text-[#666] hover:text-white p-1 hover:bg-[#222] rounded"
            title="Open in new tab"
          >
            <ExternalLink size={13} />
          </button>
          <button
            onClick={() => setInspectorCollapsed(true)}
            className="text-[#666] hover:text-white p-1 hover:bg-[#222] rounded"
            title="Collapse"
          >
            <Minimize2 size={13} />
          </button>
        </div>
      </div>

      {/* URL bar */}
      <div className="h-[28px] border-b border-[#1a1a1a] flex items-center px-4 bg-[#0d0d0d] shrink-0">
        <span className="text-[11px] font-mono text-[#F5364E] font-medium">PAGE DETAIL:</span>
        <span className="text-[11px] font-mono text-blue-400 ml-2 truncate">{selectedPage.url}</span>
      </div>

      <div className="flex-1 overflow-auto bg-[#111] p-5 text-[13px] text-[#ccc] custom-scrollbar">
        <ActiveTab page={selectedPage} />
      </div>
    </div>
  );
}
