'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { ProfileBadge } from '@/components/common/ProfileBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';
import { CardInfoTab } from './tabs/CardInfoTab';
import { PropertiesTab } from './tabs/PropertiesTab';
import { MediaTab } from './tabs/MediaTab';
import { AccessoriesTab } from './tabs/AccessoriesTab';
import { PartsTab } from './tabs/PartsTab';
import { PricingTab } from './tabs/PricingTab';
import { FulfillmentTab } from './tabs/FulfillmentTab';
import { ModerationTab } from './tabs/ModerationTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import type { ProductDetail } from '@/lib/queries';

type TabKey =
  | 'info' | 'properties' | 'media' | 'profile'
  | 'pricing' | 'fulfillment' | 'moderation' | 'performance';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Карточка' },
  { key: 'properties', label: 'Свойства' },
  { key: 'media', label: 'Медиа' },
  { key: 'profile', label: 'Профиль' },
  { key: 'pricing', label: 'Цены' },
  { key: 'fulfillment', label: 'Логистика' },
  { key: 'moderation', label: 'Модерация' },
  { key: 'performance', label: 'Метрики' },
];

export function ProductEditor({ detail }: { detail: ProductDetail }) {
  const [tab, setTab] = useState<TabKey>('info');
  const productId = detail.product.id;

  return (
    <div className="px-8 py-8">
      {/* Back */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm mb-4 hover:text-amber-400 transition-colors"
        style={{ color: 'hsl(215 20% 55%)' }}
      >
        <ArrowLeft size={14} />
        Назад к списку
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <ProfileBadge profile={detail.product.productProfile} />
          <div className="min-w-0">
            <h1
              className="text-2xl font-semibold tracking-tight truncate"
              style={{ color: 'hsl(213 31% 91%)' }}
            >
              {detail.product.nameRu}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="font-mono" style={{ color: 'hsl(215 20% 55%)' }}>
                {detail.product.sku}
              </span>
              {detail.moderation && <StatusBadge status={detail.moderation.status} />}
            </div>
          </div>
        </div>
        <ScoreBadge score={detail.score.total} size={64} />
      </div>

      {/* Two-column layout: tabs + breakdown */}
      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div>
          {/* Tab bar */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg mb-5 overflow-x-auto"
            style={{ backgroundColor: 'hsl(222 47% 13%)', border: '1px solid hsl(216 34% 22%)' }}
          >
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                  style={
                    active
                      ? { backgroundColor: '#f59e0b', color: 'hsl(222 47% 11%)' }
                      : { color: 'hsl(215 20% 55%)' }
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div>
            {tab === 'info' && (
              <CardInfoTab productId={productId} product={detail.product} card={detail.card} />
            )}
            {tab === 'properties' && (
              <PropertiesTab productId={productId} card={detail.card} />
            )}
            {tab === 'media' && (
              <MediaTab productId={productId} media={detail.media} />
            )}
            {tab === 'profile' && detail.product.productProfile === 'accessories' && (
              <AccessoriesTab productId={productId} data={detail.accessoriesData} />
            )}
            {tab === 'profile' && detail.product.productProfile === 'parts' && (
              <PartsTab productId={productId} data={detail.partsData} />
            )}
            {tab === 'pricing' && (
              <PricingTab productId={productId} pricing={detail.pricing} />
            )}
            {tab === 'fulfillment' && (
              <FulfillmentTab productId={productId} fulfillment={detail.fulfillment} />
            )}
            {tab === 'moderation' && (
              <ModerationTab
                productId={productId}
                moderation={detail.moderation}
                boost={detail.boost}
              />
            )}
            {tab === 'performance' && (
              <PerformanceTab performance={detail.performance} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <ScoreBreakdownPanel score={detail.score} />
        </aside>
      </div>
    </div>
  );
}
