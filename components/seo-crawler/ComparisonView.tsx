import React, { useEffect, useMemo, useState } from 'react';
import { 
    Download, Link2, X, Search, CheckSquare, Square, ExternalLink, TrendingUp, TrendingDown,
    BarChart3, Sidebar
} from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { downloadBlob, exportComparisonCSV } from '../../services/ExportService';
import { createTask as createTaskService } from '../../services/TaskService';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';

interface ComparisonViewProps {
    onClose: () => void;
}

const formatValue = (value: any) => {
    if (Array.isArray(value)) return value.join(', ') || '—';
    if (value && typeof value === 'object') return JSON.stringify(value);
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'number') {
        if (value > 1000000) return (value / 1000000).toFixed(1) + 'M';
        if (value > 1000) return (value / 1000).toFixed(1) + 'k';
        if (Number.isInteger(value)) return value.toString();
        return value.toFixed(2).replace(/\.00$/, '');
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
};

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-[#111]/95 backdrop-blur-md border border-[#333] shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-md p-3 min-w-[130px] flex flex-col z-[100] outline outline-1 outline-[#000]">
            {label && <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider pb-1.5 mb-2 border-b border-[#222]">{label}</span>}
            <div className="flex flex-col gap-2">
                {payload.map((entry: any, index: number) => {
                    const displayName = entry.name === 'value' ? entry.payload.name : entry.name;
                    const dotColor = entry.payload.fill || entry.payload.color || entry.color || '#ccc';
                    return (
                        <div key={index} className="flex items-center justify-between gap-5">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: dotColor }} />
                                <span className="text-[11px] font-medium text-[#ccc]">{displayName}</span>
                            </div>
                            <span className="text-[11px] font-mono text-white flex items-center justify-end">{formatValue(entry.value)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function ComparisonView({ onClose }: ComparisonViewProps) {
    const {
        crawlHistory,
        compareSessions,
        diffResult,
        currentSessionId,
        compareSessionId,
        pages,
        activeProject,
        user,
        addLog
    } = useSeoCrawler();

    const [leftSessionId, setLeftSessionId] = useState<string | null>(compareSessionId);
    const [rightSessionId, setRightSessionId] = useState<string | null>(currentSessionId);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRowUrl, setSelectedRowUrl] = useState<string | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
    const [selectedNewIssues, setSelectedNewIssues] = useState<Set<string>>(new Set());
    const [selectedFixedIssues, setSelectedFixedIssues] = useState<Set<string>>(new Set());

    const [sortField, setSortField] = useState<string>('url');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // Dynamic grid widths (index 1 is URL which is kept as 1fr dynamically or minimum pixel constraint)
    const defaultCols = [40, 0, 100, 100, 120, 120, 100, 100]; 
    const [colWidths, setColWidths] = useState<number[]>(defaultCols);

    const handleColumnResize = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.pageX;
        const startWidth = colWidths[index];

        const handleMouseMove = (moveEvent: MouseEvent) => {
            requestAnimationFrame(() => {
                const newWidth = Math.max(60, startWidth + (moveEvent.pageX - startX));
                setColWidths(prev => {
                    const next = [...prev];
                    next[index] = newWidth;
                    return next;
                });
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };

        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const toggleFilter = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
        setter(prev => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    };

    const orderedSessions = useMemo(() => crawlHistory.slice(), [crawlHistory]);

    useEffect(() => {
        const latest = orderedSessions[0]?.id || null;
        const previous = orderedSessions[1]?.id || null;
        setLeftSessionId((current) => current || compareSessionId || previous || latest);
        setRightSessionId((current) => current || currentSessionId || latest || previous);
    }, [orderedSessions, compareSessionId, currentSessionId]);

    useEffect(() => {
        if (!leftSessionId || !rightSessionId || leftSessionId === rightSessionId) return;
        void compareSessions(leftSessionId, rightSessionId);
    }, [leftSessionId, rightSessionId, compareSessions]);

    const exportDiff = () => {
        if (!diffResult) return;
        downloadBlob(exportComparisonCSV(diffResult), `compare_${leftSessionId}_${rightSessionId}.csv`);
    };

    const shareComparison = async () => {
        if (!leftSessionId || !rightSessionId) return;
        const url = new URL(window.location.href);
        url.searchParams.set('compareOld', leftSessionId);
        url.searchParams.set('compareNew', rightSessionId);
        await navigator.clipboard.writeText(url.toString());
        addLog('Comparison link copied to clipboard.', 'success');
    };

    const unifiedData = useMemo(() => {
        if (!diffResult) return [];
        const map = new Map<string, any>();
        const getOrInit = (url: string) => {
            if (!map.has(url)) {
                map.set(url, { url, types: new Set<string>(), issuesFixed: [], newIssues: [], fieldChanges: [], pageData: null });
            }
            return map.get(url);
        };

        (diffResult.added || []).forEach((p: any) => { const item = getOrInit(p.url); item.types.add('new'); item.pageData = p; });
        (diffResult.removed || []).forEach((p: any) => { const item = getOrInit(p.url); item.types.add('missing'); item.pageData = p; });
        (diffResult.changed || []).forEach((p: any) => { const item = getOrInit(p.url); item.types.add('modified'); item.fieldChanges = p.fieldChanges || []; });
        (diffResult.issuesFixed || []).forEach((p: any) => { const item = getOrInit(p.url); item.types.add('fixed'); item.issuesFixed = p.issues || []; });
        (diffResult.newIssues || []).forEach((p: any) => { const item = getOrInit(p.url); item.types.add('new_issues'); item.newIssues = p.issues || []; });

        const getDelta = (item: any, fld: string) => {
            const match = item.fieldChanges.find((f: any) => f.field === fld);
            return match ? Number(match.newValue || 0) - Number(match.oldValue || 0) : 0;
        };

        return Array.from(map.values()).map(item => {
            return {
                ...item,
                primaryType: item.types.has('missing') ? 'missing' : item.types.has('new') ? 'new' : item.types.has('new_issues') ? 'new_issues' : item.types.has('modified') ? 'modified' : 'fixed',
                types: Array.from(item.types),
                issuesDelta: item.newIssues.length - item.issuesFixed.length,
                healthDelta: getDelta(item, 'healthScore'),
                clicksDelta: getDelta(item, 'gscClicks'),
                positionDelta: getDelta(item, 'gscPosition'),
                loadTimeDelta: getDelta(item, 'loadTime'),
            };
        });
    }, [diffResult, pages]);

    const availableNewIssues = useMemo(() => {
        const issues = new Map<string, number>();
        unifiedData.forEach(row => row.newIssues.forEach((iss: any) => issues.set(iss.label, (issues.get(iss.label) || 0) + 1)));
        return Array.from(issues.entries()).sort((a,b) => b[1] - a[1]);
    }, [unifiedData]);

    const availableFixedIssues = useMemo(() => {
        const issues = new Map<string, number>();
        unifiedData.forEach(row => row.issuesFixed.forEach((iss: any) => issues.set(iss.label, (issues.get(iss.label) || 0) + 1)));
        return Array.from(issues.entries()).sort((a,b) => b[1] - a[1]);
    }, [unifiedData]);

    const filteredData = useMemo(() => {
        let result = unifiedData.filter(item => {
            if (searchQuery && !item.url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (selectedTypes.size > 0) {
                let matchType = false;
                if (selectedTypes.has('new') && item.types.includes('new')) matchType = true;
                if (selectedTypes.has('missing') && item.types.includes('missing')) matchType = true;
                if (selectedTypes.has('modified') && item.types.includes('modified')) matchType = true;
                if (!matchType) return false;
            }
            if (selectedNewIssues.size > 0 && !item.newIssues.some((iss: any) => selectedNewIssues.has(iss.label))) return false;
            if (selectedFixedIssues.size > 0 && !item.issuesFixed.some((iss: any) => selectedFixedIssues.has(iss.label))) return false;
            return true;
        });

        return result.sort((a, b) => {
            let valA: any = a[sortField as keyof typeof a];
            let valB: any = b[sortField as keyof typeof b];
            if (sortField === 'type') { valA = a.primaryType; valB = b.primaryType; }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [unifiedData, searchQuery, selectedTypes, selectedNewIssues, selectedFixedIssues, sortField, sortDir]);

    const handleSort = (field: string) => {
        if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const handleBulkTask = async () => {
        if (!activeProject?.id || selectedUrls.size === 0) return;
        try {
            const urls = Array.from(selectedUrls);
            await createTaskService(activeProject.id, {
                title: `Review ${urls.length} pages from comparison`,
                description: `These pages were selected from the crawl comparison view.\n\nURLs:\n${urls.slice(0, 10).join('\n')}${urls.length > 10 ? `\n...and ${urls.length - 10} more` : ''}`,
                priority: 'medium',
                category: 'crawler',
                affectedUrls: urls,
                createdBy: user?.id || 'system'
            } as any);
            addLog(`Task created for ${urls.length} pages.`, 'success');
            setSelectedUrls(new Set());
        } catch (err) {
            addLog('Failed to create task.', 'error');
        }
    };

    const selectedRow = useMemo(() => {
        if (!selectedRowUrl) return null;
        return unifiedData.find(row => row.url === selectedRowUrl) || null;
    }, [selectedRowUrl, unifiedData]);

    const summary = diffResult?.summaryDelta || {};
    const totalAdded = diffResult?.added?.length || 0;
    const totalMissing = diffResult?.removed?.length || 0;
    const totalModified = diffResult?.changed?.length || 0;
    const totalIssuesFixed = (diffResult?.issuesFixed || []).reduce((acc: number, item: any) => acc + (item.issues?.length || 0), 0);
    const totalIssuesIntroduced = (diffResult?.newIssues || []).reduce((acc: number, item: any) => acc + (item.issues?.length || 0), 0);

    const healthDelta = Number(summary.healthScore?.delta || 0);
    const clickDelta = Number(summary.totalClicks?.delta || 0);

    const gridTemplateString = `${colWidths[0]}px minmax(300px, 1fr) ${colWidths.slice(2).map(w => `${w}px`).join(' ')}`;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] text-[#e0e0e0] font-sans selection:bg-[#F5364E]/30 min-w-[700px]">
            
            <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#222] bg-[#0a0a0a] px-3 z-20 shadow-sm relative">
                <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => setShowSidebar(!showSidebar)} className="flex flex-col justify-center items-center gap-[3px] w-6 h-6 rounded hover:bg-[#1a1a1a] transition-colors">
                        <div className="w-3.5 h-[1.5px] bg-[#aaa] rounded-full"></div>
                        <div className="w-3.5 h-[1.5px] bg-[#aaa] rounded-full"></div>
                        <div className="w-3.5 h-[1.5px] bg-[#aaa] rounded-full"></div>
                    </button>
                    
                    <span className="font-bold text-[11px] text-[#eee]">Comparison</span>
                    
                    <div className="flex items-center text-[11px] bg-[#111] border border-[#222] rounded overflow-hidden h-6 ml-1">
                        <select value={leftSessionId || ''} onChange={(e) => setLeftSessionId(e.target.value)} className="bg-transparent text-[#aaa] outline-none cursor-pointer px-2 h-full hover:bg-[#1a1a1a]">
                            {orderedSessions.map(s => <option key={s.id} value={s.id}>{new Date(s.startedAt).toLocaleDateString()}</option>)}
                        </select>
                        <span className="text-[#555] px-2 font-bold select-none h-full flex items-center border-l border-r border-[#222]">vs</span>
                        <select value={rightSessionId || ''} onChange={(e) => setRightSessionId(e.target.value)} className="bg-transparent text-white outline-none cursor-pointer px-2 h-full hover:bg-[#1a1a1a]">
                            {orderedSessions.map(s => <option key={s.id} value={s.id}>{new Date(s.startedAt).toLocaleDateString()}</option>)}
                        </select>
                    </div>

                    <div className="h-4 w-px bg-[#222] mx-2" />

                    <div className="flex items-center gap-5 text-[11px] font-bold tracking-wider">
                        <div className="flex items-center gap-2">
                            <span className="text-[#777]">Health</span>
                            <div className="flex items-center gap-1.5 bg-[#151515] rounded px-2 py-0.5 border border-[#222]">
                                <span className="text-white font-mono">{Number(summary.healthScore?.new || 0).toFixed(0)}%</span>
                                {healthDelta !== 0 && (
                                    <span className={healthDelta > 0 ? 'text-emerald-500 font-mono flex items-center' : 'text-[#F5364E] font-mono flex items-center'}>
                                        {healthDelta > 0 ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                                        {Math.abs(healthDelta).toFixed(0)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[#777]">Traffic</span>
                            <div className="flex items-center gap-1.5 bg-[#151515] rounded px-2 py-0.5 border border-[#222]">
                                <span className="text-white font-mono">{formatValue(summary.totalClicks?.new || 0)}</span>
                                {clickDelta !== 0 && (
                                    <span className={clickDelta > 0 ? 'text-emerald-500 font-mono flex items-center' : 'text-[#F5364E] font-mono flex items-center'}>
                                        {clickDelta > 0 ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                                        {formatValue(Math.abs(clickDelta))}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 ml-2">
                            {totalAdded > 0 && <span className="text-emerald-500 font-mono flex items-center gap-1">+{totalAdded} Added</span>}
                            {totalMissing > 0 && <span className="text-[#F5364E] font-mono flex items-center gap-1">-{totalMissing} Removed</span>}
                        </div>

                        <div className="flex gap-3 ml-2">
                            {totalIssuesIntroduced > 0 && <span className="text-[#F5364E] font-mono flex items-center gap-1">+{totalIssuesIntroduced} Issues</span>}
                            {totalIssuesFixed > 0 && <span className="text-emerald-500 font-mono flex items-center gap-1">-{totalIssuesFixed} Fixed</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 relative z-30">
                    <button 
                        onClick={() => setShowAnalytics(!showAnalytics)} 
                        className={`flex items-center gap-1.5 px-3 py-1 h-6 text-[11px] font-bold transition-colors border rounded ${showAnalytics ? 'bg-blue-600/10 text-blue-500 border-blue-600/30' : 'bg-[#151515] border-[#222] text-[#ccc] hover:text-white hover:bg-[#1a1a1a]'}`}
                    >
                        <BarChart3 size={12} /> Analytics
                    </button>
                    <div className="h-4 w-px bg-[#222] mx-1" />
                    <button onClick={() => void shareComparison()} className="flex items-center gap-1.5 px-2 py-1 h-6 text-[11px] font-bold text-[#aaa] hover:text-white transition-colors">
                        <Link2 size={13} /> Share
                    </button>
                    <button onClick={exportDiff} className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#222] rounded px-3 py-1 h-6 text-[11px] font-bold text-[#eee] transition-colors">
                        <Download size={12} /> Export Table
                    </button>
                    <div className="h-4 w-px bg-[#222] mx-1" />
                    <button onClick={onClose} className="p-1 px-1.5 text-[#777] hover:bg-[#1a1a1a] rounded hover:text-white transition-colors"><X size={16} /></button>
                </div>
            </header>

            {/* Expansible Recharts Analytics Dashboard */}
            <div 
                className={`flex divide-x divide-[#222]/60 overflow-hidden z-10 shadow-inner bg-gradient-to-br from-[#111] to-[#0a0a0a] transition-all duration-300 ease-in-out ${showAnalytics ? 'max-h-[260px] h-[260px] border-b border-[#222] opacity-100' : 'max-h-0 h-0 opacity-0 border-transparent'}`}
            >
                {/* Fixed height container so charts don't resize jumpily during transition */}
                <div className="flex w-full h-[260px] shrink-0">
                    
                    {/* Issues Bar Chart */}
                    <div className="flex-1 flex flex-col p-5">
                        <span className="text-[12px] font-bold text-[#eee] mb-4">Issues Found vs Fixed</span>
                        <div className="flex-1 w-full bg-[#0d0d0d] rounded-md border border-[#222]/50 shadow-inner p-2">
                            {totalIssuesIntroduced === 0 && totalIssuesFixed === 0 ? (
                                <div className="flex h-full items-center justify-center text-[11px] text-[#555] font-medium">No issue changes detected</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={[
                                            { name: 'New Issues', value: totalIssuesIntroduced, fill: '#F5364E' }, 
                                            { name: 'Fixed Issues', value: totalIssuesFixed, fill: '#10B981' }
                                        ].filter(d => d.value > 0)} 
                                        margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis dataKey="name" stroke="#777" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis width={40} stroke="#555" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip cursor={{ fill: '#ffffff05' }} content={<ChartTooltip />} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={45}>
                                            {
                                                [
                                                    { name: 'New Issues', value: totalIssuesIntroduced, fill: '#F5364E' }, 
                                                    { name: 'Fixed Issues', value: totalIssuesFixed, fill: '#10B981' }
                                                ].filter(d => d.value > 0).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Structure Pie Chart with Custom Legend */}
                    <div className="flex-1 flex flex-col p-5 border-l border-[#222]/60">
                        <span className="text-[12px] font-bold text-[#eee] mb-4">Structural Pages Overview</span>
                        <div className="flex-1 w-full flex items-center justify-center bg-[#0d0d0d] rounded-md border border-[#222]/50 shadow-inner relative">
                            {(totalAdded > 0 || totalMissing > 0 || totalModified > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={[
                                                { name: 'Added', value: totalAdded, color: '#10B981' },
                                                { name: 'Missing', value: totalMissing, color: '#F5364E' },
                                                { name: 'Modified', value: totalModified, color: '#3B82F6' }
                                            ].filter(i => i.value > 0)} 
                                            cx="40%"
                                            innerRadius={45} 
                                            outerRadius={65} 
                                            paddingAngle={3} 
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {
                                                [
                                                    { name: 'Added', value: totalAdded, color: '#10B981' },
                                                    { name: 'Missing', value: totalMissing, color: '#F5364E' },
                                                    { name: 'Modified', value: totalModified, color: '#3B82F6' }
                                                ].filter(i => i.value > 0).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))
                                            }
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} cursor={false} />
                                        <Legend 
                                            layout="vertical" 
                                            verticalAlign="middle" 
                                            align="right" 
                                            wrapperStyle={{ fontSize: '11px', color: '#ccc', right: '10%' }}
                                            iconType="circle"
                                            iconSize={8}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <span className="text-[11px] text-[#555] font-medium">No additions or removals detected</span>
                            )}
                        </div>
                    </div>

                    {/* Traffic BarChart Compare */}
                    <div className="flex-[1.2] flex flex-col p-5 border-l border-[#222]/60">
                        <span className="text-[12px] font-bold text-[#eee] mb-4">A/B Search Traffic Snapshot</span>
                        <div className="flex-1 w-full bg-[#0d0d0d] rounded-md border border-[#222]/50 shadow-inner p-2">
                            {(summary.totalClicks?.old || 0) === 0 && (summary.totalClicks?.new || 0) === 0 ? (
                                <div className="flex h-full items-center justify-center text-[11px] text-[#555] font-medium">No traffic data recorded</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={[
                                            { period: 'Historical', Clicks: summary.totalClicks?.old || 0, fill: '#444' },
                                            { period: 'Live Crawl', Clicks: summary.totalClicks?.new || 0, fill: clickDelta >= 0 ? '#3B82F6' : '#F5364E' }
                                        ]} 
                                        margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis dataKey="period" stroke="#777" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis width={45} stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                                        <Tooltip cursor={{ fill: '#ffffff05' }} content={<ChartTooltip />} />
                                        <Bar dataKey="Clicks" radius={[4, 4, 0, 0]} barSize={50}>
                                            {
                                                [
                                                    { period: 'Historical', Clicks: summary.totalClicks?.old || 0, fill: '#444' },
                                                    { period: 'Live Crawl', Clicks: summary.totalClicks?.new || 0, fill: clickDelta >= 0 ? '#3B82F6' : '#F5364E' }
                                                ].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                
                {showSidebar && (
                    <div className="w-[200px] shrink-0 border-r border-[#222] bg-[#111] flex flex-col overflow-y-auto custom-scrollbar z-10 shadow-xl">
                        <div className="p-4 flex flex-col gap-6">
                            
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-bold text-[#777] uppercase tracking-wider border-b border-[#222] pb-2">Page Structure</span>
                                {[
                                    { id: 'new', label: 'Added', count: totalAdded },
                                    { id: 'missing', label: 'Missing', count: totalMissing },
                                    { id: 'modified', label: 'Modified Data', count: diffResult?.changed?.length || 0 },
                                ].map(f => (
                                    <label key={f.id} onClick={() => toggleFilter(setSelectedTypes, f.id)} className={`flex items-center justify-between px-2 py-1.5 text-[11px] font-medium cursor-pointer rounded transition-colors ${selectedTypes.has(f.id) ? 'bg-[#F5364E]/10 text-[#F5364E]' : 'text-[#aaa] hover:bg-[#1a1a1a] hover:text-[#fff]'}`}>
                                        <span>{f.label}</span>
                                        <span className="font-mono text-[10px] opacity-70">{f.count}</span>
                                    </label>
                                ))}
                            </div>

                            {availableNewIssues.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[11px] font-bold text-[#777] uppercase tracking-wider border-b border-[#222] pb-2">Issues Found</span>
                                    {availableNewIssues.slice(0, 10).map(([label, count]) => (
                                        <label key={label} onClick={() => toggleFilter(setSelectedNewIssues, label)} className={`flex items-center justify-between px-2 py-1.5 text-[11px] font-medium cursor-pointer rounded transition-colors ${selectedNewIssues.has(label) ? 'bg-[#F5364E]/10 text-[#F5364E]' : 'text-[#aaa] hover:bg-[#1a1a1a] hover:text-[#fff]'}`}>
                                            <span className="truncate pr-2 leading-tight">{label}</span>
                                            <span className="font-mono text-[10px] opacity-70 shrink-0">{count}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {availableFixedIssues.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[11px] font-bold text-[#777] uppercase tracking-wider border-b border-[#222] pb-2">Issues Fixed</span>
                                    {availableFixedIssues.slice(0, 10).map(([label, count]) => (
                                        <label key={label} onClick={() => toggleFilter(setSelectedFixedIssues, label)} className={`flex items-center justify-between px-2 py-1.5 text-[11px] font-medium cursor-pointer rounded transition-colors ${selectedFixedIssues.has(label) ? 'bg-[#F5364E]/10 text-[#F5364E]' : 'text-[#aaa] hover:bg-[#1a1a1a] hover:text-[#fff]'}`}>
                                            <span className="truncate pr-2 leading-tight">{label}</span>
                                            <span className="font-mono text-[10px] opacity-70 shrink-0">{count}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>
                )}
                
                {/* Dynamically Resizable Custom Data Grid */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] overflow-x-hidden relative">
                    
                    <div className="sticky left-0 flex items-center justify-between p-2 px-4 border-b border-[#1a1a1a] min-w-full z-10 w-full shadow-sm bg-[#0e0e0e]">
                        <div className="flex items-center gap-3">
                            <Search size={13} className="text-[#555]" />
                            <input 
                                type="text" 
                                placeholder="Search paths..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-7 w-[260px] max-w-[30vw] bg-[#111] rounded border border-[#222] px-3 text-[11px] text-[#e0e0e0] placeholder-[#666] outline-none focus:border-[#444] transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[11px] text-[#777] font-medium">{filteredData.length} records processed</span>
                            {selectedUrls.size > 0 && (
                                <div className="flex items-center gap-2 pl-3 border-l border-[#222]">
                                    <span className="text-[11px] font-bold text-[#eee]">{selectedUrls.size} selected</span>
                                    <button onClick={handleBulkTask} className="h-6 px-3 bg-white hover:bg-[#eaeaea] text-black rounded text-[10px] font-bold transition-colors">
                                        Create Task
                                    </button>
                                    <button onClick={() => setSelectedUrls(new Set())} className="text-[11px] px-1 text-[#666] hover:text-[#eee] font-medium">Clear</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-none overflow-hidden border-b border-[#222] bg-[#111] w-full z-10">
                        <div className="grid items-center h-9 text-[11px] font-bold text-[#666] select-none" style={{ gridTemplateColumns: gridTemplateString }}>
                            
                            {[
                                { k: 'chk', l: '', align: 'center', noSort: true, index: 0 },
                                { k: 'url', l: 'Path', align: 'left', index: 1 },
                                { k: 'type', l: 'Type', align: 'left', index: 2 },
                                { k: 'healthDelta', l: 'Health Score', align: 'right', index: 3 },
                                { k: 'clicksDelta', l: 'Total Clicks', align: 'right', index: 4 },
                                { k: 'positionDelta', l: 'Position', align: 'right', index: 5 },
                                { k: 'loadTimeDelta', l: 'Load Time', align: 'right', index: 6 },
                                { k: 'issuesDelta', l: 'Issues', align: 'right', index: 7 },
                            ].map((col) => (
                                <div 
                                    key={col.k} 
                                    className={`relative flex items-center h-full w-full ${col.align === 'right' ? 'justify-end pr-5' : col.align === 'center' ? 'justify-center' : 'pl-3'}`}
                                >
                                    {col.noSort ? (
                                        <button onClick={() => { if (selectedUrls.size === filteredData.length) setSelectedUrls(new Set()); else setSelectedUrls(new Set(filteredData.map(d => d.url))); }} className="hover:text-white">
                                            {selectedUrls.size === filteredData.length && filteredData.length > 0 ? <CheckSquare size={13} /> : <Square size={13} />}
                                        </button>
                                    ) : (
                                        <div className="cursor-pointer hover:text-white flex items-center gap-1.5 w-full h-full" onClick={() => handleSort(col.k)}>
                                            <div className={`flex items-center gap-1 truncate w-full ${col.align === 'right' ? 'justify-end' : ''}`}>
                                                {col.l} {sortField === col.k && (sortDir === 'asc' ? '↑' : '↓')}
                                            </div>
                                        </div>
                                    )}

                                    {col.index > 1 && (
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 -right-1.5 h-6 w-3 cursor-col-resize hover:bg-[#3B82F6]/50 group z-20 rounded transition-all flex justify-center"
                                            onMouseDown={(e) => handleColumnResize(col.index, e)}
                                        >
                                            <div className="h-full w-[1px] bg-[#333] group-hover:bg-transparent" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full pb-20 custom-scrollbar">
                        {filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-[#555] gap-3 mt-20 p-5">
                                <Search size={24} className="opacity-30" />
                                <div className="text-[12px] font-medium text-[#777]">No comparison records found for active filters</div>
                            </div>
                        ) : (
                            <div className="flex flex-col w-full divide-y divide-[#161616]">
                                {filteredData.map((row) => {
                                    const isRowSelected = selectedUrls.has(row.url);
                                    const isSelected = selectedRowUrl === row.url;

                                    return (
                                        <div 
                                            key={row.url} 
                                            onClick={() => setSelectedRowUrl(row.url)}
                                            className={`grid items-center text-[11px] transition-colors cursor-pointer w-full h-9 hover:bg-[#111] ${isSelected ? 'bg-[#151515] outline outline-1 outline-[#333] z-10' : ''} ${isRowSelected ? '!bg-blue-600/10' : ''}`}
                                            style={{ gridTemplateColumns: gridTemplateString }}
                                        >
                                            <div className="flex items-center justify-center w-full" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => {
                                                    const next = new Set(selectedUrls);
                                                    if (next.has(row.url)) next.delete(row.url);
                                                    else next.add(row.url);
                                                    setSelectedUrls(next);
                                                }} className="p-1 text-[#666] hover:text-[#fff]">
                                                    {isRowSelected ? <CheckSquare size={13} className="text-blue-500" /> : <Square size={13} />}
                                                </button>
                                            </div>
                                            
                                            <div className={`truncate text-left pl-3 w-full font-mono ${isSelected ? 'text-white font-medium' : 'text-[#aaa]'}`} title={row.url}>
                                                {row.url}
                                            </div>
                                            
                                            <div className="flex items-center pl-3 w-full">
                                                {row.primaryType === 'new' && <span className="text-emerald-500 font-medium">Added</span>}
                                                {row.primaryType === 'missing' && <span className="text-[#F5364E] font-medium">Missing</span>}
                                                {row.primaryType === 'new_issues' && <span className="text-orange-400 font-medium">Issues</span>}
                                                {row.primaryType === 'modified' && <span className="text-[#888] font-medium">Modified</span>}
                                                {row.primaryType === 'fixed' && <span className="text-emerald-500 font-medium">Fixed</span>}
                                            </div>

                                            <div className="text-right pr-5 w-full font-mono">
                                                {row.healthDelta > 0 ? <span className="text-emerald-500">+{row.healthDelta}</span> : row.healthDelta < 0 ? <span className="text-[#F5364E]">{row.healthDelta}</span> : <span className="text-[#444]">—</span>}
                                            </div>
                                            <div className="text-right pr-5 w-full font-mono">
                                                {row.clicksDelta > 0 ? <span className="text-emerald-500">+{formatValue(row.clicksDelta)}</span> : row.clicksDelta < 0 ? <span className="text-[#F5364E]">{formatValue(row.clicksDelta)}</span> : <span className="text-[#444]">—</span>}
                                            </div>
                                            <div className="text-right pr-5 w-full font-mono">
                                                {row.positionDelta > 0 ? <span className="text-[#F5364E]">+{formatValue(row.positionDelta)}</span> : row.positionDelta < 0 ? <span className="text-emerald-500">{formatValue(row.positionDelta)}</span> : <span className="text-[#444]">—</span>}
                                            </div>
                                            <div className="text-right pr-5 w-full font-mono">
                                                {row.loadTimeDelta > 0 ? <span className="text-[#F5364E]">+{formatValue(row.loadTimeDelta)}</span> : row.loadTimeDelta < 0 ? <span className="text-emerald-500">{formatValue(row.loadTimeDelta)}</span> : <span className="text-[#444]">—</span>}
                                            </div>
                                            <div className="text-right pr-5 w-full font-mono">
                                                {row.issuesDelta > 0 ? <span className="text-[#F5364E]">+{row.issuesDelta}</span> : row.issuesDelta < 0 ? <span className="text-emerald-500">{row.issuesDelta}</span> : <span className="text-[#444]">—</span>}
                                            </div>
                                            
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {selectedRow && (
                    <div className="absolute right-0 top-0 bottom-0 z-30 shadow-2xl transition-all border-l border-[#222]">
                        <PageDetailsSidebar 
                            row={selectedRow} 
                            pages={pages} 
                            activeProject={activeProject}
                            user={user}
                            addLog={addLog}
                            onClose={() => setSelectedRowUrl(null)} 
                        />
                    </div>
                )}
                
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Details Sidebar (Diff Terminal)
// ------------------------------------------------------------------
function PageDetailsSidebar({ row, pages, activeProject, user, addLog, onClose }: { 
    row: any, pages: any[], activeProject: any, user: any, addLog: any, onClose: () => void 
}) {
    const [showOnlyChanges, setShowOnlyChanges] = useState(false);
    const [showAllFields, setShowAllFields] = useState(false);

    const currentContext = useMemo(() => {
        if (row.pageData) return row.pageData;
        return pages.find(p => p.url === row.url) || {};
    }, [pages, row]);

    const handleCreateTask = async (issueLabel: string) => {
        if (!activeProject?.id) return;
        try {
            await createTaskService(activeProject.id, {
                title: `Fix: ${issueLabel}`,
                description: `Target: ${row.url}`,
                priority: 'medium',
                category: 'crawler',
                affectedUrls: [row.url],
                createdBy: user?.id || 'system'
            } as any);
            addLog(`Task created for ${issueLabel}`, 'success');
        } catch (err) {
            addLog('Task creation failed.', 'error');
        }
    };

    const CATEGORIES = [
        { title: 'SEO & Search', keys: ['statusCode', 'indexabilityStatus', 'title', 'metaDesc', 'h1_1', 'canonical', 'metaRobots1', 'crawlDepth', 'inSitemap'] },
        { title: 'Traffic & Revenue', keys: ['gscClicks', 'gscImpressions', 'gscPosition', 'ga4Sessions', 'ga4BounceRate'] },
        { title: 'Authority & External', keys: ['urlRating', 'referringDomains', 'authorityScore'] },
        { title: 'Performance (Vitals)', keys: ['loadTime', 'fieldLcp', 'cls', 'inp', 'sizeBytes', 'renderBlockingCss', 'renderBlockingJs'] },
        { title: 'Content & AI Insights', keys: ['wordCount', 'readability', 'fleschScore', 'topicCluster', 'sentiment', 'carbonRating'] },
        { title: 'Link Structure', keys: ['inlinks', 'outlinks', 'uniqueOutlinks', 'externalOutlinks', 'internalPageRank'] },
        { title: 'Security & Integrity', keys: ['mixedContent', 'insecureForms', 'hstsMissing'] },
    ];

    const formatDetailedValue = (value: any, key: string) => {
        if (value === null || value === undefined || value === '') return '—';
        if (key.toLowerCase().includes('time') || ['lcp', 'inp', 'fid'].includes(key)) return `${value}ms`;
        if (key.toLowerCase().includes('bytes') || key.toLowerCase().includes('size')) {
            const bytes = Number(value);
            if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
            if (bytes > 1024) return `${(bytes / 1024).toFixed(2)} KB`;
            return `${bytes} B`;
        }
        if (key.toLowerCase().includes('score') || key.toLowerCase().includes('percent')) {
            if (typeof value === 'number' && value <= 1 && value > 0) return `${(value * 100).toFixed(1)}%`;
            if (typeof value === 'number') return value.toFixed(1);
        }
        return formatValue(value);
    };

    const PropertyRow = ({ propKey, label }: { propKey: string, label?: string }) => {
        const diffRecord = (row.fieldChanges || []).find((c: any) => c.field === propKey);
        const val = currentContext[propKey];
        const displayLabel = label || propKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

        if (showOnlyChanges && !diffRecord) return null;

        if (diffRecord) {
            return (
                <div className="flex flex-col gap-1.5 py-3 border-b border-[#222]">
                    <span className="text-[11px] font-bold text-[#888]">{displayLabel}</span>
                    <div className="flex flex-col gap-1.5 font-mono text-[11px] mt-1">
                        <div className="flex items-center justify-between bg-[#F5364E]/10 border border-[#F5364E]/20 text-[#F5364E] rounded px-3 py-1.5">
                            <span className="text-[9px] font-bold opacity-70 tracking-widest px-1.5 bg-[#F5364E]/20 rounded-sm">OLD</span>
                            <span className="truncate max-w-[200px]" title={formatDetailedValue(diffRecord.oldValue, propKey)}>{formatDetailedValue(diffRecord.oldValue, propKey)}</span>
                        </div>
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded px-3 py-1.5">
                            <span className="text-[9px] font-bold opacity-70 tracking-widest px-1.5 bg-emerald-500/20 rounded-sm">NEW</span>
                            <span className="truncate max-w-[200px]" title={formatDetailedValue(diffRecord.newValue, propKey)}>{formatDetailedValue(diffRecord.newValue, propKey)}</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (showOnlyChanges) return null;

        return (
            <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a]">
                <span className="text-[11px] font-medium text-[#777] min-w-[100px]">{displayLabel}</span>
                <span className="text-[11px] text-[#ccc] font-mono text-right break-all ml-4" title={formatDetailedValue(val, propKey)}>{formatDetailedValue(val, propKey)}</span>
            </div>
        );
    };

    return (
        <div className="w-[360px] h-full bg-[#0c0c0c] flex flex-col shadow-[-15px_0_40px_rgba(0,0,0,0.8)]">
            
            <div className="flex flex-col border-b border-[#222] p-4 bg-[#0a0a0a]">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-[11px] font-bold text-[#888]">Page Details</span>
                    <button onClick={onClose} className="p-1 text-[#777] hover:text-white rounded hover:bg-[#1a1a1a] transition-colors"><X size={16} /></button>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[12px] font-mono text-white truncate block w-full" title={row.url}>{row.url}</span>
                    <a href={row.url} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 w-fit transition-colors">
                        Open Window <ExternalLink size={11} />
                    </a>
                </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#111]">
                <span className="text-[11px] font-medium text-[#ccc]">All Properties</span>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#888] cursor-pointer hover:text-white transition-colors">
                        <input 
                            type="checkbox" 
                            checked={showOnlyChanges} 
                            onChange={(e) => setShowOnlyChanges(e.target.checked)}
                            className="accent-blue-500 cursor-pointer w-3 h-3"
                        />
                        Only Modified
                    </label>
                    <div className="w-px h-3 bg-[#222]" />
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#888] cursor-pointer hover:text-white transition-colors">
                        <input 
                            type="checkbox" 
                            checked={showAllFields} 
                            onChange={(e) => setShowAllFields(e.target.checked)}
                            className="accent-blue-500 cursor-pointer w-3 h-3"
                        />
                        Show All
                    </label>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                
                {(row.newIssues.length > 0 || row.issuesFixed.length > 0) && (
                    <div className="mb-8 flex flex-col gap-4">
                        {row.newIssues.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-bold text-[#F5364E] uppercase tracking-wide">Issues Found</span>
                                <div className="flex flex-col gap-1.5">
                                    {row.newIssues.map((iss: any) => (
                                        <div key={iss.id} className="flex justify-between items-center py-2 px-2.5 bg-[#F5364E]/10 rounded border border-[#F5364E]/20 text-[11px] text-[#eee]">
                                            <span className="truncate pr-2">{iss.label}</span>
                                            <button onClick={() => void handleCreateTask(iss.label)} className="text-[10px] font-bold text-[#F5364E] hover:text-white transition-colors shrink-0">
                                                Create Task
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {row.issuesFixed.length > 0 && (
                            <div className="flex flex-col gap-1.5 pt-2">
                                <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wide">Issues Fixed</span>
                                <div className="flex flex-col gap-1.5">
                                    {row.issuesFixed.map((iss: any) => (
                                        <div key={iss.id} className="py-2 px-2.5 bg-emerald-500/10 rounded border border-emerald-500/20 text-[11px] text-[#555] line-through">
                                            {iss.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-10 pb-20">
                    {CATEGORIES.map(category => {
                        const hasVisibleFields = category.keys.some(k => 
                            (!showOnlyChanges || (row.fieldChanges || []).some((c:any) => c.field === k)) &&
                            (showAllFields || currentContext[k] !== undefined || (row.fieldChanges || []).some((c:any) => c.field === k))
                        );

                        if (!hasVisibleFields) return null;

                        return (
                            <div key={category.title} className="flex flex-col">
                                <h4 className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] mb-3 border-b border-[#1a1a1a] pb-1.5">{category.title}</h4>
                                <div className="flex flex-col">
                                    {category.keys.map(key => <PropertyRow key={key} propKey={key} />)}
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex flex-col">
                        <h4 className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] mb-3 border-b border-[#1a1a1a] pb-1.5">Visual Data</h4>
                        <PropertyRow propKey="visualDiffPercent" label="Change Percentage" />
                        <PropertyRow propKey="domNodeCount" label="DOM Structure Size" />
                    </div>

                    {showAllFields && (
                        <div className="flex flex-col pt-4 border-t border-[#222]/40">
                            <h4 className="text-[10px] font-black text-blue-500/70 uppercase tracking-[0.2em] mb-3 pb-1.5">Uncategorized Raw Data</h4>
                            <div className="flex flex-col opacity-60 italic">
                                {Object.keys(currentContext)
                                    .filter(k => 
                                        !CATEGORIES.some(cat => cat.keys.includes(k)) && 
                                        !['visualDiffPercent', 'domNodeCount', 'url', 'id', 'fieldChanges', 'types', 'primaryType', 'pageData'].includes(k)
                                    )
                                    .map(k => <PropertyRow key={k} propKey={k} />)}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="h-10" />
            </div>
        </div>
    );
}
