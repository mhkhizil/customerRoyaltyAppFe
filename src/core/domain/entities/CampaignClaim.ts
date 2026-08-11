export type CampaignClaimStatus =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

/**
 * Campaign claim from GET /claims, GET /claims/:id, or POST /redeem.
 */
export class CampaignClaim {
  redemptionId!: string;
  campaignId!: string;
  campaignName!: string;
  campaignType!: string;
  status!: CampaignClaimStatus;
  discountAmount!: number;
  purchaseId!: string | null;
  expiresAt!: string | null;
  redeemedAt!: string | null;
  createdAt!: string;
  updatedAt!: string;

  constructor(data: Partial<CampaignClaim>) {
    Object.assign(this, data);
  }

  get isPending(): boolean {
    return this.status === "PENDING";
  }

  get isCompleted(): boolean {
    return this.status === "COMPLETED";
  }

  get isTerminal(): boolean {
    return (
      this.status === "COMPLETED" ||
      this.status === "CANCELLED" ||
      this.status === "EXPIRED"
    );
  }
}
