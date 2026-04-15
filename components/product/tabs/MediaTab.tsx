'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Star, StarOff, Check, X } from 'lucide-react';
import { Section, SaveRow } from './CardInfoTab';
import { FormField, inputStyle } from '@/components/product/FormField';
import { addMedia, deleteMedia, setPrimaryMedia } from '@/app/actions/products';
import {
  PHOTO_MIN_WIDTH_PX, PHOTO_MIN_HEIGHT_PX, PHOTO_MAX_SIZE_BYTES, VIDEO_MAX_SIZE_BYTES,
} from '@/lib/constants';
import type { ProductMedia } from '@/db/schema';

export function MediaTab({ productId, media }: { productId: number; media: ProductMedia[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [widthPx, setWidthPx] = useState<number | ''>('');
  const [heightPx, setHeightPx] = useState<number | ''>('');
  const [sizeBytes, setSizeBytes] = useState<number | ''>('');
  const [isPrimary, setIsPrimary] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      const r = await addMedia(productId, {
        url: url.trim(),
        mediaType,
        widthPx: widthPx === '' ? null : Number(widthPx),
        heightPx: heightPx === '' ? null : Number(heightPx),
        sizeBytes: sizeBytes === '' ? null : Number(sizeBytes),
        isPrimary,
      });
      if ('error' in r) { setError(r.error); return; }
      setUrl(''); setWidthPx(''); setHeightPx(''); setSizeBytes(''); setIsPrimary(false);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete(mediaId: number) {
    startTransition(async () => {
      const r = await deleteMedia(mediaId, productId);
      if ('error' in r) setError(r.error);
      else router.refresh();
    });
  }

  function handleSetPrimary(mediaId: number) {
    startTransition(async () => {
      const r = await setPrimaryMedia(mediaId, productId);
      if ('error' in r) setError(r.error);
      else router.refresh();
    });
  }

  const photos = media.filter((m) => m.mediaType === 'photo');
  const videos = media.filter((m) => m.mediaType === 'video');

  return (
    <div className="space-y-6">
      <Section title={`Фото (${photos.length})`}>
        <div className="text-xs mb-3" style={{ color: 'hsl(215 20% 55%)' }}>
          Требования §12.3 Uzum: ≥{PHOTO_MIN_WIDTH_PX}×{PHOTO_MIN_HEIGHT_PX}px, 3:4, ≤
          {Math.round(PHOTO_MAX_SIZE_BYTES / 1024 / 1024)}MB
        </div>
        {photos.length === 0 && <EmptyRow label="Нет фото" />}
        <div className="space-y-2">
          {photos.map((m) => (
            <MediaRow key={m.id} m={m} onDelete={handleDelete} onSetPrimary={handleSetPrimary} />
          ))}
        </div>
      </Section>

      <Section title={`Видео (${videos.length})`}>
        <div className="text-xs mb-3" style={{ color: 'hsl(215 20% 55%)' }}>
          Максимальный размер: {Math.round(VIDEO_MAX_SIZE_BYTES / 1024 / 1024)}MB
        </div>
        {videos.length === 0 && <EmptyRow label="Нет видео" />}
        <div className="space-y-2">
          {videos.map((m) => (
            <MediaRow key={m.id} m={m} onDelete={handleDelete} onSetPrimary={handleSetPrimary} />
          ))}
        </div>
      </Section>

      <form onSubmit={handleAdd}>
        <Section title="Добавить медиа">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="URL *" span={2}>
              <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
            <FormField label="Тип">
              <select value={mediaType} onChange={(e) => setMediaType(e.target.value as 'photo' | 'video')}
                className="w-full text-sm px-3 py-2 rounded-md outline-none" style={inputStyle}>
                <option value="photo">Фото</option>
                <option value="video">Видео</option>
              </select>
            </FormField>
            <FormField label="Сделать главным">
              <label className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer"
                style={inputStyle}>
                <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
                <span className="text-xs">Основной кадр</span>
              </label>
            </FormField>
            <FormField label="Ширина, px">
              <input type="number" value={widthPx}
                onChange={(e) => setWidthPx(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
            <FormField label="Высота, px">
              <input type="number" value={heightPx}
                onChange={(e) => setHeightPx(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
            <FormField label="Размер, байты" span={2}>
              <input type="number" value={sizeBytes}
                onChange={(e) => setSizeBytes(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-md outline-none font-mono" style={inputStyle} />
            </FormField>
          </div>
        </Section>
        <div className="mt-4"><SaveRow pending={pending} error={error} saved={saved} /></div>
      </form>
    </div>
  );
}

function MediaRow({
  m, onDelete, onSetPrimary,
}: {
  m: ProductMedia;
  onDelete: (id: number) => void;
  onSetPrimary: (id: number) => void;
}) {
  const sizeMb = m.sizeBytes ? (m.sizeBytes / 1024 / 1024).toFixed(2) : '—';
  const dims = m.widthPx && m.heightPx ? `${m.widthPx}×${m.heightPx}` : '—';
  return (
    <div
      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 p-3 rounded-md"
      style={{ backgroundColor: 'hsl(222 47% 11%)', border: '1px solid hsl(216 34% 22%)' }}
    >
      {m.isCompliant === null ? (
        <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 45%)' }}>—</span>
      ) : m.isCompliant ? (
        <Check size={14} style={{ color: '#22c55e' }} />
      ) : (
        <X size={14} style={{ color: '#ef4444' }} />
      )}
      <div className="min-w-0">
        <div className="text-xs font-mono truncate" style={{ color: 'hsl(213 31% 85%)' }}>
          {m.url}
        </div>
        {m.complianceNotes && (
          <div className="text-[10px] mt-0.5" style={{ color: '#f87171' }}>
            {m.complianceNotes}
          </div>
        )}
      </div>
      <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 55%)' }}>{dims}</span>
      <span className="font-mono text-xs" style={{ color: 'hsl(215 20% 55%)' }}>{sizeMb} MB</span>
      <button type="button" onClick={() => onSetPrimary(m.id)}
        title={m.isPrimary ? 'Главный' : 'Сделать главным'}
        style={{ color: m.isPrimary ? '#f59e0b' : 'hsl(215 20% 45%)' }}>
        {m.isPrimary ? <Star size={14} /> : <StarOff size={14} />}
      </button>
      <button type="button" onClick={() => onDelete(m.id)} style={{ color: '#ef4444' }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="text-xs px-1 py-2" style={{ color: 'hsl(215 20% 45%)' }}>{label}</div>
  );
}
