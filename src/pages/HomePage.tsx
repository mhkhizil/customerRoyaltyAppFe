import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CustomerQrCard } from "@/components/points/CustomerQrCard";
import { PointsTransactionList } from "@/components/points/PointsTransactionList";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";
import { useClientPoints } from "@/core/presentation/hooks/useClientPoints";

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    qrToken,
    transactions,
    balance,
    isLoadingQr,
    isLoadingTransactions,
    error,
    rotateQrToken,
    refresh,
    clearError,
  } = useClientPoints();

  const displayName = user?.nickname || t("shell.userFallback");
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
        <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
          {balance === null ? t("home.pointsPlaceholder") : balance}
        </p>
        <p className="mt-2 text-sm text-white/80">
          {balance === null ? t("home.pointsHint") : t("home.pointsFromLedger")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 border-white/20 bg-white text-brand hover:bg-brand-soft"
            isLoading={isLoadingTransactions}
            onClick={() => {
              clearError();
              void refresh().catch(() => {
                /* error surfaced below */
              });
            }}
          >
            {t("home.refreshPoints")}
          </Button>
          <Link to="/rewards">
            <Button
              variant="ghost"
              className="min-h-11 border border-white/30 text-white hover:bg-white/10"
            >
              {t("home.viewRewards")}
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <CustomerQrCard
        qrToken={qrToken}
        isLoading={isLoadingQr}
        onRefresh={() => {
          clearError();
          void rotateQrToken().catch(() => {
            /* error surfaced above */
          });
        }}
      />

      <PointsTransactionList
        transactions={transactions}
        isLoading={isLoadingTransactions}
      />

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
    </section>
  );
}
