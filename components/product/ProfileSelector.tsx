'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/app/actions/products';

type Profile = 'accessories' | 'parts';

export function ProfileSelector() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sku, setSku] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [nameUz, setNameUz] = useState('');
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    startTransition(async () => {
      const result = await createProduct({
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        productProfile: profile,
        nameRu: nameRu.trim(),
        nameUz: nameUz.trim(),
      });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.push(`/products/${result.id}`);
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step 1: profile */}
      <div className="mb-6">
        <h2
          className="text-sm font-medium mb-3 uppercase tracking-wider"
          style={{ color: 'hsl(215 20% 55%)' }}
        >
          Шаг 1. Выберите профиль
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setProfile('accessories')}
            className="p-6 rounded-lg text-left transition-all"
            style={{
              backgroundColor: profile === 'accessories' ? 'rgba(245, 158, 11, 0.1)' : 'hsl(222 47% 15%)',
              border: `2px solid ${profile === 'accessories' ? '#f59e0b' : 'hsl(216 34% 22%)'}`,
            }}
          >
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-md font-mono font-bold text-lg mb-3"
              style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
            >
              A
            </div>
            <div className="text-base font-semibold" style={{ color: 'hsl(213 31% 91%)' }}>
              Аксессуары
            </div>
            <div className="text-xs mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
              Автохимия, косметика, чехлы, инструменты · 80% каталога
            </div>
          </button>
          <button
            type="button"
            onClick={() => setProfile('parts')}
            className="p-6 rounded-lg text-left transition-all"
            style={{
              backgroundColor: profile === 'parts' ? 'rgba(59, 130, 246, 0.1)' : 'hsl(222 47% 15%)',
              border: `2px solid ${profile === 'parts' ? '#3b82f6' : 'hsl(216 34% 22%)'}`,
            }}
          >
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-md font-mono font-bold text-lg mb-3"
              style={{ backgroundColor: '#3b82f6', color: 'white' }}
            >
              P
            </div>
            <div className="text-base font-semibold" style={{ color: 'hsl(213 31% 91%)' }}>
              Запчасти
            </div>
            <div className="text-xs mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
              OEM, кросс-номера, совместимые модели · 20% каталога
            </div>
          </button>
        </div>
      </div>

      {/* Step 2: basic fields */}
      {profile && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
        >
          <h2
            className="text-sm font-medium mb-4 uppercase tracking-wider"
            style={{ color: 'hsl(215 20% 55%)' }}
          >
            Шаг 2. Основные данные
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU *" required>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono"
                style={inputStyle}
              />
            </Field>
            <Field label="Штрих-код">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono"
                style={inputStyle}
              />
            </Field>
            <Field label="Название (RU) *" required>
              <input
                type="text"
                required
                value={nameRu}
                onChange={(e) => setNameRu(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none"
                style={inputStyle}
              />
            </Field>
            <Field label="Название (UZ) *" required>
              <input
                type="text"
                required
                value={nameUz}
                onChange={(e) => setNameUz(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none"
                style={inputStyle}
              />
            </Field>
          </div>
          {error && (
            <div
              className="mt-4 p-3 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
            >
              {pending ? 'Создание…' : 'Создать товар'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  backgroundColor: 'hsl(222 47% 11%)',
  color: 'hsl(213 31% 91%)',
  border: '1px solid hsl(216 34% 28%)',
};

function Field({ label, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs mb-1.5" style={{ color: 'hsl(215 20% 55%)' }}>
        {label}
      </span>
      {children}
    </label>
  );
}
