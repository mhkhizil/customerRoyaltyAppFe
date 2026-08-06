import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";
import { useClientCampaigns } from "@/core/presentation/hooks/useClientCampaigns";
import { formatCampaignDiscount, formatMmk } from "@/lib/formatCurrency";
import type { Campaign } from "@/core/domain/entities/Campaign";

function formatCampaignDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RewardsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const {
    discoverSales,
    preview,
    lastRedemption,
    isLoadingDiscover,
    isPreviewing,
    isRedeeming,
    error,
    loadDiscoverSales,
    previewDiscount,
    redeemCampaign,
    clearError,
  } = useClientCampaigns();

  const [purchaseAmountInput, setPurchaseAmountInput] = useState("50000");
  const [redeemingCampaignId, setRedeemingCampaignId] = useState<string | null>(
    null
  );
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const hasDob = Boolean(user?.dateOfBirth);

  const parseAmount = (): number | null => {
    const amount = Number(purchaseAmountInput.replace(/,/g, "").trim());
    if (!Number.isFinite(amount) || amount < 0) return null;
    return amount;
  };

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRedeemSuccess(null);
    clearError();

    const amount = parseAmount();
    if (amount === null) return;

    try {
      await previewDiscount(amount);
    } catch {
      /* error stored in hook */
    }
  };

  const handleRedeem = async (campaign: Campaign) => {
    setRedeemSuccess(null);
    clearError();

    const amount = parseAmount();
    if (amount === null) return;

    setRedeemingCampaignId(campaign.id);
    try {
      const result = await redeemCampaign({
        campaignId: campaign.id,
        purchaseAmount: amount,
      });
      setRedeemSuccess(
        t("campaigns.redeemSuccess", {
          amount: formatMmk(result.discountAmount, i18n.language),
        })
      );
    } catch {
      /* error stored in hook */
    } finally {
      setRedeemingCampaignId(null);
    }
  };

  return (
    <section className="w-full space-y-5 pb-4 md:space-y-6 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {t("rewards.title")}
        </h1>
        <p className="mt-1 text-sm text-ink-muted md:text-base">
          {t("rewards.subtitle")}
        </p>
      </header>

      {!hasDob ? (
        <p className="rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm text-ink-muted md:text-base">
          {t("campaigns.dobHint")}{" "}
          <Link className="font-semibold text-brand" to="/profile">
            {t("campaigns.setDob")}
          </Link>
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {redeemSuccess ? (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {redeemSuccess}
          {lastRedemption ? (
            <span className="mt-1 block text-xs opacity-80">
              {t("campaigns.redemptionId", { id: lastRedemption.redemptionId })}
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
        {/* Discount preview — birthday / occasion / discover best match */}
        <article className="rounded-2xl border border-line bg-surface p-4 sm:p-5 md:p-6">
          <h2 className="text-lg font-semibold text-ink md:text-xl">
            {t("campaigns.previewTitle")}
          </h2>
          <p className="mt-1 text-sm text-ink-muted md:text-base">
            {t("campaigns.previewSubtitle")}
          </p>

          <form className="mt-4 space-y-3" onSubmit={handlePreview}>
            <label className="block text-sm font-medium text-ink">
              {t("campaigns.purchaseAmount")}
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="mt-1.5 min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 md:min-h-12"
                value={purchaseAmountInput}
                onChange={(event) => setPurchaseAmountInput(event.target.value)}
                required
              />
            </label>
            <Button
              type="submit"
              className="min-h-11 w-full md:min-h-12"
              isLoading={isPreviewing}
            >
              {t("campaigns.previewCta")}
            </Button>
          </form>

          {preview ? (
            <div className="mt-4 rounded-xl border border-line bg-surface-muted p-4">
              {preview.hasDiscount ? (
                <>
                  <p className="text-sm font-semibold text-ink md:text-base">
                    {preview.campaignName}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-brand md:text-3xl">
                    {t("campaigns.youSave", {
                      amount: formatMmk(preview.discountAmount, i18n.language),
                    })}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {t("campaigns.payable", {
                      amount: formatMmk(preview.payableAmount, i18n.language),
                    })}
                  </p>
                </>
              ) : (
                <p className="text-sm text-ink-muted">
                  {t("campaigns.noPreviewDiscount")}
                </p>
              )}
              <p className="mt-3 text-xs text-ink-muted">
                {t("campaigns.previewNote")}
              </p>
            </div>
          ) : null}
        </article>

        {/* Discover sales browse list */}
        <article className="rounded-2xl border border-line bg-surface p-4 sm:p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ink md:text-xl">
                {t("campaigns.discoverTitle")}
              </h2>
              <p className="mt-1 text-sm text-ink-muted md:text-base">
                {t("campaigns.discoverSubtitle")}
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

          {isLoadingDiscover && discoverSales.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">{t("common.loading")}</p>
          ) : null}

          {!isLoadingDiscover && discoverSales.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line bg-surface-muted px-4 py-6 text-center text-sm text-ink-muted">
              {t("campaigns.discoverEmpty")}
            </p>
          ) : null}

          {discoverSales.length > 0 ? (
            <ul className="mt-4 divide-y divide-line">
              {discoverSales.map((campaign) => (
                <li key={campaign.id} className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{campaign.name}</p>
                      <p className="mt-1 text-sm font-medium text-brand">
                        {formatCampaignDiscount(
                          campaign.discountType,
                          campaign.discountValue,
                          i18n.language
                        )}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {t("campaigns.minPurchase", {
                          amount: formatMmk(
                            campaign.minimumPurchase,
                            i18n.language
                          ),
                        })}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {t("campaigns.validUntil", {
                          date: formatCampaignDate(
                            campaign.endsAt,
                            i18n.language
                          ),
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11 shrink-0 md:min-h-12"
                      isLoading={
                        isRedeeming && redeemingCampaignId === campaign.id
                      }
                      onClick={() => {
                        void handleRedeem(campaign);
                      }}
                    >
                      {t("campaigns.redeemCta")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-4 text-xs text-ink-muted">
            {t("campaigns.redeemNote")}
          </p>
        </article>
      </div>
    </section>
  );
}
