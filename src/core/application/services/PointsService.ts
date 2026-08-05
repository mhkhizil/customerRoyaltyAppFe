import type { PointQrToken } from "../../domain/entities/PointQrToken";
import type { PointTransaction } from "../../domain/entities/PointTransaction";
import type { IPointsRepository } from "../../domain/repositories/IPointsRepository";
import type { IPointsService } from "../../domain/services/IPointsService";

function rethrowPointsError(error: unknown, fallback: string): never {
  if (error instanceof Error && error.message) {
    throw error;
  }
  throw new Error(fallback);
}

/**
 * Application service for authenticated client points use cases.
 */
export class PointsService implements IPointsService {
  constructor(private readonly pointsRepository: IPointsRepository) {}

  async rotateQrToken(): Promise<PointQrToken> {
    try {
      return await this.pointsRepository.rotateQrToken();
    } catch (error: unknown) {
      rethrowPointsError(error, "Unable to generate QR token. Please try again.");
    }
  }

  async getTransactions(): Promise<PointTransaction[]> {
    try {
      return await this.pointsRepository.getTransactions();
    } catch (error: unknown) {
      rethrowPointsError(error, "Unable to load point transactions.");
    }
  }
}
