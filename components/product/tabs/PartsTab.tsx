'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updatePartsData } from '@/app/actions/products';
import type { PartsData } from '@/db/schema';

type CompatibleModel = { make: string; model: string; year_from: number | ''; year_to: number | ''; engine: string };

function parseStringArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}

function parseCompatible(json: string | null | undefined): CompatibleModel[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.map((x) => ({
      make: String(x?.make ?? ''),
      model: String(x?.model ?? ''),
      year_from: typeof x?.year_from === 'number' ? x.year_from : '',
      year_to: typeof x?.year_to === 'number' ? x.year_to : '',
      engine: String(x?.engine ?? ''),
    })) : [];
  } catch { return []; }
}

export function PartsTab({ productId, data }: { productId: number; data: PartsData | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [oemNumber, setOemNumber] = useState(data?.oemNumber ?? '');
  const [crossRefs, setCrossRefs] = useState(parseStringArray(data?.crossReferences).join('\n'));
  const [compatible, setCompatible] = useState<CompatibleModel[]>(parseCompatible(data?.compatibleModels));
  const [positionRu, setPositionRu] = useState(data?.positionRu ?? '');
  const [positionUz, setPositionUz] = useState(data?.positionUz ?? '');
  const [partLengthMm, setPartLengthMm] = useState<number | ''>(data?.partLengthMm ?? '');
  const [partWidthMm, setPartWidthMm] = useState<number | ''>(data?.partWidthMm ?? '');
  const [partHeightMm, setPartHeightMm] = useState<number | ''>(data?.partHeightMm ?? '');
  const [partWeightG, setPartWeightG] = useState<number | ''>(data?.partWeightG ?? '');
  const [warrantyMonths, setWarrantyMonths] = useState<number | ''>(data?.warrantyMonths ?? '');
  const [materialSpec, setMaterialSpec] = useState(data?.materialSpec ?? '');

  useEffect(() => {
    setOemNumber(data?.oemNumber ?? '');
    setCrossRefs(parseStringArray(data?.crossReferences).join('\n'));
    setCompatible(parseCompatible(data?.compatibleModels));
    setPositionRu(data?.positionRu ?? '');
    setPositionUz(data?.positionUz ?? '');
    setPartLengthMm(data?.partLengthMm ?? '');
    setPartWidthMm(data?.partWidthMm ?? '');
    setPartHeightMm(data?.partHeightMm ?? '');
    setPartWeightG(data?.partWeightG ?? '');
    setWarrantyMonths(data?.warrantyMonths ?? '');
    setMaterialSpec(data?.materialSpec ?? '');
  }, [data]);

  function updateCompat(i: number, field: keyof CompatibleModel, v: string | number) {
    setCompatible((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: v } : m)));
  }
  function addCompat() {
    setCompatible((prev) => [...prev, { make: '', model: '', year_from: '', year_to: '', engine: '' }]);
  }
  function removeCompat(i: number) {
    setCompatible((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    const crossArr = crossRefs.split('\n').map((x) => x.trim()).filter(Boolean);
    const compatClean = compatible
      .filter((m) => m.make || m.model)
      .map((m) => ({
        make: m.make.trim(),
        model: m.model.trim(),
        year_from: m.year_from === '' ? null : Number(m.year_from),
        year_to: m.year_to === '' ? null : Number(m.year_to),
        engine: m.engine.trim(),
      }));
    startTransition(async () => {
      const r = await updatePartsData(productId, {
        oemNumber: oemNumber.trim() || null,
        crossReferences: crossArr.length ? JSON.stringify(crossArr) : null,
        compatibleModels: compatClean.length ? JSON.stringify(compatClean) : null,
        positionRu: positionRu.trim() || null,
        positionUz: positionUz.trim() || null,
        partLengthMm: partLengthMm === '' ? null : Number(partLengthMm),
        partWidthMm: partWidthMm === '' ? null : Number(partWidthMm),
        partHeightMm: partHeightMm === '' ? null : Number(partHeightMm),
        partWeightG: partWeightG === '' ? null : Number(partWeightG),
        warrantyMonths: warrantyMonths === '' ? null : Number(warrantyMonths),
        materialSpec: materialSpec.trim() || null,
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="OEM и кросс-референс">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="OEM номер *" hint="Weight 10 — критически важно">
            <input type="text" value={oemNumber} onChange={(e) => setOemNumber(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Кросс-номера (по одному на строку)">
            <textarea rows={3} value={crossRefs} onChange={(e) => setCrossRefs(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none resize-y font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <Section title={`Совместимые модели (${compatible.length}) — Weight 12`}>
        <div className="space-y-2">
          <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_1.2fr_32px] gap-2 text-xs px-1"
            style={{ color: 'hsl(215 20% 55%)' }}>
            <span>Марка</span><span>Модель</span><span>Год от</span><span>Год до</span><span>Двигатель</span><span />
          </div>
          {compatible.length === 0 && (
            <div className="text-xs px-1 py-2" style={{ color: 'hsl(215 20% 45%)' }}>Нет записей</div>
          )}
          {compatible.map((m, i) => (
            <div key={i} className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_1.2fr_32px] gap-2">
              <input type="text" value={m.make} onChange={(e) => updateCompat(i, 'make', e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
              <input type="text" value={m.model} onChange={(e) => updateCompat(i, 'model', e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
              <input type="number" value={m.year_from}
                onChange={(e) => updateCompat(i, 'year_from', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none font-mono" style={inputStyle} />
              <input type="number" value={m.year_to}
                onChange={(e) => updateCompat(i, 'year_to', e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none font-mono" style={inputStyle} />
              <input type="text" value={m.engine} onChange={(e) => updateCompat(i, 'engine', e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-md outline-none font-mono" style={inputStyle} />
              <button type="button" onClick={() => removeCompat(i)}
                className="flex items-center justify-center rounded-md"
                style={{ border: '1px solid hsl(216 34% 28%)', color: '#ef4444' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addCompat}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md mt-2"
            style={{
              backgroundColor: 'hsl(222 47% 11%)',
              border: '1px dashed hsl(216 34% 28%)',
              color: 'hsl(215 20% 65%)',
            }}>
            <Plus size={12} /> Добавить модель
          </button>
        </div>
      </Section>

      <Section title="Фитмент и характеристики">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Позиция установки (RU)">
            <input type="text" value={positionRu} onChange={(e) => setPositionRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}
              placeholder="Передний левый / Задний / ..." />
          </FormField>
          <FormField label="Позиция установки (UZ)">
            <input type="text" value={positionUz} onChange={(e) => setPositionUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Материал / спецификация" span={2}>
            <input type="text" value={materialSpec} onChange={(e) => setMaterialSpec(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
          <FormField label="Гарантия, мес.">
            <input type="number" value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Вес детали, г">
            <input type="number" step="0.1" value={partWeightG}
              onChange={(e) => setPartWeightG(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Длина детали, мм">
            <input type="number" step="0.1" value={partLengthMm}
              onChange={(e) => setPartLengthMm(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Ширина детали, мм">
            <input type="number" step="0.1" value={partWidthMm}
              onChange={(e) => setPartWidthMm(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Высота детали, мм">
            <input type="number" step="0.1" value={partHeightMm}
              onChange={(e) => setPartHeightMm(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
