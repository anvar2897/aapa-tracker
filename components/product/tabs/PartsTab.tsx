import type { PartsData } from '@/db/schema';
export function PartsTab(_: { productId: number; data: PartsData | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">PartsTab placeholder</div>;
}
