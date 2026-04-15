import { NextResponse } from 'next/server';
import { getProductListRows } from '@/lib/queries';

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const rows = await getProductListRows();

  const headers = [
    'id', 'sku', 'productProfile', 'nameRu',
    'status', 'scheme', 'stockQuantity', 'fboTurnoverDays',
    'sellingPrice', 'photoCount', 'scoreTotal',
  ];

  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    lines.push([
      escapeCsv(row.id),
      escapeCsv(row.sku),
      escapeCsv(row.productProfile),
      escapeCsv(row.nameRu),
      escapeCsv(row.status),
      escapeCsv(row.scheme),
      escapeCsv(row.stockQuantity),
      escapeCsv(row.fboTurnoverDays),
      escapeCsv(row.sellingPrice),
      escapeCsv(row.photoCount),
      escapeCsv(row.score.total),
    ].join(','));
  }

  const csv = lines.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="aapa-products.csv"',
    },
  });
}
