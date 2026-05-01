import React, { useRef, useEffect } from 'react';
import { X, Terminal, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';

interface LogsDialogProps {
    onClose: () => void;
}

export default function LogsDialog({ onClose }: LogsDialogProps) {
    const { logs, logSearch, setLogSearch, logTypeFilter, setLogTypeFilter } = useSeoCrawler();
    const logsEndRef = useRef<HTMLDivElement>(null);

    const filteredLogs = logs.filter((log) => {
        if (logTypeFilter !== 'all' && log.type !== logTypeFilter) return false;
        if (logSearch && !log.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
        return true;
    });

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filteredLogs.length]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'error': return <AlertCircle size={14} className="text-red-500" />;
            case 'warn': return <AlertCircle size={14} className="text-yellow-500" />;
            case 'success': return <CheckCircle size={14} className="text-green-500" />;
            default: return <Info size={14} className="text-blue-400" />;
        }
    };

    const getColorClass = (type: string) => {
        switch (type) {
            case 'error': return 'text-red-400';
            case 'warn': return 'text-yellow-400';
            case 'success': return 'text-green-400';
            default: return 'text-gray-300';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-[800px] h-[80vh] flex flex-col rounded-3xl border border-[#232329] bg-[#111] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between border-b border-[#202025] px-5 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1a1f] border border-[#2e2e34]">
                            <Terminal size={16} className="text-[#888]" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#666]">System</div>
                            <h2 className="mt-1 text-[20px] font-black text-white">Execution Logs</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg border border-[#2e2e34] p-2 text-[#888] hover:text-white hover:bg-[#1a1a1f] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-3 px-5 py-3 border-b border-[#202025] shrink-0">
                    <input 
                        type="text" 
                        placeholder="Search logs..." 
                        value={logSearch} 
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="flex-1 bg-[#1a1a1f] border border-[#2e2e34] rounded-lg px-3 py-1.5 text-[12px] text-white placeholder-[#666] outline-none focus:border-[#444]"
                    />
                    <select 
                        value={logTypeFilter}
                        onChange={(e) => setLogTypeFilter(e.target.value as any)}
                        className="bg-[#1a1a1f] border border-[#2e2e34] rounded-lg px-3 py-1.5 text-[12px] text-white outline-none focus:border-[#444] cursor-pointer"
                    >
                        <option value="all">All Levels</option>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warn">Warning</option>
                        <option value="error">Error</option>
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-2 bg-[#0a0a0c] font-mono text-[12px]">
                    {filteredLogs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-[#666] italic">
                            No logs found matching your criteria.
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-[#15151a] transition-colors border border-transparent hover:border-[#222]">
                                <div className="shrink-0 mt-0.5">{getIcon(log.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <span className="text-[10px] text-[#555] shrink-0">
                                            {new Date(log.timestamp).toLocaleTimeString(undefined, { 
                                                hour12: false, 
                                                hour: '2-digit', 
                                                minute: '2-digit', 
                                                second: '2-digit', 
                                                fractionalSecondDigits: 3 
                                            })}
                                        </span>
                                        <span className={`break-words ${getColorClass(log.type)}`}>
                                            {log.message}
                                        </span>
                                    </div>
                                    {log.meta && Object.keys(log.meta).length > 0 && (
                                        <div className="mt-1 text-[10px] text-[#666] break-all bg-[#111] p-1.5 rounded border border-[#222]">
                                            {JSON.stringify(log.meta)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
}
