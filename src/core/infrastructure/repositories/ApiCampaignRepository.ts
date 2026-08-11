import axios from "axios";
import type {
  CampaignBranchDTO,
  CampaignBranchesEnvelopeDTO,
  CampaignClaimDTO,
  CampaignClaimEnvelopeDTO,
  CampaignClaimsEnvelopeDTO,
  DiscoverSaleCampaignDTO,
  DiscoverSalesEnvelopeDTO,
  DiscountPreviewEnvelopeDTO,
  DiscountPreviewRequestDTO,
  DiscountPreviewResponseDTO,
  EligibilityPreviewEnvelopeDTO,
  EligibilityPreviewRequestDTO,
  EligibilityPreviewResponseDTO,
  RedeemCampaignEnvelopeDTO,
  RedeemCampaignRequestDTO,
} from "../../application/dtos/CampaignDTO";
import { Campaign } from "../../domain/entities/Campaign";
import { CampaignBranch } from "../../domain/entities/CampaignBranch";
import { CampaignClaim } from "../../domain/entities/CampaignClaim";
import type { CampaignClaimStatus } from "../../domain/entities/CampaignClaim";
import {
  CampaignEligibilityChecks,
  CampaignEligibilityPreview,
} from "../../domain/entities/CampaignEligibilityPreview";
import { DiscountPreview } from "../../domain/entities/DiscountPreview";
import type { ICampaignRepository } from "../../domain/repositories/ICampaignRepository";
import { API_ENDPOINTS } from "../api/constants";
import { HttpClient } from "../api/HttpClient";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  return String(value);
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function asNullableBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = asRecord(error.response?.data);
    const message = data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function unwrapData<T>(payload: unknown): T {
  const record = asRecord(payload);
  if (
    record &&
    "data" in record &&
    record.data !== undefined &&
    record.data !== null
  ) {
    return record.data as T;
  }
  if (payload === undefined || payload === null) {
    throw new Error("API response did not include data");
  }
  return payload as T;
}

function normalizeList<T>(
  data: unknown,
  keys: readonly string[] = ["items", "claims", "branches", "campaigns"]
): T[] {
  if (Array.isArray(data)) return data as T[];

  const record = asRecord(data);
  if (!record) return [];

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }

  if (typeof record.id === "string" || typeof record.id === "number") {
    return [data as T];
  }

  return [];
}

function mapCampaignStatus(value: unknown): CampaignClaimStatus {
  const status = asString(value, "PENDING").toUpperCase();
  if (
    status === "PENDING" ||
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "EXPIRED"
  ) {
    return status;
  }
  return "PENDING";
}

function mapCampaign(
  dto: DiscoverSaleCampaignDTO | Record<string, unknown>
): Campaign {
  const record = asRecord(dto) ?? {};
  const id = asString(record.id);
  if (!id) {
    throw new Error("Campaign item is missing id");
  }

  return new Campaign({
    id,
    name: asString(record.name),
    discountType: asString(record.discountType),
    discountValue: asNumber(record.discountValue),
    minimumPurchase: asNumber(record.minimumPurchase),
    startsAt: asString(record.startsAt),
    endsAt: asString(record.endsAt),
  });
}

function mapClaim(
  dto: CampaignClaimDTO | Record<string, unknown>
): CampaignClaim {
  const record = asRecord(dto) ?? {};
  const redemptionId = asString(record.redemptionId);
  if (!redemptionId) {
    throw new Error("Claim response did not include redemptionId");
  }

  return new CampaignClaim({
    redemptionId,
    campaignId: asString(record.campaignId),
    campaignName: asString(record.campaignName),
    campaignType: asString(record.campaignType),
    status: mapCampaignStatus(record.status),
    discountAmount: asNumber(record.discountAmount),
    purchaseId: asNullableString(record.purchaseId),
    expiresAt: asNullableString(record.expiresAt),
    redeemedAt: asNullableString(record.redeemedAt),
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
  });
}

function mapBranch(
  dto: CampaignBranchDTO | Record<string, unknown>
): CampaignBranch {
  const record = asRecord(dto) ?? {};
  const id = asString(record.id);
  if (!id) {
    throw new Error("Branch item is missing id");
  }

  const address = record.address;
  return new CampaignBranch({
    id,
    code: asString(record.code),
    name: asString(record.name),
    address:
      address && typeof address === "object"
        ? (address as Record<string, unknown>)
        : null,
    isActive: asBoolean(record.isActive, true),
  });
}

function mapDiscountPreview(
  dto: DiscountPreviewResponseDTO | Record<string, unknown>
): DiscountPreview {
  const record = asRecord(dto) ?? {};
  return new DiscountPreview({
    campaignId: asNullableString(record.campaignId),
    campaignName: asNullableString(record.campaignName),
    discountAmount: asNumber(record.discountAmount),
    payableAmount: asNumber(record.payableAmount),
  });
}

function mapEligibilityChecks(
  dto: Record<string, unknown> | undefined
): CampaignEligibilityChecks {
  const record = dto ?? {};
  return new CampaignEligibilityChecks({
    campaignActive: asBoolean(record.campaignActive, false),
    minimumPurchaseMet: asBoolean(record.minimumPurchaseMet, false),
    birthdayEligible: asNullableBoolean(record.birthdayEligible),
    tierEligible: asNullableBoolean(record.tierEligible),
    branchEligible: asNullableBoolean(record.branchEligible),
    perUserLimitAvailable: asBoolean(record.perUserLimitAvailable, false),
    totalLimitAvailable: asBoolean(record.totalLimitAvailable, false),
  });
}

function mapEligibilityPreview(
  dto: EligibilityPreviewResponseDTO | Record<string, unknown>
): CampaignEligibilityPreview {
  const record = asRecord(dto) ?? {};
  const checksRecord = asRecord(record.checks) ?? undefined;

  return new CampaignEligibilityPreview({
    campaignId: asString(record.campaignId),
    campaignName: asString(record.campaignName),
    campaignType: asString(record.campaignType),
    eligible: asBoolean(record.eligible, false),
    discountAmount: asNumber(record.discountAmount),
    payableAmount: asNumber(record.payableAmount),
    reasons: asStringArray(record.reasons),
    checks: mapEligibilityChecks(checksRecord),
    userTierName: asNullableString(record.userTierName),
    minimumTierName: asNullableString(record.minimumTierName),
    allowedLocationIds: asStringArray(record.allowedLocationIds),
  });
}

/**
 * Client campaigns API repository — /api/v1/client/campaigns/*
 * Requires authenticated Bearer session (via HttpClient).
 */
export class ApiCampaignRepository implements ICampaignRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getDiscoverSales(): Promise<Campaign[]> {
    try {
      const envelope = await this.httpClient.get<DiscoverSalesEnvelopeDTO>(
        API_ENDPOINTS.CAMPAIGNS.DISCOVER_SALES
      );
      const data = unwrapData<
        DiscoverSaleCampaignDTO | DiscoverSaleCampaignDTO[]
      >(envelope);
      return normalizeList<DiscoverSaleCampaignDTO>(data).map((item) =>
        mapCampaign(item)
      );
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to load discover sales")
      );
    }
  }

  async previewDiscount(
    payload: DiscountPreviewRequestDTO
  ): Promise<DiscountPreview> {
    try {
      const envelope = await this.httpClient.post<DiscountPreviewEnvelopeDTO>(
        API_ENDPOINTS.CAMPAIGNS.DISCOUNT_PREVIEW,
        payload
      );
      const data = unwrapData<DiscountPreviewResponseDTO>(envelope);
      return mapDiscountPreview(data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to preview discount")
      );
    }
  }

  async redeemCampaign(
    payload: RedeemCampaignRequestDTO
  ): Promise<CampaignClaim> {
    try {
      const envelope = await this.httpClient.post<RedeemCampaignEnvelopeDTO>(
        API_ENDPOINTS.CAMPAIGNS.REDEEM,
        payload
      );
      const data = unwrapData<CampaignClaimDTO>(envelope);
      return mapClaim(data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to claim campaign")
      );
    }
  }

  async getClaims(): Promise<CampaignClaim[]> {
    try {
      const envelope = await this.httpClient.get<CampaignClaimsEnvelopeDTO>(
        API_ENDPOINTS.CAMPAIGNS.CLAIMS
      );
      const data = unwrapData<CampaignClaimDTO | CampaignClaimDTO[]>(envelope);
      return normalizeList<CampaignClaimDTO>(data, ["items", "claims"]).map(
        (item) => mapClaim(item)
      );
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to load campaign claims")
      );
    }
  }

  async getClaimById(redemptionId: string): Promise<CampaignClaim> {
    try {
      const envelope = await this.httpClient.get<CampaignClaimEnvelopeDTO>(
        API_ENDPOINTS.CAMPAIGNS.CLAIM_BY_ID(redemptionId)
      );
      const data = unwrapData<CampaignClaimDTO>(envelope);
      return mapClaim(data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to load campaign claim")
      );
    }
  }

  async previewEligibility(
    payload: EligibilityPreviewRequestDTO
  ): Promise<CampaignEligibilityPreview> {
    try {
      const body: EligibilityPreviewRequestDTO = {
        campaignId: payload.campaignId,
        purchaseAmount: payload.purchaseAmount,
      };
      if (payload.locationId) {
        body.locationId = payload.locationId;
      }

      const envelope =
        await this.httpClient.post<EligibilityPreviewEnvelopeDTO>(
          API_ENDPOINTS.CAMPAIGNS.ELIGIBILITY_PREVIEW,
          body
        );
      const data = unwrapData<EligibilityPreviewResponseDTO>(envelope);
      return mapEligibilityPreview(data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to preview eligibility")
      );
    }
  }

  async getBranches(): Promise<CampaignBranch[]> {
    try {
      const envelope = await this.httpClient.get<CampaignBranchesEnvelopeDTO>(
        API_ENDPOINTS.CAMPAIGNS.BRANCHES
      );
      const data = unwrapData<CampaignBranchDTO | CampaignBranchDTO[]>(
        envelope
      );
      return normalizeList<CampaignBranchDTO>(data, [
        "items",
        "branches",
      ]).map((item) => mapBranch(item));
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to load branches")
      );
    }
  }
}
