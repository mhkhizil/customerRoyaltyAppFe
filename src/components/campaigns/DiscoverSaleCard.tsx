import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { Campaign } from "@/core/domain/entities/Campaign";
import { formatCampaignDiscount, formatMmk } from "@/lib/formatCurrency";

type DiscoverSaleCardProps = {
  campaign: Campaign;
  isClaimed: boolean;
  isSelected: boolean;
  isEligible: boolean | null;
  onSelect: (campaign: Campaign) => void;
};

function formatCampaignDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysRemaining(endsAt: string): number | null {
  const endsMs = Date.parse(endsAt);
  if (Number.isNaN(endsMs)) return null;
  const diff = endsMs - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function DiscoverSaleCard({
  campaign,
  isClaimed,
  isSelected,
  isEligible,
  onSelect,
}: DiscoverSaleCardProps) {
  const { t, i18n } = useTranslation();
  const daysLeft = getDaysRemaining(campaign.endsAt);
  const endingSoon = daysLeft !== null && daysLeft <= 3;
  const discountLabel = formatCampaignDiscount(
    campaign.discountType,
    campaign.discountValue,
    i18n.language
  );

  return (
    <article
      className={[
        "flex h-full flex-col overflow-hidden rounded-3xl border bg-surface shadow-sm transition-shadow",
        isSelected
          ? "border-brand ring-2 ring-brand/20"
          : endingSoon
            ? "border-brand/40 ring-1 ring-brand/20"
            : "border-line hover:shadow-md",
      ].join(" ")}
    >
      <div className="relative bg-brand px-5 py-6 text-white sm:px-6 md:py-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
            {campaign.isPercentage
              ? t("campaigns.badgePercent")
              : t("campaigns.badgeFixed")}
          </span>
          {endingSoon ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand">
              {daysLeft === 0
                ? t("campaigns.endsToday")
                : t("campaigns.daysLeft", { count: daysLeft })}
            </span>
          ) : null}
        </div>

        <p className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {campaign.isPercentage
            ? `${campaign.discountValue}%`
            : formatMmk(campaign.discountValue, i18n.language)}
        </p>
        <p className="mt-1 text-sm font-medium text-white/85">
          {campaign.isPercentage
            ? t("campaigns.offLabel")
            : t("campaigns.fixedOffLabel")}
        </p>
        <p className="sr-only">{discountLabel}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-semibold tracking-tight text-ink md:text-xl">
            {campaign.name}
          </h3>
          <p className="text-sm text-ink-muted">
            {t("campaigns.validRange", {
              start: formatCampaignDate(campaign.startsAt, i18n.language),
              end: formatCampaignDate(campaign.endsAt, i18n.language),
            })}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-surface-muted px-3 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t("campaigns.minLabel")}
            </dt>
            <dd className="mt-1 font-semibold tabular-nums text-ink">
              {campaign.minimumPurchase > 0
                ? formatMmk(campaign.minimumPurchase, i18n.language)
                : t("campaigns.noMinimum")}
            </dd>
          </div>
          <div className="rounded-2xl bg-surface-muted px-3 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t("campaigns.endsLabel")}
            </dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatCampaignDate(campaign.endsAt, i18n.language)}
            </dd>
          </div>
        </dl>

        <div className="mt-auto space-y-2 pt-1">
          <Button
            type="button"
            variant={isSelected ? "primary" : "secondary"}
            className="min-h-11 w-full md:min-h-12"
            disabled={isClaimed}
            onClick={() => onSelect(campaign)}
          >
            {isClaimed
              ? t("campaigns.claimAlreadyActive")
              : isSelected
                ? t("campaigns.eligibilitySelected")
                : t("campaigns.reviewPromoCta")}
          </Button>
          {isEligible === true ? (
            <p className="text-center text-xs font-medium text-success">
              {t("campaigns.eligibilityEligibleShort")}
            </p>
          ) : null}
          {isEligible === false ? (
            <p className="text-center text-xs font-medium text-danger">
              {t("campaigns.eligibilityIneligibleShort")}
            </p>
          ) : null}
          <p className="text-center text-xs text-ink-muted">
            {isClaimed
              ? t("campaigns.cardClaimedHint")
              : t("campaigns.cardReviewHint")}
          </p>
        </div>
      </div>
    </article>
  );
}

export function DiscoverSaleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="h-36 animate-pulse bg-brand/30 md:h-40" />
      <div className="space-y-3 p-5 sm:p-6">
        <div className="h-5 w-2/3 animate-pulse rounded bg-surface-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-surface-muted" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-16 animate-pulse rounded-2xl bg-surface-muted" />
          <div className="h-16 animate-pulse rounded-2xl bg-surface-muted" />
        </div>
        <div className="h-11 animate-pulse rounded-lg bg-surface-muted" />
      </div>
    </div>
  );
}
