import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/core/presentation/hooks/useAuth";
import {
  PAGE_PERMISSIONS,
  PERMISSION_ROUTE_ORDER,
  usePermissions,
} from "@/features/permissions/usePermissions";

const LoginPage = lazy(() =>
  import("../../pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  }))
);
const RegisterPage = lazy(() =>
  import("../../pages/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  }))
);
const ForgotPasswordPage = lazy(() =>
  import("../../pages/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage,
  }))
);
const ResetPasswordPage = lazy(() =>
  import("../../pages/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  }))
);
const VerifyPhonePage = lazy(() =>
  import("../../pages/VerifyPhonePage").then((module) => ({
    default: module.VerifyPhonePage,
  }))
);
const VerifyEmailPage = lazy(() =>
  import("../../pages/VerifyEmailPage").then((module) => ({
    default: module.VerifyEmailPage,
  }))
);
const HomePage = lazy(() =>
  import("../../pages/HomePage").then((module) => ({
    default: module.HomePage,
  }))
);
const RewardsPage = lazy(() =>
  import("../../pages/RewardsPage").then((module) => ({
    default: module.RewardsPage,
  }))
);
const ProfilePage = lazy(() =>
  import("../../pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  }))
);
const NotFoundPage = lazy(() =>
  import("../../pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  }))
);
const AppShell = lazy(() =>
  import("../../widgets/layout/AppShell").then((module) => ({
    default: module.AppShell,
  }))
);

function RouteFallback() {
  return <LoadingScreen />;
}

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <RouteFallback />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

function GuestOnly() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteFallback />;
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}

function UnauthorizedPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {t("router.accessDeniedTitle")}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {t("router.accessDeniedDescription")}
        </p>
      </div>
    </section>
  );
}

function PermissionRedirect() {
  const { isLoading } = useAuth();
  const { canAccess } = usePermissions();

  if (isLoading) return <RouteFallback />;

  const firstAccessibleRoute = PERMISSION_ROUTE_ORDER.find((entry) =>
    canAccess(entry.permissions)
  );

  if (firstAccessibleRoute) {
    return <Navigate to={firstAccessibleRoute.path} replace />;
  }

  return <UnauthorizedPage />;
}

function RequirePermission({
  requiredPermissions,
  children,
}: {
  requiredPermissions: readonly string[];
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();
  const { canAccess } = usePermissions();

  if (isLoading) return <RouteFallback />;
  if (!canAccess(requiredPermissions)) {
    return <UnauthorizedPage />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Verification can happen before or after login */}
          <Route path="/verify-phone" element={<VerifyPhonePage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<PermissionRedirect />} />
              <Route path="/dashboard" element={<Navigate to="/home" replace />} />
              <Route
                path="/home"
                element={
                  <RequirePermission requiredPermissions={PAGE_PERMISSIONS.home}>
                    <HomePage />
                  </RequirePermission>
                }
              />
              <Route
                path="/rewards"
                element={
                  <RequirePermission
                    requiredPermissions={PAGE_PERMISSIONS.rewards}
                  >
                    <RewardsPage />
                  </RequirePermission>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequirePermission
                    requiredPermissions={PAGE_PERMISSIONS.profile}
                  >
                    <ProfilePage />
                  </RequirePermission>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
