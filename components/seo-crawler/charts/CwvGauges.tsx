import React from 'react';
import ChartCard from './ChartCard';

type Rating = 'good' | 'needs-improvement' | 'poor';

function getMetricRating(metric: string, value: number): Rating {
  if (metric === 'lcp') return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
  if (metric === 'cls') return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
  if (metric === 'inp') return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
  return 'good';
}

const RATING_COLORS: Record<Rating, string> = {
  good: '#4ade80',
  'needs-improvement': '#fbbf24',
  poor: '#f87171',
};

const RATING_LABELS: Record<Rating, string> = {
  good: '✓ Good',
  'needs-improvement': '⚠ Needs Work',
  poor: '✗ Poor',
};

function GaugeRing({ value, max, color, label, unit }: {
  value: number; max: number; color: string; label: string; unit: string;
}) {
  const pct = Math.min(value / max, 1);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" stroke="#222" strokeWidth="6" fill="none" />
          <circle
            cx="40" cy="40" r="36"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-white">
            {typeof value === 'number' && value > 10 ? Math.round(value) : value.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="text-[11px] text-[#ccc] font-semibold mt-1">{label}</div>
      <div className="text-[10px] mt-0.5" style={{ color }}>
        {unit}
      </div>
    </div>
  );
}

export default function CwvGauges({
  data,
}: {
  data: { lcp: number; cls: number; inp: number };
}) {
  const lcpRating = getMetricRating('lcp', data.lcp);
  const clsRating = getMetricRating('cls', data.cls);
  const inpRating = getMetricRating('inp', data.inp);

  return (
    <ChartCard title="Core Web Vitals (Averages)">
      <div className="flex items-center justify-around py-4">
        <GaugeRing
          value={data.lcp / 1000}
          max={4}
          color={RATING_COLORS[lcpRating]}
          label="LCP"
          unit={`${RATING_LABELS[lcpRating]} · ${(data.lcp / 1000).toFixed(1)}s`}
        />
        <GaugeRing
          value={data.cls}
          max={0.25}
          color={RATING_COLORS[clsRating]}
          label="CLS"
          unit={`${RATING_LABELS[clsRating]} · ${data.cls.toFixed(3)}`}
        />
        <GaugeRing
          value={data.inp}
          max={500}
          color={RATING_COLORS[inpRating]}
          label="INP"
          unit={`${RATING_LABELS[inpRating]} · ${Math.round(data.inp)}ms`}
        />
      </div>
    </ChartCard>
  );
}
