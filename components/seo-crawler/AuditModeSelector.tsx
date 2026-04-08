import React, { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Save, X } from 'lucide-react';
import { AUDIT_MODES, INDUSTRY_FILTERS } from '../../services/AuditModeConfig';
import { getActiveChecks } from '../../services/CheckFilterEngine';
import type { AuditMode, IndustryFilter } from '../../services/CheckRegistry';

interface AuditModeSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    currentModes: AuditMode[];
    currentIndustry: IndustryFilter;
    onApply: (modes: AuditMode[], industry: IndustryFilter) => void;
    onSavePreset: (name: string, modes: AuditMode[], industry: IndustryFilter) => void;
}

export default function AuditModeSelector({
    isOpen,
    onClose,
    currentModes,
    currentIndustry,
    onApply,
    onSavePreset
}: AuditModeSelectorProps) {
    const [selectedModes, setSelectedModes] = useState<AuditMode[]>(currentModes);
    const [selectedIndustry, setSelectedIndustry] = useState<IndustryFilter>(currentIndustry);
    const [showSavePreset, setShowSavePreset] = useState(false);
    const [presetName, setPresetName] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setSelectedModes(currentModes.length > 0 ? currentModes : ['full']);
        setSelectedIndustry(currentIndustry);
    }, [isOpen, currentModes, currentIndustry]);

    const activeCheckCount = useMemo(() => {
        return getActiveChecks({ modes: selectedModes, industry: selectedIndustry }).length;
    }, [selectedModes, selectedIndustry]);

    const handleModeToggle = (mode: AuditMode, event: React.MouseEvent) => {
        if (mode === 'full') {
            setSelectedModes(['full']);
            return;
        }

        let next: AuditMode[] = selectedModes.filter((entry) => entry !== 'full');
        const alreadySelected = next.includes(mode);

        if (event.shiftKey) {
            next = alreadySelected ? next.filter((entry) => entry !== mode) : [...next, mode];
        } else {
            next = alreadySelected ? [] : [mode];
        }

        if (next.length === 0) next = ['full'];
        setSelectedModes(next);
    };

    const handleApply = () => {
        onApply(selectedModes, selectedIndustry);
        onClose();
    };

    const handleSave = () => {
        const trimmed = presetName.trim();
        if (!trimmed) return;
        onSavePreset(trimmed, selectedModes, selectedIndustry);
        setPresetName('');
        setShowSavePreset(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-[680px] max-h-[85vh] bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
                    <div>
                        <h3 className="text-[14px] text-white font-bold">Audit Mode & Industry</h3>
                        <p className="text-[11px] text-[#777] mt-0.5">{activeCheckCount} checks active</p>
                    </div>
                    <button onClick={onClose} className="text-[#666] hover:text-white p-1 rounded hover:bg-[#222] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-6">
                    <section>
                        <h4 className="text-[10px] text-[#666] uppercase tracking-widest font-bold mb-2">Select Audit Mode</h4>
                        <p className="text-[10px] text-[#555] mb-3">Click a mode. Use shift-click to combine modes.</p>
                        <div className="space-y-1.5">
                            {AUDIT_MODES.map((mode) => {
                                const selected = selectedModes.includes(mode.id);
                                return (
                                    <button
                                        key={mode.id}
                                        onClick={(event) => handleModeToggle(mode.id, event)}
                                        className={`w-full text-left rounded-lg border px-3 py-2.5 flex items-center gap-3 transition-colors ${
                                            selected
                                                ? 'border-[#F5364E]/40 bg-[#F5364E]/10'
                                                : 'border-[#222] bg-[#0f0f0f] hover:border-[#333] hover:bg-[#171717]'
                                        }`}
                                    >
                                        <span className="text-[16px]">{mode.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[12px] font-semibold ${selected ? 'text-white' : 'text-[#ddd]'}`}>{mode.label}</div>
                                            <div className="text-[10px] text-[#666] truncate">{mode.description}</div>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#666]">{mode.totalChecks}</span>
                                        {selected && <Check size={13} className="text-[#F5364E]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section>
                        <h4 className="text-[10px] text-[#666] uppercase tracking-widest font-bold mb-2">Industry Filter</h4>
                        <p className="text-[10px] text-[#555] mb-3">Adds vertical-specific checks on top of selected mode(s).</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {INDUSTRY_FILTERS.map((industry) => {
                                const selected = selectedIndustry === industry.id;
                                return (
                                    <button
                                        key={industry.id}
                                        onClick={() => setSelectedIndustry(industry.id)}
                                        className={`text-left rounded-lg border px-3 py-2 flex items-center gap-2.5 transition-colors ${
                                            selected
                                                ? 'border-[#F5364E]/40 bg-[#F5364E]/10'
                                                : 'border-[#222] bg-[#0f0f0f] hover:border-[#333] hover:bg-[#171717]'
                                        }`}
                                    >
                                        <span className="text-[14px]">{industry.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[11px] font-semibold truncate ${selected ? 'text-white' : 'text-[#ddd]'}`}>{industry.label}</div>
                                            {industry.extraChecksLabel && (
                                                <div className="text-[9px] text-[#666] truncate">{industry.extraChecksLabel}</div>
                                            )}
                                        </div>
                                        {selected && <Check size={12} className="text-[#F5364E]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {showSavePreset ? (
                        <div className="bg-[#0f0f0f] border border-[#222] rounded-lg px-3 py-2.5 flex items-center gap-2">
                            <input
                                type="text"
                                value={presetName}
                                onChange={(event) => setPresetName(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') handleSave();
                                    if (event.key === 'Escape') setShowSavePreset(false);
                                }}
                                placeholder="Preset name..."
                                autoFocus
                                className="flex-1 bg-transparent text-[12px] text-white placeholder:text-[#555] focus:outline-none"
                            />
                            <button onClick={handleSave} className="px-2.5 py-1 text-[11px] font-semibold bg-[#F5364E] text-white rounded hover:bg-[#df3248] transition-colors">
                                Save
                            </button>
                            <button onClick={() => setShowSavePreset(false)} className="text-[#666] hover:text-white transition-colors">
                                <X size={13} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowSavePreset(true)} className="text-[11px] text-[#888] hover:text-white transition-colors flex items-center gap-1.5">
                            <Save size={12} />
                            Save as Custom Preset
                        </button>
                    )}
                </div>

                <div className="px-5 py-4 border-t border-[#222] bg-[#0d0d0d] flex items-center justify-between">
                    <button
                        onClick={() => {
                            setSelectedModes(['full']);
                            setSelectedIndustry('all');
                        }}
                        className="text-[11px] text-[#888] hover:text-white transition-colors flex items-center gap-1.5"
                    >
                        <RotateCcw size={12} />
                        Reset to Full Audit
                    </button>
                    <div className="flex items-center gap-2.5">
                        <button onClick={onClose} className="px-3 py-1.5 text-[12px] text-[#888] hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleApply} className="px-4 py-1.5 text-[12px] font-bold bg-[#F5364E] text-white rounded hover:bg-[#df3248] transition-colors">
                            Apply Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
