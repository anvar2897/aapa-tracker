'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updateProperties } from '@/app/actions/products';
import type { ProductCard } from '@/db/schema';

type KV = { name_ru: string; name_uz: string; value_ru: string; value_uz: string };

function parseStringArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}

function parseKVArray(json: string | null | undefined): KV[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.map((x) => ({
      name_ru: String(x?.name_ru ?? ''),
      name_uz: String(x?.name_uz ?? ''),
      value_ru: String(x?.value_ru ?? ''),
      value_uz: String(x?.value_uz ?? ''),
    })) : [];
  } catch { return []; }
}

export function PropertiesTab({ productId, card }: { productId: number; card: ProductCard | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [propsRu, setPropsRu] = useState(parseStringArray(card?.propertiesRu).join('\n'));
  const [propsUz, setPropsUz] = useState(parseStringArray(card?.propertiesUz).join('\n'));
  const [characteristics, setCharacteristics] = useState<KV[]>(parseKVArray(card?.characteristics));
  const [filterProps, setFilterProps] = useState<KV[]>(parseKVArray(card?.filterProperties));

  useEffect(() => {
    setPropsRu(parseStringArray(card?.propertiesRu).join('\n'));
    setPropsUz(parseStringArray(card?.propertiesUz).join('\n'));
    setCharacteristics(parseKVArray(card?.characteristics));
    setFilterProps(parseKVArray(card?.filterProperties));
  }, [card]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const toArr = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
    startTransition(async () => {
      const r = await updateProperties(productId, {
        propertiesRu: JSON.stringify(toArr(propsRu)),
        propertiesUz: JSON.stringify(toArr(propsUz)),
        characteristics: JSON.stringify(characteristics.filter((k) => k.name_ru || k.value_ru)),
        filterProperties: JSON.stringify(filterProps.filter((k) => k.name_ru || k.value_ru)),
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Свойства (по одному на строку)">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Свойства (RU)" hint={`${propsRu.split('\n').filter(Boolean).length} шт`}>
            <textarea rows={6} value={propsRu} onChange={(e) => setPropsRu(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono resize-y"
              style={inputStyle} placeholder="Материал: резина&#10;Цвет: чёрный&#10;..." />
          </FormField>
          <FormField label="Свойства (UZ)" hint={`${propsUz.split('\n').filter(Boolean).length} шт`}>
            <textarea rows={6} value={propsUz} onChange={(e) => setPropsUz(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono resize-y"
              style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <KVSection
        title="Характеристики (для карточки)"
        rows={characteristics}
        onChange={setCharacteristics}
      />
      <KVSection
        title="Фильтрационные свойства (Uzum filter tree)"
        rows={filterProps}
        onChange={setFilterProps}
      />

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}

function KVSection({
  title, rows, onChange,
}: {
  title: string;
  rows: KV[];
  onChange: (next: KV[]) => void;
}) {
  function update(i: number, field: keyof KV, v: string) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
  }
  function add() {
    onChange([...rows, { name_ru: '', name_uz: '', value_ru: '', value_uz: '' }]);
  }
  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  return (
    <Section title={title}>
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_32px] gap-2 text-xs px-1"
          style={{ color: 'hsl(215 20% 55%)' }}>
          <span>Имя (RU)</span><span>Имя (UZ)</span><span>Значение (RU)</span><span>Значение (UZ)</span><span />
        </div>
        {rows.length === 0 && (
          <div className="text-xs px-1 py-2" style={{ color: 'hsl(215 20% 45%)' }}>
            Нет записей
          </div>
        )}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_32px] gap-2">
            <input type="text" value={r.name_ru} onChange={(e) => update(i, 'name_ru', e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
            <input type="text" value={r.name_uz} onChange={(e) => update(i, 'name_uz', e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
            <input type="text" value={r.value_ru} onChange={(e) => update(i, 'value_ru', e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
            <input type="text" value={r.value_uz} onChange={(e) => update(i, 'value_uz', e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md outline-none" style={inputStyle} />
            <button type="button" onClick={() => remove(i)}
              className="flex items-center justify-center rounded-md transition-colors"
              style={{ border: '1px solid hsl(216 34% 28%)', color: '#ef4444' }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button type="button" onClick={add}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md mt-2"
          style={{
            backgroundColor: 'hsl(222 47% 11%)',
            border: '1px dashed hsl(216 34% 28%)',
            color: 'hsl(215 20% 65%)',
          }}>
          <Plus size={12} /> Добавить запись
        </button>
      </div>
    </Section>
  );
}
