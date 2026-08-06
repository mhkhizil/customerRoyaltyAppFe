/**
 * Result of manually redeeming a campaign discount.
 * Matches POST /api/v1/client/campaigns/redeem data.
 */
export class CampaignRedemption {
  redemptionId!: string;
  discountAmount!: number;

  constructor(data: Partial<CampaignRedemption>) {
    Object.assign(this, data);
  }
}
