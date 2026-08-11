import type { ApiEnvelopeDTO } from "./AuthDTO";

/**
 * Client campaign DTOs — shapes match /api/v1/client/campaigns/* contracts.
 */

export type CampaignDiscountTypeDTO = "PERCENTAGE" | "FIXED_AMOUNT" | string;

export type CampaignClaimStatusDTO =
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | string;

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

export type CampaignClaimDTO = {
  redemptionId: string;
  campaignId: string;
  campaignName: string;
  campaignType: string;
  status: CampaignClaimStatusDTO;
  discountAmount: number;
  purchaseId: string | null;
  expiresAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignBranchDTO = {
  id: string;
  code: string;
  name: string;
  address?: Record<string, unknown> | null;
  isActive: boolean;
};

export type EligibilityPreviewRequestDTO = {
  campaignId: string;
  purchaseAmount: number;
  locationId?: string;
};

export type EligibilityChecksDTO = {
  campaignActive: boolean;
  minimumPurchaseMet: boolean;
  birthdayEligible: boolean | null;
  tierEligible: boolean | null;
  branchEligible: boolean | null;
  perUserLimitAvailable: boolean;
  totalLimitAvailable: boolean;
};

export type EligibilityPreviewResponseDTO = {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  eligible: boolean;
  discountAmount: number;
  payableAmount: number;
  reasons: string[];
  checks: EligibilityChecksDTO;
  userTierName: string | null;
  minimumTierName: string | null;
  allowedLocationIds: string[];
};

export type DiscoverSalesEnvelopeDTO = ApiEnvelopeDTO<
  DiscoverSaleCampaignDTO | DiscoverSaleCampaignDTO[]
>;

export type DiscountPreviewEnvelopeDTO =
  ApiEnvelopeDTO<DiscountPreviewResponseDTO>;

export type RedeemCampaignEnvelopeDTO = ApiEnvelopeDTO<CampaignClaimDTO>;

export type CampaignClaimsEnvelopeDTO = ApiEnvelopeDTO<
  CampaignClaimDTO | CampaignClaimDTO[]
>;

export type CampaignClaimEnvelopeDTO = ApiEnvelopeDTO<CampaignClaimDTO>;

export type CampaignBranchesEnvelopeDTO = ApiEnvelopeDTO<
  CampaignBranchDTO | CampaignBranchDTO[]
>;

export type EligibilityPreviewEnvelopeDTO =
  ApiEnvelopeDTO<EligibilityPreviewResponseDTO>;

/** @deprecated Use CampaignClaimDTO — redeem now returns full claim. */
export type RedeemCampaignResponseDTO = Pick<
  CampaignClaimDTO,
  "redemptionId" | "discountAmount"
>;
