import React, { useMemo, useState } from 'react';
import {
    ChevronDown, ChevronRight, Wrench, FileText, Briefcase,
    ArrowUpDown, Search as SearchIcon,
} from 'lucide-react';
import { useSeoCrawler } from '../../../../contexts/SeoCrawlerContext';
import ViewHeader        from './shared/ViewHeader';
import PagePreviewRow    from './shared/PagePreviewRow';
import ImpactBar         from './shared/ImpactBar';
import EmptyViewState    from './shared/EmptyViewState';

type Cat = 'technical' | 'content' | 'industry';
type SortKey = 'impact' | 'count' | 'priority';

const COLUMNS: Array<{ id: Cat; label: string; icon: React.ElementType; barColor: string; tint: string }> = [
    { id: 'technical', label: 'Technical',  icon: Wrench,    barColor: '#ef4444', tint: 'border-red-500/25 bg-red-500/[0.03]' },
    { id: 'content',   label: 'Content',    icon: FileText,  barColor: '#3b82f6', tint: 'border-blue-500/25 bg-blue-500/[0.03]' },
    { id: 'industry',  label: 'Industry',   icon: Briefcase, barColor: '#a855f7', tint: 'border-purple-500/25 bg-purple-500/[0.03]' },
];

export default function WqaActionsView() {
    const { wqaState, setWqaFilter, wqaFilter } = useSeoCrawler() as any;
    const groups = wqaState?.actionGroups || [];

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [shownPerBucket, setShownPerBucket] = useState<Record<string, number>>({});
    const [catsOn, setCatsOn] = useState<Record<Cat, boolean>>({ technical: true, content: true, industry: true });
    const [sortKey, setSortKey] = useState<SortKey>('impact');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return groups.filter((g: any) =>
            catsOn[g.category as Cat] &&
            (!q || g.action.toLowerCase().includes(q) || (g.reason || '').toLowerCase().includes(q))
        );
    }, [groups, catsOn, search]);

    const byCategory = useMemo(() => {
        const out: Record<Cat, any[]> = { technical: [], content: [], industry: [] };
        for (const g of filtered) {
            if (g.category in out) out[g.category as Cat] = [...out[g.category as Cat], g];
        }
        const sorter = (a: any, b: any) => {
            if (sortKey === 'count')    return (b.count || 0) - (a.count || 0);
            if (sortKey === 'priority') return (a.avgPriority || 99) - (b.avgPriority || 99);
            return (b.impact || 0) - (a.impact || 0);
        };
        (Object.keys(out) as Cat[]).forEach((k) => { out[k] = [...out[k]].sort(sorter); });
        return out;
    }, [filtered, sortKey]);

    const maxImpact = Math.max(1, ...filtered.map((g: any) => g.impact || 0));
    const totalActions = filtered.length;
    const totalPages = filtered.reduce((s: number, g: any) => s + (g.count || 0), 0);

    if ((groups || []).length === 0) {
        return <EmptyViewState
            title="No actions assigned yet"
            subtitle="Run Strategic Audit to let Headlight pick a technical, content, and industry action for every page."
        />;
    }

    return (
        <div className="flex-1 flex flex-col bg-[#070707] overflow-hidden">
            <div className="h-[40px] px-4 border-b border-[#111] bg-[#080808] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-[11px] text-[#555] uppercase tracking-widest mr-2">Actions</span>
                    {COLUMNS.map(({ id, label, icon: Icon }) => {
                        const on = catsOn[id];
                        return (
                            <button
                                key={id}
                                onClick={() => setCatsOn((v) => ({ ...v, [id]: !v[id] }))}
                                className={`h-[24px] px-2 text-[10px] rounded border flex items-center gap-1.5 transition-colors ${
                                    on
                                        ? 'border-[#333] bg-[#1a1a1a] text-white'
                                        : 'border-[#1a1a1a] bg-[#0a0a0a] text-[#555] hover:text-[#888]'
                                }`}
                            >
                                <Icon size={10} />
                                {label}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <SearchIcon size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#555]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter actions"
                            className="h-[24px] pl-7 pr-2 w-[140px] text-[10px] bg-[#0a0a0a] border border-[#1e1e1e] rounded text-[#ddd] placeholder-[#555] focus:outline-none focus:border-[#F5364E]"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as SortKey)}
                            className="appearance-none h-[24px] pl-6 pr-4 text-[10px] bg-[#0a0a0a] border border-[#1e1e1e] rounded text-[#ddd] hover:border-[#333] focus:outline-none focus:border-[#F5364E] cursor-pointer"
                        >
                            <option value="impact">Impact</option>
                            <option value="count">Pages</option>
                            <option value="priority">Priority</option>
                        </select>
                        <ArrowUpDown size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                    {COLUMNS.filter((c) => catsOn[c.id]).map(({ id, label, icon: Icon, tint, barColor }) => {
                        const list = byCategory[id];
                        const colTotal = list.reduce((s, g) => s + (g.count || 0), 0);
                        return (
                            <div key={id} className={`rounded-lg border ${tint} flex flex-col overflow-hidden min-h-0`}>
                                <div className="h-[38px] px-3 border-b border-[#1e1e1e] bg-[#0a0a0a] flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Icon size={12} className="text-[#888]" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-white">{label}</span>
                                        <span className="text-[10px] font-mono text-[#555]">· {list.length}</span>
                                    </div>
                                    <span className="text-[10px] text-[#666] font-mono">{colTotal.toLocaleString()} pages</span>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-0">
                                    {list.length === 0 && (
                                        <div className="text-[11px] text-[#555] text-center py-8">No {label.toLowerCase()} actions.</div>
                                    )}
                                    {list.map((g: any) => {
                                        const key = `${g.category}:${g.action}`;
                                        const isOpen = !!expanded[key];
                                        const shown = shownPerBucket[key] ?? 10;
                                        const visible = g.pages.slice(0, shown);
                                        return (
                                            <div key={key} className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-md overflow-hidden">
                                                <button
                                                    onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))}
                                                    className="w-full px-2.5 py-2 flex items-center gap-2 hover:bg-[#111] transition-colors text-left"
                                                >
                                                    {isOpen
                                                        ? <ChevronDown  size={11} className="text-[#666]" />
                                                        : <ChevronRight size={11} className="text-[#666]" />}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[12px] text-white truncate">{g.action}</div>
                                                        {g.reason && <div className="text-[10px] text-[#666] truncate">{g.reason}</div>}
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-[11px] font-mono text-white">{g.count}</div>
                                                        <div className="text-[9px] text-[#555]">pages</div>
                                                    </div>
                                                </button>

                                                <div className="px-2.5 pb-2">
                                                    <ImpactBar value={g.impact || 0} max={maxImpact} color={barColor} />
                                                    <div className="mt-1 flex items-center justify-between text-[9px] text-[#666]">
                                                        <div className="flex items-center gap-2">
                                                            <span>Impact {Math.round(g.impact || 0).toLocaleString()}</span>
                                                            <span>·</span>
                                                            <span>Effort {g.effort || '—'}</span>
                                                            <span>·</span>
                                                            <span>Priority {g.avgPriority ? Math.round(g.avgPriority) : '—'}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setWqaFilter({
                                                                    ...wqaFilter,
                                                                    ...(id === 'technical' ? { technicalAction: g.action } : {}),
                                                                    ...(id === 'content'   ? { contentAction: g.action }   : {}),
                                                                });
                                                            }}
                                                            className="text-[#888] hover:text-white"
                                                        >
                                                            Filter grid →
                                                        </button>
                                                    </div>
                                                </div>

                                                {isOpen && (
                                                    <div className="border-t border-[#1e1e1e] p-2 space-y-1 max-h-[260px] overflow-y-auto custom-scrollbar">
                                                        {visible.map((p: any) => (
                                                            <PagePreviewRow key={p.url} page={p} showAction={false} />
                                                        ))}
                                                        {g.pages.length > visible.length && (
                                                            <button
                                                                onClick={() => setShownPerBucket((v) => ({ ...v, [key]: (v[key] ?? 10) + 20 }))}
                                                                className="w-full text-center py-1 text-[10px] text-[#888] hover:text-white"
                                                            >
                                                                Show {Math.min(20, g.pages.length - visible.length)} more ({g.pages.length - visible.length} remaining)
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
