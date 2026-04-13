import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface CompScoreCardProps {
    domain: string;
    score: number | null;
    delta?: number | null;
    threatLevel?: string | null;
    isOwn?: boolean;
}

export default function CompScoreCard({ domain, score, delta, threatLevel, isOwn }: CompScoreCardProps) {
    const resolvedScore = score ?? 0;
    const scoreColor = resolvedScore >= 70 ? 'text-green-400' : resolvedScore >= 40 ? 'text-yellow-400' : 'text-red-400';
    const threatColor = {
        Critical: 'text-red-400 bg-red-400/10',
        High: 'text-orange-400 bg-orange-400/10',
        Moderate: 'text-yellow-400 bg-yellow-400/10',
        Low: 'text-green-400 bg-green-400/10',
    }[threatLevel || 'Low'] || 'text-[#666] bg-[#111]';

    return (
        <div className={`rounded-xl border p-3 ${isOwn ? 'border-[#F5364E]/30 bg-[#F5364E]/5' : 'border-[#222] bg-[#0d0d0f]'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="max-w-[140px] truncate text-[11px] font-bold text-white">
                    {isOwn ? 'Your Site' : domain}
                </span>
                {threatLevel && !isOwn && (
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${threatColor}`}>
                        {threatLevel}
                    </span>
                )}
            </div>

            <div className="flex items-end gap-2">
                <span className={`font-mono text-[22px] font-black ${scoreColor}`}>
                    {score ?? '—'}
                </span>
                {delta != null && delta !== 0 && (
                    <span className={`mb-1 flex items-center gap-0.5 text-[10px] font-bold ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {delta > 0 ? '+' : ''}
                        {delta}
                    </span>
                )}
            </div>
        </div>
    );
}
