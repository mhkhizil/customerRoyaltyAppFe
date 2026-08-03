# AI Change Guide (read this first)

This file is the **first document AI assistants and contributors must read** before making changes in this repository.

Also required reading:

- [architecture.md](../architecture.md) — layer rules and feature checklist
- [src/theme/README.md](../src/theme/README.md) — shop theme tokens

---

## 1. Architecture (mandatory)

Follow [architecture.md](../architecture.md). Do not bypass it.

**Allowed flow**

`Page/Component` → `presentation hook` → `application service` → `domain interface` → `infrastructure repository`

**Rules**

- Pages stay thin. No `HttpClient`, Axios, or `fetch` in pages/components.
- Do not create parallel `src/features/*Api.ts` bypass layers.
- Match backend request/response shapes exactly in DTOs and repositories.
- Register new services/repos in `src/core/infrastructure/di/container.ts`.

**Adding a feature (inside-out)**

1. Domain entity + repository/service interfaces  
2. Application DTOs + service  
3. Infrastructure `Api*Repository` + `constants.ts` paths  
4. DI registration  
5. Presentation hook  
6. Page + route + shell nav + permissions (if needed)  
7. i18n keys in `src/lib/i18n/locales/en.json`

---

## 2. TypeScript and type safety (mandatory)

Run typecheck before finishing:

```bash
npm run typecheck
npm run build
```

**Strict typing rules**

- `strict` mode is enabled — do not weaken it.
- **Never use `any`.** Use `unknown` and narrow, or define proper types/interfaces.
- Avoid `as any`, `@ts-ignore`, and `@ts-expect-error` unless there is a documented, unavoidable reason.
- Avoid unsafe casts (`as SomeType`) without validation.
- Prefer explicit return types on exported functions in `src/core/**`.
- DTOs and domain entities must reflect real backend contracts — do not invent fields.
- Use `readonly` and discriminated unions where they improve safety.

**If a type is unclear**

- Define it in domain/application layers.
- Normalize API ambiguity in infrastructure repositories, not in UI.

---

## 3. Responsive UI and Median.io readiness (mandatory)

This web app will later be wrapped as a **mobile app** ([Median.io](https://median.io/)). Every page and layout change must be **mobile-first and responsive**.

**Layout rules**

- Design **mobile-first**, then enhance with `sm:`, `md:`, `lg:` breakpoints.
- Use fluid widths (`w-full`, `max-w-*`, `%`, `min-w-0`) — avoid fixed desktop-only widths.
- Tables: wrap in `overflow-x-auto` or provide a stacked mobile layout.
- Touch targets: minimum **44px** height for buttons and nav items on mobile.
- Avoid hover-only interactions; ensure tap-friendly controls.
- Test mentally at **320px**, **390px**, and **768px** widths.
- Shell: mobile-first with bottom nav (Home / Rewards / Profile); keep touch targets ≥ 44px.

**Do not**

- Hard-code pixel widths for main content areas without responsive fallbacks.
- Hide critical actions on mobile.
- Assume mouse hover for core workflows.

---

## 4. Theme and branding (mandatory)

This is **Customer Royalty App** — a loyalty/rewards experience that will be **re-branded per shop**.

**Single source of truth**

- Shop colors live in [`src/theme/shopTheme.ts`](../src/theme/shopTheme.ts).
- Runtime application: [`src/theme/applyShopTheme.ts`](../src/theme/applyShopTheme.ts).
- Select preset via `VITE_SHOP_THEME_ID` in `.env`.

**UI color rules**

- Use theme tokens only: `bg-brand`, `bg-accent`, `bg-surface`, `text-ink`, `border-line`, etc.
- **Do not** hard-code hex/rgb colors in components or pages.
- Support light and dark mode with `dark:` variants.
- Default palette = warm **gold** (rewards/royalty) + **navy accent** (trust). New shops = new preset in `shopTheme.ts`.

**When adding UI**

- Buttons: use `src/components/ui/Button.tsx` variants (they map to theme tokens).
- Cards/surfaces: `bg-surface`, `border-line`.
- Sidebars/headers: `bg-accent` or `bg-surface` — not random slate/gray hex values.

---

## 5. Styling stack

- **Tailwind CSS v4** only (via `src/index.css` `@theme` tokens).
- Reuse shared components in `src/components/ui`.
- Framer Motion only for small transitions — do not block mobile performance.

---

## 6. i18n

- Add new user-facing strings to `src/lib/i18n/locales/en.json` first.
- Do not hard-code labels in pages unless purely technical/debug.

---

## 7. Validation checklist (run before done)

- [ ] Follows [architecture.md](../architecture.md) layer boundaries  
- [ ] No `any`, no unsafe type escapes  
- [ ] `npm run typecheck` passes  
- [ ] `npm run build` passes  
- [ ] Page works on mobile + desktop breakpoints  
- [ ] Colors use theme tokens (no inline hex)  
- [ ] i18n keys added for new copy  

---

## 8. Change discipline

- Keep diffs focused — no drive-by refactors.
- Do not rename core abstractions without strong reason.
- Do not add speculative patterns unless immediately used.
- Prefer extending existing hooks/services over duplicating logic.

---

## Quick reference

| Topic | Location |
|-------|----------|
| Architecture | `architecture.md` |
| Shop theme presets | `src/theme/shopTheme.ts` |
| Theme tokens | `src/index.css` `@theme` block |
| Permissions | `src/features/permissions/usePermissions.ts` |
| Routes | `src/app/router/AppRouter.tsx` |
| Shell | `src/widgets/layout/AppShell.tsx` |
| API paths | `src/core/infrastructure/api/constants.ts` |
