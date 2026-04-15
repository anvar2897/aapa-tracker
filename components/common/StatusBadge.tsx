type Status = 'draft' | 'ready' | 'on_sale' | 'blocked' | 'archived';

type Props = {
  status: Status;
};

const config: Record<Status, { label: string; style: React.CSSProperties }> = {
  draft: {
    label: 'Черновик',
    style: {
      backgroundColor: 'rgba(107, 114, 128, 0.15)',
      color: '#9ca3af',
      border: '1px solid rgba(107, 114, 128, 0.25)',
    },
  },
  ready: {
    label: 'Готов',
    style: {
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      color: '#60a5fa',
      border: '1px solid rgba(59, 130, 246, 0.25)',
    },
  },
  on_sale: {
    label: 'Продаётся',
    style: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      color: '#4ade80',
      border: '1px solid rgba(34, 197, 94, 0.25)',
    },
  },
  blocked: {
    label: 'Заблокирован',
    style: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      color: '#f87171',
      border: '1px solid rgba(239, 68, 68, 0.25)',
    },
  },
  archived: {
    label: 'Архив',
    style: {
      backgroundColor: 'rgba(75, 85, 99, 0.15)',
      color: '#6b7280',
      border: '1px solid rgba(75, 85, 99, 0.2)',
    },
  },
};

export function StatusBadge({ status }: Props) {
  const { label, style } = config[status] ?? config.draft;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
      style={style}
    >
      {label}
    </span>
  );
}
