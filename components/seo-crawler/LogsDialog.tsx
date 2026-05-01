import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
    X, Search, CheckCircle2, AlertTriangle, XCircle, Info,
    ArrowLeft, Download, Trash2, ChevronDown, ChevronRight,
    Globe, Server, History, BarChart3, Settings2, Cpu, Users,
    Filter, Clock, Zap, ExternalLink, Copy, Check
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';

/* ─── Types ─── */
interface LogEntry {
    msg: string;
    type: 'info' | 'warn' | 'error' | 'success';
    time: number;
    source?: string;
    url?: string;
    sessionId?: string;
    detail?: string;
}

type SourceFilter = 'all' | 'crawler' | 'system' | 'analysis' | 'enrichment' | 'session' | 'history' | 'collaboration';
type TypeFilter = 'all' | 'info' | 'warn' | 'error' | 'success';

interface LogsPageProps {
    onClose: () => void;
}

/* ─── Constants ─── */
const SOURCE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    crawler:       { label: 'Scanner',       icon: <Globe size={13} />,     color: '#60a5fa' },
    system:        { label: 'System',        icon: <Settings2 size={13} />, color: '#a78bfa' },
    analysis:      { label: 'Analysis',      icon: <BarChart3 size={13} />, color: '#34d399' },
    enrichment:    { label: 'Enrichment',    icon: <Zap size={13} />,       color: '#fbbf24' },
    session:       { label: 'Session',       icon: <Server size={13} />,    color: '#f472b6' },
    history:       { label: 'History',       icon: <History size={13} />,   color: '#fb923c' },
    collaboration: { label: 'Team',          icon: <Users size={13} />,     color: '#2dd4bf' },
};

const TYPE_META: Record<string, { label: string; dot: string; bg: string; border: string; text: string }> = {
    info:    { label: 'Info',    dot: 'bg-blue-400',    bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.12)',  text: '#93c5fd' },
    success: { label: 'Success', dot: 'bg-emerald-400', bg: 'rgba(52,211,153,0.06)',  border: 'rgba(52,211,153,0.12)',  text: '#6ee7b7' },
    warn:    { label: 'Warning', dot: 'bg-amber-400',   bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.12)',  text: '#fcd34d' },
    error:   { label: 'Error',   dot: 'bg-red-400',     bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.12)', text: '#fca5a5' },
};

/* ─── Helpers ─── */
const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const groupByDate = (logs: LogEntry[]): Map<string, LogEntry[]> => {
    const groups = new Map<string, LogEntry[]>();
    for (const log of logs) {
        const key = formatDate(log.time);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(log);
    }
    return groups;
};

/* ─── Component ─── */
export default function LogsDialog({ onClose }: LogsPageProps) {
    const { logs, logSearch, setLogSearch, logTypeFilter, setLogTypeFilter, setLogs,
            isCrawling, crawlRuntime, elapsedTime } = useSeoCrawler();

    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const feedEndRef = useRef<HTMLDivElement>(null);
    const feedRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const typedLogs = logs as LogEntry[];

    /* ─── Filtering ─── */
    const filtered = useMemo(() => {
        return typedLogs.filter(log => {
            if (logTypeFilter !== 'all' && log.type !== logTypeFilter) return false;
            if (sourceFilter !== 'all' && (log.source || 'crawler') !== sourceFilter) return false;
            if (logSearch) {
                const q = logSearch.toLowerCase();
                const msgMatch = log.msg?.toLowerCase().includes(q);
                const urlMatch = log.url?.toLowerCase().includes(q);
                const detailMatch = log.detail?.toLowerCase().includes(q);
                if (!msgMatch && !urlMatch && !detailMatch) return false;
            }
            return true;
        });
    }, [typedLogs, logTypeFilter, sourceFilter, logSearch]);

    /* ─── Summary counters ─── */
    const counts = useMemo(() => {
        const c = { total: typedLogs.length, info: 0, success: 0, warn: 0, error: 0, bySrc: {} as Record<string, number> };
        for (const l of typedLogs) {
            c[l.type] = (c[l.type] || 0) + 1;
            const src = l.source || 'crawler';
            c.bySrc[src] = (c.bySrc[src] || 0) + 1;
        }
        return c;
    }, [typedLogs]);

    /* ─── Auto-scroll ─── */
    useEffect(() => {
        if (autoScroll) feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filtered.length, autoScroll]);

    const handleScroll = useCallback(() => {
        if (!feedRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
        setAutoScroll(scrollHeight - scrollTop - clientHeight < 80);
    }, []);

    /* ─── Actions ─── */
    const handleExport = useCallback(() => {
        const lines = filtered.map(l =>
            `[${new Date(l.time).toISOString()}] [${l.type.toUpperCase()}] [${l.source || 'crawler'}] ${l.msg}${l.url ? ` (${l.url})` : ''}`
        );
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `headlight-activity-${new Date().toISOString().slice(0, 10)}.log`;
        a.click();
        URL.revokeObjectURL(a.href);
    }, [filtered]);

    const handleCopy = useCallback((log: LogEntry, idx: number) => {
        navigator.clipboard.writeText(`[${new Date(log.time).toISOString()}] ${log.msg}${log.url ? ` — ${log.url}` : ''}`);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
    }, []);

    const handleClear = useCallback(() => { setLogs([]); }, [setLogs]);

    const dateGroups = useMemo(() => groupByDate(filtered), [filtered]);

    /* ─── Render ─── */
    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#08080b]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ━━ Top Bar ━━ */}
            <header className="shrink-0 border-b border-[#1a1a1f]" style={{ background: 'linear-gradient(180deg, #0e0e12 0%, #0b0b0f 100%)' }}>
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14141a] border border-[#222228] text-[#888] hover:text-white hover:border-[#333] transition-all">
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-[17px] font-bold text-white tracking-tight flex items-center gap-2.5">
                                Scan Activity
                                {isCrawling && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Live
                                    </span>
                                )}
                            </h1>
                            <p className="text-[12px] text-[#555] mt-0.5">
                                {counts.total === 0 ? 'No activity recorded yet' : `${counts.total} events recorded`}
                                {isCrawling && elapsedTime ? ` · Running ${elapsedTime}` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExport} disabled={filtered.length === 0}
                            className="flex items-center gap-1.5 rounded-xl border border-[#222228] bg-[#14141a] px-3.5 py-2 text-[11px] font-semibold text-[#999] hover:text-white hover:border-[#333] transition-all disabled:opacity-30 disabled:pointer-events-none">
                            <Download size={13} /> Export
                        </button>
                        <button onClick={handleClear} disabled={typedLogs.length === 0}
                            className="flex items-center gap-1.5 rounded-xl border border-[#2a1a1c] bg-[#1a0e10] px-3.5 py-2 text-[11px] font-semibold text-[#e8838d] hover:border-[#3d2226] transition-all disabled:opacity-30 disabled:pointer-events-none">
                            <Trash2 size={13} /> Clear
                        </button>
                        <button onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14141a] border border-[#222228] text-[#666] hover:text-white hover:border-[#333] transition-all ml-1">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ━━ Summary Cards ━━ */}
                <div className="flex gap-2 px-6 pb-4 overflow-x-auto">
                    {(['info', 'success', 'warn', 'error'] as const).map(t => {
                        const m = TYPE_META[t];
                        const c = counts[t];
                        const active = logTypeFilter === t;
                        return (
                            <button key={t} onClick={() => setLogTypeFilter(active ? 'all' : t)}
                                className="shrink-0 rounded-xl px-4 py-2.5 text-left transition-all border"
                                style={{
                                    background: active ? m.bg : 'rgba(255,255,255,0.02)',
                                    borderColor: active ? m.border : '#1a1a1f',
                                }}>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                                    <span className="text-[11px] font-semibold" style={{ color: active ? m.text : '#777' }}>{m.label}</span>
                                </div>
                                <div className="text-[20px] font-black mt-1 tabular-nums" style={{ color: active ? m.text : '#ccc' }}>{c}</div>
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* ━━ Toolbar ━━ */}
            <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-[#1a1a1f] bg-[#0a0a0e]">
                <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                    <input type="text" placeholder="Search events, URLs, messages..."
                        value={logSearch} onChange={e => setLogSearch(e.target.value)}
                        className="w-full rounded-xl border border-[#1e1e24] bg-[#111116] pl-9 pr-4 py-2 text-[13px] text-white placeholder:text-[#444] focus:border-[#333] focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all" />
                </div>

                <button onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] font-semibold transition-all ${
                        sourceFilter !== 'all'
                            ? 'border-blue-500/30 bg-blue-500/8 text-blue-400'
                            : 'border-[#222228] bg-[#14141a] text-[#888] hover:text-white hover:border-[#333]'
                    }`}>
                    <Filter size={13} />
                    Source
                    {sourceFilter !== 'all' && <span className="ml-1 text-[10px] opacity-70">· {SOURCE_META[sourceFilter]?.label}</span>}
                </button>

                <div className="ml-auto text-[11px] text-[#555] tabular-nums">
                    {filtered.length}{filtered.length !== counts.total ? ` of ${counts.total}` : ''} events
                </div>
            </div>

            {/* ━━ Source Filter Drawer ━━ */}
            {showFilters && (
                <div className="shrink-0 flex flex-wrap gap-2 px-6 py-3 border-b border-[#1a1a1f] bg-[#0c0c10]">
                    <button onClick={() => { setSourceFilter('all'); setShowFilters(false); }}
                        className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold border transition-all ${
                            sourceFilter === 'all' ? 'bg-white text-black border-white' : 'border-[#222] text-[#888] hover:text-white hover:border-[#444]'
                        }`}>
                        All Sources
                    </button>
                    {Object.entries(SOURCE_META).map(([key, meta]) => {
                        const c = counts.bySrc[key] || 0;
                        const active = sourceFilter === key;
                        return (
                            <button key={key} onClick={() => { setSourceFilter(key as SourceFilter); setShowFilters(false); }}
                                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold border transition-all ${
                                    active ? 'border-white/20 bg-white/10 text-white' : 'border-[#222] text-[#888] hover:text-white hover:border-[#444]'
                                }`}>
                                <span style={{ color: meta.color }}>{meta.icon}</span>
                                {meta.label}
                                <span className="text-[10px] opacity-50">{c}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ━━ Activity Feed ━━ */}
            <div ref={feedRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#222 transparent' }}>
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-[#111116] border border-[#1e1e24] flex items-center justify-center mb-4">
                            <Clock size={24} className="text-[#333]" />
                        </div>
                        <p className="text-[15px] font-semibold text-[#555]">No activity yet</p>
                        <p className="text-[12px] text-[#444] mt-1 max-w-xs">
                            {counts.total > 0 ? 'No events match your current filters. Try adjusting them.' : 'Start a scan to see live activity appear here.'}
                        </p>
                    </div>
                ) : (
                    Array.from(dateGroups.entries()).map(([dateLabel, entries]) => (
                        <div key={dateLabel} className="mb-6 last:mb-0">
                            {/* Date header */}
                            <div className="flex items-center gap-3 mb-3 sticky top-0 z-10 py-1" style={{ background: 'linear-gradient(180deg, #08080b 60%, transparent)' }}>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444]">{dateLabel}</span>
                                <div className="flex-1 h-px bg-[#161619]" />
                                <span className="text-[10px] text-[#333] tabular-nums">{entries.length} events</span>
                            </div>

                            <div className="space-y-1">
                                {entries.map((log, i) => {
                                    const globalIdx = typedLogs.indexOf(log);
                                    const isExpanded = expandedIdx === globalIdx;
                                    const src = log.source || 'crawler';
                                    const srcMeta = SOURCE_META[src] || SOURCE_META.crawler;
                                    const typeMeta = TYPE_META[log.type] || TYPE_META.info;

                                    return (
                                        <div key={`${log.time}-${i}`}
                                            className="group rounded-xl border transition-all cursor-pointer"
                                            style={{
                                                background: isExpanded ? typeMeta.bg : 'transparent',
                                                borderColor: isExpanded ? typeMeta.border : 'transparent',
                                            }}
                                            onClick={() => setExpandedIdx(isExpanded ? null : globalIdx)}
                                            onMouseEnter={e => { if (!isExpanded) { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = '#1a1a1f'; }}}
                                            onMouseLeave={e => { if (!isExpanded) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}}
                                        >
                                            <div className="flex items-start gap-3 px-4 py-2.5">
                                                {/* Timestamp */}
                                                <span className="shrink-0 text-[11px] tabular-nums text-[#444] pt-0.5 w-[62px]">
                                                    {formatTime(log.time)}
                                                </span>

                                                {/* Type dot */}
                                                <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${typeMeta.dot}`} />

                                                {/* Source badge */}
                                                <span className="shrink-0 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border border-[#1a1a1f] bg-[#111116]"
                                                    style={{ color: srcMeta.color }}>
                                                    {srcMeta.icon}
                                                    <span className="hidden sm:inline">{srcMeta.label}</span>
                                                </span>

                                                {/* Message */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] leading-relaxed text-[#c8c8cf] break-words">{log.msg}</p>
                                                    {log.url && !isExpanded && (
                                                        <span className="text-[11px] text-[#444] truncate block mt-0.5 max-w-md">{log.url.replace(/^https?:\/\//, '')}</span>
                                                    )}
                                                </div>

                                                {/* Expand indicator */}
                                                {(log.url || log.detail) && (
                                                    <span className="shrink-0 text-[#333] group-hover:text-[#555] transition-colors mt-0.5">
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Expanded detail */}
                                            {isExpanded && (
                                                <div className="px-4 pb-3 pt-0 ml-[82px] space-y-2">
                                                    {log.url && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#555]">URL</span>
                                                            <a href={log.url} target="_blank" rel="noopener noreferrer"
                                                                className="text-[12px] text-blue-400/80 hover:text-blue-300 truncate max-w-lg flex items-center gap-1">
                                                                {log.url} <ExternalLink size={10} />
                                                            </a>
                                                        </div>
                                                    )}
                                                    {log.detail && (
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#555]">Detail</span>
                                                            <p className="text-[12px] text-[#888] mt-0.5">{log.detail}</p>
                                                        </div>
                                                    )}
                                                    {log.sessionId && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#555]">Session</span>
                                                            <span className="text-[11px] text-[#666] font-mono">{log.sessionId.slice(0, 12)}…</span>
                                                        </div>
                                                    )}
                                                    <button onClick={e => { e.stopPropagation(); handleCopy(log, globalIdx); }}
                                                        className="flex items-center gap-1 text-[10px] font-semibold text-[#555] hover:text-white transition-colors mt-1">
                                                        {copiedIdx === globalIdx ? <><Check size={11} className="text-emerald-400" /> Copied</> : <><Copy size={11} /> Copy entry</>}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
                <div ref={feedEndRef} />
            </div>

            {/* ━━ Sticky bottom: scroll-to-bottom indicator ━━ */}
            {!autoScroll && filtered.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                    <button onClick={() => { setAutoScroll(true); feedEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                        className="flex items-center gap-2 rounded-full bg-[#18181e] border border-[#2a2a30] px-4 py-2 text-[11px] font-semibold text-white shadow-xl hover:bg-[#222] transition-all">
                        <ChevronDown size={13} /> Jump to latest
                    </button>
                </div>
            )}
        </div>
    );
}
