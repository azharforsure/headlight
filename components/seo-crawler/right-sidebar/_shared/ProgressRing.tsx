import { HelpHint } from './HelpHint'

export function ProgressRing({
  value, size = 56, stroke = 5, label, hint,
}: {
  value: number; size?: number; stroke?: number; label?: string; hint?: string
}) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (v / 100) * c
  const tone = v >= 75 ? '#22c55e' : v >= 50 ? '#f59e0b' : '#F5364E'
  const styleSize = { width: size, height: size }
  return (
    <div className="relative inline-flex items-center justify-center" style={styleSize}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#1a1a1a" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={tone} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[12px] font-mono font-bold text-white">{Math.round(v)}</span>
        {label && (
          <span className="text-[9px] text-[#888] flex items-center gap-1">
            {label}
            {hint && <HelpHint text={hint} />}
          </span>
        )}
      </div>
    </div>
  )
}
