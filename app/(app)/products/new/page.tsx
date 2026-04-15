import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileSelector } from '@/components/product/ProfileSelector';

export default function NewProductPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:text-amber-400 transition-colors"
          style={{ color: 'hsl(215 20% 55%)' }}
        >
          <ArrowLeft size={14} />
          Назад к списку
        </Link>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'hsl(213 31% 91%)' }}
        >
          Новый товар
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
          Выберите профиль и заполните основные поля
        </p>
      </div>
      <ProfileSelector />
    </div>
  );
}
