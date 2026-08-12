import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { Reward } from "@/core/domain/entities/Reward";
import { formatMmk, formatPoints } from "@/lib/formatCurrency";

type RewardCatalogCardProps = {
  reward: Reward;
  pointsBalance: number | null;
  isRedeeming: boolean;
  onRedeem: (reward: Reward) => void;
};

function rewardTypeLabel(type: string, t: (key: string) => string): string {
  switch (String(type).toUpperCase()) {
    case "BONUS_POINTS":
      return t("rewardsCatalog.typeBonusPoints");
    case "FREE_PRODUCT":
      return t("rewardsCatalog.typeFreeProduct");
    case "DISCOUNT":
      return t("rewardsCatalog.typeDiscount");
    default:
      return type;
  }
}

function rewardBenefitSummary(
  reward: Reward,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string
): string {
  if (reward.isBonusPoints && reward.bonusPoints !== null) {
    return t("rewardsCatalog.bonusPointsBenefit", {
      points: formatPoints(reward.bonusPoints, locale),
    });
  }
  if (reward.isDiscount && reward.discountValue !== null) {
    return t("rewardsCatalog.discountBenefit", {
      amount: formatMmk(reward.discountValue, locale),
    });
  }
  if (reward.isFreeProduct) {
    return t("rewardsCatalog.freeProductBenefit");
  }
  return t("rewardsCatalog.genericBenefit");
}

export function RewardCatalogCard({
  reward,
  pointsBalance,
  isRedeeming,
  onRedeem,
}: RewardCatalogCardProps) {
  const { t, i18n } = useTranslation();
  const canAfford =
    pointsBalance === null ? true : pointsBalance >= reward.pointsCost;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="bg-brand px-5 py-5 text-white sm:px-6">
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
          {rewardTypeLabel(reward.type, t)}
        </span>
        <h3 className="mt-3 text-xl font-semibold tracking-tight md:text-2xl">
          {reward.name}
        </h3>
        <p className="mt-1 text-sm text-white/85">
          {rewardBenefitSummary(reward, t, i18n.language)}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-surface-muted px-3 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t("rewardsCatalog.costLabel")}
            </dt>
            <dd className="mt-1 font-semibold tabular-nums text-ink">
              {t("rewardsCatalog.pointsCost", {
                points: formatPoints(reward.pointsCost, i18n.language),
              })}
            </dd>
          </div>
          <div className="rounded-2xl bg-surface-muted px-3 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t("rewardsCatalog.stockLabel")}
            </dt>
            <dd className="mt-1 font-semibold text-ink">
              {reward.stockQuantity === null
                ? t("rewardsCatalog.stockUnlimited")
                : formatPoints(reward.stockQuantity, i18n.language)}
            </dd>
          </div>
        </dl>

        {!canAfford ? (
          <p className="text-sm text-danger">{t("rewardsCatalog.insufficientPoints")}</p>
        ) : null}

        <div className="mt-auto pt-1">
          <Button
            type="button"
            className="min-h-11 w-full md:min-h-12"
            isLoading={isRedeeming}
            disabled={!canAfford}
            onClick={() => onRedeem(reward)}
          >
            {t("rewardsCatalog.redeemCta")}
          </Button>
          <p className="mt-2 text-center text-xs text-ink-muted">
            {reward.isFreeProduct || reward.isDiscount
              ? t("rewardsCatalog.staffFulfillmentHint")
              : t("rewardsCatalog.instantHint")}
          </p>
        </div>
      </div>
    </article>
  );
}

export function RewardCatalogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="h-32 animate-pulse bg-brand/30" />
      <div className="space-y-3 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 animate-pulse rounded-2xl bg-surface-muted" />
          <div className="h-16 animate-pulse rounded-2xl bg-surface-muted" />
        </div>
        <div className="h-11 animate-pulse rounded-lg bg-surface-muted" />
      </div>
    </div>
  );
}
