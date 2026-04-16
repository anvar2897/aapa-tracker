import { NextRequest, NextResponse } from 'next/server';
import { parseCsvImport } from '@/lib/csvParser';
import { createProduct } from '@/app/actions/products';

export async function POST(req: NextRequest) {
  let text: string;
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    text = await (file as File).text();
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 400 });
  }

  const { valid, errors } = parseCsvImport(text);

  const created: number[] = [];
  const createErrors: { sku: string; message: string }[] = [];

  for (const row of valid) {
    const result = await createProduct(row);
    if ('error' in result) {
      createErrors.push({ sku: row.sku, message: result.error });
    } else {
      created.push(result.id);
    }
  }

  return NextResponse.json({
    createdCount: created.length,
    createdIds: created,
    parseErrors: errors,
    createErrors,
  });
}
