import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Campaign } from "../../domain/entities/Campaign";
import type { CampaignBranch } from "../../domain/entities/CampaignBranch";
import type { CampaignClaim } from "../../domain/entities/CampaignClaim";
import type { CampaignEligibilityPreview } from "../../domain/entities/CampaignEligibilityPreview";
import type { DiscountPreview } from "../../domain/entities/DiscountPreview";
import type { ICampaignService } from "../../domain/services/ICampaignService";
import container from "../../infrastructure/di/container";

const DEFAULT_POLL_INTERVAL_MS = 5_000;

type UseClientCampaignsOptions = {
  /** Auto-load discover sales on mount (default true). */
  autoLoadDiscover?: boolean;
  /** Auto-load claims on mount (default true). */
  autoLoadClaims?: boolean;
  /** Poll pending claims until terminal status (default true). */
  autoPollPendingClaims?: boolean;
  pollIntervalMs?: number;
};

type UseClientCampaignsReturn = {
  discoverSales: Campaign[];
  claims: CampaignClaim[];
  pendingClaims: CampaignClaim[];
  branches: CampaignBranch[];
  preview: DiscountPreview | null;
  eligibilityPreview: CampaignEligibilityPreview | null;
  lastClaim: CampaignClaim | null;
  isLoadingDiscover: boolean;
  isLoadingClaims: boolean;
  isLoadingBranches: boolean;
  isPreviewing: boolean;
  isCheckingEligibility: boolean;
  isRedeeming: boolean;
  isPollingClaim: boolean;
  isLoading: boolean;
  error: string | null;
  loadDiscoverSales: () => Promise<Campaign[]>;
  loadClaims: () => Promise<CampaignClaim[]>;
  loadBranches: () => Promise<CampaignBranch[]>;
  previewDiscount: (purchaseAmount: number) => Promise<DiscountPreview>;
  previewEligibility: (input: {
    campaignId: string;
    purchaseAmount: number;
    locationId?: string;
  }) => Promise<CampaignEligibilityPreview>;
  redeemCampaign: (input: {
    campaignId: string;
    purchaseAmount: number;
    idempotencyKey?: string;
  }) => Promise<CampaignClaim>;
  refreshClaim: (redemptionId: string) => Promise<CampaignClaim>;
  clearError: () => void;
  clearPreview: () => void;
  clearEligibilityPreview: () => void;
};

function createIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `claim-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function claimKey(campaignId: string, purchaseAmount: number): string {
  return `${campaignId}:${purchaseAmount}`;
}

function mergeClaimList(
  claims: CampaignClaim[],
  updated: CampaignClaim
): CampaignClaim[] {
  const index = claims.findIndex(
    (item) => item.redemptionId === updated.redemptionId
  );
  if (index === -1) {
    return [updated, ...claims];
  }
  const next = [...claims];
  next[index] = updated;
  return next;
}

/**
 * Presentation hook for authenticated client campaigns.
 */
export function useClientCampaigns(
  options: UseClientCampaignsOptions = {}
): UseClientCampaignsReturn {
  const {
    autoLoadDiscover = true,
    autoLoadClaims = true,
    autoPollPendingClaims = true,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  } = options;

  const campaignServiceRef = useRef(
    container.resolve<ICampaignService>("campaignService")
  );
  const mountedRef = useRef(true);
  const didLoadDiscoverRef = useRef(false);
  const didLoadClaimsRef = useRef(false);
  const didLoadBranchesRef = useRef(false);
  const idempotencyKeysRef = useRef<Map<string, string>>(new Map());
  const pollTimerRef = useRef<number | null>(null);
  const pollInFlightRef = useRef(false);

  const [discoverSales, setDiscoverSales] = useState<Campaign[]>([]);
  const [claims, setClaims] = useState<CampaignClaim[]>([]);
  const [branches, setBranches] = useState<CampaignBranch[]>([]);
  const [preview, setPreview] = useState<DiscountPreview | null>(null);
  const [eligibilityPreview, setEligibilityPreview] =
    useState<CampaignEligibilityPreview | null>(null);
  const [lastClaim, setLastClaim] = useState<CampaignClaim | null>(null);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isPollingClaim, setIsPollingClaim] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingClaims = useMemo(
    () => claims.filter((claim) => claim.isPending),
    [claims]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const clearEligibilityPreview = useCallback(() => {
    setEligibilityPreview(null);
  }, []);

  const loadDiscoverSales = useCallback(async () => {
    try {
      setIsLoadingDiscover(true);
      clearError();
      const items = await campaignServiceRef.current.getDiscoverSales();
      if (mountedRef.current) {
        setDiscoverSales(items);
      }
      return items;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load discover sales";
      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoadingDiscover(false);
      }
    }
  }, [clearError]);

  const loadClaims = useCallback(async () => {
    try {
      setIsLoadingClaims(true);
      clearError();
      const items = await campaignServiceRef.current.getClaims();
      if (mountedRef.current) {
        setClaims(items);
      }
      return items;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load campaign claims";
      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoadingClaims(false);
      }
    }
  }, [clearError]);

  const loadBranches = useCallback(async () => {
    try {
      setIsLoadingBranches(true);
      clearError();
      const items = await campaignServiceRef.current.getBranches();
      if (mountedRef.current) {
        setBranches(items.filter((branch) => branch.isActive));
      }
      return items;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load branches";
      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoadingBranches(false);
      }
    }
  }, [clearError]);

  const previewDiscount = useCallback(
    async (purchaseAmount: number) => {
      try {
        setIsPreviewing(true);
        clearError();
        const result = await campaignServiceRef.current.previewDiscount({
          purchaseAmount,
        });
        if (mountedRef.current) {
          setPreview(result);
        }
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unable to preview discount";
        if (mountedRef.current) {
          setError(message);
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsPreviewing(false);
        }
      }
    },
    [clearError]
  );

  const previewEligibility = useCallback(
    async (input: {
      campaignId: string;
      purchaseAmount: number;
      locationId?: string;
    }) => {
      try {
        setIsCheckingEligibility(true);
        clearError();
        const result = await campaignServiceRef.current.previewEligibility({
          campaignId: input.campaignId,
          purchaseAmount: input.purchaseAmount,
          locationId: input.locationId,
        });
        if (mountedRef.current) {
          setEligibilityPreview(result);
        }
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to preview eligibility";
        if (mountedRef.current) {
          setError(message);
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsCheckingEligibility(false);
        }
      }
    },
    [clearError]
  );

  const redeemCampaign = useCallback(
    async (input: {
      campaignId: string;
      purchaseAmount: number;
      idempotencyKey?: string;
    }) => {
      const cacheKey = claimKey(input.campaignId, input.purchaseAmount);
      const idempotencyKey =
        input.idempotencyKey?.trim() ||
        idempotencyKeysRef.current.get(cacheKey) ||
        createIdempotencyKey();
      idempotencyKeysRef.current.set(cacheKey, idempotencyKey);

      try {
        setIsRedeeming(true);
        clearError();
        const result = await campaignServiceRef.current.redeemCampaign({
          campaignId: input.campaignId,
          purchaseAmount: input.purchaseAmount,
          idempotencyKey,
        });
        if (mountedRef.current) {
          setLastClaim(result);
          setClaims((current) => mergeClaimList(current, result));
        }
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unable to claim campaign";
        if (mountedRef.current) {
          setError(message);
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsRedeeming(false);
        }
      }
    },
    [clearError]
  );

  const refreshClaim = useCallback(async (redemptionId: string) => {
    const result = await campaignServiceRef.current.getClaimById(redemptionId);
    if (mountedRef.current) {
      setClaims((current) => mergeClaimList(current, result));
      setLastClaim((current) =>
        current?.redemptionId === result.redemptionId ? result : current
      );
    }
    return result;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!autoLoadDiscover || didLoadDiscoverRef.current) return;
    didLoadDiscoverRef.current = true;

    void loadDiscoverSales().catch(() => {
      /* error already stored */
    });
  }, [autoLoadDiscover, loadDiscoverSales]);

  useEffect(() => {
    if (!autoLoadClaims || didLoadClaimsRef.current) return;
    didLoadClaimsRef.current = true;

    void loadClaims().catch(() => {
      /* error already stored */
    });
  }, [autoLoadClaims, loadClaims]);

  useEffect(() => {
    if (didLoadBranchesRef.current) return;
    didLoadBranchesRef.current = true;

    void loadBranches().catch(() => {
      /* non-blocking — picker can retry */
    });
  }, [loadBranches]);

  useEffect(() => {
    if (!autoPollPendingClaims || pendingClaims.length === 0) {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setIsPollingClaim(false);
      return;
    }

    const pollPending = async () => {
      if (pollInFlightRef.current || !mountedRef.current) return;
      pollInFlightRef.current = true;
      setIsPollingClaim(true);

      try {
        const snapshots = await Promise.all(
          pendingClaims.map((claim) =>
            campaignServiceRef.current.getClaimById(claim.redemptionId)
          )
        );
        if (mountedRef.current) {
          setClaims((current) =>
            snapshots.reduce(
              (acc, snapshot) => mergeClaimList(acc, snapshot),
              current
            )
          );
        }
      } catch {
        /* keep polling — transient network errors */
      } finally {
        pollInFlightRef.current = false;
        if (mountedRef.current) {
          setIsPollingClaim(false);
          pollTimerRef.current = window.setTimeout(() => {
            void pollPending();
          }, pollIntervalMs);
        }
      }
    };

    pollTimerRef.current = window.setTimeout(() => {
      void pollPending();
    }, pollIntervalMs);

    return () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [autoPollPendingClaims, pendingClaims, pollIntervalMs]);

  return {
    discoverSales,
    claims,
    pendingClaims,
    branches,
    preview,
    eligibilityPreview,
    lastClaim,
    isLoadingDiscover,
    isLoadingClaims,
    isLoadingBranches,
    isPreviewing,
    isCheckingEligibility,
    isRedeeming,
    isPollingClaim,
    isLoading:
      isLoadingDiscover ||
      isLoadingClaims ||
      isLoadingBranches ||
      isPreviewing ||
      isCheckingEligibility ||
      isRedeeming,
    error,
    loadDiscoverSales,
    loadClaims,
    loadBranches,
    previewDiscount,
    previewEligibility,
    redeemCampaign,
    refreshClaim,
    clearError,
    clearPreview,
    clearEligibilityPreview,
  };
}
