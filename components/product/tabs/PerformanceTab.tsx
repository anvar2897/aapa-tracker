import { Section } from './CardInfoTab';
import type { Performance } from '@/db/schema';

export function PerformanceTab({ performance }: { performance: Performance[] }) {
  if (performance.length === 0) {
    return (
      <Section title="Метрики">
        <div className="text-sm py-6 text-center" style={{ color: 'hsl(215 20% 45%)' }}>
          Нет данных о показателях. Снэпшоты загружаются из Uzum API (ещё не реализовано).
        </div>
      </Section>
    );
  }

  const headers = [
    { key: 'date', label: 'Дата' },
    { key: 'impressions', label: 'Показы' },
    { key: 'opens', label: 'Открытия' },
    { key: 'cart', label: 'В корзину' },
    { key: 'orders', label: 'Заказы' },
    { key: 'received', label: 'Получено' },
    { key: 'returns', label: 'Возвраты' },
    { key: 'conversionPct', label: 'CR, %' },
    { key: 'revenue', label: 'Выручка' },
    { key: 'rating', label: 'Рейтинг' },
    { key: 'reviews', label: 'Отзывы' },
    { key: 'roiPct', label: 'ROI, %' },
  ] as const;

  return (
    <Section title={`Метрики (${performance.length} снэпшотов)`}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(216 34% 22%)' }}>
              {headers.map((h) => (
                <th key={h.key}
                  className="px-3 py-2 text-left font-medium whitespace-nowrap"
                  style={{ color: 'hsl(215 20% 55%)' }}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {performance.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid hsl(216 34% 19%)' }}>
                {headers.map((h) => {
                  const v = (row as unknown as Record<string, unknown>)[h.key];
                  const display = v == null ? '—' :
                    typeof v === 'number' ? (h.key === 'revenue' ? v.toLocaleString('ru-RU') : String(v)) :
                    String(v);
                  return (
                    <td key={h.key}
                      className="px-3 py-2 font-mono whitespace-nowrap"
                      style={{ color: 'hsl(213 31% 85%)' }}>
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
