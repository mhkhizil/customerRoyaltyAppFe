export class CampaignEligibilityChecks {
  campaignActive!: boolean;
  minimumPurchaseMet!: boolean;
  birthdayEligible!: boolean | null;
  tierEligible!: boolean | null;
  branchEligible!: boolean | null;
  perUserLimitAvailable!: boolean;
  totalLimitAvailable!: boolean;

  constructor(data: Partial<CampaignEligibilityChecks>) {
    Object.assign(this, data);
  }
}

/**
 * Advisory eligibility preview before claiming a campaign.
 */
export class CampaignEligibilityPreview {
  campaignId!: string;
  campaignName!: string;
  campaignType!: string;
  eligible!: boolean;
  discountAmount!: number;
  payableAmount!: number;
  reasons!: string[];
  checks!: CampaignEligibilityChecks;
  userTierName!: string | null;
  minimumTierName!: string | null;
  allowedLocationIds!: string[];

  constructor(data: Partial<CampaignEligibilityPreview>) {
    Object.assign(this, data);
  }
}
