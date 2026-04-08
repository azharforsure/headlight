import React from 'react';

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <div className="mb-4">
        <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">{title}</h3>
        {description && <p className="text-[11px] text-[#666] mt-1">{description}</p>}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

export function SettingsToggle({ label, description, checked, onChange }: { 
  label: string; description?: string; checked: boolean; onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg cursor-pointer hover:border-[#333] transition-colors"
      onClick={() => onChange(!checked)}>
      <div>
        <div className="text-[12px] text-white font-medium">{label}</div>
        {description && <div className="text-[10px] text-[#666] mt-0.5">{description}</div>}
      </div>
      <div className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-[#F5364E]' : 'bg-[#333]'}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'right-0.5' : 'left-0.5'}`} />
      </div>
    </label>
  );
}

export function SettingsInput({ label, description, value, onChange, type = 'text', placeholder }: {
  label: string; description?: string; value: string | number; onChange: (val: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-[#888]">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-[12px] text-white focus:border-[#F5364E] outline-none transition-colors placeholder:text-[#333]"
      />
      {description && <p className="text-[10px] text-[#555]">{description}</p>}
    </div>
  );
}

export function SettingsSelect({ label, description, value, onChange, options }: {
  label: string; description?: string; value: string; onChange: (val: any) => void; options: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-[#888]">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-[12px] text-white focus:border-[#F5364E] outline-none transition-colors appearance-none cursor-pointer"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {description && <p className="text-[10px] text-[#555]">{description}</p>}
    </div>
  );
}

export function SettingsTextarea({ label, description, value, onChange, placeholder, rows = 3 }: {
  label: string; description?: string; value: string; onChange: (val: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-[#888]">{label}</label>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-[12px] text-white focus:border-[#F5364E] outline-none transition-colors placeholder:text-[#333] resize-none font-mono"
      />
      {description && <p className="text-[10px] text-[#555]">{description}</p>}
    </div>
  );
}

export function SettingsSlider({ label, min, max, step, value, onChange, unit = '' }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (val: number) => void; unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <label className="text-[11px] font-medium text-[#888]">{label}</label>
        <span className="text-[11px] font-bold text-[#F5364E]">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#F5364E]"
      />
    </div>
  );
}
