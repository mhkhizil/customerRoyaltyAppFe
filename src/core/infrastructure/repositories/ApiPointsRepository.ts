import axios from "axios";
import type {
  PointQrTokenDTO,
  PointTransactionDTO,
  PointQrTokenEnvelopeDTO,
  PointTransactionsEnvelopeDTO,
} from "../../application/dtos/PointsDTO";
import { PointQrToken } from "../../domain/entities/PointQrToken";
import { PointTransaction } from "../../domain/entities/PointTransaction";
import type { IPointsRepository } from "../../domain/repositories/IPointsRepository";
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

/**
 * HttpClient already returns axios `response.data` (the API envelope).
 * Also tolerate a double-wrapped shape if callers pass `envelope.data`.
 */
function unwrapData<T>(payload: unknown): T {
  const record = asRecord(payload);
  if (record && "data" in record && record.data !== undefined && record.data !== null) {
    return record.data as T;
  }
  if (payload === undefined || payload === null) {
    throw new Error("API response did not include data");
  }
  return payload as T;
}

function mapQrToken(dto: PointQrTokenDTO | Record<string, unknown>): PointQrToken {
  const record = asRecord(dto) ?? {};
  const qrToken = asString(record.qrToken);
  const expiresAt = asString(record.expiresAt);

  if (!qrToken) {
    throw new Error("QR token response did not include qrToken");
  }
  if (!expiresAt) {
    throw new Error("QR token response did not include expiresAt");
  }

  return new PointQrToken({ qrToken, expiresAt });
}

function mapDescription(
  value: unknown
): Record<string, unknown> | string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  const record = asRecord(value);
  return record ?? null;
}

function mapTransaction(
  dto: PointTransactionDTO | Record<string, unknown>
): PointTransaction {
  const record = asRecord(dto) ?? {};
  const id = asString(record.id);
  if (!id) {
    throw new Error("Transaction item is missing id");
  }

  return new PointTransaction({
    id,
    type: asString(record.type),
    source: asString(record.source),
    points: asNumber(record.points),
    balanceAfter: asNumber(record.balanceAfter),
    createdAt: asString(record.createdAt),
    description: mapDescription(record.description),
  });
}

function normalizeTransactions(data: unknown): PointTransaction[] {
  if (Array.isArray(data)) {
    return data.map((item) => mapTransaction(item as Record<string, unknown>));
  }

  const record = asRecord(data);
  if (!record) return [];

  if (Array.isArray(record.items)) {
    return record.items.map((item) =>
      mapTransaction(item as Record<string, unknown>)
    );
  }
  if (Array.isArray(record.transactions)) {
    return record.transactions.map((item) =>
      mapTransaction(item as Record<string, unknown>)
    );
  }
  if (typeof record.id === "string" || typeof record.id === "number") {
    return [mapTransaction(record)];
  }

  return [];
}

/**
 * Client points API repository — implements /api/v1/client/points/*
 * Requires authenticated Bearer session (via HttpClient).
 */
export class ApiPointsRepository implements IPointsRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async rotateQrToken(): Promise<PointQrToken> {
    try {
      const envelope = await this.httpClient.post<PointQrTokenEnvelopeDTO>(
        API_ENDPOINTS.POINTS.QR_TOKEN_ROTATE
      );
      const data = unwrapData<PointQrTokenDTO>(envelope);
      return mapQrToken(data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to rotate QR token")
      );
    }
  }

  async getTransactions(): Promise<PointTransaction[]> {
    try {
      const envelope = await this.httpClient.get<PointTransactionsEnvelopeDTO>(
        API_ENDPOINTS.POINTS.TRANSACTIONS
      );
      const data = unwrapData<PointTransactionDTO | PointTransactionDTO[]>(
        envelope
      );
      return normalizeTransactions(data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to load point transactions")
      );
    }
  }
}
