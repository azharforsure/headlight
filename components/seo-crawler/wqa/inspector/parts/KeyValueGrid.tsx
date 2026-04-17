import React from 'react';
import { DataRow } from '../../../inspector/shared';

type Row = {
  label: string;
  value: React.ReactNode;
  status?: 'pass' | 'warn' | 'fail' | 'info';
  mono?: boolean;
};

export default function KeyValueGrid({ rows, cols = 1 }: { rows: Row[]; cols?: 1 | 2 | 3 }) {
  return (
    <div className={`grid grid-cols-1 ${cols === 2 ? 'md:grid-cols-2' : ''} ${cols === 3 ? 'md:grid-cols-2 xl:grid-cols-3' : ''} gap-x-6`}>
      {rows.map((r) => (
        <DataRow key={r.label} label={r.label} value={r.value} status={r.status} mono={r.mono} />
      ))}
    </div>
  );
}
