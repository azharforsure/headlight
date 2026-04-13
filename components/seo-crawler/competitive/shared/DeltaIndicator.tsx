import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { DELTA_NEGATIVE, DELTA_NEUTRAL, DELTA_POSITIVE } from './styles';

interface DeltaIndicatorProps {
  diff: number;
  showValue?: boolean;
  value?: string;
  size?: number;
}

export default function DeltaIndicator({
  diff,
  showValue = false,
  value,
  size = 11,
}: DeltaIndicatorProps) {
  const color = diff > 0 ? DELTA_POSITIVE : diff < 0 ? DELTA_NEGATIVE : DELTA_NEUTRAL;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

  return (
    <span className={`inline-flex items-center gap-0.5 ${color}`}>
      <Icon size={size} />
      {showValue && value && <span className="font-mono text-[10px] font-bold">{value}</span>}
    </span>
  );
}
