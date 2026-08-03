import { useMemo } from "react";
import type { User } from "@/core/domain/entities/User";
import { useAuth } from "@/core/presentation/hooks/useAuth";

/**
 * Customer app route permissions.
 * All authenticated members can open home / rewards / profile.
 */
export const PAGE_PERMISSIONS = {
  home: [] as string[],
  rewards: [] as string[],
  profile: [] as string[],
} as const;

export const PERMISSION_ROUTE_ORDER = [
  { path: "/home", permissions: PAGE_PERMISSIONS.home },
  { path: "/rewards", permissions: PAGE_PERMISSIONS.rewards },
  { path: "/profile", permissions: PAGE_PERMISSIONS.profile },
] as const;

const normalizePermission = (value: string) => value.trim().toUpperCase();

const extractUserPermissions = (user: User | null): string[] => {
  const source = user?.adminAccess?.permissions ?? user?.permissions;
  if (!user || !Array.isArray(source)) return [];

  return source
    .filter((value): value is string => typeof value === "string")
    .map(normalizePermission)
    .filter(Boolean);
};

export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => extractUserPermissions(user), [user]);
  const resolvedRoleName = String(
    user?.adminRoleName || user?.role || "CLIENT"
  ).trim();

  const hasPermission = (requiredPermission: string) =>
    permissions.includes(normalizePermission(requiredPermission));

  const canAccess = (requiredPermissions?: readonly string[]) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) => hasPermission(permission));
  };

  return {
    permissions,
    resolvedRoleName,
    isFullAccess: false,
    isLoading: false,
    hasPermission,
    canAccess,
  };
}
