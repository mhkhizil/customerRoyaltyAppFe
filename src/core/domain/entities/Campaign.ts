export type CampaignDiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | string;

/**
 * Discover-sale campaign for the promotions browse tab.
 * Matches GET /api/v1/client/campaigns/discover-sales item.
 */
export class Campaign {
  id!: string;
  name!: string;
  discountType!: CampaignDiscountType;
  discountValue!: number;
  minimumPurchase!: number;
  startsAt!: string;
  endsAt!: string;

  constructor(data: Partial<Campaign>) {
    Object.assign(this, data);
  }

  get isPercentage(): boolean {
    return String(this.discountType).toUpperCase() === "PERCENTAGE";
  }

  get isFixedAmount(): boolean {
    return String(this.discountType).toUpperCase() === "FIXED_AMOUNT";
  }
}
