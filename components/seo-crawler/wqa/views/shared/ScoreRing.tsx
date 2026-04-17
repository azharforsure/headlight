import React from 'react';

export default function ScoreRing({
    score, grade, size = 140, delta = 0,
}: { score: number; grade: string; size?: number; delta?: number }) {
    const radius = (size - 14) / 2;
    const circ   = 2 * Math.PI * radius;
    const pct    = Math.max(0, Math.min(100, score)) / 100;
    const stroke = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';

    return (
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="#141414" strokeWidth={10} fill="none" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={stroke} strokeWidth={10} fill="none"
                    strokeDasharray={`${pct * circ} ${circ}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] text-[#666] uppercase tracking-widest">Site Score</span>
                <span className="text-[32px] font-black text-white leading-none mt-1">{Math.round(score)}</span>
                <span className="text-[11px] text-[#888] mt-0.5">Grade {grade}</span>
                {delta !== 0 && (
                    <span className={`text-[10px] mt-0.5 font-mono ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)} vs last
                    </span>
                )}
            </div>
        </div>
    );
}
