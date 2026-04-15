import type { ProductMedia } from '@/db/schema';
export function MediaTab(_: { productId: number; media: ProductMedia[] }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">MediaTab placeholder</div>;
}
