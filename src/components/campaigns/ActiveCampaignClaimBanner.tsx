import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { CampaignClaim } from "@/core/domain/entities/CampaignClaim";
import { formatMmk } from "@/lib/formatCurrency";

type ActiveCampaignClaimBannerProps = {
  claim: CampaignClaim;
  variant?: "default" | "compact";
  isPolling?: boolean;
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

export function ActiveCampaignClaimBanner({
  claim,
  variant = "default",
  isPolling = false,
}: ActiveCampaignClaimBannerProps) {
  const { t, i18n } = useTranslation();

  if (variant === "compact") {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 md:px-5">
        <p className="text-sm font-semibold text-success md:text-base">
          {t("campaigns.claimReadyTitle")}
        </p>
        <p className="mt-1 text-sm text-ink md:text-base">
          {t("campaigns.claimReadyBody")}
        </p>
        <p className="mt-2 text-xs text-ink-muted md:text-sm">
          {claim.campaignName} ·{" "}
          {formatMmk(claim.discountAmount, i18n.language)}
          {isPolling ? ` · ${t("campaigns.pollingClaim")}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-4 md:px-5 md:py-5">
      <p className="text-sm font-semibold text-success md:text-base">
        {t("campaigns.claimReadyTitle")}
      </p>
      <p className="mt-1 text-sm text-ink md:text-base">
        {t("campaigns.claimReadyBody")}
      </p>
      <div className="mt-3 space-y-1 text-sm text-ink md:text-base">
        <p className="font-semibold">{claim.campaignName}</p>
        <p>
          {t("campaigns.claimReadySavings", {
            amount: formatMmk(claim.discountAmount, i18n.language),
          })}
        </p>
        <p className="text-xs text-ink-muted md:text-sm">
          {t("campaigns.claimAmountNote")}
        </p>
        <p className="text-xs text-ink-muted md:text-sm">
          {t("campaigns.claimExpires", {
            date: formatClaimDate(claim.expiresAt, i18n.language),
          })}
        </p>
        <p className="text-xs text-ink-muted md:text-sm">
          {t("campaigns.claimReadyRef", { id: claim.redemptionId })}
        </p>
        {isPolling ? (
          <p className="text-xs text-brand md:text-sm">
            {t("campaigns.pollingClaim")}
          </p>
        ) : null}
      </div>
      <Link to="/home" className="mt-4 inline-block">
        <Button className="min-h-11 md:min-h-12">
          {t("campaigns.claimReadyCta")}
        </Button>
      </Link>
    </div>
  );
}
