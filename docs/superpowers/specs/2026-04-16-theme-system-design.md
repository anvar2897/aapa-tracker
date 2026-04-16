# Theme System Design — AAPA Tracker

**Date:** 2026-04-16  
**Status:** Approved

---

## Overview

Add light, dark, and system theme modes to AAPA Tracker using `next-themes`. Store preference in `localStorage`. Follow OS setting when "system" is selected. Smooth 200ms transitions between modes. Theme toggle lives in a new top bar component.

---

## Decisions Made

| Question | Decision |
|---|---|
| Library | `next-themes` (not custom) |
| Toggle placement | New top bar, full-width, right-aligned |
| Light mode palette | Black sidebar + white content (high contrast) |
| Token migration scope | Minimal — split CSS vars only, no tailwind config changes |
| Default theme | `system` |

---

## Architecture

```
next-themes ThemeProvider (wraps <body> in layout.tsx)
  ↓ injects class="light" or class="dark" on <html>

globals.css
  :root   → light tokens
  .dark   → dark tokens (existing, unchanged)
  *       → transition rules

New components:
  components/common/ThemeProvider.tsx
  components/common/TopBar.tsx
```

**State flow:**
```
user clicks toggle → next-themes writes localStorage['theme']
  → sets class on <html> → CSS vars swap → 200ms transition

system mode → next-themes watches prefers-color-scheme
  → auto-applies class, no localStorage override
```

---

## CSS Tokens

### Light mode (`:root`)

```css
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
--sidebar:                 hsl(0 0% 0%);
--sidebar-foreground:      hsl(0 0% 90%);
--sidebar-primary:         hsl(38 92% 50%);
--sidebar-primary-foreground: hsl(0 0% 0%);
--sidebar-accent:          hsl(0 0% 12%);
--sidebar-accent-foreground: hsl(0 0% 90%);
--sidebar-border:          hsl(0 0% 18%);
--sidebar-ring:            hsl(38 92% 50%);
/* chart colors unchanged — semantic colors, not theme-dependent */
--chart-1: hsl(38 92% 50%);
--chart-2: hsl(142 71% 45%);
--chart-3: hsl(217 91% 60%);
--chart-4: hsl(0 84% 60%);
--chart-5: hsl(280 68% 60%);
```

### Dark mode (`.dark`) — identical to current, no changes

---

## Transitions

```css
*, *::before, *::after {
  transition: background-color 200ms ease, color 200ms ease,
              border-color 200ms ease, fill 200ms ease;
}
```

`outline`, `box-shadow`, `transform` excluded to avoid jank on interactive elements.

---

## Components

### `ThemeProvider.tsx`

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

### `TopBar.tsx`

- Fixed bar, 40px tall (`h-10`)
- Background: `var(--card)`, bottom border: `var(--border)`
- Right-aligned 3-way segmented pill: `☀ Light` | `◐ System` | `☾ Dark`
- Active segment: amber background (`bg-amber-400`) + black text
- Inactive: transparent + muted text
- Uses `useTheme()` from next-themes

### `layout.tsx` changes

```tsx
<html lang="ru" suppressHydrationWarning>
  <body>
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
```

- `suppressHydrationWarning` on `<html>` — required by next-themes (class injected before hydration)
- Remove hardcoded `className="dark"` from `<html>`

### `Sidebar.tsx` changes

Two hardcoded inline style values swapped to CSS vars:
- `backgroundColor: 'hsl(222 47% 8%)'` → `backgroundColor: 'var(--sidebar)'`
- `borderColor: 'hsl(216 34% 18%)'` → `borderColor: 'var(--sidebar-border)'`

---

## SSR Flash Prevention

`next-themes` injects a blocking inline script before hydration that reads `localStorage` and sets the class on `<html>` before the page renders. No additional configuration needed.

---

## Files Changed

| File | Change |
|---|---|
| `app/globals.css` | Split `:root` (light) / `.dark` (dark), add transition rule |
| `app/layout.tsx` | Add `ThemeProvider`, `TopBar`, `suppressHydrationWarning`, remove `className="dark"` |
| `components/common/ThemeProvider.tsx` | New — next-themes wrapper |
| `components/common/TopBar.tsx` | New — top bar with 3-way theme toggle |
| `components/common/Sidebar.tsx` | Swap 2 hardcoded colors to CSS vars |
| `package.json` | Add `next-themes` |

---

## Out of Scope

- Migrating hardcoded AAPA tokens in `tailwind.config.ts` to CSS vars (score colors, profile colors are semantic — not theme-dependent)
- Per-page theme overrides
- Animated theme transition effects beyond 200ms CSS transitions
