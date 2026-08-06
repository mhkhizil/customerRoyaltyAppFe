import { useCallback, useEffect, useRef, useState } from "react";
import type { Campaign } from "../../domain/entities/Campaign";
import type { CampaignRedemption } from "../../domain/entities/CampaignRedemption";
import type { DiscountPreview } from "../../domain/entities/DiscountPreview";
import type { ICampaignService } from "../../domain/services/ICampaignService";
import container from "../../infrastructure/di/container";

type UseClientCampaignsOptions = {
  /** Auto-load discover sales on mount (default true). */
  autoLoadDiscover?: boolean;
};

type UseClientCampaignsReturn = {
  discoverSales: Campaign[];
  preview: DiscountPreview | null;
  lastRedemption: CampaignRedemption | null;
  isLoadingDiscover: boolean;
  isPreviewing: boolean;
  isRedeeming: boolean;
  isLoading: boolean;
  error: string | null;
  loadDiscoverSales: () => Promise<Campaign[]>;
  previewDiscount: (purchaseAmount: number) => Promise<DiscountPreview>;
  redeemCampaign: (input: {
    campaignId: string;
    purchaseAmount: number;
    idempotencyKey?: string;
  }) => Promise<CampaignRedemption>;
  clearError: () => void;
  clearPreview: () => void;
};

function createIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `redeem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Presentation hook for authenticated client campaigns.
 */
export function useClientCampaigns(
  options: UseClientCampaignsOptions = {}
): UseClientCampaignsReturn {
  const { autoLoadDiscover = true } = options;

  const campaignServiceRef = useRef(
    container.resolve<ICampaignService>("campaignService")
  );
  const mountedRef = useRef(true);
  const didLoadDiscoverRef = useRef(false);

  const [discoverSales, setDiscoverSales] = useState<Campaign[]>([]);
  const [preview, setPreview] = useState<DiscountPreview | null>(null);
  const [lastRedemption, setLastRedemption] =
    useState<CampaignRedemption | null>(null);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
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

  const redeemCampaign = useCallback(
    async (input: {
      campaignId: string;
      purchaseAmount: number;
      idempotencyKey?: string;
    }) => {
      try {
        setIsRedeeming(true);
        clearError();
        const result = await campaignServiceRef.current.redeemCampaign({
          campaignId: input.campaignId,
          purchaseAmount: input.purchaseAmount,
          idempotencyKey: input.idempotencyKey || createIdempotencyKey(),
        });
        if (mountedRef.current) {
          setLastRedemption(result);
        }
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unable to redeem campaign";
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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!autoLoadDiscover || didLoadDiscoverRef.current) return;
    didLoadDiscoverRef.current = true;

    void loadDiscoverSales().catch(() => {
      /* error already stored */
    });
  }, [autoLoadDiscover, loadDiscoverSales]);

  return {
    discoverSales,
    preview,
    lastRedemption,
    isLoadingDiscover,
    isPreviewing,
    isRedeeming,
    isLoading: isLoadingDiscover || isPreviewing || isRedeeming,
    error,
    loadDiscoverSales,
    previewDiscount,
    redeemCampaign,
    clearError,
    clearPreview,
  };
}
