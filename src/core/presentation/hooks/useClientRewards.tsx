import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Reward } from "../../domain/entities/Reward";
import type { RewardRedemption } from "../../domain/entities/RewardRedemption";
import type { IRewardsService } from "../../domain/services/IRewardsService";
import container from "../../infrastructure/di/container";

const DEFAULT_POLL_INTERVAL_MS = 5_000;

type UseClientRewardsOptions = {
  autoLoadRewards?: boolean;
  autoLoadRedemptions?: boolean;
  autoPollPendingRedemptions?: boolean;
  pollIntervalMs?: number;
};

type UseClientRewardsReturn = {
  rewards: Reward[];
  redemptions: RewardRedemption[];
  pendingRedemptions: RewardRedemption[];
  lastRedemption: RewardRedemption | null;
  isLoadingRewards: boolean;
  isLoadingRedemptions: boolean;
  isRedeeming: boolean;
  isPollingRedemption: boolean;
  isLoading: boolean;
  error: string | null;
  loadRewards: () => Promise<Reward[]>;
  loadRedemptions: () => Promise<RewardRedemption[]>;
  redeemReward: (input: {
    rewardId: string;
    idempotencyKey?: string;
  }) => Promise<RewardRedemption>;
  refreshRedemption: (redemptionId: string) => Promise<RewardRedemption>;
  clearError: () => void;
};

function createIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `reward-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function rewardKey(rewardId: string): string {
  return rewardId;
}

function mergeRedemptionList(
  redemptions: RewardRedemption[],
  updated: RewardRedemption
): RewardRedemption[] {
  const index = redemptions.findIndex(
    (item) => item.redemptionId === updated.redemptionId
  );
  if (index === -1) {
    return [updated, ...redemptions];
  }
  const next = [...redemptions];
  next[index] = updated;
  return next;
}

export function useClientRewards(
  options: UseClientRewardsOptions = {}
): UseClientRewardsReturn {
  const {
    autoLoadRewards = true,
    autoLoadRedemptions = true,
    autoPollPendingRedemptions = true,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  } = options;

  const rewardsServiceRef = useRef(
    container.resolve<IRewardsService>("rewardsService")
  );
  const mountedRef = useRef(true);
  const didLoadRewardsRef = useRef(false);
  const didLoadRedemptionsRef = useRef(false);
  const idempotencyKeysRef = useRef<Map<string, string>>(new Map());
  const pollTimerRef = useRef<number | null>(null);
  const pollInFlightRef = useRef(false);

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [lastRedemption, setLastRedemption] = useState<RewardRedemption | null>(
    null
  );
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [isLoadingRedemptions, setIsLoadingRedemptions] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isPollingRedemption, setIsPollingRedemption] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingRedemptions = useMemo(
    () => redemptions.filter((item) => item.isPending),
    [redemptions]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadRewards = useCallback(async () => {
    try {
      setIsLoadingRewards(true);
      clearError();
      const items = await rewardsServiceRef.current.getRewards();
      if (mountedRef.current) {
        setRewards(items);
      }
      return items;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load rewards";
      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoadingRewards(false);
      }
    }
  }, [clearError]);

  const loadRedemptions = useCallback(async () => {
    try {
      setIsLoadingRedemptions(true);
      clearError();
      const items = await rewardsServiceRef.current.getRedemptions();
      if (mountedRef.current) {
        setRedemptions(items);
      }
      return items;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load reward redemptions";
      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setIsLoadingRedemptions(false);
      }
    }
  }, [clearError]);

  const redeemReward = useCallback(
    async (input: { rewardId: string; idempotencyKey?: string }) => {
      const cacheKey = rewardKey(input.rewardId);
      const idempotencyKey =
        input.idempotencyKey?.trim() ||
        idempotencyKeysRef.current.get(cacheKey) ||
        createIdempotencyKey();
      idempotencyKeysRef.current.set(cacheKey, idempotencyKey);

      try {
        setIsRedeeming(true);
        clearError();
        const result = await rewardsServiceRef.current.redeemReward({
          rewardId: input.rewardId,
          idempotencyKey,
        });
        if (mountedRef.current) {
          setLastRedemption(result);
          setRedemptions((current) => mergeRedemptionList(current, result));
        }
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unable to redeem reward";
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

  const refreshRedemption = useCallback(async (redemptionId: string) => {
    const result =
      await rewardsServiceRef.current.getRedemptionById(redemptionId);
    if (mountedRef.current) {
      setRedemptions((current) => mergeRedemptionList(current, result));
      setLastRedemption((current) =>
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
    if (!autoLoadRewards || didLoadRewardsRef.current) return;
    didLoadRewardsRef.current = true;
    void loadRewards().catch(() => {
      /* error stored */
    });
  }, [autoLoadRewards, loadRewards]);

  useEffect(() => {
    if (!autoLoadRedemptions || didLoadRedemptionsRef.current) return;
    didLoadRedemptionsRef.current = true;
    void loadRedemptions().catch(() => {
      /* error stored */
    });
  }, [autoLoadRedemptions, loadRedemptions]);

  useEffect(() => {
    if (!autoPollPendingRedemptions || pendingRedemptions.length === 0) {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setIsPollingRedemption(false);
      return;
    }

    const pollPending = async () => {
      if (pollInFlightRef.current || !mountedRef.current) return;
      pollInFlightRef.current = true;
      setIsPollingRedemption(true);

      try {
        const snapshots = await Promise.all(
          pendingRedemptions.map((item) =>
            rewardsServiceRef.current.getRedemptionById(item.redemptionId)
          )
        );
        if (mountedRef.current) {
          setRedemptions((current) =>
            snapshots.reduce(
              (acc, snapshot) => mergeRedemptionList(acc, snapshot),
              current
            )
          );
        }
      } catch {
        /* keep polling */
      } finally {
        pollInFlightRef.current = false;
        if (mountedRef.current) {
          setIsPollingRedemption(false);
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
  }, [autoPollPendingRedemptions, pendingRedemptions, pollIntervalMs]);

  return {
    rewards,
    redemptions,
    pendingRedemptions,
    lastRedemption,
    isLoadingRewards,
    isLoadingRedemptions,
    isRedeeming,
    isPollingRedemption,
    isLoading: isLoadingRewards || isLoadingRedemptions || isRedeeming,
    error,
    loadRewards,
    loadRedemptions,
    redeemReward,
    refreshRedemption,
    clearError,
  };
}
