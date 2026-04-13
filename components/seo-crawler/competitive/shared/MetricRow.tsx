import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface MetricRowProps {
  label: string;
  yours: number;
  compAvg: number;
  unit?: string;
  inverse?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

export default function MetricRow({
  label,
  yours,
  compAvg,
  unit = '',
  inverse = false,
  onClick,
  selected = false,
}: MetricRowProps) {
  const diff = yours - compAvg;
  const isWinning = inverse ? diff < 0 : diff > 0;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-lg text-left transition-all ${
        selected ? 'border border-[#F5364E]/20 bg-[#F5364E]/5' : 'border border-transparent hover:bg-[#111]'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className="flex-1 text-[11px] text-[#888]">{label}</span>
      <span className="w-[60px] text-right font-mono text-[13px] font-bold text-white">
        {yours.toLocaleString()}
        {unit}
      </span>
      <span className="w-[16px] text-center text-[10px] text-[#333]">vs</span>
      <span className="w-[60px] text-right font-mono text-[11px] text-[#666]">
        {compAvg.toLocaleString()}
        {unit}
      </span>
      <span className="w-[14px]">
        {diff === 0 || Math.abs(diff) < 1 ? (
          <Minus size={10} className="text-[#555]" />
        ) : isWinning ? (
          <TrendingUp size={10} className="text-green-400" />
        ) : (
          <TrendingDown size={10} className="text-red-400" />
        )}
      </span>
    </button>
  );
}
