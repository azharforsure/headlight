import React from 'react';

const TIER: Record<string, { glyph: string; color: string; label: string }> = {
    '★★★': { glyph: '★★★', color: '#22c55e', label: 'Top' },
    '★★':  { glyph: '★★',  color: '#3b82f6', label: 'High' },
    '★':   { glyph: '★',   color: '#eab308', label: 'Mid' },
    '☆':   { glyph: '☆',   color: '#6b7280', label: 'Low' },
};

export default function TierBadge({ tier, compact = false }: { tier?: string; compact?: boolean }) {
    const meta = TIER[tier || '☆'] || TIER['☆'];
    if (compact) {
        return <span className="font-mono text-[10px]" style={{ color: meta.color }}>{meta.glyph}</span>;
    }
    return (
        <span
            className="inline-flex items-center gap-1 px-1.5 h-[18px] rounded text-[10px] font-mono border"
            style={{ color: meta.color, borderColor: `${meta.color}44`, background: `${meta.color}12` }}
        >
            {meta.glyph}
            <span className="text-[#aaa]">{meta.label}</span>
        </span>
    );
}
