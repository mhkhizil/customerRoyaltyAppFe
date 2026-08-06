# AGENTS.md

> **Read first:** [docs/AI_CHANGE_GUIDE.md](./docs/AI_CHANGE_GUIDE.md)  
> Then follow [architecture.md](./architecture.md) and [src/theme/README.md](./src/theme/README.md).

This file applies to the entire repository.

## Purpose

Customer Royalty App frontend — authenticated loyalty/rewards experience, white-labeled per shop.

When implementing features, prioritize:

- [docs/AI_CHANGE_GUIDE.md](./docs/AI_CHANGE_GUIDE.md) (architecture, types, responsive, theme)
- [architecture.md](./architecture.md)
- exact backend contract matching
- permission-aware route/sidebar behavior when needed
- consistency with existing page, hook, and service patterns
- minimal, focused changes

## Tech Stack

- React with functional components and hooks
- TypeScript (strict — no `any`)
- Vite
- Axios via `HttpClient`
- Tailwind CSS with shop theme tokens (`bg-brand`, `bg-accent`, …)
- Framer Motion for shell/page transitions
- i18n — add keys in `src/lib/i18n/locales/en.json`
- Responsive / mobile-first (Median.io wrapper planned)

## Architecture (required)

Follow the onion layers in [architecture.md](./architecture.md):

1. **Domain** — entities + repository/service interfaces in `src/core/domain`
2. **Application** — DTOs + service implementations in `src/core/application`
3. **Infrastructure** — `HttpClient`, API repositories, endpoint constants, DI container
4. **Presentation** — React hooks in `src/core/presentation/hooks`
5. **UI** — thin pages/components that call hooks only

**Do not** call Axios/`HttpClient` from pages.
**Do not** invent a parallel `src/features/<feature>/<feature>Api.ts` bypass pattern.

## How to add a feature

Work inside-out:

1. Confirm the backend endpoint contract
2. Add/extend domain entity + interfaces
3. Add DTOs
4. Implement application service
5. Implement `Api*Repository` and add paths in `src/core/infrastructure/api/constants.ts`
6. Register repository/service in `src/core/infrastructure/di/container.ts`
7. Add presentation hook
8. Add page under `src/pages/` (responsive, theme tokens)
9. Add route in `src/app/router/AppRouter.tsx`
10. Add sidebar item in `src/widgets/layout/AppShell.tsx`
11. Add permission mapping in `src/features/permissions/usePermissions.ts` when needed
12. Run `npm run typecheck` and `npm run build`

Starter examples:

- Auth (`useAuth`) — client register/login/OTP/profile
- Points (`useClientPoints`) — QR rotate + point transactions
- Campaigns (`useClientCampaigns`) — discover sales, discount preview, redeem
- Home / Rewards / Profile — customer loyalty shell
- Customer CRUD layers (`useCustomerManagement`) remain as an architecture sample only

## Theme rules

- Shop colors: `src/theme/shopTheme.ts` only
- Use Tailwind theme tokens — never hard-code hex in components
- See `src/theme/README.md`

## UI rules

- Mobile-first responsive layouts (Median.io)
- Reuse `src/components/ui` components
- Keep pages thin; business logic in services/hooks

## Validation rules

- Run `npm run typecheck` and `npm run build` after meaningful changes
- No `any` types
- Fix compile errors caused by your changes

## Change discipline

- Keep changes surgical
- Do not rename existing files or abstractions without strong reason
- Do not rewrite unrelated modules
