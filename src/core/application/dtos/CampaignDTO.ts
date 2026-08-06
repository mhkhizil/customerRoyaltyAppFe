import type { ApiEnvelopeDTO } from "./AuthDTO";

/**
 * Client campaign DTOs — shapes match /api/v1/client/campaigns/* contracts.
 */

export type CampaignDiscountTypeDTO = "PERCENTAGE" | "FIXED_AMOUNT" | string;

export type DiscoverSaleCampaignDTO = {
  id: string;
  name: string;
  discountType: CampaignDiscountTypeDTO;
  discountValue: number;
  minimumPurchase: number;
  startsAt: string;
  endsAt: string;
};

export type DiscountPreviewRequestDTO = {
  purchaseAmount: number;
};

export type DiscountPreviewResponseDTO = {
  campaignId: string | null;
  campaignName: string | null;
  discountAmount: number;
  payableAmount: number;
};

export type RedeemCampaignRequestDTO = {
  campaignId: string;
  idempotencyKey: string;
  purchaseAmount: number;
};

export type RedeemCampaignResponseDTO = {
  redemptionId: string;
  discountAmount: number;
};

export type DiscoverSalesEnvelopeDTO = ApiEnvelopeDTO<
  DiscoverSaleCampaignDTO | DiscoverSaleCampaignDTO[]
>;

export type DiscountPreviewEnvelopeDTO =
  ApiEnvelopeDTO<DiscountPreviewResponseDTO>;

export type RedeemCampaignEnvelopeDTO =
  ApiEnvelopeDTO<RedeemCampaignResponseDTO>;
