/**
 * Format loyalty money amounts (MMK) for customer UI.
 */
export function formatMmk(amount: number, locale = "en"): string {
  if (!Number.isFinite(amount)) return "—";
  return `${new Intl.NumberFormat(locale).format(amount)} MMK`;
}

export function formatCampaignDiscount(
  discountType: string,
  discountValue: number,
  locale = "en"
): string {
  if (String(discountType).toUpperCase() === "PERCENTAGE") {
    return `${discountValue}% off`;
  }
  return `${formatMmk(discountValue, locale)} off`;
}
