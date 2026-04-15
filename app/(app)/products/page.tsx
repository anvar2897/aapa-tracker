// app/(app)/products/page.tsx
import { getProductListRows } from '@/lib/queries';
import { ProductTable } from '@/components/product/ProductTable';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const rows = await getProductListRows();

  const total = rows.length;
  const lowScore = rows.filter((r) => r.score.total < 50).length;
  const fboWarn = rows.filter(
    (r) => r.scheme === 'FBO' && r.fboTurnoverDays !== null && r.fboTurnoverDays >= 45
  ).length;

  return (
    <div className="px-8 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'hsl(213 31% 91%)' }}
          >
            Товары
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
            Каталог AAPA Store · Uzum Marketplace
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
            style={{
              backgroundColor: 'hsl(222 47% 15%)',
              border: '1px solid hsl(216 34% 22%)',
              color: 'hsl(213 31% 88%)',
            }}
          >
            <span style={{ color: 'hsl(215 20% 55%)' }}>Всего:</span>
            <span className="font-mono font-semibold">{total}</span>
          </div>
          {lowScore > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
              }}
            >
              <span>Score &lt;50:</span>
              <span className="font-mono font-semibold">{lowScore}</span>
            </div>
          )}
          {fboWarn > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                color: '#fbbf24',
              }}
            >
              <span>⚠ FBO:</span>
              <span className="font-mono font-semibold">{fboWarn}</span>
            </div>
          )}
        </div>
      </div>

      <ProductTable rows={rows} />
    </div>
  );
}
