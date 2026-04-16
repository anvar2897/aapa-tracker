# Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add light/dark/system theme switching to AAPA Tracker using `next-themes`, with a 3-way pill toggle in a new top bar.

**Architecture:** `next-themes` ThemeProvider wraps the app and manages class injection on `<html>`. CSS vars in `globals.css` are split into `:root` (light) and `.dark` (dark). A new `TopBar` component renders the toggle; a new `ThemeProvider` wraps `next-themes`. `Sidebar` swaps two hardcoded colors to CSS vars.

**Tech Stack:** Next.js 14 App Router, next-themes, Tailwind CSS, Vitest + @testing-library/react (jsdom)

**Spec:** `docs/superpowers/specs/2026-04-16-theme-system-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `next-themes`, `@testing-library/react`, `jsdom` |
| `app/globals.css` | Modify | Split `:root` (light) / `.dark` (dark) + transition rule |
| `components/common/ThemeProvider.tsx` | Create | Thin next-themes wrapper |
| `components/common/TopBar.tsx` | Create | Fixed top bar with 3-way pill theme toggle |
| `components/common/TopBar.test.tsx` | Create | Component tests for toggle behavior |
| `app/layout.tsx` | Modify | Add ThemeProvider, TopBar, suppressHydrationWarning, remove `className="dark"` |
| `components/common/Sidebar.tsx` | Modify | Swap 2 hardcoded inline colors to CSS vars |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install next-themes**

```bash
npm install next-themes
```

Expected: `next-themes` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Install testing deps**

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom
```

Expected: three packages appear in `devDependencies`.

- [ ] **Step 3: Verify install**

```bash
npm ls next-themes
```

Expected: `next-themes@x.x.x` (no errors).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add next-themes and testing-library deps"
```

---

## Task 2: Split CSS tokens (light/dark) and add transitions

**Files:**
- Modify: `app/globals.css`

Current state: `:root` and `.dark` both have identical dark tokens. We replace `:root` with light tokens and leave `.dark` unchanged (it already has the correct dark values).

- [ ] **Step 1: Replace `:root` block with light tokens**

Open `app/globals.css`. Replace the entire `:root { ... }` block (lines 18–52) with:

```css
  :root {
    --background:              hsl(0 0% 98%);
    --foreground:              hsl(222 47% 11%);
    --card:                    hsl(0 0% 100%);
    --card-foreground:         hsl(222 47% 11%);
    --popover:                 hsl(0 0% 100%);
    --popover-foreground:      hsl(222 47% 11%);
    --primary:                 hsl(38 92% 50%);
    --primary-foreground:      hsl(222 47% 11%);
    --secondary:               hsl(220 14% 90%);
    --secondary-foreground:    hsl(222 47% 11%);
    --muted:                   hsl(220 14% 92%);
    --muted-foreground:        hsl(220 9% 45%);
    --accent:                  hsl(38 92% 50%);
    --accent-foreground:       hsl(222 47% 11%);
    --destructive:             hsl(0 84% 50%);
    --destructive-foreground:  hsl(0 0% 100%);
    --border:                  hsl(220 14% 88%);
    --input:                   hsl(220 14% 92%);
    --ring:                    hsl(38 92% 50%);
    --radius:                  0.625rem;
    --chart-1:                 hsl(38 92% 50%);
    --chart-2:                 hsl(142 71% 45%);
    --chart-3:                 hsl(217 91% 60%);
    --chart-4:                 hsl(0 84% 60%);
    --chart-5:                 hsl(280 68% 60%);
    --sidebar:                 hsl(0 0% 0%);
    --sidebar-foreground:      hsl(0 0% 90%);
    --sidebar-primary:         hsl(38 92% 50%);
    --sidebar-primary-foreground: hsl(0 0% 0%);
    --sidebar-accent:          hsl(0 0% 12%);
    --sidebar-accent-foreground: hsl(0 0% 90%);
    --sidebar-border:          hsl(0 0% 18%);
    --sidebar-ring:            hsl(38 92% 50%);
  }
```

- [ ] **Step 2: Add transition rule**

Inside `@layer base { ... }`, after the `body { ... }` rule, add:

```css
  *, *::before, *::after {
    transition: background-color 200ms ease, color 200ms ease,
                border-color 200ms ease, fill 200ms ease;
  }
```

- [ ] **Step 3: Verify full globals.css structure**

The file should now have this structure (confirm by reading it):

```
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities { .text-balance { ... } }

@layer base {
  .theme { ... }
  :root { /* LIGHT tokens */ }
  .dark { /* DARK tokens — unchanged */ }
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  html { @apply font-sans; }
  *, *::before, *::after { transition: ...; }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(theme): split CSS tokens into light/dark vars, add transitions"
```

---

## Task 3: Create ThemeProvider component

**Files:**
- Create: `components/common/ThemeProvider.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

- `attribute="class"` — next-themes adds/removes `class="dark"` on `<html>` (matches shadcn convention)
- `defaultTheme="system"` — first visit follows OS setting
- `enableSystem` — activates `prefers-color-scheme` listener

- [ ] **Step 2: Commit**

```bash
git add components/common/ThemeProvider.tsx
git commit -m "feat(theme): add ThemeProvider wrapper around next-themes"
```

---

## Task 4: Create TopBar component (TDD)

**Files:**
- Create: `components/common/TopBar.tsx`
- Create: `components/common/TopBar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/common/TopBar.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: mockSetTheme }),
}));

import { TopBar } from './TopBar';

describe('TopBar', () => {
  beforeEach(() => mockSetTheme.mockClear());

  it('renders three theme buttons', () => {
    render(<TopBar />);
    expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
  });

  it('calls setTheme("light") when Light is clicked', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /light/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme("dark") when Dark is clicked', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /dark/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme("system") when System is clicked', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /system/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('marks the active theme button', () => {
    render(<TopBar />);
    // 'system' is the mocked active theme
    const systemBtn = screen.getByRole('button', { name: /system/i });
    expect(systemBtn).toHaveAttribute('data-active', 'true');
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- TopBar
```

Expected: FAIL — `Cannot find module './TopBar'`

- [ ] **Step 3: Create TopBar.tsx**

```tsx
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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- TopBar
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/common/TopBar.tsx components/common/TopBar.test.tsx
git commit -m "feat(theme): add TopBar with 3-way theme toggle"
```

---

## Task 5: Update layout.tsx

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

Replace the entire file contents with:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { TopBar } from "@/components/common/TopBar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AAPA Tracker",
  description: "Product card tracker for AAPA Store on Uzum marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <TopBar />
            <div className="flex flex-1 pt-10">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Key changes from original:
- `className="dark"` removed from `<html>` (next-themes injects this)
- `suppressHydrationWarning` added to `<html>` (required — next-themes sets class before hydration)
- `ThemeProvider` wraps content
- `TopBar` renders above children
- `pt-10` on inner div offsets content below fixed 40px top bar

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(theme): wire ThemeProvider and TopBar into root layout"
```

---

## Task 6: Update Sidebar to use CSS vars

**Files:**
- Modify: `components/common/Sidebar.tsx`

The sidebar currently uses two hardcoded inline `hsl(...)` values for its background and border. These need to use CSS vars so they respond to theme changes.

- [ ] **Step 1: Update the `<aside>` style prop**

In `Sidebar.tsx`, find the `<aside>` opening tag. Change:

```tsx
      style={{
        backgroundColor: 'hsl(222 47% 8%)',
        borderColor: 'hsl(216 34% 18%)',
      }}
```

To:

```tsx
      style={{
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
      }}
```

- [ ] **Step 2: Update the logo border div**

Find the `<div>` with `style={{ borderColor: 'hsl(216 34% 18%)' }}` (logo section). Change:

```tsx
        style={{ borderColor: 'hsl(216 34% 18%)' }}
```

To:

```tsx
        style={{ borderColor: 'var(--sidebar-border)' }}
```

- [ ] **Step 3: Update the footer border div**

Find the footer `<div>` with `style={{ borderColor: 'hsl(216 34% 18%)', color: 'hsl(215 20% 35%)' }}`. Change:

```tsx
        style={{
          borderColor: 'hsl(216 34% 18%)',
          color: 'hsl(215 20% 35%)',
        }}
```

To:

```tsx
        style={{
          borderColor: 'var(--sidebar-border)',
          color: 'var(--sidebar-foreground)',
        }}
```

- [ ] **Step 4: Run all tests to confirm nothing broke**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/common/Sidebar.tsx
git commit -m "feat(theme): replace hardcoded sidebar colors with CSS vars"
```

---

## Task 7: Smoke test in browser

**Files:** none

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open http://localhost:3000**

Verify:
- Top bar visible at top of page with Light / System / Dark pill
- Default shows current OS theme (System mode)
- Content area pushed down 40px (no overlap with top bar)

- [ ] **Step 3: Test Light mode**

Click "Light" in the top bar. Verify:
- Page background goes white/near-white
- Sidebar stays black
- Amber accent unchanged
- Transition is smooth (~200ms)
- `localStorage.getItem('theme')` in browser console returns `"light"`

- [ ] **Step 4: Test Dark mode**

Click "Dark". Verify:
- Page returns to dark charcoal background
- Active button shows amber highlight
- `localStorage.getItem('theme')` returns `"dark"`

- [ ] **Step 5: Test System mode**

Click "System". Verify:
- `localStorage.getItem('theme')` returns `"system"`
- Theme matches current OS setting
- Changing OS dark/light mode setting (System Preferences) updates the app without page reload

- [ ] **Step 6: Test persistence**

Hard-refresh the page (`Cmd+Shift+R`). Verify selected theme is restored from localStorage immediately (no flash).

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat(theme): complete theme system — light/dark/system with top bar toggle"
```
