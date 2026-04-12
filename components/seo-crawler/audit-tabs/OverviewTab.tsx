import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface OverviewTabProps {
    pages: any[];
    isCrawling: boolean;
    elapsedTime: string;
    crawlRate: string | number;
    healthScore: { score: number; grade: string };
    stats: any;
    auditInsights: any[];
    setActiveMacro: (macro: string) => void;
}

export default function OverviewTab({
    pages, isCrawling, elapsedTime, crawlRate, healthScore,
    stats, auditInsights, setActiveMacro
}: OverviewTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Health Score */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#222] rounded-lg p-4 relative overflow-hidden group/health w-full shadow-inner">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors duration-1000 ${
                    healthScore.grade === 'A' ? 'bg-green-500/10' : 
                    healthScore.grade === 'B' ? 'bg-blue-500/10' : 
                    healthScore.grade === 'F' ? 'bg-[#F5364E]/15' : 'bg-yellow-500/10'
                }`}></div>
                <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${healthScore.grade === 'A' ? 'green' : healthScore.grade === 'B' ? 'blue' : healthScore.grade === 'F' ? 'red' : 'yellow'}-500/50 to-transparent`}></div>
                {/* Live crawl progress */}
                {isCrawling && (
                    <div className="mb-3 pb-3 border-b border-[#222]">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-[#888] uppercase tracking-widest font-bold flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Crawling Live
                            </span>
                            <span className="text-[10px] font-mono text-[#666]">{elapsedTime}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#ccc]">
                            <span className="font-mono">{pages.length} URLs</span>
                            <span className="text-[#444]">|</span>
                            <span className="font-mono text-[#F5364E]">{crawlRate} p/s</span>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex-1">
                        <h4 className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-1">Site Health</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">{pages.length === 0 ? '--' : healthScore.score}</span>
                            <span className={`text-lg font-black ${healthScore.grade === 'A' ? 'text-green-400' : healthScore.grade === 'B' ? 'text-blue-400' : healthScore.grade === 'C' ? 'text-yellow-400' : healthScore.grade === 'D' ? 'text-orange-400' : healthScore.grade === 'F' ? 'text-red-400' : 'text-[#555]'}`}>{healthScore.grade}</span>
                            <span className="text-[#666] text-[12px]">/ 100</span>
                        </div>
                    </div>
                    <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="#222" strokeWidth="6" fill="none" />
                            <circle cx="32" cy="32" r="28" stroke={healthScore.grade === 'A' ? '#4ade80' : healthScore.grade === 'B' ? '#60a5fa' : healthScore.grade === 'C' ? '#fbbf24' : '#F5364E'} strokeWidth="6" fill="none" strokeDasharray="175.9" strokeDashoffset={pages.length === 0 ? 175.9 : 175.9 * (1 - healthScore.score / 100)} className="transition-all duration-1000 ease-out" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Crawl Summary */}
            <div>
                <h4 className="text-[11px] font-bold text-[#555] mb-3 uppercase tracking-widest border-b border-[#222] pb-1">Crawl Summary</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#141414] p-3 rounded border border-[#222]">
                        <div className="text-[10px] text-[#888] mb-1">Total URLs</div>
                        <div className="text-[16px] font-mono text-white">{stats?.total || 0}</div>
                    </div>
                    <div className="bg-[#141414] p-3 rounded border border-[#222]">
                        <div className="text-[10px] text-[#888] mb-1">HTML Pages</div>
                        <div className="text-[16px] font-mono text-white">{stats?.html || 0}</div>
                    </div>
                    <div className="bg-[#141414] p-3 rounded border border-[#222]">
                        <div className="text-[10px] text-[#888] mb-1">Images</div>
                        <div className="text-[16px] font-mono text-white">{stats?.img || 0}</div>
                    </div>
                    <div className="bg-[#141414] p-3 rounded border border-[#222]">
                        <div className="text-[10px] text-[#888] mb-1">Avg Load Time</div>
                        <div className="text-[16px] font-mono text-white">{pages.length > 0 ? Math.round(pages.reduce((acc: any, p: any) => acc + (p.loadTime || 0), 0) / pages.length) : 0}ms</div>
                    </div>
                </div>
                

            </div>

            {/* Fix These First */}
            <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                <h4 className="text-[11px] font-bold text-[#F5364E] mb-3 uppercase tracking-widest flex items-center gap-1.5">Fix These First</h4>
                {pages.length === 0 ? (
                    <div className="text-[11px] text-[#666] text-center py-4">Scan a website to see what needs fixing.</div>
                ) : (
                    <div className="space-y-3">
                        {(() => {
                            if (auditInsights.length === 0) return <div className="text-[11px] text-green-400 flex items-center gap-2 pb-2"><CheckCircle2 size={12}/> Looking good! No big issues found.</div>;

                            return auditInsights.slice(0, 5).map((r: any) => (
                                <div 
                                    key={r.id} 
                                    onClick={() => setActiveMacro(r.id)}
                                    className="flex items-start gap-3 p-2.5 rounded-md bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] cursor-pointer transition-colors group/fix"
                                >
                                    <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                                        r.impact === 'High' ? 'text-red-400 bg-red-400/10 border-red-500/20' : 'text-blue-400 bg-blue-400/10 border-blue-500/20'
                                    }`}>{r.impact}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12px] text-[#eee] font-medium leading-tight group-hover/fix:text-white transition-colors">{r.label}</div>
                                        <div className="text-[10px] text-[#666] mt-0.5 leading-snug">{r.summary}</div>
                                    </div>
                                    <div className="text-[#444] group-hover/fix:text-white transition-colors self-center">
                                        <ArrowRight size={14}/>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}
            </div>

            {/* Status Distribution */}
            <div>
                <h4 className="text-[11px] font-bold text-[#555] mb-3 uppercase tracking-widest border-b border-[#222] pb-1">Status Codes</h4>
                <div className="space-y-2">
                    {[
                        { label: '2xx Success', count: pages.filter((p: any) => p.statusCode >= 200 && p.statusCode < 300).length, color: 'bg-green-500' },
                        { label: '3xx Redirect', count: stats?.redirects || 0, color: 'bg-orange-400' },
                        { label: '4xx Error', count: stats?.broken || 0, color: 'bg-red-500' },
                        { label: '5xx Server Error', count: pages.filter((p: any) => p.statusCode >= 500).length, color: 'bg-red-700' }
                    ].map(stat => (
                        <div key={stat.label} className="flex items-center gap-3 text-[12px]">
                            <div className={`w-2 h-2 rounded-full ${stat.color} shrink-0`}></div>
                            <div className="flex-1 text-[#aaa]">{stat.label}</div>
                            <div className="font-mono text-white">{stat.count}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
