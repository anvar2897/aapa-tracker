'use client';

import { useState, useTransition, useRef } from 'react';

type ImportResult = {
  createdCount: number;
  createdIds: number[];
  parseErrors: { row: number; message: string }[];
  createErrors: { sku: string; message: string }[];
};

export function ImportForm() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import/products', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Upload failed');
        return;
      }

      const data: ImportResult = await res.json();
      setResult(data);
    });
  }

  const totalErrors = (result?.parseErrors.length ?? 0) + (result?.createErrors.length ?? 0);

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          required
          className="text-sm"
          style={{ color: 'hsl(213 31% 91%)' }}
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
        >
          {pending ? 'Загрузка…' : 'Импортировать'}
        </button>
      </form>

      {error && (
        <div
          className="p-3 rounded-md text-sm mb-3"
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          <div
            className="p-3 rounded-md text-sm"
            style={{
              backgroundColor: result.createdCount > 0 ? 'rgba(34,197,94,0.08)' : 'hsl(222 47% 13%)',
              border: `1px solid ${result.createdCount > 0 ? 'rgba(34,197,94,0.2)' : 'hsl(216 34% 22%)'}`,
              color: result.createdCount > 0 ? '#22c55e' : 'hsl(215 20% 55%)',
            }}
          >
            Создано товаров: {result.createdCount}
            {totalErrors > 0 && (
              <span style={{ color: '#f87171' }}> · Ошибок: {totalErrors}</span>
            )}
          </div>

          {result.parseErrors.length > 0 && (
            <div>
              <p className="text-xs mb-2 font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
                Ошибки парсинга:
              </p>
              <div className="flex flex-col gap-1">
                {result.parseErrors.map((e) => (
                  <div key={e.row} className="text-xs font-mono" style={{ color: '#f87171' }}>
                    Строка {e.row}: {e.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.createErrors.length > 0 && (
            <div>
              <p className="text-xs mb-2 font-medium" style={{ color: 'hsl(215 20% 55%)' }}>
                Ошибки создания:
              </p>
              <div className="flex flex-col gap-1">
                {result.createErrors.map((e) => (
                  <div key={e.sku} className="text-xs font-mono" style={{ color: '#f87171' }}>
                    {e.sku}: {e.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
