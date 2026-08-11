import type { Campaign } from "../entities/Campaign";
import type { CampaignBranch } from "../entities/CampaignBranch";
import type { CampaignClaim } from "../entities/CampaignClaim";
import type { CampaignEligibilityPreview } from "../entities/CampaignEligibilityPreview";
import type { DiscountPreview } from "../entities/DiscountPreview";
import type {
  DiscountPreviewRequestDTO,
  EligibilityPreviewRequestDTO,
  RedeemCampaignRequestDTO,
} from "../../application/dtos/CampaignDTO";

export interface ICampaignService {
  getDiscoverSales(): Promise<Campaign[]>;
  previewDiscount(
    payload: DiscountPreviewRequestDTO
  ): Promise<DiscountPreview>;
  redeemCampaign(payload: RedeemCampaignRequestDTO): Promise<CampaignClaim>;
  getClaims(): Promise<CampaignClaim[]>;
  getClaimById(redemptionId: string): Promise<CampaignClaim>;
  previewEligibility(
    payload: EligibilityPreviewRequestDTO
  ): Promise<CampaignEligibilityPreview>;
  getBranches(): Promise<CampaignBranch[]>;
}
