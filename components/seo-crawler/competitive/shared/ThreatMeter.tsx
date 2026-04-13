import React from 'react';

interface ThreatMeterProps {
    level: 'Critical' | 'High' | 'Moderate' | 'Low';
    label?: string;
}

const LEVELS = ['Low', 'Moderate', 'High', 'Critical'] as const;

export default function ThreatMeter({ level, label }: ThreatMeterProps) {
    const idx = LEVELS.indexOf(level);
    const pct = ((idx + 1) / LEVELS.length) * 100;
    const color = {
        Critical: '#ef4444',
        High: '#f97316',
        Moderate: '#eab308',
        Low: '#22c55e',
    }[level];

    return (
        <div>
            {label && <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#666]">{label}</div>}
            <div className="relative h-3 overflow-hidden rounded-full bg-[#1a1a1a]">
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <div className="mt-1 flex justify-between">
                <span className="text-[9px] text-[#555]">Low</span>
                <span className="text-[10px] font-bold" style={{ color }}>
                    {level}
                </span>
                <span className="text-[9px] text-[#555]">Critical</span>
            </div>
        </div>
    );
}
