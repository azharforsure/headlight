import React from 'react'

type MiniBarItem = { label: string; value: number; tone?: 'good' | 'warn' | 'bad' | 'info' }

export function MiniBar({ 
  data, max, height, mode = 'list' 
}: { 
  data: MiniBarItem[]; 
  max?: number; 
  height?: number;
  mode?: 'list' | 'histogram'
}) {
  const items = data ?? []
  const cap = max ?? Math.max(1, ...items.map(d => d.value))
  const color = (t?: string) => 
    t === 'bad' ? '#f87171' : 
    t === 'warn' ? '#fbbf24' : 
    t === 'good' ? '#4ade80' : 
    t === 'info' ? '#60a5fa' : '#a78bfa'

  if (mode === 'histogram') {
    return (
      <div className="flex items-end gap-1 w-full mt-2" style={{ height: height ?? 40 }}>
        {items.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div 
              className="w-full bg-white/10 rounded-t-sm transition-all duration-500 hover:bg-white/20 relative"
              style={{ height: `${(d.value / cap) * 100}%`, backgroundColor: color(d.tone) }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {d.label}: {d.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5" style={{ height }}>
      {items.map((d) => (
        <div key={d.label} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider">
            <span className="text-[#666]">{d.label}</span>
            <span className="text-[#999] font-mono">{d.value}</span>
          </div>
          <div className="h-[4px] bg-[#121212] rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500 ease-out" 
              style={ { width: `${(d.value / cap) * 100}%`, background: color(d.tone) } } 
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProgressBar({ value, max = 100, tone }: { value: number; max?: number; tone?: 'good' | 'warn' | 'bad' | 'info' }) {
  const color = (t?: string) => 
    t === 'bad' ? '#f87171' : 
    t === 'warn' ? '#fbbf24' : 
    t === 'good' ? '#4ade80' : 
    t === 'info' ? '#60a5fa' : '#a78bfa'
  return (
    <div className="h-[4px] bg-[#121212] rounded-full overflow-hidden">
      <div 
        className="h-full transition-all duration-500 ease-out" 
        style={ { width: `${(value / max) * 100}%`, background: color(tone) } } 
      />
    </div>
  )
}
