import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointQrToken } from "../../domain/entities/PointQrToken";
import type { PointTransaction } from "../../domain/entities/PointTransaction";
import type { IPointsService } from "../../domain/services/IPointsService";
import { PointQrToken as PointQrTokenEntity } from "../../domain/entities/PointQrToken";
import container from "../../infrastructure/di/container";
import {
  canCallRotateApi,
  hasAutoRotatedThisSession,
  hasHomePointsInitialized,
  isCustomerQrUsable,
  markAutoRotatedThisSession,
  markHomePointsInitialized,
  markRotateApiCalled,
  readStoredCustomerQr,
  writeStoredCustomerQr,
} from "@/lib/customerQrCache";

type RotateOptions = {
  silent?: boolean;
  force?: boolean;
};

type UseClientPointsReturn = {
  qrToken: PointQrToken | null;
  transactions: PointTransaction[];
  balance: number | null;
  isLoadingQr: boolean;
  isLoadingTransactions: boolean;
  isLoading: boolean;
  error: string | null;
  rotateQrToken: () => Promise<PointQrToken>;
  loadTransactions: () => Promise<PointTransaction[]>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

let sharedCachedQr: PointQrToken | null = readStoredCustomerQr();
let sharedRotateInFlight: Promise<PointQrToken> | null = null;

function persistQr(token: PointQrToken): void {
  const next = new PointQrTokenEntity({
    qrToken: token.qrToken,
    expiresAt: token.expiresAt,
    fetchedAt: token.fetchedAt ?? new Date().toISOString(),
  });
  sharedCachedQr = next;
  writeStoredCustomerQr(next);
}

async function fetchRotatedQr(
  service: IPointsService,
  force: boolean
): Promise<PointQrToken> {
  const cached = sharedCachedQr ?? readStoredCustomerQr();

  if (!force && isCustomerQrUsable(cached)) {
    sharedCachedQr = cached;
    return cached;
  }

  if (!force && hasAutoRotatedThisSession()) {
    if (cached) return cached;
    throw new Error("QR unavailable. Tap New code to try again.");
  }

  if (!force && !canCallRotateApi(false)) {
    if (cached) return cached;
  }

  if (sharedRotateInFlight) {
    return sharedRotateInFlight;
  }

  sharedRotateInFlight = (async () => {
    try {
      markRotateApiCalled();
      if (!force) {
        markAutoRotatedThisSession();
      }
      const next = await service.rotateQrToken();
      persistQr(next);
      return sharedCachedQr as PointQrToken;
    } finally {
      sharedRotateInFlight = null;
    }
  })();

  return sharedRotateInFlight;
}

/**
 * Client points — one auto rotate per login session; manual New code anytime.
 * No timers. Server sets expiry via expiresAt only.
 */
export function useClientPoints(): UseClientPointsReturn {
  const pointsServiceRef = useRef(
    container.resolve<IPointsService>("pointsService")
  );
  const mountedRef = useRef(true);

  const [qrToken, setQrToken] = useState<PointQrToken | null>(sharedCachedQr);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const applyQrToken = useCallback((next: PointQrToken) => {
    persistQr(next);
    setQrToken(next);
  }, []);

  const rotateQrToken = useCallback(
    async (opts?: RotateOptions) => {
      const silent = Boolean(opts?.silent);
      const force = Boolean(opts?.force);

      try {
        if (!silent && mountedRef.current) {
          setIsLoadingQr(true);
        }
        if (!silent) {
          clearError();
        }

        const next = await fetchRotatedQr(pointsServiceRef.current, force);
        if (mountedRef.current) {
          applyQrToken(next);
        }
        return next;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unable to generate QR token";
        if (mountedRef.current) {
          setError(message);
        }
        throw err;
      } finally {
        if (!silent && mountedRef.current) {
          setIsLoadingQr(false);
        }
      }
    },
    [applyQrToken, clearError]
  );

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoadingTransactions(true);
      clearError();
      const items = await pointsServiceRef.current.getTransactions();
      if (mountedRef.current) {
        setTransactions(items);
      }
      return items;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load point transactions";
      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoadingTransactions(false);
      }
    }
  }, [clearError]);

  const refresh = useCallback(async () => {
    await loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    mountedRef.current = true;
    if (hasHomePointsInitialized()) return;
    markHomePointsInitialized();

    const cached = readStoredCustomerQr();
    if (isCustomerQrUsable(cached)) {
      applyQrToken(cached);
    } else {
      void rotateQrToken({ silent: false, force: false }).catch(() => {
        /* error stored */
      });
    }

    void loadTransactions().catch(() => {
      /* error stored */
    });

    return () => {
      mountedRef.current = false;
    };
  }, [applyQrToken, loadTransactions, rotateQrToken]);

  const balance = useMemo(() => {
    if (transactions.length === 0) return null;
    const sorted = [...transactions].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
    return sorted[0]?.balanceAfter ?? null;
  }, [transactions]);

  return {
    qrToken,
    transactions,
    balance,
    isLoadingQr,
    isLoadingTransactions,
    isLoading: isLoadingQr || isLoadingTransactions,
    error,
    rotateQrToken: () => rotateQrToken({ force: true }),
    loadTransactions,
    refresh,
    clearError,
  };
}
