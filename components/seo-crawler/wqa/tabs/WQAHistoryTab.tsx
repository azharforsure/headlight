import React from 'react';
import type { WebsiteQualityState, WqaSiteStats } from '../../../../services/WebsiteQualityModeTypes';
import { scoreToGrade } from '../../../../services/WebsiteQualityModeTypes';
import type { CrawlSession } from '../../../../services/CrawlHistoryService';

interface Props {
    stats: WqaSiteStats | null;
    wqaState: WebsiteQualityState;
    crawlHistory: CrawlSession[];
    currentSessionId: string | null;
    onCompare: (id1: string, id2: string) => void;
}

export default function WQAHistoryTab({ stats, crawlHistory, currentSessionId, onCompare }: Props) {
    if (!stats) return <div className="p-4 text-[12px] text-[#555] text-center">No data yet.</div>;

    const recentSessions = crawlHistory
        .filter((s) => s.completedAt)
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
        .slice(0, 10);

    const currentSession = recentSessions[0];
    const previousSession = recentSessions[1];

    return (
        <div className="p-3 space-y-4">
            <section>
                <SectionHeader title="Score Trend" />
                {recentSessions.length >= 2 ? (
                    <div className="space-y-1">
                        {recentSessions.slice(0, 5).map((s) => {
                            const score = Number(s.healthScore || 0);
                            const grade = scoreToGrade(score);
                            const isCurrent = s.id === currentSessionId;
                            return (
                                <div key={s.id} className={`flex items-center justify-between text-[10px] p-1.5 rounded ${isCurrent ? 'bg-[#111] border border-[#222]' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[#F5364E]' : 'bg-[#333]'}`} />
                                        <span className="text-[#888]">{formatDate(s.completedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-mono">{grade} ({score})</span>
                                        <span className="text-[#555]">{s.totalPages || '—'} pg</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-[11px] text-[#555]">Need at least 2 crawls to show trend.</div>
                )}
            </section>

            <section>
                <SectionHeader title="Crawl Sessions" />
                <div className="space-y-2">
                    {recentSessions.map((s) => {
                        const isCurrent = s.id === currentSessionId;
                        const score = Number(s.healthScore || 0);
                        const grade = scoreToGrade(score);
                        return (
                            <div key={s.id} className={`bg-[#111] border rounded p-2 ${isCurrent ? 'border-[#F5364E]/30' : 'border-[#1a1a1a]'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-white font-medium">{isCurrent ? '● ' : '○ '}{formatDate(s.completedAt)}</span>
                                    <span className="text-[10px] text-[#888] font-mono">{grade} ({score})</span>
                                </div>
                                <div className="text-[9px] text-[#555] mt-1">{s.totalPages || '—'} pages</div>
                                {!isCurrent && currentSessionId && (
                                    <button onClick={() => onCompare(currentSessionId, s.id)} className="mt-1 text-[9px] text-[#F5364E] hover:text-[#ff5a6e]">
                                        Compare ↔
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {previousSession && currentSession && (
                <section>
                    <SectionHeader title="Changes Since Last" />
                    <div className="space-y-1 text-[10px] text-[#888]">
                        <ChangeLine
                            label="Score"
                            current={Number(currentSession.healthScore || 0)}
                            previous={Number(previousSession.healthScore || 0)}
                            format={(v) => `${scoreToGrade(v)} (${v})`}
                        />
                        <ChangeLine
                            label="Pages"
                            current={Number(currentSession.totalPages || 0)}
                            previous={Number(previousSession.totalPages || 0)}
                        />
                    </div>
                </section>
            )}
        </div>
    );
}

function ChangeLine({ label, current, previous, format }: { label: string; current: number; previous: number; format?: (v: number) => string }) {
    const delta = current - previous;
    const displayCurrent = format ? format(current) : current.toLocaleString();
    return (
        <div className="flex justify-between">
            <span>{label}</span>
            <span className="text-white font-mono">
                {displayCurrent}
                {delta !== 0 && (
                    <span className={`ml-1 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>{delta > 0 ? `+${delta}` : delta}</span>
                )}
            </span>
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1 mb-3">{title}</h4>;
}

function formatDate(timestamp: number | null | undefined): string {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
