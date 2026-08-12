import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { RewardRedemption } from "@/core/domain/entities/RewardRedemption";
import { formatPoints } from "@/lib/formatCurrency";

type RewardRedemptionCardProps = {
  redemption: RewardRedemption;
  isPolling?: boolean;
  onRefresh?: () => void;
};

function formatDate(value: string | null, locale: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusTone(status: RewardRedemption["status"]): string {
  switch (status) {
    case "PENDING":
      return "border-brand/30 bg-brand-soft text-brand";
    case "COMPLETED":
      return "border-success/30 bg-success/10 text-success";
    case "CANCELLED":
      return "border-danger/30 bg-danger/10 text-danger";
    case "EXPIRED":
      return "border-line bg-surface-muted text-ink-muted";
    default:
      return "border-line bg-surface-muted text-ink-muted";
  }
}

export function RewardRedemptionCard({
  redemption,
  isPolling = false,
  onRefresh,
}: RewardRedemptionCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone(redemption.status)}`}
          >
            {t(`rewardsCatalog.redemptionStatus.${redemption.status}`)}
          </span>
          <h3 className="text-lg font-semibold tracking-tight text-ink md:text-xl">
            {redemption.rewardName}
          </h3>
          <p className="text-sm text-ink-muted">{redemption.rewardType}</p>
        </div>
        <p className="text-sm font-semibold text-brand">
          {t("rewardsCatalog.pointsSpent", {
            points: formatPoints(redemption.pointsSpent, i18n.language),
          })}
        </p>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {redemption.redemptionCode ? (
          <div className="rounded-2xl bg-surface-muted px-3 py-3 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t("rewardsCatalog.redemptionCodeLabel")}
            </dt>
            <dd className="mt-1 break-all font-mono text-base font-semibold tracking-wide text-ink">
              {redemption.redemptionCode}
            </dd>
          </div>
        ) : null}
        <div className="rounded-2xl bg-surface-muted px-3 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("rewardsCatalog.redemptionRefLabel")}
          </dt>
          <dd className="mt-1 break-all font-medium text-ink">
            {redemption.redemptionId}
          </dd>
        </div>
        <div className="rounded-2xl bg-surface-muted px-3 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("rewardsCatalog.expiresLabel")}
          </dt>
          <dd className="mt-1 font-medium text-ink">
            {formatDate(redemption.expiresAt, i18n.language)}
          </dd>
        </div>
      </dl>

      {redemption.isPending ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-ink-muted">
            {redemption.needsStaffFulfillment
              ? t("rewardsCatalog.pendingStaffHint")
              : t("rewardsCatalog.pendingHint")}
          </p>
          {onRefresh ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 md:min-h-12"
              isLoading={isPolling}
              onClick={onRefresh}
            >
              {t("rewardsCatalog.refreshStatus")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {redemption.isCompleted && redemption.fulfilledAt ? (
        <p className="mt-4 text-sm text-ink-muted">
          {t("rewardsCatalog.fulfilledAt", {
            date: formatDate(redemption.fulfilledAt, i18n.language),
          })}
        </p>
      ) : null}
    </article>
  );
}

export function RewardRedemptionCardSkeleton() {
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm md:p-6">
      <div className="h-5 w-24 animate-pulse rounded bg-surface-muted" />
      <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-surface-muted" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="h-16 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="h-16 animate-pulse rounded-2xl bg-surface-muted" />
      </div>
    </div>
  );
}
