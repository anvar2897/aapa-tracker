import type { ProductCard } from '@/db/schema';
export function PropertiesTab(_: { productId: number; card: ProductCard | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">PropertiesTab placeholder</div>;
}
