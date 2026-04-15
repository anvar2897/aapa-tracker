'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updateAccessoriesData } from '@/app/actions/products';
import type { AccessoriesData } from '@/db/schema';

type Props = { productId: number; data: AccessoriesData | null };

function parseColors(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}

function parseBundleInfo(json: string | null | undefined) {
  if (!json) return { description_ru: '', description_uz: '', items: [] as string[] };
  try {
    const p = JSON.parse(json);
    return {
      description_ru: String(p?.description_ru ?? ''),
      description_uz: String(p?.description_uz ?? ''),
      items: Array.isArray(p?.items) ? (p.items as unknown[]).filter((x): x is string => typeof x === 'string') : [],
    };
  } catch { return { description_ru: '', description_uz: '', items: [] }; }
}

export function AccessoriesTab({ productId, data }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [universalFit, setUniversalFit] = useState(Boolean(data?.universalFit));
  const [useCaseRu, setUseCaseRu] = useState(data?.useCaseRu ?? '');
  const [useCaseUz, setUseCaseUz] = useState(data?.useCaseUz ?? '');
  const [materialRu, setMaterialRu] = useState(data?.materialRu ?? '');
  const [materialUz, setMaterialUz] = useState(data?.materialUz ?? '');
  const [colors, setColors] = useState(parseColors(data?.colorOptions).join('\n'));
  const [volumeMl, setVolumeMl] = useState<number | ''>(data?.volumeMl ?? '');
  const [applicationMethodRu, setApplicationMethodRu] = useState(data?.applicationMethodRu ?? '');
  const [applicationMethodUz, setApplicationMethodUz] = useState(data?.applicationMethodUz ?? '');
  const [kitContentsRu, setKitContentsRu] = useState(data?.kitContentsRu ?? '');
  const [kitContentsUz, setKitContentsUz] = useState(data?.kitContentsUz ?? '');
  const initialBundle = parseBundleInfo(data?.bundleInfo);
  const [bundleDescRu, setBundleDescRu] = useState(initialBundle.description_ru);
  const [bundleDescUz, setBundleDescUz] = useState(initialBundle.description_uz);
  const [bundleItems, setBundleItems] = useState(initialBundle.items.join('\n'));

  useEffect(() => {
    setUniversalFit(Boolean(data?.universalFit));
    setUseCaseRu(data?.useCaseRu ?? '');
    setUseCaseUz(data?.useCaseUz ?? '');
    setMaterialRu(data?.materialRu ?? '');
    setMaterialUz(data?.materialUz ?? '');
    setColors(parseColors(data?.colorOptions).join('\n'));
    setVolumeMl(data?.volumeMl ?? '');
    setApplicationMethodRu(data?.applicationMethodRu ?? '');
    setApplicationMethodUz(data?.applicationMethodUz ?? '');
    setKitContentsRu(data?.kitContentsRu ?? '');
    setKitContentsUz(data?.kitContentsUz ?? '');
    const b = parseBundleInfo(data?.bundleInfo);
    setBundleDescRu(b.description_ru);
    setBundleDescUz(b.description_uz);
    setBundleItems(b.items.join('\n'));
  }, [data]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    const colorArr = colors.split('\n').map((x) => x.trim()).filter(Boolean);
    const itemsArr = bundleItems.split('\n').map((x) => x.trim()).filter(Boolean);
    const bundleInfo = bundleDescRu || bundleDescUz || itemsArr.length
      ? JSON.stringify({ description_ru: bundleDescRu, description_uz: bundleDescUz, items: itemsArr })
      : null;
    startTransition(async () => {
      const r = await updateAccessoriesData(productId, {
        universalFit,
        useCaseRu: useCaseRu.trim() || null,
        useCaseUz: useCaseUz.trim() || null,
        materialRu: materialRu.trim() || null,
        materialUz: materialUz.trim() || null,
        colorOptions: colorArr.length ? JSON.stringify(colorArr) : null,
        volumeMl: volumeMl === '' ? null : Number(volumeMl),
        applicationMethodRu: applicationMethodRu.trim() || null,
        applicationMethodUz: applicationMethodUz.trim() || null,
        kitContentsRu: kitContentsRu.trim() || null,
        kitContentsUz: kitContentsUz.trim() || null,
        bundleInfo,
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Сценарий использования">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Use case (RU)" hint="Weight 6 — важное поле для score">
            <textarea rows={3} value={useCaseRu} onChange={(e) => setUseCaseRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Use case (UZ)">
            <textarea rows={3} value={useCaseUz} onChange={(e) => setUseCaseUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Способ применения (RU)">
            <textarea rows={2} value={applicationMethodRu}
              onChange={(e) => setApplicationMethodRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Способ применения (UZ)">
            <textarea rows={2} value={applicationMethodUz}
              onChange={(e) => setApplicationMethodUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <Section title="Материал, цвет, объём">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Материал (RU)">
            <input type="text" value={materialRu} onChange={(e) => setMaterialRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Материал (UZ)">
            <input type="text" value={materialUz} onChange={(e) => setMaterialUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Объём, мл">
            <input type="number" step="0.1" value={volumeMl}
              onChange={(e) => setVolumeMl(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Цвета (по одному на строку)" span={2}>
            <textarea rows={3} value={colors} onChange={(e) => setColors(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle}
              placeholder="Чёрный&#10;Серый&#10;Бежевый" />
          </FormField>
          <FormField label="Универсальная посадка">
            <label className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer"
              style={inputStyle}>
              <input type="checkbox" checked={universalFit}
                onChange={(e) => setUniversalFit(e.target.checked)} />
              <span className="text-xs">Подходит ко всем авто</span>
            </label>
          </FormField>
        </div>
      </Section>

      <Section title="Комплект поставки">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Состав комплекта (RU)">
            <textarea rows={2} value={kitContentsRu} onChange={(e) => setKitContentsRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Состав комплекта (UZ)">
            <textarea rows={2} value={kitContentsUz} onChange={(e) => setKitContentsUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Bundle описание (RU)" hint="Weight 4 — если применимо">
            <input type="text" value={bundleDescRu} onChange={(e) => setBundleDescRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Bundle описание (UZ)">
            <input type="text" value={bundleDescUz} onChange={(e) => setBundleDescUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Bundle позиции (по одной на строку)" span={2}>
            <textarea rows={3} value={bundleItems} onChange={(e) => setBundleItems(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
