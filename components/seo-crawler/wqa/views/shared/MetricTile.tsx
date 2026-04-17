import React from 'react';

type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral';

const TONE_COLOR: Record<Tone, string> = {
    good:    '#22c55e',
    warn:    '#f59e0b',
    bad:     '#ef4444',
    info:    '#3b82f6',
    neutral: '#ffffff',
};

export default function MetricTile({
    label, value, sub, tone = 'neutral', icon, onClick,
}: {
    label: string;
    value: string | number;
    sub?: string;
    tone?: Tone;
    icon?: React.ReactNode;
    onClick?: () => void;
}) {
    const color = TONE_COLOR[tone];
    const clickable = typeof onClick === 'function';
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!clickable}
            className={`text-left w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-3 py-2.5 transition-colors ${
                clickable ? 'hover:border-[#333] hover:bg-[#111] cursor-pointer' : 'cursor-default'
            }`}
        >
            <div className="flex items-center gap-1.5 text-[#666] text-[10px] uppercase tracking-widest font-semibold mb-1">
                {icon}
                <span className="truncate">{label}</span>
            </div>
            <div className="text-[20px] font-black leading-none mb-1" style={{ color }}>
                {value}
            </div>
            {sub && <div className="text-[10px] text-[#666] truncate">{sub}</div>}
        </button>
    );
}
