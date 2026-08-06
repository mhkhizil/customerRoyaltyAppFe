import type { Campaign } from "../entities/Campaign";
import type { CampaignRedemption } from "../entities/CampaignRedemption";
import type { DiscountPreview } from "../entities/DiscountPreview";
import type {
  DiscountPreviewRequestDTO,
  RedeemCampaignRequestDTO,
} from "../../application/dtos/CampaignDTO";

export interface ICampaignService {
  getDiscoverSales(): Promise<Campaign[]>;
  previewDiscount(
    payload: DiscountPreviewRequestDTO
  ): Promise<DiscountPreview>;
  redeemCampaign(
    payload: RedeemCampaignRequestDTO
  ): Promise<CampaignRedemption>;
}
