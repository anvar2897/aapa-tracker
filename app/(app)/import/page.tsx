export default function ImportPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'hsl(213 31% 91%)' }}
        >
          Импорт / Экспорт
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
          Экспорт каталога · CSV импорт (Phase 4B)
        </p>
      </div>

      <div
        className="rounded-lg p-6 mb-6"
        style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
      >
        <h2 className="text-sm font-medium mb-1" style={{ color: 'hsl(213 31% 91%)' }}>
          Экспорт каталога
        </h2>
        <p className="text-xs mb-4" style={{ color: 'hsl(215 20% 55%)' }}>
          Скачать все товары в формате CSV (id, SKU, профиль, названия, статус, схема, остатки, score)
        </p>
        <a
          href="/api/export/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
          style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
          download="aapa-products.csv"
        >
          Скачать CSV
        </a>
      </div>

      <div
        className="rounded-lg p-6"
        style={{
          backgroundColor: 'hsl(222 47% 13%)',
          border: '1px dashed hsl(216 34% 28%)',
        }}
      >
        <h2 className="text-sm font-medium mb-1" style={{ color: 'hsl(215 20% 55%)' }}>
          CSV Импорт
        </h2>
        <p className="text-xs" style={{ color: 'hsl(215 20% 40%)' }}>
          Будет доступно в Phase 4B
        </p>
      </div>
    </div>
  );
}
