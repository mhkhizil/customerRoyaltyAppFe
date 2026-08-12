import { PointQrToken } from "@/core/domain/entities/PointQrToken";
import type { PointTransaction } from "@/core/domain/entities/PointTransaction";

const STORAGE_KEY = "wms_customer_qr";
const AUTO_ROTATE_DONE_KEY = "wms_qr_auto_rotate_done";

/** Minimum time between rotate API calls (unless user forces New code). */
export const MIN_QR_ROTATE_INTERVAL_MS = 60_000;

type StoredCustomerQr = {
  qrToken: string;
  expiresAt: string;
  fetchedAt: string;
};

let lastRotateApiAt = 0;
let homePointsInitialized = false;
let cachedPointTransactions: PointTransaction[] = [];

/** Full reset — call on logout only. */
export function resetCustomerQrSession(): void {
  clearStoredCustomerQr();
  lastRotateApiAt = 0;
  sessionStorage.removeItem(AUTO_ROTATE_DONE_KEY);
  homePointsInitialized = false;
  cachedPointTransactions = [];
}

export function readCachedPointTransactions(): PointTransaction[] {
  return cachedPointTransactions;
}

export function writeCachedPointTransactions(
  transactions: PointTransaction[]
): void {
  cachedPointTransactions = transactions;
}

export function hasHomePointsInitialized(): boolean {
  return homePointsInitialized;
}

export function markHomePointsInitialized(): void {
  homePointsInitialized = true;
}

/** Clear QR from storage on auth loss without allowing another auto-rotate storm. */
export function clearCustomerQrStorage(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hasAutoRotatedThisSession(): boolean {
  return sessionStorage.getItem(AUTO_ROTATE_DONE_KEY) === "1";
}

export function markAutoRotatedThisSession(): void {
  sessionStorage.setItem(AUTO_ROTATE_DONE_KEY, "1");
}

export function canCallRotateApi(force: boolean): boolean {
  if (force) return true;
  return Date.now() - lastRotateApiAt >= MIN_QR_ROTATE_INTERVAL_MS;
}

export function markRotateApiCalled(): void {
  lastRotateApiAt = Date.now();
}

export function parseExpiresMs(expiresAt: string): number {
  const trimmed = expiresAt.trim();
  if (!trimmed) return Number.NaN;

  const direct = Date.parse(trimmed);
  if (!Number.isNaN(direct)) return direct;

  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return Date.parse(`${trimmed}Z`);
  }

  return Number.NaN;
}

export function readStoredCustomerQr(): PointQrToken | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredCustomerQr;
    if (!parsed.qrToken || !parsed.expiresAt) return null;

    return new PointQrToken({
      qrToken: parsed.qrToken,
      expiresAt: parsed.expiresAt,
      fetchedAt: parsed.fetchedAt,
    });
  } catch {
    return null;
  }
}

export function writeStoredCustomerQr(token: PointQrToken): void {
  const payload: StoredCustomerQr = {
    qrToken: token.qrToken,
    expiresAt: token.expiresAt,
    fetchedAt: token.fetchedAt ?? new Date().toISOString(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredCustomerQr(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Expired only when server expiry is parseable AND in the past.
 * Unparseable expiry → keep showing the QR (do not re-rotate in a loop).
 */
export function isCustomerQrExpired(token: PointQrToken | null): boolean {
  if (!token?.expiresAt) return false;
  const expiresMs = parseExpiresMs(token.expiresAt);
  if (Number.isNaN(expiresMs)) return false;
  return expiresMs <= Date.now();
}

export function isCustomerQrUsable(
  token: PointQrToken | null
): token is PointQrToken {
  return Boolean(token?.qrToken && !isCustomerQrExpired(token));
}
