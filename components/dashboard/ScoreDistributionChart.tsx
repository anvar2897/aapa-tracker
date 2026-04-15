'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Props = {
  distribution: { red: number; yellow: number; blue: number; green: number };
};

const bands = [
  { key: 'red', label: '<50', color: '#ef4444' },
  { key: 'yellow', label: '50–69', color: '#eab308' },
  { key: 'blue', label: '70–89', color: '#3b82f6' },
  { key: 'green', label: '90–100', color: '#22c55e' },
] as const;

export function ScoreDistributionChart({ distribution }: Props) {
  const data = bands.map(b => ({ label: b.label, count: distribution[b.key], color: b.color }));
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[180px]" style={{ color: 'hsl(215 20% 45%)' }}>
        <span className="text-sm">No products yet</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            backgroundColor: 'hsl(222 47% 15%)',
            border: '1px solid hsl(216 34% 22%)',
            borderRadius: 6,
            color: 'hsl(213 31% 91%)',
            fontSize: 12,
          }}
          formatter={(value: unknown) => [value as number, 'Products'] as const}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
