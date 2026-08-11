import { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { CampaignBranch } from "@/core/domain/entities/CampaignBranch";
import type { CampaignEligibilityPreview } from "@/core/domain/entities/CampaignEligibilityPreview";
import { formatMmk } from "@/lib/formatCurrency";

type CampaignEligibilityPanelProps = {
  campaignName: string;
  purchaseAmount: string;
  onPurchaseAmountChange: (value: string) => void;
  branches: CampaignBranch[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  isLoadingBranches: boolean;
  isChecking: boolean;
  isClaiming: boolean;
  isClaimed: boolean;
  preview: CampaignEligibilityPreview | null;
  onCheck: () => void;
  onReset: () => void;
  onClaim: () => void;
};

function CheckRow({
  label,
  value,
}: {
  label: string;
  value: boolean | null;
}) {
  const { t } = useTranslation();

  let text = t("campaigns.eligibilityUnknown");
  let tone = "border-line bg-surface-muted text-ink-muted";

  if (value === true) {
    text = t("campaigns.eligibilityPass");
    tone = "border-success/30 bg-success/10 text-success";
  } else if (value === false) {
    text = t("campaigns.eligibilityFail");
    tone = "border-danger/30 bg-danger/10 text-danger";
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span
        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`}
      >
        {text}
      </span>
    </div>
  );
}

export function CampaignEligibilityPanel({
  campaignName,
  purchaseAmount,
  onPurchaseAmountChange,
  branches,
  selectedBranchId,
  onBranchChange,
  isLoadingBranches,
  isChecking,
  isClaiming,
  isClaimed,
  preview,
  onCheck,
  onReset,
  onClaim,
}: CampaignEligibilityPanelProps) {
  const { t, i18n } = useTranslation();
  const hasChecked = Boolean(preview);
  const canClaim = Boolean(preview?.eligible) && !isClaimed;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCheck();
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-brand/25 bg-surface shadow-sm">
      <div className="border-b border-line bg-brand-soft px-4 py-4 md:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          {t("campaigns.claimStepTitle")}
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink md:text-xl">
          {campaignName}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          {hasChecked
            ? t("campaigns.eligibilityResultHint")
            : t("campaigns.eligibilityFormHint")}
        </p>
      </div>

      {!hasChecked ? (
        <form className="space-y-4 p-4 md:p-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-ink">
            {t("campaigns.purchaseAmount")}
            <div className="relative mt-1.5">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 py-2.5 pr-14 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 md:min-h-12"
                value={purchaseAmount}
                onChange={(event) => onPurchaseAmountChange(event.target.value)}
                required
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-ink-muted">
                MMK
              </span>
            </div>
          </label>

          <label className="block text-sm font-medium text-ink">
            {t("campaigns.branchLabel")}
            <select
              className="mt-1.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 md:min-h-12"
              value={selectedBranchId}
              disabled={isLoadingBranches}
              onChange={(event) => onBranchChange(event.target.value)}
            >
              <option value="">{t("campaigns.branchAny")}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                  {branch.code ? ` (${branch.code})` : ""}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="submit"
            className="min-h-11 w-full md:min-h-12"
            isLoading={isChecking}
          >
            {t("campaigns.eligibilityCta")}
          </Button>
        </form>
      ) : (
        <div className="space-y-4 p-4 md:p-5">
          <div
            className={[
              "rounded-2xl border px-4 py-4",
              preview?.eligible
                ? "border-success/30 bg-success/10"
                : "border-danger/30 bg-danger/10",
            ].join(" ")}
          >
            <p className="text-sm font-semibold md:text-base">
              {preview?.eligible
                ? t("campaigns.eligibilityEligible")
                : t("campaigns.eligibilityIneligible")}
            </p>

            {preview?.eligible ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    {t("campaigns.estimatedSavings")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-brand">
                    {formatMmk(preview.discountAmount, i18n.language)}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                    {t("campaigns.estimatedPayable")}
                  </p>
                  <p className="mt-1 text-xl font-bold text-ink">
                    {formatMmk(preview.payableAmount, i18n.language)}
                  </p>
                </div>
              </div>
            ) : null}

            {preview && preview.reasons.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                {preview.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {preview ? (
            <details className="rounded-2xl border border-line bg-surface-muted px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-ink">
                {t("campaigns.eligibilityChecksTitle")}
              </summary>
              <div className="mt-3 space-y-2">
                <CheckRow
                  label={t("campaigns.checkCampaignActive")}
                  value={preview.checks.campaignActive}
                />
                <CheckRow
                  label={t("campaigns.checkMinimumPurchase")}
                  value={preview.checks.minimumPurchaseMet}
                />
                <CheckRow
                  label={t("campaigns.checkBirthday")}
                  value={preview.checks.birthdayEligible}
                />
                <CheckRow
                  label={t("campaigns.checkTier")}
                  value={preview.checks.tierEligible}
                />
                <CheckRow
                  label={t("campaigns.checkBranch")}
                  value={preview.checks.branchEligible}
                />
                <CheckRow
                  label={t("campaigns.checkPerUserLimit")}
                  value={preview.checks.perUserLimitAvailable}
                />
                <CheckRow
                  label={t("campaigns.checkTotalLimit")}
                  value={preview.checks.totalLimitAvailable}
                />
                {preview.userTierName ? (
                  <p className="pt-1 text-xs text-ink-muted">
                    {t("campaigns.userTier", { tier: preview.userTierName })}
                  </p>
                ) : null}
              </div>
            </details>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 flex-1 md:min-h-12"
              onClick={onReset}
            >
              {t("campaigns.changeAmountCta")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 flex-1 md:min-h-12"
              isLoading={isChecking}
              onClick={onCheck}
            >
              {t("campaigns.eligibilityRecheckCta")}
            </Button>
            <Button
              type="button"
              className="min-h-11 flex-1 md:min-h-12"
              isLoading={isClaiming}
              disabled={!canClaim}
              onClick={onClaim}
            >
              {isClaimed
                ? t("campaigns.claimAlreadyActive")
                : preview?.eligible
                  ? t("campaigns.claimCta")
                  : t("campaigns.claimNotEligible")}
            </Button>
          </div>

          <p className="text-xs text-ink-muted">{t("campaigns.claimPanelHint")}</p>
        </div>
      )}
    </div>
  );
}
