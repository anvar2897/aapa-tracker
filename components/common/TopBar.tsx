'use client';

import { useTheme } from 'next-themes';
import { Sun, Monitor, Moon } from 'lucide-react';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

export function TopBar() {
  const { theme, setTheme } = useTheme();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-10 flex items-center justify-end px-4 border-b"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center rounded-full border p-0.5 gap-0.5"
        style={{ borderColor: 'var(--border)' }}
      >
        {THEMES.map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              data-active={active}
              aria-label={label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-150"
              style={
                active
                  ? { backgroundColor: 'hsl(38 92% 50%)', color: 'hsl(222 47% 11%)' }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              <Icon size={12} strokeWidth={1.8} />
              {label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
