import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/queries';
import { ProductEditor } from '@/components/product/ProductEditor';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const detail = await getProductById(id);
  if (!detail) notFound();
  return <ProductEditor detail={detail} />;
}
