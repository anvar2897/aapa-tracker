type Props = {
  profile: 'accessories' | 'parts';
};

export function ProfileBadge({ profile }: Props) {
  const isAccessories = profile === 'accessories';
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold font-mono shrink-0"
      style={
        isAccessories
          ? {
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }
          : {
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }
      }
      title={isAccessories ? 'Аксессуары' : 'Запчасти'}
    >
      {isAccessories ? 'A' : 'P'}
    </span>
  );
}
