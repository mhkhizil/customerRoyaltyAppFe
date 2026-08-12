import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DiscoverSaleCard,
  DiscoverSaleCardSkeleton,
} from "@/components/campaigns/DiscoverSaleCard";
import { ActiveCampaignClaimBanner } from "@/components/campaigns/ActiveCampaignClaimBanner";
import {
  CampaignClaimCard,
  CampaignClaimCardSkeleton,
} from "@/components/campaigns/CampaignClaimCard";
import { CampaignEligibilityPanel } from "@/components/campaigns/CampaignEligibilityPanel";
import {
  RewardCatalogCard,
  RewardCatalogCardSkeleton,
} from "@/components/rewards/RewardCatalogCard";
import {
  RewardRedemptionCard,
  RewardRedemptionCardSkeleton,
} from "@/components/rewards/RewardRedemptionCard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";
import { useClientCampaigns } from "@/core/presentation/hooks/useClientCampaigns";
import { useClientPoints } from "@/core/presentation/hooks/useClientPoints";
import { useClientRewards } from "@/core/presentation/hooks/useClientRewards";
import { formatMmk, formatPoints } from "@/lib/formatCurrency";
import type { Campaign } from "@/core/domain/entities/Campaign";
import type { Reward } from "@/core/domain/entities/Reward";

type RewardsTab = "discover" | "promos" | "catalog";

function sortByEndingSoon(a: Campaign, b: Campaign): number {
  const aEnds = Date.parse(a.endsAt);
  const bEnds = Date.parse(b.endsAt);
  const aSafe = Number.isNaN(aEnds) ? Number.POSITIVE_INFINITY : aEnds;
  const bSafe = Number.isNaN(bEnds) ? Number.POSITIVE_INFINITY : bEnds;
  return aSafe - bSafe;
}

function sortClaimsByRecent<T extends { createdAt: string }>(a: T, b: T): number {
  const aMs = Date.parse(a.createdAt);
  const bMs = Date.parse(b.createdAt);
  const aSafe = Number.isNaN(aMs) ? 0 : aMs;
  const bSafe = Number.isNaN(bMs) ? 0 : bMs;
  return bSafe - aSafe;
}

export function RewardsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const {
    discoverSales,
    claims,
    pendingClaims,
    branches,
    eligibilityPreview,
    lastClaim,
    isLoadingDiscover,
    isLoadingClaims,
    isLoadingBranches,
    isCheckingEligibility,
    isRedeeming,
    isPollingClaim,
    error,
    loadDiscoverSales,
    loadClaims,
    previewEligibility,
    redeemCampaign,
    refreshClaim,
    clearError,
    clearEligibilityPreview,
  } = useClientCampaigns();

  const {
    rewards,
    redemptions,
    pendingRedemptions,
    lastRedemption,
    isLoadingRewards,
    isLoadingRedemptions,
    isRedeeming: isRedeemingReward,
    isPollingRedemption,
    error: rewardsError,
    loadRewards,
    loadRedemptions,
    redeemReward,
    refreshRedemption,
    clearError: clearRewardsError,
  } = useClientRewards();

  const { balance, refresh: refreshPoints } = useClientPoints();

  const [activeTab, setActiveTab] = useState<RewardsTab>("discover");
  const [purchaseAmountInput, setPurchaseAmountInput] = useState("50000");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [eligibilityByCampaignId, setEligibilityByCampaignId] = useState<
    Record<string, boolean>
  >({});
  const [claimingCampaignId, setClaimingCampaignId] = useState<string | null>(
    null
  );
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [rewardSuccess, setRewardSuccess] = useState<string | null>(null);
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);

  const hasDob = Boolean(user?.dateOfBirth);
  const primaryPendingClaim = pendingClaims[0] ?? null;

  const sortedSales = useMemo(
    () => [...discoverSales].sort(sortByEndingSoon),
    [discoverSales]
  );

  const sortedClaims = useMemo(
    () => [...claims].sort(sortClaimsByRecent),
    [claims]
  );

  const pendingCampaignIds = useMemo(
    () => new Set(pendingClaims.map((claim) => claim.campaignId)),
    [pendingClaims]
  );

  const sortedRedemptions = useMemo(
    () => [...redemptions].sort(sortClaimsByRecent),
    [redemptions]
  );

  const displayError =
    activeTab === "catalog" ? rewardsError : error;

  const selectedCampaignIsClaimed = selectedCampaign
    ? pendingCampaignIds.has(selectedCampaign.id)
    : false;

  const handleRedeemReward = async (reward: Reward) => {
    setRewardSuccess(null);
    clearRewardsError();

    setRedeemingRewardId(reward.id);
    try {
      const result = await redeemReward({ rewardId: reward.id });
      setRewardSuccess(
        result.isCompleted
          ? t("rewardsCatalog.redeemSuccessInstant", { name: result.rewardName })
          : t("rewardsCatalog.redeemSuccessPending", {
              code: result.redemptionCode,
            })
      );
      void refreshPoints().catch(() => {
        /* balance refresh is best-effort */
      });
    } catch {
      /* error stored in hook */
    } finally {
      setRedeemingRewardId(null);
    }
  };
  const parseAmount = (): number | null => {
    const amount = Number(purchaseAmountInput.replace(/,/g, "").trim());
    if (!Number.isFinite(amount) || amount < 0) return null;
    return amount;
  };

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    clearEligibilityPreview();
  };

  const handlePurchaseAmountChange = (value: string) => {
    setPurchaseAmountInput(value);
    clearEligibilityPreview();
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    clearEligibilityPreview();
  };

  const handleCheckEligibility = async () => {
    if (!selectedCampaign) return;

    const amount = parseAmount();
    if (amount === null) return;

    clearError();
    try {
      const result = await previewEligibility({
        campaignId: selectedCampaign.id,
        purchaseAmount: amount,
        locationId: selectedBranchId || undefined,
      });
      setEligibilityByCampaignId((current) => ({
        ...current,
        [selectedCampaign.id]: result.eligible,
      }));
    } catch {
      /* error stored in hook */
    }
  };

  const handleClaim = async (campaign: Campaign) => {
    setClaimSuccess(null);
    clearError();

    const amount = parseAmount();
    if (amount === null) return;

    setClaimingCampaignId(campaign.id);
    try {
      const result = await redeemCampaign({
        campaignId: campaign.id,
        purchaseAmount: amount,
      });
      setClaimSuccess(
        t("campaigns.claimSuccess", {
          amount: formatMmk(result.discountAmount, i18n.language),
        })
      );
      setActiveTab("promos");
      setEligibilityByCampaignId((current) => ({
        ...current,
        [campaign.id]: true,
      }));
    } catch {
      /* error stored in hook */
    } finally {
      setClaimingCampaignId(null);
    }
  };

  return (
    <section className="w-full space-y-6 pb-4 md:space-y-8 md:pb-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-brand md:text-base">
          {t("campaigns.eyebrow")}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-4xl">
          {t("rewards.title")}
        </h1>
        <p className="max-w-2xl text-sm text-ink-muted md:text-base">
          {t("rewards.subtitle")}
        </p>
      </header>

      <div className="flex gap-2 rounded-2xl border border-line bg-surface-muted p-1">
        <button
          type="button"
          className={[
            "min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors md:min-h-12 md:text-base",
            activeTab === "discover"
              ? "bg-surface text-brand shadow-sm"
              : "text-ink-muted hover:text-ink",
          ].join(" ")}
          onClick={() => setActiveTab("discover")}
        >
          {t("campaigns.tabDiscover")}
        </button>
        <button
          type="button"
          className={[
            "min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors md:min-h-12 md:text-base",
            activeTab === "promos"
              ? "bg-surface text-brand shadow-sm"
              : "text-ink-muted hover:text-ink",
          ].join(" ")}
          onClick={() => setActiveTab("promos")}
        >
          {t("campaigns.tabPromos")}
          {pendingClaims.length > 0 ? (
            <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs text-white">
              {pendingClaims.length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className={[
            "min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors md:min-h-12 md:text-base",
            activeTab === "catalog"
              ? "bg-surface text-brand shadow-sm"
              : "text-ink-muted hover:text-ink",
          ].join(" ")}
          onClick={() => setActiveTab("catalog")}
        >
          {t("rewardsCatalog.tabTitle")}
          {pendingRedemptions.length > 0 ? (
            <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs text-white">
              {pendingRedemptions.length}
            </span>
          ) : null}
        </button>
      </div>

      {!hasDob ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-brand/25 bg-brand-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <p className="text-sm text-ink md:text-base">{t("campaigns.dobHint")}</p>
          <Link to="/profile" className="shrink-0">
            <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-12">
              {t("campaigns.setDob")}
            </Button>
          </Link>
        </div>
      ) : null}

      {primaryPendingClaim && activeTab !== "catalog" ? (
        <ActiveCampaignClaimBanner
          claim={primaryPendingClaim}
          isPolling={isPollingClaim}
        />
      ) : null}

      {displayError ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {displayError}
        </p>
      ) : null}

      {claimSuccess && lastClaim && activeTab !== "catalog" ? (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {claimSuccess}
          <span className="mt-1 block text-xs opacity-80">
            {t("campaigns.claimReadyRef", { id: lastClaim.redemptionId })}
          </span>
        </p>
      ) : null}

      {rewardSuccess && lastRedemption && activeTab === "catalog" ? (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {rewardSuccess}
        </p>
      ) : null}

      {activeTab === "discover" ? (
        <section className="space-y-4 md:space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
                {t("campaigns.discoverTitle")}
              </h2>
              <p className="mt-1 text-sm text-ink-muted md:text-base">
                {t("campaigns.discoverFlowHint")}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11 shrink-0 md:min-h-12"
              isLoading={isLoadingDiscover}
              onClick={() => {
                clearError();
                void loadDiscoverSales().catch(() => {
                  /* error stored */
                });
              }}
            >
              {t("common.refresh")}
            </Button>
          </div>

          {selectedCampaign ? (
            <CampaignEligibilityPanel
              campaignName={selectedCampaign.name}
              purchaseAmount={purchaseAmountInput}
              onPurchaseAmountChange={handlePurchaseAmountChange}
              branches={branches}
              selectedBranchId={selectedBranchId}
              onBranchChange={handleBranchChange}
              isLoadingBranches={isLoadingBranches}
              isChecking={isCheckingEligibility}
              isClaiming={isRedeeming && claimingCampaignId === selectedCampaign.id}
              isClaimed={selectedCampaignIsClaimed}
              preview={
                eligibilityPreview?.campaignId === selectedCampaign.id
                  ? eligibilityPreview
                  : null
              }
              onCheck={handleCheckEligibility}
              onReset={clearEligibilityPreview}
              onClaim={() => {
                void handleClaim(selectedCampaign);
              }}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-surface-muted px-4 py-5 text-sm text-ink-muted md:px-5">
              {t("campaigns.selectPromoHint")}
            </div>
          )}

          {isLoadingDiscover && sortedSales.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DiscoverSaleCardSkeleton />
              <DiscoverSaleCardSkeleton />
              <DiscoverSaleCardSkeleton />
            </div>
          ) : null}

          {!isLoadingDiscover && sortedSales.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-surface-muted px-6 py-12 text-center md:py-16">
              <p className="text-base font-semibold text-ink md:text-lg">
                {t("campaigns.discoverEmptyTitle")}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted md:text-base">
                {t("campaigns.discoverEmpty")}
              </p>
            </div>
          ) : null}

          {sortedSales.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedSales.map((campaign) => (
                <DiscoverSaleCard
                  key={campaign.id}
                  campaign={campaign}
                  isClaimed={pendingCampaignIds.has(campaign.id)}
                  isSelected={selectedCampaign?.id === campaign.id}
                  isEligible={eligibilityByCampaignId[campaign.id] ?? null}
                  onSelect={handleSelectCampaign}
                />
              ))}
            </div>
          ) : null}

          <p className="text-xs text-ink-muted md:text-sm">
            {t("campaigns.claimNote")}
          </p>
        </section>
      ) : activeTab === "promos" ? (
        <section className="space-y-4 md:space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
                {t("campaigns.promosTitle")}
              </h2>
              <p className="mt-1 text-sm text-ink-muted md:text-base">
                {t("campaigns.promosSubtitle")}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11 shrink-0 md:min-h-12"
              isLoading={isLoadingClaims}
              onClick={() => {
                clearError();
                void loadClaims().catch(() => {
                  /* error stored */
                });
              }}
            >
              {t("common.refresh")}
            </Button>
          </div>

          {isLoadingClaims && sortedClaims.length === 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <CampaignClaimCardSkeleton />
              <CampaignClaimCardSkeleton />
            </div>
          ) : null}

          {!isLoadingClaims && sortedClaims.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-surface-muted px-6 py-12 text-center md:py-16">
              <p className="text-base font-semibold text-ink md:text-lg">
                {t("campaigns.promosEmptyTitle")}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted md:text-base">
                {t("campaigns.promosEmpty")}
              </p>
              <Button
                type="button"
                className="mt-5 min-h-11 md:min-h-12"
                onClick={() => setActiveTab("discover")}
              >
                {t("campaigns.promosBrowseCta")}
              </Button>
            </div>
          ) : null}

          {sortedClaims.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {sortedClaims.map((claim) => (
                <CampaignClaimCard
                  key={claim.redemptionId}
                  claim={claim}
                  isPolling={claim.isPending && isPollingClaim}
                  onRefresh={
                    claim.isPending
                      ? () => {
                          void refreshClaim(claim.redemptionId).catch(() => {
                            /* error stored */
                          });
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="space-y-6 md:space-y-8">
          <div className="rounded-3xl bg-brand p-5 text-white shadow-sm sm:p-6 md:p-8">
            <p className="text-sm font-medium text-white/80 md:text-base">
              {t("rewardsCatalog.balanceLabel")}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
              {balance === null
                ? t("home.pointsPlaceholder")
                : formatPoints(balance, i18n.language)}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {t("rewardsCatalog.balanceHint")}
            </p>
          </div>

          <div className="space-y-4 md:space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
                  {t("rewardsCatalog.title")}
                </h2>
                <p className="mt-1 text-sm text-ink-muted md:text-base">
                  {t("rewardsCatalog.subtitle")}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-11 shrink-0 md:min-h-12"
                isLoading={isLoadingRewards}
                onClick={() => {
                  clearRewardsError();
                  void loadRewards().catch(() => {
                    /* error stored */
                  });
                }}
              >
                {t("common.refresh")}
              </Button>
            </div>

            {isLoadingRewards && rewards.length === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <RewardCatalogCardSkeleton />
                <RewardCatalogCardSkeleton />
                <RewardCatalogCardSkeleton />
              </div>
            ) : null}

            {!isLoadingRewards && rewards.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line bg-surface-muted px-6 py-12 text-center md:py-16">
                <p className="text-base font-semibold text-ink md:text-lg">
                  {t("rewardsCatalog.emptyTitle")}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted md:text-base">
                  {t("rewardsCatalog.empty")}
                </p>
              </div>
            ) : null}

            {rewards.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rewards.map((reward) => (
                  <RewardCatalogCard
                    key={reward.id}
                    reward={reward}
                    pointsBalance={balance}
                    isRedeeming={isRedeemingReward && redeemingRewardId === reward.id}
                    onRedeem={handleRedeemReward}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 md:space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
                  {t("rewardsCatalog.myRedemptionsTitle")}
                </h2>
                <p className="mt-1 text-sm text-ink-muted md:text-base">
                  {t("rewardsCatalog.myRedemptionsSubtitle")}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-11 shrink-0 md:min-h-12"
                isLoading={isLoadingRedemptions}
                onClick={() => {
                  clearRewardsError();
                  void loadRedemptions().catch(() => {
                    /* error stored */
                  });
                }}
              >
                {t("common.refresh")}
              </Button>
            </div>

            {isLoadingRedemptions && sortedRedemptions.length === 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <RewardRedemptionCardSkeleton />
                <RewardRedemptionCardSkeleton />
              </div>
            ) : null}

            {!isLoadingRedemptions && sortedRedemptions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line bg-surface-muted px-6 py-10 text-center">
                <p className="text-sm text-ink-muted md:text-base">
                  {t("rewardsCatalog.noRedemptions")}
                </p>
              </div>
            ) : null}

            {sortedRedemptions.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {sortedRedemptions.map((redemption) => (
                  <RewardRedemptionCard
                    key={redemption.redemptionId}
                    redemption={redemption}
                    isPolling={redemption.isPending && isPollingRedemption}
                    onRefresh={
                      redemption.isPending
                        ? () => {
                            void refreshRedemption(redemption.redemptionId).catch(
                              () => {
                                /* error stored */
                              }
                            );
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}
    </section>
  );
}
