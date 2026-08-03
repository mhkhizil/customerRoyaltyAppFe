# Theme system

## Purpose

Customer Royalty App is white-labeled per shop. Brand colors must be changed in **one place**, not scattered across components.

## Files

- [`shopTheme.ts`](./shopTheme.ts) — shop color presets (add a new preset per shop)
- [`applyShopTheme.ts`](./applyShopTheme.ts) — writes CSS variables to `:root`
- [`ThemeProvider.tsx`](./ThemeProvider.tsx) — light/dark mode + applies shop palette

## How to change colors for a shop

1. Add a preset in `shopThemePresets` inside `shopTheme.ts` (copy `customerRoyaltyDefaultTheme`).
2. Set `VITE_SHOP_THEME_ID=<your-preset-id>` in `.env`, or call `applyShopTheme(mode, "<your-preset-id>")`.
3. Do **not** hard-code hex colors in pages/components.

## Tailwind tokens (use these in UI)

| Token | Example class |
|-------|----------------|
| Brand primary | `bg-brand`, `text-brand`, `border-brand` |
| Brand strong | `bg-brand-strong`, `hover:bg-brand-strong` |
| Brand soft | `bg-brand-soft` |
| Accent / shell | `bg-accent`, `text-accent` |
| Surfaces | `bg-surface`, `bg-surface-muted` |
| Text | `text-ink`, `text-ink-muted` |
| Borders | `border-line` |
| Status | `text-success`, `text-danger`, `bg-danger/10` |

## Light / dark mode

Use `dark:` variants. Example: `bg-surface dark:bg-surface-muted`.
