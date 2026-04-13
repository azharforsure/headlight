import React, { useEffect, useMemo, useState } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useSeoCrawler } from '../../../contexts/SeoCrawlerContext';
import type { CompetitorProfile } from '../../../services/CompetitorMatrixConfig';

interface SavedNote {
    text: string;
    date: string;
}

const STORAGE_KEY = 'headlight:comp-notes';

export default function CompNotesTab() {
    const { competitiveState } = useSeoCrawler();
    const { ownProfile, competitorProfiles, activeCompetitorDomains } = competitiveState;
    const [noteText, setNoteText] = useState('');
    const [notes, setNotes] = useState<SavedNote[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as SavedNote[];
            if (Array.isArray(parsed)) setNotes(parsed);
        } catch {
            setNotes([]);
        }
    }, []);

    const activeComps = useMemo(
        () => activeCompetitorDomains.map((d) => competitorProfiles.get(d)).filter(Boolean) as CompetitorProfile[],
        [activeCompetitorDomains, competitorProfiles]
    );

    const deltaMetrics = useMemo(() => {
        if (!ownProfile || activeComps.length === 0) return [];
        const metrics: Array<{ label: string; key: keyof CompetitorProfile }> = [
            { label: 'Organic Traffic', key: 'estimatedOrganicTraffic' },
            { label: 'Referring Domains', key: 'referringDomains' },
            { label: 'Indexable Pages', key: 'totalIndexablePages' },
            { label: 'Tech Health', key: 'techHealthScore' },
            { label: 'CWV Pass Rate', key: 'cwvPassRate' },
            { label: 'GEO Score', key: 'avgGeoScore' },
        ];

        return metrics.map((m) => {
            const yours = Number(ownProfile[m.key] || 0);
            const compAvg =
                activeComps.reduce((sum: number, c) => sum + Number(c[m.key] || 0), 0) / activeComps.length;
            const diff = yours - compAvg;
            return { ...m, yours, compAvg: Math.round(compAvg), diff: Math.round(diff) };
        });
    }, [ownProfile, activeComps]);

    const addNote = () => {
        const text = noteText.trim();
        if (!text) return;
        const updated = [{ text, date: new Date().toISOString() }, ...notes];
        setNotes(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setNoteText('');
    };

    const DeltaIcon = ({ diff }: { diff: number }) => {
        if (diff > 5) return <TrendingUp size={10} className="text-green-400" />;
        if (diff < -5) return <TrendingDown size={10} className="text-red-400" />;
        return <Minus size={10} className="text-[#555]" />;
    };

    return (
        <div className="custom-scrollbar h-full space-y-4 overflow-y-auto p-3">
            <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#666]">Your Position vs Competitor Avg</div>
                {deltaMetrics.length > 0 ? (
                    <div className="space-y-1">
                        {deltaMetrics.map((m) => (
                            <div key={String(m.key)} className="flex items-center py-1 text-[10px]">
                                <span className="flex-1 text-[#888]">{m.label}</span>
                                <span className="w-[55px] text-right font-mono text-white">{m.yours.toLocaleString()}</span>
                                <span className="mx-1.5 text-[#333]">vs</span>
                                <span className="w-[55px] font-mono text-[#888]">{m.compAvg.toLocaleString()}</span>
                                <span className="ml-1 w-[12px]">
                                    <DeltaIcon diff={m.diff} />
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-2 text-center text-[11px] text-[#555]">No comparison data available.</div>
                )}
            </div>

            <div className="rounded-xl border border-[#222] bg-[#0d0d0f] p-3">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#666]">Notes</div>
                <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a competitive observation..."
                    className="mb-2 h-[60px] w-full resize-none rounded-lg border border-[#222] bg-[#111] p-2 text-[11px] text-white placeholder:text-[#444] outline-none focus:border-[#F5364E]/30"
                />
                <button
                    onClick={addNote}
                    disabled={!noteText.trim()}
                    className="text-[10px] font-bold text-[#F5364E] transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-[#333]"
                >
                    + Add Note
                </button>

                {notes.length > 0 && (
                    <div className="custom-scrollbar mt-3 max-h-[300px] space-y-2 overflow-y-auto">
                        {notes.map((note, i) => (
                            <div key={`${note.date}-${i}`} className="border-l-2 border-[#333] py-1 pl-2">
                                <div className="text-[10px] text-[#ccc]">{note.text}</div>
                                <div className="mt-0.5 text-[8px] text-[#444]">
                                    {new Date(note.date).toLocaleDateString()}{' '}
                                    {new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
