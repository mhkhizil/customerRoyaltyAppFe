import type { PointQrToken } from "../entities/PointQrToken";
import type { PointTransaction } from "../entities/PointTransaction";

export interface IPointsService {
  rotateQrToken(): Promise<PointQrToken>;
  getTransactions(): Promise<PointTransaction[]>;
}
