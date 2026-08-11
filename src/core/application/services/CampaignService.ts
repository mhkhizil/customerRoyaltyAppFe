import type {
  DiscountPreviewRequestDTO,
  EligibilityPreviewRequestDTO,
  RedeemCampaignRequestDTO,
} from "../dtos/CampaignDTO";
import type { Campaign } from "../../domain/entities/Campaign";
import type { CampaignBranch } from "../../domain/entities/CampaignBranch";
import type { CampaignClaim } from "../../domain/entities/CampaignClaim";
import type { CampaignEligibilityPreview } from "../../domain/entities/CampaignEligibilityPreview";
import type { DiscountPreview } from "../../domain/entities/DiscountPreview";
import type { ICampaignRepository } from "../../domain/repositories/ICampaignRepository";
import type { ICampaignService } from "../../domain/services/ICampaignService";

function rethrowCampaignError(error: unknown, fallback: string): never {
  if (error instanceof Error && error.message) {
    throw error;
  }
  throw new Error(fallback);
}

function assertNonNegativeAmount(
  purchaseAmount: number,
  label = "Purchase amount"
): void {
  if (
    typeof purchaseAmount !== "number" ||
    !Number.isFinite(purchaseAmount) ||
    purchaseAmount < 0
  ) {
    throw new Error(`${label} must be a non-negative number`);
  }
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
    assertNonNegativeAmount(payload.purchaseAmount);

    try {
      return await this.campaignRepository.previewDiscount({
        purchaseAmount: payload.purchaseAmount,
      });
    } catch (error: unknown) {
      rethrowCampaignError(error, "Unable to preview discount.");
    }
  }

  async redeemCampaign(payload: RedeemCampaignRequestDTO): Promise<CampaignClaim> {
    if (!payload.campaignId?.trim()) {
      throw new Error("Campaign is required");
    }
    if (!payload.idempotencyKey?.trim()) {
      throw new Error("Idempotency key is required");
    }
    assertNonNegativeAmount(payload.purchaseAmount);

    try {
      return await this.campaignRepository.redeemCampaign({
        campaignId: payload.campaignId.trim(),
        idempotencyKey: payload.idempotencyKey.trim(),
        purchaseAmount: payload.purchaseAmount,
      });
    } catch (error: unknown) {
      rethrowCampaignError(error, "Unable to claim campaign.");
    }
  }

  async getClaims(): Promise<CampaignClaim[]> {
    try {
      return await this.campaignRepository.getClaims();
    } catch (error: unknown) {
      rethrowCampaignError(error, "Unable to load campaign claims.");
    }
  }

  async getClaimById(redemptionId: string): Promise<CampaignClaim> {
    if (!redemptionId?.trim()) {
      throw new Error("Claim reference is required");
    }

    try {
      return await this.campaignRepository.getClaimById(redemptionId.trim());
    } catch (error: unknown) {
      rethrowCampaignError(error, "Unable to load campaign claim.");
    }
  }

  async previewEligibility(
    payload: EligibilityPreviewRequestDTO
  ): Promise<CampaignEligibilityPreview> {
    if (!payload.campaignId?.trim()) {
      throw new Error("Campaign is required");
    }
    assertNonNegativeAmount(payload.purchaseAmount);

    try {
      return await this.campaignRepository.previewEligibility({
        campaignId: payload.campaignId.trim(),
        purchaseAmount: payload.purchaseAmount,
        locationId: payload.locationId?.trim() || undefined,
      });
    } catch (error: unknown) {
      rethrowCampaignError(error, "Unable to preview eligibility.");
    }
  }

  async getBranches(): Promise<CampaignBranch[]> {
    try {
      return await this.campaignRepository.getBranches();
    } catch (error: unknown) {
      rethrowCampaignError(error, "Unable to load branches.");
    }
  }
}
