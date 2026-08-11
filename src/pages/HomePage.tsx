import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CustomerQrCard } from "@/components/points/CustomerQrCard";
import { PointsTransactionList } from "@/components/points/PointsTransactionList";
import { ActiveCampaignClaimBanner } from "@/components/campaigns/ActiveCampaignClaimBanner";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";
import { useClientCampaigns } from "@/core/presentation/hooks/useClientCampaigns";
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
  const { pendingClaims, isPollingClaim } = useClientCampaigns({
    autoLoadDiscover: false,
  });
  const primaryPendingClaim = pendingClaims[0] ?? null;

  const displayName = user?.nickname || t("shell.userFallback");
  const phoneVerified = Boolean(user?.isPhoneVerified);
  const emailVerified = Boolean(user?.isEmailVerified);

  return (
    <section className="w-full space-y-5 pb-4 md:space-y-6 md:pb-6">
      <header className="space-y-1 md:space-y-2">
        <p className="text-sm font-medium text-brand md:text-base">
          {t("home.greeting")}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
          {t("home.welcome", { name: displayName })}
        </h1>
        <p className="max-w-2xl text-sm text-ink-muted md:text-base">
          {t("home.subtitle")}
        </p>
      </header>

      {primaryPendingClaim ? (
        <ActiveCampaignClaimBanner
          claim={primaryPendingClaim}
          variant="compact"
          isPolling={isPollingClaim}
        />
      ) : null}

      {/* Phone: stacked. Tablet+: points + QR side by side for scan-friendly layout. */}
      <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-6">
        <div className="rounded-3xl bg-brand p-5 text-white shadow-sm sm:p-6 md:p-8">
          <p className="text-sm font-medium text-white/80 md:text-base">
            {t("home.pointsLabel")}
          </p>
          <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl md:text-6xl">
            {balance === null ? t("home.pointsPlaceholder") : balance}
          </p>
          <p className="mt-2 text-sm text-white/80 md:text-base">
            {balance === null ? t("home.pointsHint") : t("home.pointsFromLedger")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 border-white/20 bg-white text-brand hover:bg-brand-soft md:min-h-12"
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
                className="min-h-11 border border-white/30 text-white hover:bg-white/10 md:min-h-12"
              >
                {t("home.viewRewards")}
              </Button>
            </Link>
          </div>
        </div>

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
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger md:text-base">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <PointsTransactionList
          transactions={transactions}
          isLoading={isLoadingTransactions}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <article className="rounded-2xl border border-line bg-surface p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {t("home.phoneStatus")}
            </p>
            <p className="mt-2 text-base font-semibold text-ink md:text-lg">
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

          <article className="rounded-2xl border border-line bg-surface p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {t("home.emailStatus")}
            </p>
            <p className="mt-2 text-base font-semibold text-ink md:text-lg">
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
      </div>
    </section>
  );
}
