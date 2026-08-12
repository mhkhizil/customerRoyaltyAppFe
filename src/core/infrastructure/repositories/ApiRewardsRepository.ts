import axios from "axios";
import type {
  RedeemRewardEnvelopeDTO,
  RedeemRewardRequestDTO,
  RewardDTO,
  RewardRedemptionDTO,
  RewardRedemptionEnvelopeDTO,
  RewardRedemptionsEnvelopeDTO,
  RewardsEnvelopeDTO,
} from "../../application/dtos/RewardsDTO";
import { Reward } from "../../domain/entities/Reward";
import { RewardRedemption } from "../../domain/entities/RewardRedemption";
import type { IRewardsRepository } from "../../domain/repositories/IRewardsRepository";
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

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
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
  keys: readonly string[] = ["items", "rewards", "redemptions"]
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

function mapReward(dto: RewardDTO | Record<string, unknown>): Reward {
  const record = asRecord(dto) ?? {};
  const id = asString(record.id);
  if (!id) {
    throw new Error("Reward item is missing id");
  }

  return new Reward({
    id,
    name: asString(record.name),
    slug: asString(record.slug),
    type: asString(record.type),
    status: asString(record.status),
    pointsCost: asNumber(record.pointsCost),
    bonusPoints: asNullableNumber(record.bonusPoints),
    discountValue: asNullableNumber(record.discountValue),
    freeProductId: asNullableString(record.freeProductId),
    minimumTierId: asNullableString(record.minimumTierId),
    unlockMetric: asNullableString(record.unlockMetric),
    unlockThreshold: asNullableNumber(record.unlockThreshold),
    stockQuantity: asNullableNumber(record.stockQuantity),
    perUserLimit: asNullableNumber(record.perUserLimit),
    startsAt: asNullableString(record.startsAt),
    endsAt: asNullableString(record.endsAt),
  });
}

function mapRedemption(
  dto: RewardRedemptionDTO | Record<string, unknown>
): RewardRedemption {
  const record = asRecord(dto) ?? {};
  const redemptionId = asString(record.redemptionId);
  if (!redemptionId) {
    throw new Error("Reward redemption response did not include redemptionId");
  }

  return new RewardRedemption({
    redemptionId,
    redemptionCode: asString(record.redemptionCode),
    rewardId: asString(record.rewardId),
    rewardName: asString(record.rewardName),
    rewardType: asString(record.rewardType),
    status: asString(record.status, "PENDING"),
    pointsSpent: asNumber(record.pointsSpent),
    purchaseId: asNullableString(record.purchaseId),
    redeemedAt: asNullableString(record.redeemedAt),
    fulfilledAt: asNullableString(record.fulfilledAt),
    expiresAt: asNullableString(record.expiresAt),
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
  });
}

export class ApiRewardsRepository implements IRewardsRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getRewards(): Promise<Reward[]> {
    try {
      const envelope = await this.httpClient.get<RewardsEnvelopeDTO>(
        API_ENDPOINTS.REWARDS.LIST
      );
      const data = unwrapData<RewardDTO | RewardDTO[]>(envelope);
      return normalizeList<RewardDTO>(data, ["items", "rewards"]).map((item) =>
        mapReward(item)
      );
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, "Unable to load rewards"));
    }
  }

  async getRedemptions(): Promise<RewardRedemption[]> {
    try {
      const envelope = await this.httpClient.get<RewardRedemptionsEnvelopeDTO>(
        API_ENDPOINTS.REWARDS.REDEMPTIONS
      );
      const data = unwrapData<RewardRedemptionDTO | RewardRedemptionDTO[]>(
        envelope
      );
      return normalizeList<RewardRedemptionDTO>(data, [
        "items",
        "redemptions",
      ]).map((item) => mapRedemption(item));
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to load reward redemptions")
      );
    }
  }

  async getRedemptionById(redemptionId: string): Promise<RewardRedemption> {
    try {
      const envelope = await this.httpClient.get<RewardRedemptionEnvelopeDTO>(
        API_ENDPOINTS.REWARDS.REDEMPTION_BY_ID(redemptionId)
      );
      const data = unwrapData<RewardRedemptionDTO>(envelope);
      return mapRedemption(data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to load reward redemption")
      );
    }
  }

  async redeemReward(
    payload: RedeemRewardRequestDTO
  ): Promise<RewardRedemption> {
    try {
      const envelope = await this.httpClient.post<RedeemRewardEnvelopeDTO>(
        API_ENDPOINTS.REWARDS.REDEEM,
        payload
      );
      const data = unwrapData<RewardRedemptionDTO>(envelope);
      return mapRedemption(data);
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, "Unable to redeem reward"));
    }
  }
}
