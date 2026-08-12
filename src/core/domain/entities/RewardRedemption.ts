export type RewardRedemptionStatus =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | string;

/**
 * Point reward redemption from GET/POST /api/v1/client/rewards/redemptions*.
 */
export class RewardRedemption {
  redemptionId!: string;
  redemptionCode!: string;
  rewardId!: string;
  rewardName!: string;
  rewardType!: string;
  status!: RewardRedemptionStatus;
  pointsSpent!: number;
  purchaseId!: string | null;
  redeemedAt!: string | null;
  fulfilledAt!: string | null;
  expiresAt!: string | null;
  createdAt!: string;
  updatedAt!: string;

  constructor(data: Partial<RewardRedemption>) {
    Object.assign(this, data);
  }

  get isPending(): boolean {
    return this.status === "PENDING";
  }

  get isCompleted(): boolean {
    return this.status === "COMPLETED";
  }

  get needsStaffFulfillment(): boolean {
    const type = String(this.rewardType).toUpperCase();
    return type === "FREE_PRODUCT" || type === "DISCOUNT";
  }
}
