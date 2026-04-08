import React from 'react';

export default function ChartCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[#111112] border border-[#1E1E1E] rounded-lg p-4 ${className}`}>
      <h3 className="text-[11px] font-bold text-[#888] uppercase tracking-widest mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
