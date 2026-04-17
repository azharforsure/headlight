import React, { useEffect } from 'react';
import { LayoutGrid, BarChart2, ListChecks, Network } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import { WqaViewMode } from '../../../services/WebsiteQualityModeTypes';

const VIEWS: Array<{ id: WqaViewMode; label: string; Icon: React.ElementType; shortcut: string }> = [
    { id: 'grid',      label: 'Grid',      Icon: LayoutGrid, shortcut: '1' },
    { id: 'overview',  label: 'Overview',  Icon: BarChart2,  shortcut: '2' },
    { id: 'actions',   label: 'Actions',   Icon: ListChecks, shortcut: '3' },
    { id: 'structure', label: 'Structure', Icon: Network,    shortcut: '4' },
];

export default function WqaViewSwitcher() {
    const { wqaState, setWqaViewMode } = useSeoCrawler() as any;
    const current = (wqaState?.viewMode || 'grid') as WqaViewMode;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const match = VIEWS.find((v) => v.shortcut === e.key);
            if (match) setWqaViewMode(match.id);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [setWqaViewMode]);

    return (
        <div className="flex items-center bg-[#0a0a0a] rounded-md border border-[#1e1e1e] p-0.5 gap-0.5">
            {VIEWS.map(({ id, label, Icon, shortcut }) => {
                const active = current === id;
                return (
                    <button
                        key={id}
                        onClick={() => setWqaViewMode(id)}
                        title={`${label} (${shortcut})`}
                        className={`group relative px-2.5 h-[26px] text-[11px] font-medium rounded flex items-center gap-1.5 transition-colors ${
                            active
                                ? 'bg-[#1a1a1a] text-white'
                                : 'text-[#888] hover:text-[#ddd] hover:bg-[#141414]'
                        }`}
                    >
                        <Icon size={12} className={active ? 'text-[#F5364E]' : ''} />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
