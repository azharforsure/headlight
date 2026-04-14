import React from 'react';

interface Props { label: string; value: number; suffix?: string; max?: number; }

export default function GaugeBar({ label, value, suffix = '%', max = 100 }: Props) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';

    if (suffix === '✓' || suffix === '✗') {
        return (
            <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#888]">{label}</span>
                <span className={suffix === '✓' ? 'text-green-400' : 'text-red-400'}>{suffix}</span>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-[#888]">{label}</span>
                <span className="text-white font-mono">{value}{suffix}</span>
            </div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}
