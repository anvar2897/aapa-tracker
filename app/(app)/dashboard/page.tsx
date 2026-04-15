import { getDashboardData } from '@/lib/queries';
import { StatCard } from '@/components/dashboard/StatCard';
import { ScoreDistributionChart } from '@/components/dashboard/ScoreDistributionChart';
import { TabCompletionChart } from '@/components/dashboard/TabCompletionChart';
import { AlertsTable } from '@/components/dashboard/AlertsTable';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { stats, distribution, tabCompletion, alerts } = data;

  const scoreAccent =
    stats.avgScore < 50 ? 'red' :
    stats.avgScore < 70 ? 'amber' :
    stats.avgScore < 90 ? 'blue' : 'green';

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'hsl(213 31% 91%)' }}
        >
          Дашборд
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
          Каталог AAPA Store · Uzum Marketplace
        </p>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Всего товаров"
          value={stats.total}
        />
        <StatCard
          label="Средний score"
          value={stats.avgScore}
          accent={scoreAccent}
        />
        <StatCard
          label="Score < 50"
          value={stats.lowScoreCount}
          accent={stats.lowScoreCount > 0 ? 'red' : 'default'}
          sublabel="требуют внимания"
        />
        <StatCard
          label="Продаётся"
          value={stats.onSaleCount}
          accent="green"
          sublabel="on_sale"
        />
        <StatCard
          label="Выручка каталога"
          value={stats.catalogRevenue > 0 ? `${stats.catalogRevenue.toLocaleString('ru-RU')} сум` : '—'}
          accent="green"
          sublabel="сумма прайсов"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
        >
          <h2 className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
            Распределение score
          </h2>
          <ScoreDistributionChart distribution={distribution} />
        </div>
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
        >
          <h2 className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
            Заполненность по вкладкам
          </h2>
          <TabCompletionChart tabCompletion={tabCompletion} />
        </div>
      </div>

      {/* Alerts table */}
      <div>
        <h2
          className="text-xs uppercase tracking-wider mb-3 font-medium"
          style={{ color: 'hsl(215 20% 55%)' }}
        >
          Товары с низким score (&lt; 50)
        </h2>
        <AlertsTable alerts={alerts} />
      </div>
    </div>
  );
}
