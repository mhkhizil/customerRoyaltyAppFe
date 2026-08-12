import type { RedeemRewardRequestDTO } from "../dtos/RewardsDTO";
import type { Reward } from "../../domain/entities/Reward";
import type { RewardRedemption } from "../../domain/entities/RewardRedemption";
import type { IRewardsRepository } from "../../domain/repositories/IRewardsRepository";
import type { IRewardsService } from "../../domain/services/IRewardsService";

function rethrowRewardsError(error: unknown, fallback: string): never {
  if (error instanceof Error && error.message) {
    throw error;
  }
  throw new Error(fallback);
}

export class RewardsService implements IRewardsService {
  constructor(private readonly rewardsRepository: IRewardsRepository) {}

  async getRewards(): Promise<Reward[]> {
    try {
      return await this.rewardsRepository.getRewards();
    } catch (error: unknown) {
      rethrowRewardsError(error, "Unable to load rewards.");
    }
  }

  async getRedemptions(): Promise<RewardRedemption[]> {
    try {
      return await this.rewardsRepository.getRedemptions();
    } catch (error: unknown) {
      rethrowRewardsError(error, "Unable to load reward redemptions.");
    }
  }

  async getRedemptionById(redemptionId: string): Promise<RewardRedemption> {
    if (!redemptionId?.trim()) {
      throw new Error("Redemption reference is required");
    }

    try {
      return await this.rewardsRepository.getRedemptionById(redemptionId.trim());
    } catch (error: unknown) {
      rethrowRewardsError(error, "Unable to load reward redemption.");
    }
  }

  async redeemReward(payload: RedeemRewardRequestDTO): Promise<RewardRedemption> {
    if (!payload.rewardId?.trim()) {
      throw new Error("Reward is required");
    }
    if (!payload.idempotencyKey?.trim()) {
      throw new Error("Idempotency key is required");
    }

    try {
      return await this.rewardsRepository.redeemReward({
        rewardId: payload.rewardId.trim(),
        idempotencyKey: payload.idempotencyKey.trim(),
      });
    } catch (error: unknown) {
      rethrowRewardsError(error, "Unable to redeem reward.");
    }
  }
}
