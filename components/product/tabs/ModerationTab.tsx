'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormField, inputStyle } from '@/components/product/FormField';
import { Section, SaveRow } from './CardInfoTab';
import { updateModeration, updateBoost } from '@/app/actions/products';
import { MODERATION_STATUSES } from '@/lib/constants';
import type { Moderation, Boost } from '@/db/schema';

function parseStringArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

const statusLabels: Record<Moderation['status'], string> = {
  draft: 'Черновик',
  ready: 'Готов',
  on_sale: 'Продаётся',
  blocked: 'Заблокирован',
  archived: 'Архив',
};

export function ModerationTab({
  productId, moderation, boost,
}: { productId: number; moderation: Moderation | null; boost: Boost | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [status, setStatus] = useState<Moderation['status']>(moderation?.status ?? 'draft');
  const [blockReason, setBlockReason] = useState(moderation?.blockReason ?? '');

  const [campaignType, setCampaignType] = useState(boost?.campaignType ?? '');
  const [bidPer1000, setBidPer1000] = useState<number | ''>(boost?.bidPer1000 ?? '');
  const [dailyBudget, setDailyBudget] = useState<number | ''>(boost?.dailyBudget ?? '');
  const [totalBudget, setTotalBudget] = useState<number | ''>(boost?.totalBudget ?? '');
  const [keywords, setKeywords] = useState(parseStringArray(boost?.keywords).join('\n'));
  const [negativeKeywords, setNegativeKeywords] = useState(parseStringArray(boost?.negativeKeywords).join('\n'));
  const [drrPct, setDrrPct] = useState<number | ''>(boost?.drrPct ?? '');

  useEffect(() => {
    setStatus(moderation?.status ?? 'draft');
    setBlockReason(moderation?.blockReason ?? '');
  }, [moderation]);
  useEffect(() => {
    setCampaignType(boost?.campaignType ?? '');
    setBidPer1000(boost?.bidPer1000 ?? '');
    setDailyBudget(boost?.dailyBudget ?? '');
    setTotalBudget(boost?.totalBudget ?? '');
    setKeywords(parseStringArray(boost?.keywords).join('\n'));
    setNegativeKeywords(parseStringArray(boost?.negativeKeywords).join('\n'));
    setDrrPct(boost?.drrPct ?? '');
  }, [boost]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    const toArr = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
    startTransition(async () => {
      const r1 = await updateModeration(productId, {
        status,
        blockReason: blockReason.trim() || null,
      });
      if ('error' in r1) { setError(r1.error); return; }

      const kwArr = toArr(keywords);
      const negArr = toArr(negativeKeywords);
      const r2 = await updateBoost(productId, {
        campaignType: campaignType.trim() || null,
        bidPer1000: bidPer1000 === '' ? null : Number(bidPer1000),
        dailyBudget: dailyBudget === '' ? null : Number(dailyBudget),
        totalBudget: totalBudget === '' ? null : Number(totalBudget),
        keywords: kwArr.length ? JSON.stringify(kwArr) : null,
        negativeKeywords: negArr.length ? JSON.stringify(negArr) : null,
        drrPct: drrPct === '' ? null : Number(drrPct),
      });
      if ('error' in r2) { setError(r2.error); return; }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Модерация">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Статус">
            <select value={status} onChange={(e) => setStatus(e.target.value as Moderation['status'])}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}>
              {MODERATION_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Причина блокировки (если blocked)">
            <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <Section title="Boost (рекламная кампания)">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Тип кампании">
            <input type="text" value={campaignType} onChange={(e) => setCampaignType(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}
              placeholder="Поиск / Каталог / Смежные" />
          </FormField>
          <FormField label="ДРР, %">
            <input type="number" step="0.1" value={drrPct}
              onChange={(e) => setDrrPct(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Ставка за 1000, сум">
            <input type="number" step="1" value={bidPer1000}
              onChange={(e) => setBidPer1000(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Дневной бюджет, сум">
            <input type="number" step="1" value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Общий бюджет, сум" span={2}>
            <input type="number" step="1" value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
          </FormField>
          <FormField label="Ключевые слова (по одному на строку)">
            <textarea rows={4} value={keywords} onChange={(e) => setKeywords(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono resize-y" style={inputStyle} />
          </FormField>
          <FormField label="Минус-слова (по одному на строку)">
            <textarea rows={4} value={negativeKeywords} onChange={(e) => setNegativeKeywords(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono resize-y" style={inputStyle} />
          </FormField>
        </div>
      </Section>

      <SaveRow pending={pending} error={error} saved={saved} />
    </form>
  );
}
