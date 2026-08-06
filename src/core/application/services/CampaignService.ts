import type {
  DiscountPreviewRequestDTO,
  RedeemCampaignRequestDTO,
} from "../dtos/CampaignDTO";
import type { Campaign } from "../../domain/entities/Campaign";
import type { CampaignRedemption } from "../../domain/entities/CampaignRedemption";
import type { DiscountPreview } from "../../domain/entities/DiscountPreview";
import type { ICampaignRepository } from "../../domain/repositories/ICampaignRepository";
import type { ICampaignService } from "../../domain/services/ICampaignService";

function rethrowCampaignError(error: unknown, fallback: string): never {
  if (error instanceof Error && error.message) {
    throw error;
  }
  throw new Error(fallback);
}

/**
 * Application service for authenticated client campaign use cases.
 */
export class CampaignService implements ICampaignService {
  constructor(private readonly campaignRepository: ICampaignRepository) {}

  async getDiscoverSales(): Promise<Campaign[]> {
    try {
      return await this.campaignRepository.getDiscoverSales();
    } catch (error: unknown) {
      rethrowCampaignError(error, "Unable to load discover sales.");
    }
  }

  async previewDiscount(
    payload: DiscountPreviewRequestDTO
  ): Promise<DiscountPreview> {
    if (
      typeof payload.purchaseAmount !== "number" ||
      !Number.isFinite(payload.purchaseAmount) ||
      payload.purchaseAmount < 0
    ) {
      throw new Error("Purchase amount must be a non-negative number");
    }

    try {
      return await this.campaignRepository.previewDiscount({
        purchaseAmount: payload.purchaseAmount,
      });
    } catch (error: unknown) {
      rethrowCampaignError(error, "Unable to preview discount.");
    }
  }

  async redeemCampaign(
    payload: RedeemCampaignRequestDTO
  ): Promise<CampaignRedemption> {
    if (!payload.campaignId?.trim()) {
      throw new Error("Campaign is required");
    }
    if (!payload.idempotencyKey?.trim()) {
      throw new Error("Idempotency key is required");
    }
    if (
      typeof payload.purchaseAmount !== "number" ||
      !Number.isFinite(payload.purchaseAmount) ||
      payload.purchaseAmount < 0
    ) {
      throw new Error("Purchase amount must be a non-negative number");
    }

    try {
      return await this.campaignRepository.redeemCampaign({
        campaignId: payload.campaignId.trim(),
        idempotencyKey: payload.idempotencyKey.trim(),
        purchaseAmount: payload.purchaseAmount,
      });
    } catch (error: unknown) {
      rethrowCampaignError(error, "Unable to redeem campaign.");
    }
  }
}
