'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updatePricing } from '@/app/actions/products';
import type { Pricing } from '@/db/schema';

export function PricingTab({ productId, pricing }: { productId: number; pricing: Pricing | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [cost, setCost] = useState<number | ''>(pricing?.costPrice ?? '');
  const [selling, setSelling] = useState<number | ''>(pricing?.sellingPrice ?? '');
  const [discount, setDiscount] = useState<number | ''>(pricing?.discountPrice ?? '');
  const [competitor, setCompetitor] = useState<number | ''>(pricing?.competitorPrice ?? '');
  const [competitorUrl, setCompetitorUrl] = useState(pricing?.competitorUrl ?? '');

  useEffect(() => {
    setCost(pricing?.costPrice ?? '');
    setSelling(pricing?.sellingPrice ?? '');
    setDiscount(pricing?.discountPrice ?? '');
    setCompetitor(pricing?.competitorPrice ?? '');
    setCompetitorUrl(pricing?.competitorUrl ?? '');
  }, [pricing]);

  const marginPreview = cost !== '' && selling !== '' && Number(cost) > 0
    ? (((Number(selling) - Number(cost)) / Number(cost)) * 100).toFixed(1)
    : null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    const costN = cost === '' ? null : Number(cost);
    const sellN = selling === '' ? null : Number(selling);
    const margin = costN != null && sellN != null && costN > 0
      ? ((sellN - costN) / costN) * 100
      : null;
    startTransition(async () => {
      const r = await updatePricing(productId, {
        costPrice: costN,
        sellingPrice: sellN,
        discountPrice: discount === '' ? null : Number(discount),
        marginPct: margin,
        competitorPrice: competitor === '' ? null : Number(competitor),
        competitorUrl: competitorUrl.trim() || null,
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Цены">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Себестоимость, сум">
            <input type="number" step="1" value={cost}
              onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Цена продажи, сум *">
            <input type="number" step="1" value={selling}
              onChange={(e) => setSelling(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Цена со скидкой, сум">
            <input type="number" step="1" value={discount}
              onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Наценка (расчётная)" hint="Пересчитывается автоматически по цене и себестоимости">
            <div className="w-full text-sm px-3 py-2 rounded-md font-mono"
              style={{ ...inputStyle, color: marginPreview ? '#22c55e' : 'hsl(215 20% 45%)' }}>
              {marginPreview != null ? `${marginPreview}%` : '—'}
            </div>
          </FormField>
        </div>
      </Section>

      <Section title="Конкурент">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Цена конкурента, сум">
            <input type="number" step="1" value={competitor}
              onChange={(e) => setCompetitor(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="URL страницы конкурента" span={2}>
            <input type="url" value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
