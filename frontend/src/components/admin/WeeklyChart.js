import React from 'react';
import { TrendingUp } from 'lucide-react';

const SERIES = [
  ['users', 'Cadastros', '#2A9D8F'],
  ['posts', 'Publicações', '#E9C46A'],
  ['appointments', 'Encontros', '#264653'],
];

export default function WeeklyChart({ data = [] }) {
  const max = Math.max(1, ...data.flatMap((d) => SERIES.map(([k]) => d[k] || 0)));
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm" data-testid="admin-weekly-chart">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800"><TrendingUp size={20} className="text-primary" /> Crescimento nas últimas 8 semanas</h3>
        <div className="flex gap-3 text-xs text-gray-600">
          {SERIES.map(([k, l, c]) => <span key={k} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{l}</span>)}
        </div>
      </div>
      <div className="flex h-48 items-end gap-2 sm:gap-4">
        {data.map((d) => (
          <div key={d.week} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-40 w-full items-end justify-center gap-0.5">
              {SERIES.map(([k, l, c]) => (
                <div key={k} title={`${l}: ${d[k]}`} className="w-full max-w-[14px] rounded-t transition-all" style={{ height: `${((d[k] || 0) / max) * 100}%`, minHeight: d[k] ? 4 : 0, background: c }} />
              ))}
            </div>
            <span className="text-[10px] text-gray-500">{d.week}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
