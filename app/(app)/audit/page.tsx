import { getAuditData } from '@/lib/queries';
import { AuditSection } from '@/components/audit/AuditSection';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const data = await getAuditData();
  const totalIssues =
    data.critical.length + data.high.length + data.medium.length + data.low.length;

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'hsl(213 31% 91%)' }}
          >
            Аудит каталога
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(215 20% 55%)' }}>
            {totalIssues} проблем обнаружено
          </p>
        </div>
        <a
          href="/api/export/products"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium"
          style={{ backgroundColor: 'hsl(222 47% 15%)', border: '1px solid hsl(216 34% 28%)', color: 'hsl(213 31% 91%)' }}
          download="aapa-audit.csv"
        >
          Скачать CSV
        </a>
      </div>

      <div className="flex flex-col gap-4">
        <AuditSection severity="critical" issues={data.critical} />
        <AuditSection severity="high"     issues={data.high} />
        <AuditSection severity="medium"   issues={data.medium} />
        <AuditSection severity="low"      issues={data.low} />
      </div>
    </div>
  );
}
