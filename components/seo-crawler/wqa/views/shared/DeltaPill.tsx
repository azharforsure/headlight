import React from 'react';

export default function DeltaPill({ value, suffix = '%' }: { value?: number | null; suffix?: string }) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return <span className="text-[#555] text-[10px] font-mono">—</span>;
    }
    const n = Number(value);
    const up = n > 0;
    const flat = n === 0;
    const color = flat ? '#888' : up ? '#22c55e' : '#ef4444';
    return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono" style={{ color }}>
            {flat ? '→' : up ? '▲' : '▼'}
            <span>{Math.abs(n).toFixed(1)}{suffix}</span>
        </span>
    );
}
