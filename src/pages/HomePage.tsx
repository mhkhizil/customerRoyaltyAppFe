import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.nickname || user?.name || t("shell.userFallback");
  const phoneVerified = Boolean(user?.isPhoneVerified);
  const emailVerified = Boolean(user?.isEmailVerified);

  return (
    <section className="mx-auto max-w-lg space-y-5 pb-4">
      <header className="space-y-1">
        <p className="text-sm font-medium text-brand">{t("home.greeting")}</p>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {t("home.welcome", { name: displayName })}
        </h1>
        <p className="text-sm text-ink-muted">{t("home.subtitle")}</p>
      </header>

      <div className="rounded-3xl bg-brand p-5 text-white shadow-sm sm:p-6">
        <p className="text-sm font-medium text-white/80">{t("home.pointsLabel")}</p>
        <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          {t("home.pointsPlaceholder")}
        </p>
        <p className="mt-2 text-sm text-white/80">{t("home.pointsHint")}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/rewards">
            <Button
              variant="secondary"
              className="min-h-11 border-white/20 bg-white text-brand hover:bg-brand-soft"
            >
              {t("home.viewRewards")}
            </Button>
          </Link>
          <Link to="/profile">
            <Button
              variant="ghost"
              className="min-h-11 border border-white/30 text-white hover:bg-white/10"
            >
              {t("home.viewProfile")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("home.phoneStatus")}
          </p>
          <p className="mt-2 text-base font-semibold text-ink">
            {phoneVerified ? t("home.verified") : t("home.unverified")}
          </p>
          {!phoneVerified ? (
            <Link
              className="mt-3 inline-block text-sm font-semibold text-brand"
              to="/verify-phone"
              state={{ phone: user?.phone, email: user?.email }}
            >
              {t("home.verifyNow")}
            </Link>
          ) : null}
        </article>

        <article className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("home.emailStatus")}
          </p>
          <p className="mt-2 text-base font-semibold text-ink">
            {emailVerified ? t("home.verified") : t("home.unverified")}
          </p>
          {!emailVerified ? (
            <Link
              className="mt-3 inline-block text-sm font-semibold text-brand"
              to="/verify-email"
              state={{ email: user?.email }}
            >
              {t("home.verifyNow")}
            </Link>
          ) : null}
        </article>
      </div>

      <article className="rounded-2xl border border-line bg-surface-muted p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-ink">{t("home.howItWorksTitle")}</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-muted">
          <li>{t("home.howItWorksStep1")}</li>
          <li>{t("home.howItWorksStep2")}</li>
          <li>{t("home.howItWorksStep3")}</li>
        </ul>
      </article>
    </section>
  );
}
