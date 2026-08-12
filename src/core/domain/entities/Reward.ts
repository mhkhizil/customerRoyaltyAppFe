export type RewardType = "BONUS_POINTS" | "FREE_PRODUCT" | "DISCOUNT" | string;

export type RewardStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | string;

/**
 * Unlocked loyalty reward from GET /api/v1/client/rewards.
 */
export class Reward {
  id!: string;
  name!: string;
  slug!: string;
  type!: RewardType;
  status!: RewardStatus;
  pointsCost!: number;
  bonusPoints!: number | null;
  discountValue!: number | null;
  freeProductId!: string | null;
  minimumTierId!: string | null;
  unlockMetric!: string | null;
  unlockThreshold!: number | null;
  stockQuantity!: number | null;
  perUserLimit!: number | null;
  startsAt!: string | null;
  endsAt!: string | null;

  constructor(data: Partial<Reward>) {
    Object.assign(this, data);
  }

  get isBonusPoints(): boolean {
    return String(this.type).toUpperCase() === "BONUS_POINTS";
  }

  get isFreeProduct(): boolean {
    return String(this.type).toUpperCase() === "FREE_PRODUCT";
  }

  get isDiscount(): boolean {
    return String(this.type).toUpperCase() === "DISCOUNT";
  }
}
