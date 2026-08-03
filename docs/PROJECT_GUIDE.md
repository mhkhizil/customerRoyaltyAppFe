# Frontend Template Guide

Short working guide for bootstrapping a new project from this template.

## 1. What this template is

A **Customer Royalty** (loyalty/rewards) frontend with onion architecture:

- pages/UI stay thin
- hooks call application services
- services depend on domain interfaces
- infrastructure implements HTTP/API details
- mobile-first shell (bottom nav) for Median.io

Starter customer routes:

- `/login`, `/register`, forgot/reset password, verify phone/email
- `/home` — points + verification status
- `/rewards` — redeemable offers (placeholder until API)
- `/profile` — account details

## 2. Stack

- React 19 + TypeScript + Vite
- React Router
- Axios via `HttpClient`
- `react-i18next`
- Framer Motion
- Vitest + Testing Library

## 3. Boot process

Entry files:

- `src/main.tsx`
- `src/app/App.tsx`

Startup order:

1. Global CSS and i18n load in `src/main.tsx`
2. `App` mounts `ThemeProvider` → `NetworkStatusGate` → `AuthProvider` → `AppRouter`
3. `AppRouter` renders login or the authenticated shell based on session state

## 4. Auth and session

- Login uses `useAuth()` → `AuthService` → `ApiAuthRepository`
- Tokens are stored through `src/lib/cookies.ts`
- Authenticated user fields commonly used by the permission skeleton:
  - `role`
  - `adminRoleName` (optional product-specific role name)
  - `permissions`
  - `nickname` when present

Update `API_ENDPOINTS.AUTH.LOGIN` for your backend.

## 5. Permissions skeleton

File: `src/features/permissions/usePermissions.ts`

- Maps routes to required permissions
- Bottom nav and route guards must use the same helper

Member routes default to open for any authenticated client (`home` / `rewards` / `profile`).

## 6. Architecture example: Customers

End-to-end example resource:

1. Entity: `src/core/domain/entities/Customer.ts`
2. Repository interface: `src/core/domain/repositories/ICustomerRepository.ts`
3. Service interface: `src/core/domain/services/ICustomerService.ts`
4. DTOs: `src/core/application/dtos/CustomerDTO.ts`
5. Service: `src/core/application/services/CustomerManagementService.ts`
6. API repo: `src/core/infrastructure/repositories/ApiCustomerRepository.ts`
7. DI: registered in `src/core/infrastructure/di/container.ts`
8. Hook: `src/core/presentation/hooks/useCustomerManagement.tsx`
9. Page: `src/pages/CustomersPage.tsx`

Copy that path for every new resource.

## 7. How to add a feature safely

1. Confirm backend contract (paths, request body, response body)
2. Add domain + application + infrastructure pieces
3. Register in the DI container
4. Expose a presentation hook
5. Build a thin page that only uses the hook
6. Wire route + bottom nav + permissions
7. Add i18n keys in `src/lib/i18n/locales/en.json`
8. Run `npm run build`

## 8. UI guidance

- Use Tailwind utility classes for layout and styling
- Reuse shared components in `src/components/ui` (Button, MetricCard, etc.)
- Dark mode uses the `dark` class on `<html>` via `ThemeProvider`
- Keep branding/product naming neutral until the new project owns them

## 9. Validation

After meaningful changes:

```bash
npm run build
```
