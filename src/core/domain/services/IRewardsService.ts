import type { Reward } from "../entities/Reward";
import type { RewardRedemption } from "../entities/RewardRedemption";
import type { RedeemRewardRequestDTO } from "../../application/dtos/RewardsDTO";

export interface IRewardsService {
  getRewards(): Promise<Reward[]>;
  getRedemptions(): Promise<RewardRedemption[]>;
  getRedemptionById(redemptionId: string): Promise<RewardRedemption>;
  redeemReward(payload: RedeemRewardRequestDTO): Promise<RewardRedemption>;
}
