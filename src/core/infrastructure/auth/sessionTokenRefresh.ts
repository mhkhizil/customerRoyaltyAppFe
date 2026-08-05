import axios from "axios";
import type {
  ApiEnvelopeDTO,
  AuthTokensDTO,
  RefreshTokenRequestDTO,
} from "../../application/dtos/AuthDTO";
import { tokenCookies } from "@/lib/cookies";
import { API_CONFIG, API_ENDPOINTS } from "../api/constants";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function unwrapEnvelopeData(payload: unknown): AuthTokensDTO | null {
  const record = asRecord(payload);
  const data = record && "data" in record ? record.data : payload;
  const tokens = asRecord(data);
  if (!tokens) return null;

  const accessToken = asString(tokens.accessToken);
  const refreshToken = asString(tokens.refreshToken);
  if (!accessToken || !refreshToken) return null;

  return {
    accessToken,
    refreshToken,
    expiresIn: asString(tokens.expiresIn) || undefined,
    refreshExpiresIn: asString(tokens.refreshExpiresIn) || undefined,
  };
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotate access + refresh tokens using POST /api/v1/client/auth/refresh.
 * Uses raw axios to avoid HttpClient interceptor loops.
 * Coalesces concurrent refresh attempts.
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refreshToken = tokenCookies.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  refreshInFlight = (async () => {
    try {
      const body: RefreshTokenRequestDTO = { refreshToken };
      const response = await axios.post<ApiEnvelopeDTO<AuthTokensDTO>>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        body,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const tokens = unwrapEnvelopeData(response.data);
      if (!tokens) {
        return false;
      }

      tokenCookies.setToken(tokens.accessToken);
      tokenCookies.setRefreshToken(tokens.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Persist rotated token pair from login or refresh responses.
 */
export function persistAuthTokens(tokens: AuthTokensDTO): void {
  tokenCookies.setToken(tokens.accessToken);
  tokenCookies.setRefreshToken(tokens.refreshToken);
}
