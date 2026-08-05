import type { ApiEnvelopeDTO } from "./AuthDTO";

/**
 * Client points DTOs — shapes match /api/v1/client/points/* contracts.
 */

export type PointQrTokenDTO = {
  qrToken: string;
  expiresAt: string;
};

export type PointTransactionDTO = {
  id: string;
  type: string;
  source: string;
  points: number;
  balanceAfter: number;
  createdAt: string;
  description?: Record<string, unknown> | string | null;
};

export type PointQrTokenEnvelopeDTO = ApiEnvelopeDTO<PointQrTokenDTO>;

/**
 * Swagger lists a single object; real list APIs often return an array.
 * Repository normalizes both shapes.
 */
export type PointTransactionsEnvelopeDTO = ApiEnvelopeDTO<
  PointTransactionDTO | PointTransactionDTO[]
>;
