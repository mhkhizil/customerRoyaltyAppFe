import type { ApiEnvelopeDTO } from "./AuthDTO";

export type RewardTypeDTO =
  | "BONUS_POINTS"
  | "FREE_PRODUCT"
  | "DISCOUNT"
  | string;

export type RewardStatusDTO = "DRAFT" | "ACTIVE" | "INACTIVE" | string;

export type RewardRedemptionStatusDTO =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | string;

export type RewardDTO = {
  id: string;
  name: string;
  slug: string;
  type: RewardTypeDTO;
  status: RewardStatusDTO;
  pointsCost: number;
  bonusPoints?: number | null;
  discountValue?: number | null;
  freeProductId?: string | null;
  minimumTierId?: string | null;
  unlockMetric?: string | null;
  unlockThreshold?: number | null;
  stockQuantity?: number | null;
  perUserLimit?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type RewardRedemptionDTO = {
  redemptionId: string;
  redemptionCode: string;
  rewardId: string;
  rewardName: string;
  rewardType: string;
  status: RewardRedemptionStatusDTO;
  pointsSpent: number;
  purchaseId?: string | null;
  redeemedAt?: string | null;
  fulfilledAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RedeemRewardRequestDTO = {
  rewardId: string;
  idempotencyKey: string;
};

export type RewardsEnvelopeDTO = ApiEnvelopeDTO<RewardDTO | RewardDTO[]>;

export type RewardRedemptionsEnvelopeDTO = ApiEnvelopeDTO<
  RewardRedemptionDTO | RewardRedemptionDTO[]
>;

export type RewardRedemptionEnvelopeDTO =
  ApiEnvelopeDTO<RewardRedemptionDTO>;

export type RedeemRewardEnvelopeDTO = ApiEnvelopeDTO<RewardRedemptionDTO>;
