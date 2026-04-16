import { ImportForm } from '@/components/import/ImportForm';

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
          CSV импорт и экспорт каталога
        </p>
      </div>

      {/* Export section */}
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

      {/* Import section */}
      <div
        className="rounded-lg p-6 mb-6"
        style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
      >
        <h2 className="text-sm font-medium mb-1" style={{ color: 'hsl(213 31% 91%)' }}>
          Импорт из CSV
        </h2>
        <p className="text-xs mb-1" style={{ color: 'hsl(215 20% 55%)' }}>
          Загрузите CSV-файл для массового создания товаров. Колонки: sku, barcode, productProfile, nameRu, nameUz
        </p>
        <div className="flex gap-4 mb-4">
          <a
            href="/templates/aapa-accessories-template.csv"
            className="text-xs underline"
            style={{ color: 'hsl(215 20% 55%)' }}
            download
          >
            Шаблон: Аксессуары
          </a>
          <a
            href="/templates/aapa-parts-template.csv"
            className="text-xs underline"
            style={{ color: 'hsl(215 20% 55%)' }}
            download
          >
            Шаблон: Запчасти
          </a>
        </div>
        <ImportForm />
      </div>
    </div>
  );
}
