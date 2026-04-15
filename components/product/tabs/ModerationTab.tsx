import type { Moderation, Boost } from '@/db/schema';
export function ModerationTab(_: { productId: number; moderation: Moderation | null; boost: Boost | null }) {
  return <div style={{ color: 'hsl(215 20% 55%)' }} className="text-sm">ModerationTab placeholder</div>;
}
