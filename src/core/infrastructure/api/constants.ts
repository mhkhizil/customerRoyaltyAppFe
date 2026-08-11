export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "",
} as const;

/**
 * API endpoint map for Customer Royalty App.
 */
export const API_ENDPOINTS = {
  ROOT: "/",

  AUTH: {
    REGISTER: "/api/v1/client/auth/register",
    LOGIN: "/api/v1/client/auth/login",
    REFRESH: "/api/v1/client/auth/refresh",
    LOGOUT: "/api/v1/client/auth/logout",
    FORGOT_PASSWORD: "/api/v1/client/auth/forgot-password",
    RESET_PASSWORD: "/api/v1/client/auth/reset-password",
    OTP_SEND: "/api/v1/client/auth/otp/send",
    OTP_VERIFY: "/api/v1/client/auth/otp/verify",
    EMAIL_SEND_VERIFICATION: "/api/v1/client/auth/email/send-verification",
    EMAIL_VERIFY: "/api/v1/client/auth/email/verify",
    ME: "/api/v1/client/auth/me",
    UPDATE_DATE_OF_BIRTH: "/api/v1/client/auth/me/date-of-birth",
  },

  /** Authenticated client points (Bearer required). */
  POINTS: {
    QR_TOKEN_ROTATE: "/api/v1/client/points/qr-token/rotate",
    TRANSACTIONS: "/api/v1/client/points/transactions",
  },

  /** Authenticated client campaigns (Bearer required). */
  CAMPAIGNS: {
    DISCOVER_SALES: "/api/v1/client/campaigns/discover-sales",
    DISCOUNT_PREVIEW: "/api/v1/client/campaigns/discount-preview",
    ELIGIBILITY_PREVIEW: "/api/v1/client/campaigns/eligibility-preview",
    REDEEM: "/api/v1/client/campaigns/redeem",
    CLAIMS: "/api/v1/client/campaigns/claims",
    CLAIM_BY_ID: (redemptionId: string) =>
      `/api/v1/client/campaigns/claims/${encodeURIComponent(redemptionId)}`,
    BRANCHES: "/api/v1/client/campaigns/branches",
  },

  USERS: {
    BASE: "/api/v1/users",
    CREATE: "/api/v1/users",
    GET_BY_ID: "/api/v1/users/by-id",
    GET_LIST: "/api/v1/users",
    UPDATE: "/api/v1/users/update",
    UPDATE_PROFILE: "/api/v1/users/profile",
    UPLOAD_PROFILE_IMAGE: "/api/v1/users/upload-profile-image",
    DELETE: (id: string) => `/api/v1/users/${id}`,
  },

  CUSTOMERS: {
    BASE: "/api/v1/customers",
    CREATE: "/api/v1/customers",
    GET_ALL: "/api/v1/customers",
    GET_ALL_NO_PAGINATION: "/api/v1/customers/all",
    GET_BY_ID: (id: string) => `/api/v1/customers/${id}`,
    UPDATE: (id: string) => `/api/v1/customers/${id}`,
    DELETE: (id: string) => `/api/v1/customers/${id}`,
    GET_BY_EMAIL: (email: string) => `/api/v1/customers/email/${email}`,
    GET_BY_PHONE: (phone: string) => `/api/v1/customers/phone/${phone}`,
  },

  CSRF: {
    TOKEN: "/csrf/token",
  },
} as const;

/** Public auth routes that must skip CSRF bootstrap. */
export const PUBLIC_AUTH_PATHS: readonly string[] = [
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REFRESH,
  API_ENDPOINTS.AUTH.LOGOUT,
  API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
  API_ENDPOINTS.AUTH.RESET_PASSWORD,
  API_ENDPOINTS.AUTH.OTP_SEND,
  API_ENDPOINTS.AUTH.OTP_VERIFY,
  API_ENDPOINTS.AUTH.EMAIL_SEND_VERIFICATION,
  API_ENDPOINTS.AUTH.EMAIL_VERIFY,
];

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS;
export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
