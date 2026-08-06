/**
 * Best applicable campaign discount preview for a purchase amount.
 * Matches POST /api/v1/client/campaigns/discount-preview data.
 */
export class DiscountPreview {
  campaignId!: string | null;
  campaignName!: string | null;
  discountAmount!: number;
  payableAmount!: number;

  constructor(data: Partial<DiscountPreview>) {
    Object.assign(this, data);
  }

  get hasDiscount(): boolean {
    return this.discountAmount > 0 && Boolean(this.campaignId);
  }
}
