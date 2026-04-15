import type { Fulfillment } from '@/db/schema';
export function FulfillmentTab(_: { productId: number; fulfillment: Fulfillment | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">FulfillmentTab placeholder</div>;
}
