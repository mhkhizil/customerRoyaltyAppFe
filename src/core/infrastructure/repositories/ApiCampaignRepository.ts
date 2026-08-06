import axios from "axios";
import type {
  DiscoverSaleCampaignDTO,
  DiscoverSalesEnvelopeDTO,
  DiscountPreviewEnvelopeDTO,
  DiscountPreviewRequestDTO,
  DiscountPreviewResponseDTO,
  RedeemCampaignEnvelopeDTO,
  RedeemCampaignRequestDTO,
  RedeemCampaignResponseDTO,
} from "../../application/dtos/CampaignDTO";
import { Campaign } from "../../domain/entities/Campaign";
import { CampaignRedemption } from "../../domain/entities/CampaignRedemption";
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

function normalizeCampaigns(data: unknown): Campaign[] {
  if (Array.isArray(data)) {
    return data.map((item) => mapCampaign(item as Record<string, unknown>));
  }

  const record = asRecord(data);
  if (!record) return [];

  if (Array.isArray(record.items)) {
    return record.items.map((item) =>
      mapCampaign(item as Record<string, unknown>)
    );
  }
  if (Array.isArray(record.campaigns)) {
    return record.campaigns.map((item) =>
      mapCampaign(item as Record<string, unknown>)
    );
  }
  if (typeof record.id === "string" || typeof record.id === "number") {
    return [mapCampaign(record)];
  }

  return [];
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

function mapRedemption(
  dto: RedeemCampaignResponseDTO | Record<string, unknown>
): CampaignRedemption {
  const record = asRecord(dto) ?? {};
  const redemptionId = asString(record.redemptionId);
  if (!redemptionId) {
    throw new Error("Redeem response did not include redemptionId");
  }

  return new CampaignRedemption({
    redemptionId,
    discountAmount: asNumber(record.discountAmount),
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
      return normalizeCampaigns(data);
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
  ): Promise<CampaignRedemption> {
    try {
      const envelope = await this.httpClient.post<RedeemCampaignEnvelopeDTO>(
        API_ENDPOINTS.CAMPAIGNS.REDEEM,
        payload
      );
      const data = unwrapData<RedeemCampaignResponseDTO>(envelope);
      return mapRedemption(data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to redeem campaign")
      );
    }
  }
}
