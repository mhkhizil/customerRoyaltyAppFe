/**
 * Customer QR token used at POS to earn/redeem points.
 * Matches POST /api/v1/client/points/qr-token/rotate data payload.
 */
import { isCustomerQrExpired, parseExpiresMs } from "@/lib/customerQrCache";

export class PointQrToken {
  qrToken!: string;
  expiresAt!: string;
  /** When FE received this token from the server. */
  fetchedAt?: string;

  constructor(data: Partial<PointQrToken>) {
    Object.assign(this, data);
  }

  get isExpired(): boolean {
    return isCustomerQrExpired(this);
  }

  get expiresInMs(): number {
    const expiresMs = parseExpiresMs(this.expiresAt);
    if (Number.isNaN(expiresMs)) return Number.POSITIVE_INFINITY;
    return Math.max(0, expiresMs - Date.now());
  }
}
