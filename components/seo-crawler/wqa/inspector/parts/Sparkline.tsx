import React from 'react';

type Props = {
  values: Array<number | null | undefined>;
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
};

export default function Sparkline({
  values,
  width = 120,
  height = 28,
  stroke = '#60a5fa',
  fill = 'rgba(96,165,250,0.12)',
}: Props) {
  const v = values.map((x) => (Number.isFinite(Number(x)) ? Number(x) : 0));
  if (v.length < 2) {
    return <div style={{ width, height }} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded" />;
  }
  const min = Math.min(...v);
  const max = Math.max(...v);
  const range = max - min || 1;
  const step = width / (v.length - 1);
  const pts = v.map((y, i) => [i * step, height - ((y - min) / range) * height] as const);
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="block">
      <path d={area} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.25} />
    </svg>
  );
}
