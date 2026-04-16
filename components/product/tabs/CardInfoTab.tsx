'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { checkStopWords } from '@/lib/validators';
import { updateCardInfo, updateProduct } from '@/app/actions/products';
import { VAT_OPTIONS } from '@/lib/constants';
import type { Product, ProductCard } from '@/db/schema';

type Props = { productId: number; product: Product; card: ProductCard | null };

export function CardInfoTab({ productId, product, card }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Root product fields
  const [nameRu, setNameRu] = useState(product.nameRu);
  const [nameUz, setNameUz] = useState(product.nameUz);
  const [barcode, setBarcode] = useState(product.barcode ?? '');

  // Card fields
  const [titleRu, setTitleRu] = useState(card?.titleRu ?? '');
  const [titleUz, setTitleUz] = useState(card?.titleUz ?? '');
  const [descriptionRu, setDescriptionRu] = useState(card?.descriptionRu ?? '');
  const [descriptionUz, setDescriptionUz] = useState(card?.descriptionUz ?? '');
  const [shortDescRu, setShortDescRu] = useState(card?.shortDescRu ?? '');
  const [shortDescUz, setShortDescUz] = useState(card?.shortDescUz ?? '');
  const [brand, setBrand] = useState(card?.brand ?? '');
  const [vatPct, setVatPct] = useState<number | ''>(card?.vatPct ?? '');
  const [weightKg, setWeightKg] = useState<number | ''>(card?.weightKg ?? '');
  const [dimLength, setDimLength] = useState<number | ''>(card?.dimLengthCm ?? '');
  const [dimWidth, setDimWidth] = useState<number | ''>(card?.dimWidthCm ?? '');
  const [dimHeight, setDimHeight] = useState<number | ''>(card?.dimHeightCm ?? '');

  // Sync from server when detail refreshes
  useEffect(() => {
    setNameRu(product.nameRu);
    setNameUz(product.nameUz);
    setBarcode(product.barcode ?? '');
  }, [product.nameRu, product.nameUz, product.barcode]);
  useEffect(() => {
    setTitleRu(card?.titleRu ?? '');
    setTitleUz(card?.titleUz ?? '');
    setDescriptionRu(card?.descriptionRu ?? '');
    setDescriptionUz(card?.descriptionUz ?? '');
    setShortDescRu(card?.shortDescRu ?? '');
    setShortDescUz(card?.shortDescUz ?? '');
    setBrand(card?.brand ?? '');
    setVatPct(card?.vatPct ?? '');
    setWeightKg(card?.weightKg ?? '');
    setDimLength(card?.dimLengthCm ?? '');
    setDimWidth(card?.dimWidthCm ?? '');
    setDimHeight(card?.dimHeightCm ?? '');
  }, [card]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r1 = await updateProduct(productId, {
        nameRu: nameRu.trim(),
        nameUz: nameUz.trim(),
        barcode: barcode.trim() || null,
      });
      if ('error' in r1) { setError(r1.error); return; }

      const r2 = await updateCardInfo(productId, {
        titleRu: titleRu.trim() || null,
        titleUz: titleUz.trim() || null,
        descriptionRu: descriptionRu.trim() || null,
        descriptionUz: descriptionUz.trim() || null,
        shortDescRu: shortDescRu.trim() || null,
        shortDescUz: shortDescUz.trim() || null,
        brand: brand.trim() || null,
        vatPct: vatPct === '' ? null : Number(vatPct),
        weightKg: weightKg === '' ? null : Number(weightKg),
        dimLengthCm: dimLength === '' ? null : Number(dimLength),
        dimWidthCm: dimWidth === '' ? null : Number(dimWidth),
        dimHeightCm: dimHeight === '' ? null : Number(dimHeight),
      });
      if ('error' in r2) { setError(r2.error); return; }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const swTitleRu = checkStopWords(titleRu);
  const swTitleUz = checkStopWords(titleUz);
  const swDescRu  = checkStopWords(descriptionRu);
  const swDescUz  = checkStopWords(descriptionUz);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Основное">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Название (RU) *">
            <input type="text" required value={nameRu} onChange={(e) => setNameRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Название (UZ) *">
            <input type="text" required value={nameUz} onChange={(e) => setNameUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Штрих-код">
            <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Бренд">
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <Section title="Заголовки карточки (Uzum)">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Title (RU)" hint="Основной заголовок карточки на русском">
            <input type="text" value={titleRu} onChange={(e) => setTitleRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Title (UZ)">
            <input type="text" value={titleUz} onChange={(e) => setTitleUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          {!swTitleRu.valid && (
            <p className="col-span-1 text-[11px] mt-[-12px]" style={{ color: '#f59e0b' }}>
              ⚠ Стоп-слова: {swTitleRu.violations.slice(0, 2).join(' · ')}
            </p>
          )}
          {!swTitleUz.valid && (
            <p className="col-span-1 text-[11px] mt-[-12px]" style={{ color: '#f59e0b' }}>
              ⚠ Стоп-слова: {swTitleUz.violations.slice(0, 2).join(' · ')}
            </p>
          )}
          <FormField label="Короткое описание (RU)">
            <input type="text" value={shortDescRu} onChange={(e) => setShortDescRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Короткое описание (UZ)">
            <input type="text" value={shortDescUz} onChange={(e) => setShortDescUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Полное описание (RU)" span={2}>
            <textarea rows={4} value={descriptionRu} onChange={(e) => setDescriptionRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          {!swDescRu.valid && (
            <p className="col-span-2 text-[11px] mt-[-12px]" style={{ color: '#f59e0b' }}>
              ⚠ Стоп-слова: {swDescRu.violations.slice(0, 2).join(' · ')}
            </p>
          )}
          <FormField label="Полное описание (UZ)" span={2}>
            <textarea rows={4} value={descriptionUz} onChange={(e) => setDescriptionUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          {!swDescUz.valid && (
            <p className="col-span-2 text-[11px] mt-[-12px]" style={{ color: '#f59e0b' }}>
              ⚠ Стоп-слова: {swDescUz.violations.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>
      </Section>

      <Section title="Налог и габариты (ВГХ)">
        <div className="grid grid-cols-5 gap-4">
          <FormField label="НДС %">
            <select value={vatPct} onChange={(e) => setVatPct(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}>
              <option value="">—</option>
              {VAT_OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
            </select>
          </FormField>
          <FormField label="Вес, кг">
            <input type="number" step="0.001" value={weightKg}
              onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Длина, см">
            <input type="number" step="0.1" value={dimLength}
              onChange={(e) => setDimLength(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Ширина, см">
            <input type="number" step="0.1" value={dimWidth}
              onChange={(e) => setDimWidth(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Высота, см">
            <input type="number" step="0.1" value={dimHeight}
              onChange={(e) => setDimHeight(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="p-5 rounded-lg"
      style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 22%)' }}
    >
      <h3 className="text-xs uppercase tracking-wider font-medium mb-4"
        style={{ color: 'hsl(215 20% 55%)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export function SaveRow({
  pending, error, saved,
}: { pending: boolean; error: string | null; saved: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {error && (
        <span className="text-xs" style={{ color: '#f87171' }}>{error}</span>
      )}
      {saved && (
        <span className="text-xs" style={{ color: '#22c55e' }}>Сохранено ✓</span>
      )}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
        style={{ backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }}
      >
        {pending ? 'Сохранение…' : 'Сохранить'}
      </button>
    </div>
  );
}
