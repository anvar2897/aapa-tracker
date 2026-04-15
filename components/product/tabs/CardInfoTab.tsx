import type { Product, ProductCard } from '@/db/schema';

export function CardInfoTab(_: { productId: number; product: Product; card: ProductCard | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">CardInfoTab placeholder</div>;
}
