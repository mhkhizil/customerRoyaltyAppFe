import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import type { CampaignClaim } from "@/core/domain/entities/CampaignClaim";
import { formatMmk } from "@/lib/formatCurrency";

type CampaignClaimCardProps = {
  claim: CampaignClaim;
  isPolling?: boolean;
  onRefresh?: () => void;
};

function formatClaimDate(value: string | null, locale: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusTone(status: CampaignClaim["status"]): string {
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

export function CampaignClaimCard({
  claim,
  isPolling = false,
  onRefresh,
}: CampaignClaimCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone(claim.status)}`}
          >
            {t(`campaigns.claimStatus.${claim.status}`)}
          </span>
          <h3 className="text-lg font-semibold tracking-tight text-ink md:text-xl">
            {claim.campaignName}
          </h3>
          <p className="text-sm text-ink-muted">{claim.campaignType}</p>
        </div>
        <p className="text-2xl font-bold tracking-tight text-brand md:text-3xl">
          {formatMmk(claim.discountAmount, i18n.language)}
        </p>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-surface-muted px-3 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("campaigns.claimRefLabel")}
          </dt>
          <dd className="mt-1 break-all font-medium text-ink">
            {claim.redemptionId}
          </dd>
        </div>
        <div className="rounded-2xl bg-surface-muted px-3 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("campaigns.endsLabel")}
          </dt>
          <dd className="mt-1 font-medium text-ink">
            {formatClaimDate(claim.expiresAt, i18n.language)}
          </dd>
        </div>
      </dl>

      {claim.isPending ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-ink-muted md:text-base">
            {t("campaigns.claimPendingHint")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/home">
              <Button className="min-h-11 md:min-h-12">
                {t("campaigns.claimReadyCta")}
              </Button>
            </Link>
            {onRefresh ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 md:min-h-12"
                isLoading={isPolling}
                onClick={onRefresh}
              >
                {t("campaigns.refreshClaimStatus")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {claim.isCompleted && claim.redeemedAt ? (
        <p className="mt-4 text-sm text-ink-muted">
          {t("campaigns.claimCompletedAt", {
            date: formatClaimDate(claim.redeemedAt, i18n.language),
          })}
        </p>
      ) : null}
    </article>
  );
}

export function CampaignClaimCardSkeleton() {
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
