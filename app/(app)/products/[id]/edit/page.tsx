import { redirect } from 'next/navigation';

export default function ProductEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/products/${params.id}`);
}
