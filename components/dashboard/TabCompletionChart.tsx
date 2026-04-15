'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';

type Props = {
  tabCompletion: { tab: string; metPct: number }[];
};

export function TabCompletionChart({ tabCompletion }: Props) {
  if (tabCompletion.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px]" style={{ color: 'hsl(215 20% 45%)' }}>
        <span className="text-sm">No data yet</span>
      </div>
    );
  }

  const data = [...tabCompletion].sort((a, b) => b.metPct - a.metPct);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
      >
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="tab"
          width={72}
          tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
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
          formatter={(value: number) => [`${value}%`, 'Completion']}
        />
        <Bar dataKey="metPct" radius={[0, 4, 4, 0]} fill="#f59e0b">
          <LabelList
            dataKey="metPct"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fill: 'hsl(215 20% 65%)', fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
