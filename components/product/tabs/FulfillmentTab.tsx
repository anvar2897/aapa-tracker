'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updateFulfillment } from '@/app/actions/products';
import { FULFILLMENT_SCHEMES, FBO_TURNOVER_WARN_DAYS, FBO_TURNOVER_CRITICAL_DAYS, FBO_FREE_WINDOW_DAYS } from '@/lib/constants';
import type { Fulfillment } from '@/db/schema';

export function FulfillmentTab({
  productId, fulfillment,
}: { productId: number; fulfillment: Fulfillment | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [scheme, setScheme] = useState<Fulfillment['scheme']>(fulfillment?.scheme ?? 'FBS');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(fulfillment?.stockQuantity ?? 0);
  const [fboTurnoverDays, setFboTurnoverDays] = useState<number | ''>(fulfillment?.fboTurnoverDays ?? '');
  const [isOversized, setIsOversized] = useState(Boolean(fulfillment?.isOversized));

  useEffect(() => {
    setScheme(fulfillment?.scheme ?? 'FBS');
    setStockQuantity(fulfillment?.stockQuantity ?? 0);
    setFboTurnoverDays(fulfillment?.fboTurnoverDays ?? '');
    setIsOversized(Boolean(fulfillment?.isOversized));
  }, [fulfillment]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      const r = await updateFulfillment(productId, {
        scheme,
        stockQuantity: stockQuantity === '' ? 0 : Number(stockQuantity),
        fboTurnoverDays: fboTurnoverDays === '' ? null : Number(fboTurnoverDays),
        isOversized,
      });
      if ('error' in r) { setError(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const turnoverNum = fboTurnoverDays === '' ? null : Number(fboTurnoverDays);
  const turnoverLabel = turnoverNum == null ? null
    : turnoverNum >= FBO_TURNOVER_CRITICAL_DAYS
      ? { color: '#ef4444', text: `КРИТИЧНО — до платного хранения осталось ${FBO_FREE_WINDOW_DAYS - turnoverNum}д` }
      : turnoverNum >= FBO_TURNOVER_WARN_DAYS
        ? { color: '#f59e0b', text: `ВНИМАНИЕ — до платного хранения ${FBO_FREE_WINDOW_DAYS - turnoverNum}д` }
        : { color: '#22c55e', text: 'В норме' };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Схема и остаток">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Схема выполнения">
            <select value={scheme} onChange={(e) => setScheme(e.target.value as Fulfillment['scheme'])}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle}>
              {FULFILLMENT_SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Остаток, шт">
            <input type="number" min="0" value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Крупногабаритный">
            <label className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer"
              style={inputStyle}>
              <input type="checkbox" checked={isOversized}
                onChange={(e) => setIsOversized(e.target.checked)} />
              <span className="text-xs">Oversized (КГТ)</span>
            </label>
          </FormField>
        </div>
      </Section>

      {scheme === 'FBO' && (
        <Section title="FBO оборачиваемость (§5.3)">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Дней на складе Uzum"
              hint={`Warn ≥${FBO_TURNOVER_WARN_DAYS}д · Critical ≥${FBO_TURNOVER_CRITICAL_DAYS}д · Бесплатный период ${FBO_FREE_WINDOW_DAYS}д`}>
              <input type="number" min="0" value={fboTurnoverDays}
                onChange={(e) => setFboTurnoverDays(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
            <div>
              {turnoverLabel && (
                <div className="mt-6 text-sm font-medium" style={{ color: turnoverLabel.color }}>
                  {turnoverLabel.text}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
