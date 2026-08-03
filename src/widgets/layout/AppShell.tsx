import { memo, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/motion/PageTransition";
import { useAuth } from "@/core/presentation/hooks/useAuth";
import {
  PAGE_PERMISSIONS,
  usePermissions,
} from "@/features/permissions/usePermissions";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function RewardsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M12 3l2.2 4.5L19 8.2l-3.5 3.4.8 4.9L12 14.3 7.7 16.5l.8-4.9L5 8.2l4.8-.7L12 3z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" />
    </svg>
  );
}

type BottomNavItemProps = {
  to: string;
  label: string;
  icon: ReactNode;
};

const BottomNavItem = memo(function BottomNavItem({
  to,
  label,
  icon,
}: BottomNavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition-colors",
          isActive ? "bg-brand-soft text-brand" : "text-ink-muted hover:text-ink",
        ].join(" ")
      }
    >
      {icon}
      <span className="truncate">{label}</span>
    </NavLink>
  );
});

export function AppShell() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { canAccess } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserName = user?.nickname || user?.name || t("shell.userFallback");

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-bold tracking-tight text-brand">
              {t("shell.brandTitle")}
            </div>
            <div className="truncate text-xs text-ink-muted">
              {t("shell.hello", { name: currentUserName })}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="hidden min-h-11 text-ink-muted sm:inline-flex"
              onClick={() => {
                void handleLogout();
              }}
            >
              {t("shell.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      <nav className="sticky bottom-0 z-20 border-t border-line bg-surface/95 px-2 py-2 backdrop-blur safe-area-pb">
        <div className="mx-auto flex max-w-lg items-stretch gap-1">
          {canAccess(PAGE_PERMISSIONS.home) ? (
            <BottomNavItem
              to="/home"
              label={t("shell.homeTitle")}
              icon={<HomeIcon />}
            />
          ) : null}
          {canAccess(PAGE_PERMISSIONS.rewards) ? (
            <BottomNavItem
              to="/rewards"
              label={t("shell.rewardsTitle")}
              icon={<RewardsIcon />}
            />
          ) : null}
          {canAccess(PAGE_PERMISSIONS.profile) ? (
            <BottomNavItem
              to="/profile"
              label={t("shell.profileTitle")}
              icon={<ProfileIcon />}
            />
          ) : null}
        </div>
      </nav>
    </div>
  );
}
