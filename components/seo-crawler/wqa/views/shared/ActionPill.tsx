import React from 'react';

const STYLES: Record<string, { text: string; bg: string; border: string }> = {
    technical: { text: '#FCA5A5', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)' },
    content:   { text: '#93C5FD', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)' },
    industry:  { text: '#C4B5FD', bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.30)' },
    monitor:   { text: '#86EFAC', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)' },
};

export default function ActionPill({
    action, kind = 'technical', size = 'sm', title,
}: {
    action?: string | null;
    kind?: 'technical' | 'content' | 'industry' | 'monitor';
    size?: 'xs' | 'sm';
    title?: string;
}) {
    if (!action) return <span className="text-[#444] text-[11px]">—</span>;
    const s = STYLES[kind] || STYLES.technical;
    const px = size === 'xs' ? 'px-1.5 py-[1px] text-[9px]' : 'px-2 py-[2px] text-[10px]';
    return (
        <span
            title={title || action}
            className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${px}`}
            style={{ color: s.text, background: s.bg, borderColor: s.border }}
        >
            {action}
        </span>
    );
}
