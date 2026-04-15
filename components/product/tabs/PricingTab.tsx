import type { Pricing } from '@/db/schema';
export function PricingTab(_: { productId: number; pricing: Pricing | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">PricingTab placeholder</div>;
}
