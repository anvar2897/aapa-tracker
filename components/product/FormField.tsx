import type { CSSProperties, ReactNode } from 'react';

export const inputStyle: CSSProperties = {
  backgroundColor: 'hsl(222 47% 11%)',
  color: 'hsl(213 31% 91%)',
  border: '1px solid hsl(216 34% 28%)',
};

export function FormField({
  label, hint, children, span = 1,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
}) {
  const colSpan = { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4' }[span];
  return (
    <label className={`block ${colSpan}`}>
      <span className="block text-xs mb-1.5" style={{ color: 'hsl(215 20% 55%)' }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[10px] mt-1" style={{ color: 'hsl(215 20% 40%)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}
